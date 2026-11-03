/**
 * The saved palace on this device: the deck, where each memory sits, which ones
 * were reimagined, and the review schedule and streak. Everything is wrapped in
 * try/catch so a blocked storage never breaks a session.
 */
import type { Deck } from './decks.js';

export interface SavedPalace {
  deck: Deck;
  /** cardId -> locus id */
  placed: Record<string, string>;
  weird: string[];
  reviews: { at: number; first: number; total: number }[];
  level: number;
  nextReviewAt: number;
  streak: number;
  lastReviewDay: string;
}

const KEY = 'smriti.palace';
const DAY = 86_400_000;
const INTERVALS = [1, 3, 7, 14, 30];

const dayKey = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export function loadPalace(): SavedPalace | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? 'null') as SavedPalace | null;
    return p && p.deck && Array.isArray(p.deck.cards) ? p : null;
  } catch {
    return null;
  }
}

function store(p: SavedPalace): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}

/** Called once every memory is on a spot; keeps history if it is the same deck. */
export function savePlacement(deck: Deck, placed: Record<string, string>, weird: string[]): SavedPalace {
  const old = loadPalace();
  const same = old && old.deck.id === deck.id && old.deck.title === deck.title;
  const p: SavedPalace = same
    ? { ...old, deck, placed, weird }
    : { deck, placed, weird, reviews: [], level: 0, nextReviewAt: Date.now() + DAY, streak: old?.streak ?? 0, lastReviewDay: old?.lastReviewDay ?? '' };
  store(p);
  return p;
}

/** Record a finished test: update the streak and space out the next review. */
export function recordReview(first: number, total: number, weird: string[]): SavedPalace | null {
  const p = loadPalace();
  if (!p) return null;
  const now = Date.now();
  const today = dayKey(now);
  if (p.lastReviewDay !== today) p.streak = p.lastReviewDay === dayKey(now - DAY) ? p.streak + 1 : 1;
  p.lastReviewDay = today;
  p.reviews = [...p.reviews, { at: now, first, total }].slice(-50);
  p.level = first >= Math.ceil(total * 0.75) ? Math.min(p.level + 1, INTERVALS.length) : 0;
  p.nextReviewAt = now + INTERVALS[Math.max(0, p.level - 1)] * DAY;
  p.weird = weird;
  store(p);
  return p;
}

export function nextReviewText(p: SavedPalace, now = Date.now()): string {
  const days = Math.round((p.nextReviewAt - now) / DAY);
  if (days <= 0) return 'Review due today';
  if (days === 1) return 'Next review tomorrow';
  return `Next review in ${days} days`;
}

export function forgetPalace(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
