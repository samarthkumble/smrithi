/** Comfort settings chosen on the start screen; saved on this device when possible. */
export interface Settings {
  largeText: boolean;
  calm: boolean;
  sound: boolean;
  /** Smriti reads her captions aloud. */
  voice: boolean;
  /** Passthrough: build the palace in the person's own room. */
  ownRoom: boolean;
}

const KEY = 'smriti.settings';
export const settings: Settings = { largeText: false, calm: false, sound: true, voice: true, ownRoom: false };

try {
  Object.assign(settings, JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<Settings>);
} catch {
  /* private window or blocked storage: defaults */
}

export function saveSettings(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    /* ignore */
  }
}
