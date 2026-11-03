/**
 * Smriti palace layout: the eight memory spots (loci) around the seated player.
 * Pure data, shared by the room asset (src/assets realm) and runtime systems.
 * The player sits at the origin facing -Z; seated eye height is about 1.2 m.
 */

export type LocusId =
  | 'door'
  | 'jhoola'
  | 'bookshelf'
  | 'window'
  | 'clock'
  | 'lamp'
  | 'tulsi'
  | 'rangoli';

export interface Locus {
  id: LocusId;
  /** Spoken / captioned name */
  label: string;
  /** Surface point where a memory object rests (its base), world metres */
  anchor: [number, number, number];
}

export const ROOM = {
  halfWidth: 2.6,
  backZ: -2.6,
  frontZ: 1.6,
  height: 2.8,
} as const;

export const SEATED_EYE = 1.2;

export const LOCI: readonly Locus[] = [
  { id: 'door', label: 'the stool by the door', anchor: [-2.08, 0.445, -0.7] },
  { id: 'jhoola', label: 'the jhoola', anchor: [-1.38, 0.56, -1.26] },
  { id: 'bookshelf', label: 'the bookshelf', anchor: [-1.12, 0.968, -2.4] },
  { id: 'window', label: 'the window sill', anchor: [-0.18, 1.02, -2.46] },
  { id: 'clock', label: 'the shelf under the clock', anchor: [0.95, 1.5, -2.48] },
  { id: 'lamp', label: 'the brass lamp', anchor: [1.125, 0.5, -1.384] },
  { id: 'tulsi', label: 'the tulsi plant', anchor: [1.576, 0.78, -0.834] },
  { id: 'rangoli', label: 'the rangoli', anchor: [0, 0.008, -1.15] },
];

/** Where new memories float, within seated arm's reach. */
export const TRAY = { center: [0, 0.84, -0.4] as [number, number, number], spacing: 0.2 };
