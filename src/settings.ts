/** Comfort settings chosen on the start screen; saved on this device when possible. */
export interface Settings {
  largeText: boolean;
  calm: boolean;
  sound: boolean;
}

const KEY = 'smriti.settings';
export const settings: Settings = { largeText: false, calm: false, sound: true };

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
