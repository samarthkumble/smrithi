/**
 * Smriti's voice: each caption line read aloud with the browser's own speech
 * voices (no audio files, no network). Prefers an Indian-English voice, then any
 * English one. Where speech is not available, captions carry everything.
 */
import { settings } from './settings.js';

let chosen: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  const score = (v: SpeechSynthesisVoice) => {
    const n = `${v.name} ${v.lang}`.toLowerCase();
    let s = 0;
    if (v.lang.toLowerCase() === 'en-in') s += 50;
    else if (v.lang.toLowerCase().startsWith('en')) s += 20;
    if (/female|heera|neerja|veena|zira|samantha|google uk english female|aria|jenny/.test(n)) s += 10;
    if (/natural|neural|online|google/.test(n)) s += 6;
    if (v.localService) s += 1;
    return s;
  };
  return [...voices].sort((a, b) => score(b) - score(a))[0] ?? null;
}

export function voiceAvailable(): boolean {
  return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined';
}

if (voiceAvailable()) {
  speechSynthesis.addEventListener?.('voiceschanged', () => (chosen = pickVoice()));
}

/** Speak a line, replacing whatever Smriti was saying. Calls onEnd when it finishes (or fails). */
export function speak(text: string, onEnd?: () => void): void {
  if (!settings.voice || !voiceAvailable() || !text) return;
  try {
    chosen ??= pickVoice();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/\s*\.\.\.\s*/g, '. '));
    if (chosen) {
      u.voice = chosen;
      u.lang = chosen.lang;
    } else u.lang = 'en-IN';
    u.rate = 0.97;
    u.pitch = 1.05;
    u.volume = 0.95;
    if (onEnd) {
      u.onend = () => onEnd();
      u.onerror = () => onEnd();
    }
    speechSynthesis.speak(u);
  } catch {
    /* captions still show */
  }
}

export function hush(): void {
  try {
    if (voiceAvailable()) speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}
