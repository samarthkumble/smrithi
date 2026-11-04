/** Smriti ECS components (system-free). */
import { createComponent, Types } from '@iwsdk/core';

export const MemoryPhase = { Tray: 'tray', Flying: 'flying', Placed: 'placed' } as const;

/** A memory image the player places in the palace. */
export const MemoryItem = createComponent('MemoryItem', {
  cardId: { type: Types.String, default: '' },
  locus: { type: Types.String, default: '' },
  phase: { type: Types.Enum, default: MemoryPhase.Tray, enum: MemoryPhase },
});

/** Glowing ring on an empty memory spot. */
export const SpotMarker = createComponent('SpotMarker', {
  locus: { type: Types.String, default: '' },
});

/** One of the floating answer orbs used in recall (slot 0..2, left to right). */
export const AnswerOrb = createComponent('AnswerOrb', {
  slot: { type: Types.Int8, default: 0 },
  label: { type: Types.String, default: '' },
});

/** A button on the palm-up menu: 'repeat', 'voice' or 'exit'. */
export const PalmButton = createComponent('PalmButton', {
  action: { type: Types.String, default: '' },
});
