/**
 * Preset decks. Each fact has a keyword, the vivid image kit, where Smriti
 * suggests placing it, and the line Smriti says while you place it.
 */
import type { KitId } from './memory-kits.js';
import type { LocusId } from './palace-layout.js';

export interface MemoryCard {
  id: string;
  answer: string;
  kit: KitId;
  /** Optional colour and effect chosen by the agent (see kit-style.ts). */
  color?: string;
  modifier?: string;
  suggested: LocusId;
  story: string;
  /** Smriti's weirder retelling after a miss. */
  weird: string;
}

export interface Deck {
  id: string;
  title: string;
  /** What Smriti says when the deck arrives. */
  intro?: string;
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

export const ACID_DECK: Deck = {
  id: 'acid',
  title: 'ACID properties of transactions',
  intro: 'Four promises a database keeps: ACID.',
  cards: [
    { id: 'atomicity', answer: 'Atomicity', kit: 'planet', color: 'purple', modifier: 'tiny', suggested: 'jhoola',
      story: 'On the jhoola spins one tiny atom. A transaction is one atom: it all happens, or none of it does.',
      weird: 'Weirder now: the atom swells, and if one piece falls off, the whole jhoola vanishes. All or nothing: Atomicity.' },
    { id: 'consistency', answer: 'Consistency', kit: 'scales', color: 'gold', modifier: 'none', suggested: 'bookshelf',
      story: 'On the bookshelf, gold scales always stay level. Every transaction keeps the rules balanced: consistency.',
      weird: 'Weirder now: the scales shout "RULES!" every time a book tips them. Consistency.' },
    { id: 'isolation', answer: 'Isolation', kit: 'padlock', color: 'blue', modifier: 'glowing', suggested: 'window',
      story: 'On the window sill, a glowing blue padlock keeps each transaction alone in its own room: isolation.',
      weird: 'Weirder now: every padlock in the house has its own tiny room with a "do not disturb" sign. Isolation.' },
    { id: 'durability', answer: 'Durability', kit: 'mountain', color: 'white', modifier: 'giant', suggested: 'clock',
      story: 'Under the clock stands a giant white mountain. Once saved, data lasts like a mountain, even after a crash: durability.',
      weird: 'Weirder now: the clock falls and smashes, but the mountain does not even notice. Durability.' },
  ],
};

export const PLANETS_DECK: Deck = {
  id: 'planets',
  title: 'The planets, in order from the Sun',
  intro: 'Walk the room from the door to the rangoli and you walk the planets outward from the Sun.',
  cards: [
    { id: 'mercury', answer: 'Mercury', kit: 'rocket', color: 'white', modifier: 'tiny', suggested: 'door',
      story: 'By the door, a tiny silver rocket races off: Mercury, the quick messenger, closest to the Sun.',
      weird: 'Weirder now: the tiny rocket zooms round the door a hundred times before you blink. Mercury.' },
    { id: 'venus', answer: 'Venus', kit: 'heart', color: 'pink', modifier: 'on_fire', suggested: 'jhoola',
      story: 'On the jhoola, a pink heart is on fire: Venus, named for love, and the hottest planet.',
      weird: 'Weirder now: the burning heart swings the jhoola so hard it glows. Venus.' },
    { id: 'earth', answer: 'Earth', kit: 'tree', color: 'green', modifier: 'giant', suggested: 'bookshelf',
      story: 'From the bookshelf grows a giant green tree: Earth, the planet with life.',
      weird: 'Weirder now: the tree pushes the books out and birds start living in it. Earth.' },
    { id: 'mars', answer: 'Mars', kit: 'shield', color: 'red', modifier: 'none', suggested: 'window',
      story: 'On the window sill, a red war shield: Mars, the red planet named for the god of war.',
      weird: 'Weirder now: the red shield bangs on the window grille like a drum. Mars.' },
    { id: 'jupiter', answer: 'Jupiter', kit: 'mountain', color: 'gold', modifier: 'giant', suggested: 'clock',
      story: 'Under the clock, a giant gold mountain: Jupiter, the biggest planet of all.',
      weird: 'Weirder now: the gold mountain is so big the clock sits on its peak like a hat. Jupiter.' },
    { id: 'saturn', answer: 'Saturn', kit: 'planet', color: 'natural', modifier: 'spinning', suggested: 'lamp',
      story: 'On the brass lamp, a ringed planet spins: Saturn, the one with the famous rings.',
      weird: 'Weirder now: the rings spin off and hoop around the lamp flames. Saturn.' },
    { id: 'uranus', answer: 'Uranus', kit: 'magnet', color: 'blue', modifier: 'floating', suggested: 'tulsi',
      story: 'Above the tulsi plant, a blue magnet floats lying on its side: Uranus, the ice giant that rolls on its side.',
      weird: 'Weirder now: the sideways magnet pulls every tulsi leaf sideways too. Uranus.' },
    { id: 'neptune', answer: 'Neptune', kit: 'key', color: 'blue', modifier: 'glowing', suggested: 'rangoli',
      story: 'On the rangoli lies a glowing deep-blue key: Neptune, the last planet, far out in the cold.',
      weird: 'Weirder now: the blue key unlocks the rangoli and the whole floor turns into deep sea. Neptune.' },
  ],
};

export const PRESET_DECKS: Deck[] = [OOP_DECK, ACID_DECK, PLANETS_DECK];
