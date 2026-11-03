/**
 * Preset decks. Each fact has a keyword, the vivid image kit, where Smriti
 * suggests placing it, and the line Smriti says while you place it.
 */
import type { MemoryKitId } from './memory-objects.js';
import type { LocusId } from './palace-layout.js';

export interface MemoryCard {
  id: string;
  answer: string;
  kit: MemoryKitId;
  suggested: LocusId;
  story: string;
  /** Smriti's weirder retelling after a miss. */
  weird: string;
}

export interface Deck {
  id: string;
  title: string;
  cards: MemoryCard[];
}

export const OOP_DECK: Deck = {
  id: 'oop-pillars',
  title: '4 pillars of OOP',
  cards: [
    { id: 'encapsulation', answer: 'Encapsulation', kit: 'capsuleChest', suggested: 'jhoola',
      story: 'A giant capsule locks the treasure chest on the jhoola. Encapsulation keeps the data locked inside its capsule.',
      weird: 'Weirder now: the capsule is as big as the jhoola, and the chest inside is banging to get out. Encapsulation.' },
    { id: 'inheritance', answer: 'Inheritance', kit: 'parrotCrown', suggested: 'bookshelf',
      story: 'On the bookshelf, the big parrot passes its crown to the baby. The child inherits from the parent.',
      weird: 'Weirder now: the baby parrot wears the crown and squawks orders at its parent. Inheritance.' },
    { id: 'polymorphism', answer: 'Polymorphism', kit: 'morphGem', suggested: 'window',
      story: 'On the window sill, one gem keeps changing shape. One thing, many forms: polymorphism.',
      weird: 'Weirder now: the gem spins wildly and turns into a new shape every blink. Polymorphism.' },
    { id: 'abstraction', answer: 'Abstraction', kit: 'buttonTV', suggested: 'clock',
      story: 'Under the clock, a TV shows only a big ON button. The wires hide behind it. You see the button, not the wiring: abstraction.',
      weird: 'Weirder now: the TV is huge, the ON button glows, and the hidden wires hiss behind it. Abstraction.' },
  ],
};
