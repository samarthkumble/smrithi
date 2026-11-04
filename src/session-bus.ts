/** Requests from the palm menu to Smriti's main system (counters, so nothing is missed). */
export const sessionBus = {
  repeat: 0,
  /** Whether the palm menu is open right now (for tests and for hiding the hint). */
  menuOpen: false,
  /** Palm-up score of the left hand, -1..1, for diagnostics. */
  palmUp: 0,
};
