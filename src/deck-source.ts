/**
 * Where the next palace comes from: a preset, or Smriti's agent building one live.
 * Plain state shared by the start screen (DOM) and the XR systems. No DOM here.
 */
import { type Deck, type MemoryCard, OOP_DECK } from './decks.js';
import { isKit } from './memory-kits.js';
import { isModifier, KIT_COLORS } from './kit-style.js';
import { LOCI, type LocusId } from './palace-layout.js';
import type { SavedPalace } from './palace-store.js';

export type DeckStatus = 'ready' | 'building' | 'error';

export interface AgentStep {
  tool: string;
  ok: boolean;
  note: string;
}

export const deckSource = {
  status: 'ready' as DeckStatus,
  deck: OOP_DECK as Deck,
  topic: '',
  steps: [] as AgentStep[],
  error: '',
  /** Set when the person came back to review a saved palace. */
  review: null as SavedPalace | null,
  /** Bumped on every change so systems can react without polling objects. */
  version: 0,
};

const bump = () => (deckSource.version += 1);

export function usePreset(deck: Deck): void {
  Object.assign(deckSource, { status: 'ready', deck, topic: '', steps: [], error: '', review: null });
  bump();
}

export function startReview(p: SavedPalace): void {
  Object.assign(deckSource, { status: 'ready', deck: p.deck, topic: '', steps: [], error: '', review: p });
  bump();
}

/** Accept only what the room can show: known kits, real spots, one card per spot. */
export function sanitizeDeck(raw: unknown): Deck | null {
  const d = raw as { id?: unknown; title?: unknown; intro?: unknown; cards?: unknown };
  if (!d || !Array.isArray(d.cards)) return null;
  const used = new Set<LocusId>();
  const cards: MemoryCard[] = [];
  for (const c of d.cards.slice(0, LOCI.length) as Record<string, unknown>[]) {
    const answer = typeof c.answer === 'string' ? c.answer.trim().slice(0, 40) : '';
    if (!answer || cards.some((x) => x.answer === answer)) continue;
    let spot = LOCI.find((l) => l.id === c.suggested)?.id;
    if (!spot || used.has(spot)) spot = LOCI.find((l) => !used.has(l.id))?.id;
    if (!spot) break;
    used.add(spot);
    const text = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().slice(0, n) : '');
    cards.push({
      id: `${cards.length}-${answer.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      answer,
      kit: typeof c.kit === 'string' && isKit(c.kit) ? c.kit : 'bulb',
      color: typeof c.color === 'string' && KIT_COLORS[c.color] ? c.color : 'natural',
      modifier: typeof c.modifier === 'string' && isModifier(c.modifier) ? c.modifier : 'none',
      suggested: spot,
      story: text(c.story, 220) || `At ${LOCI.find((l) => l.id === spot)?.label}, remember ${answer}.`,
      weird: text(c.weird, 200) || `Picture it bigger and stranger. ${answer}.`,
    });
  }
  if (cards.length < 2) return null;
  return {
    id: typeof d.id === 'string' ? d.id.slice(0, 60) : 'agent',
    title: typeof d.title === 'string' ? d.title.slice(0, 60) : 'Your palace',
    intro: typeof d.intro === 'string' ? d.intro.slice(0, 200) : undefined,
    cards,
  };
}

const PROD_ORIGIN = 'https://smrithi-eight.vercel.app';

/** Local dev (Vite) has no /api, so it talks to the deployed agent instead. */
function agentUrl(): string {
  const host = globalThis.location?.hostname ?? '';
  const local = host === 'localhost' || host === '127.0.0.1' || /^(10|192\.168|172\.(1[6-9]|2\d|3[01]))\./.test(host);
  return `${local ? PROD_ORIGIN : ''}/api/agent`;
}

/** Ask Smriti's agent to build a palace; progress streams into deckSource.steps. */
export async function buildFromTopic(topic: string): Promise<void> {
  Object.assign(deckSource, { status: 'building', topic, steps: [], error: '', review: null });
  bump();
  const fail = (msg: string) => {
    Object.assign(deckSource, { status: 'error', error: msg, deck: OOP_DECK });
    bump();
  };
  try {
    const res = await fetch(agentUrl(), {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/x-ndjson' },
      body: JSON.stringify({ topic }),
    });
    if (!res.body) return fail('No answer from Smriti.');
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { value, done } = await reader.read();
      if (value) buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        const ev = JSON.parse(line) as { type: string; deck?: unknown; error?: string } & Partial<AgentStep>;
        if (ev.type === 'step') {
          deckSource.steps.push({ tool: ev.tool ?? '', ok: ev.ok === true, note: ev.note ?? '' });
          bump();
        } else if (ev.type === 'done') {
          const deck = sanitizeDeck(ev.deck);
          if (!deck) return fail('Smriti made a palace the room could not show.');
          Object.assign(deckSource, { status: 'ready', deck });
          bump();
          return;
        } else if (ev.type === 'error') {
          return fail(ev.error ?? 'Smriti could not build that palace.');
        }
      }
      if (done) break;
    }
    if (deckSource.status === 'building') fail('Smriti stopped before finishing.');
  } catch {
    fail('Smriti could not reach the internet.');
  }
}
