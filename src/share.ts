/**
 * Coming back and passing it on: a calendar reminder for the next review, and a
 * link that carries a whole palace (the deck travels in the URL, no server).
 */
import type { Deck } from './decks.js';
import { sanitizeDeck } from './deck-source.js';

const SITE = 'https://smrithi-eight.vercel.app/';

const b64urlEncode = (s: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
const b64urlDecode = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

export function palaceLink(deck: Deck): string {
  const slim = {
    v: 1,
    id: deck.id,
    title: deck.title,
    intro: deck.intro,
    cards: deck.cards.map(({ answer, kit, color, modifier, suggested, story, weird }) => ({ answer, kit, color, modifier, suggested, story, weird })),
  };
  return `${SITE}?p=${b64urlEncode(JSON.stringify(slim))}`;
}

/** The palace a friend shared in this page's link, checked like any agent deck. */
export function sharedDeckFromUrl(): Deck | null {
  try {
    const p = new URLSearchParams(location.search).get('p');
    if (!p) return null;
    const deck = sanitizeDeck(JSON.parse(b64urlDecode(p)));
    return deck ? { ...deck, id: `shared-${deck.id}`.slice(0, 60) } : null;
  } catch {
    return null;
  }
}

/** Share with the system sheet where there is one, else copy to the clipboard. Returns what happened. */
export async function sharePalace(deck: Deck): Promise<'shared' | 'copied' | 'failed'> {
  const url = palaceLink(deck);
  const text = `I built a memory palace for "${deck.title}" in Smriti. Step inside and place the same memories:`;
  try {
    if (navigator.share) {
      await navigator.share({ title: `Smriti: ${deck.title}`, text, url });
      return 'shared';
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') return 'failed';
  }
  try {
    await navigator.clipboard.writeText(url);
    return 'copied';
  } catch {
    return 'failed';
  }
}

const stamp = (t: number) => new Date(t).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function googleCalendarLink(title: string, at: number): string {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Smriti review: ${title}`,
    dates: `${stamp(at)}/${stamp(at + 15 * 60_000)}`,
    details: `Walk your memory palace again (about 5 minutes). Open ${SITE} and press Review my palace.`,
    location: SITE,
  });
  return `https://calendar.google.com/calendar/render?${q}`;
}

/** Download a standard .ics reminder for any calendar app. */
export function downloadCalendarFile(title: string, at: number): void {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Smriti//Review//EN',
    'BEGIN:VEVENT',
    `UID:smriti-${at}@smrithi-eight.vercel.app`,
    `DTSTAMP:${stamp(Date.now())}`,
    `DTSTART:${stamp(at)}`,
    `DTEND:${stamp(at + 15 * 60_000)}`,
    `SUMMARY:Smriti review: ${title.replace(/[,;\\]/g, ' ')}`,
    `DESCRIPTION:Walk your memory palace again. Open ${SITE} and press Review my palace.`,
    `URL:${SITE}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT0M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Time to walk your memory palace',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  a.download = 'smriti-review.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
