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



// Showcase palaces: drafted with Smriti's agent, then each memory hook written by hand.
// The order of spots (door, jhoola, bookshelf, window, clock, lamp, tulsi, rangoli) is the walking route,
// so ordered lists are remembered in order.

export const OSI_DECK: Deck = {
  id: 'osi',
  title: 'The 7 layers of the OSI model',
  intro: 'Seven layers, bottom to top, along your route from the door. Please Do Not Throw Sausage Pizza Away.',
  cards: [
    { id: 'physical', answer: 'Physical', kit: 'mountain', color: 'natural', modifier: 'none', suggested: 'door',
      story: 'By the door sits a rock-solid mountain: the bottom layer is real stuff, cables and signals. Physical.',
      weird: 'Weirder now: the mountain is wired with cables like a giant plug socket. Physical.' },
    { id: 'data-link', answer: 'Data Link', kit: 'bridge', color: 'blue', modifier: 'none', suggested: 'jhoola',
      story: 'Between the jhoola chains, a little bridge links one machine to the next, hop by hop. Data Link.',
      weird: 'Weirder now: tiny envelopes march across the bridge one hop at a time. Data Link.' },
    { id: 'network', answer: 'Network', kit: 'planet', color: 'blue', modifier: 'spinning', suggested: 'bookshelf',
      story: 'On the bookshelf, a spinning planet with routes all over it finds the path across the world. Network.',
      weird: 'Weirder now: little road signs pop out of the planet pointing every packet home. Network.' },
    { id: 'transport', answer: 'Transport', kit: 'rocket', color: 'white', modifier: 'none', suggested: 'window',
      story: 'On the window sill, a delivery rocket carries the data end to end and checks it all arrived. Transport.',
      weird: 'Weirder now: the rocket counts its parcels out loud before take-off. Transport.' },
    { id: 'session', answer: 'Session', kit: 'hourglass', color: 'natural', modifier: 'none', suggested: 'clock',
      story: 'Under the clock, an hourglass opens and closes the conversation, like a meeting with a start and end. Session.',
      weird: 'Weirder now: the hourglass flips itself to start and stop the chat. Session.' },
    { id: 'presentation', answer: 'Presentation', kit: 'morphGem', color: 'natural', modifier: 'none', suggested: 'lamp',
      story: 'On the brass lamp, a gem keeps changing shape: it translates, encrypts and compresses data. Presentation.',
      weird: 'Weirder now: the gem dresses the data in a new costume for every show. Presentation.' },
    { id: 'application', answer: 'Application', kit: 'buttonTV', color: 'natural', modifier: 'none', suggested: 'tulsi',
      story: 'By the tulsi plant, a TV shows the apps you actually use: the browser, email, chat. Application.',
      weird: 'Weirder now: the TV opens a hundred browser tabs at once. Application.' },
  ],
};

export const MUGHALS_DECK: Deck = {
  id: 'mughals',
  title: 'The six great Mughal emperors, in order',
  intro: 'Six emperors, in order, from the door to the lamp.',
  cards: [
    { id: 'babur', answer: 'Babur', kit: 'rocket', color: 'gold', modifier: 'none', suggested: 'door',
      story: 'By the door, a gold rocket goes ba-BOOM: Babur launches the Mughal empire at Panipat in 1526.',
      weird: 'Weirder now: the rocket shouts "Ba-BOOM!" and the stool flies to Panipat. Babur.' },
    { id: 'humayun', answer: 'Humayun', kit: 'key', color: 'natural', modifier: 'none', suggested: 'jhoola',
      story: 'On the jhoola, a key swings away and swings back: Humayun lost his kingdom, then won it back.',
      weird: 'Weirder now: the key swings out of the window and boomerangs back. Humayun.' },
    { id: 'akbar', answer: 'Akbar', kit: 'scales', color: 'gold', modifier: 'giant', suggested: 'bookshelf',
      story: 'On the bookshelf, giant gold scales stay level: Akbar the Great, who balanced every faith at his court.',
      weird: 'Weirder now: every book on the shelf takes a turn on the scales, and they never tip. Akbar.' },
    { id: 'jahangir', answer: 'Jahangir', kit: 'padlock', color: 'gold', modifier: 'none', suggested: 'window',
      story: 'At the window hangs a gold padlock on a chain: Jahangir\'s chain of justice, which anyone could pull.',
      weird: 'Weirder now: the chain rings a bell every time someone asks for justice. Jahangir.' },
    { id: 'shah-jahan', answer: 'Shah Jahan', kit: 'heart', color: 'white', modifier: 'giant', suggested: 'clock',
      story: 'Under the clock, a giant white marble heart: Shah Jahan built the Taj Mahal out of love.',
      weird: 'Weirder now: the white heart grows four little minarets. Shah Jahan.' },
    { id: 'aurangzeb', answer: 'Aurangzeb', kit: 'hourglass', color: 'natural', modifier: 'none', suggested: 'lamp',
      story: 'On the brass lamp, a tall hourglass: Aurangzeb ruled the longest, 49 years, as the empire\'s sand ran low.',
      weird: 'Weirder now: the hourglass is so tall its sand takes 49 years to fall. Aurangzeb.' },
  ],
};

export const NEWTON_DECK: Deck = {
  id: 'newton',
  title: "Newton's three laws of motion",
  intro: 'First, second, third law: the door, the jhoola, the bookshelf.',
  cards: [
    { id: 'inertia', answer: 'Inertia', kit: 'padlock', color: 'blue', modifier: 'none', suggested: 'door',
      story: 'On the stool by the door, a padlock keeps everything as it is: nothing changes until a force acts. Inertia.',
      weird: 'Weirder now: you push the stool and the padlock stays exactly where it was. Inertia.' },
    { id: 'f-ma', answer: 'F = ma', kit: 'scales', color: 'natural', modifier: 'none', suggested: 'jhoola',
      story: 'On the jhoola, scales weigh mass against force: push twice as hard and it speeds up twice as fast. F = ma.',
      weird: 'Weirder now: a heavy elephant and a feather ride the jhoola, and only the feather zooms. F = ma.' },
    { id: 'action-reaction', answer: 'Action and reaction', kit: 'rocket', color: 'red', modifier: 'none', suggested: 'bookshelf',
      story: 'On the bookshelf, a rocket pushes fire down and shoots up: every action has an equal and opposite reaction.',
      weird: 'Weirder now: the books push back on the rocket just as hard. Action and reaction.' },
  ],
};

export const RIGHTS_DECK: Deck = {
  id: 'fundamental-rights',
  title: 'The six Fundamental Rights of India',
  intro: 'Six rights in the Constitution, Articles 14 to 32, from the door to the lamp.',
  cards: [
    { id: 'equality', answer: 'Equality', kit: 'scales', color: 'white', modifier: 'none', suggested: 'door',
      story: 'By the door, perfectly level scales: everyone is equal before the law. Right to Equality, Articles 14 to 18.',
      weird: 'Weirder now: a king and a farmer sit on the scales and they stay level. Equality.' },
    { id: 'freedom', answer: 'Freedom', kit: 'key', color: 'gold', modifier: 'none', suggested: 'jhoola',
      story: 'On the jhoola, a gold key unlocks speech, movement and work. Right to Freedom, Articles 19 to 22.',
      weird: 'Weirder now: the key unlocks the jhoola and it swings out over the whole city. Freedom.' },
    { id: 'against-exploitation', answer: 'Against exploitation', kit: 'shield', color: 'red', modifier: 'none', suggested: 'bookshelf',
      story: 'On the bookshelf, a shield blocks forced labour and child labour. Right against Exploitation, Articles 23 and 24.',
      weird: 'Weirder now: the shield stands in front of a tiny child and blocks a giant whip. Against exploitation.' },
    { id: 'religion', answer: 'Freedom of religion', kit: 'bulb', color: 'gold', modifier: 'glowing', suggested: 'window',
      story: 'On the window sill, one glowing lamp of light for every faith. Freedom of Religion, Articles 25 to 28.',
      weird: 'Weirder now: the bulb glows a different colour for every prayer it hears. Freedom of religion.' },
    { id: 'culture-education', answer: 'Culture and education', kit: 'book', color: 'green', modifier: 'none', suggested: 'clock',
      story: 'Under the clock, an open book in every Indian language. Cultural and Educational Rights, Articles 29 and 30.',
      weird: 'Weirder now: the book reads itself aloud in Kannada, Tamil, Hindi and more. Culture and education.' },
    { id: 'remedies', answer: 'Constitutional remedies', kit: 'heart', color: 'red', modifier: 'glowing', suggested: 'lamp',
      story: 'On the brass lamp, a glowing heart: Ambedkar called Article 32 the heart and soul of the Constitution.',
      weird: 'Weirder now: the heart beats and a court door opens with every beat. Constitutional remedies.' },
  ],
};

export const ELEMENTS_DECK: Deck = {
  id: 'elements',
  title: 'The first eight elements, in order',
  intro: 'Numbers 1 to 8, all the way round the room from the door to the rangoli.',
  cards: [
    { id: 'hydrogen', answer: 'Hydrogen', kit: 'rocket', color: 'white', modifier: 'none', suggested: 'door',
      story: 'By the door, a rocket burns hydrogen, the lightest element of all. Number 1: Hydrogen.',
      weird: 'Weirder now: the rocket is so light it floats off the stool before lift-off. Hydrogen.' },
    { id: 'helium', answer: 'Helium', kit: 'heart', color: 'pink', modifier: 'floating', suggested: 'jhoola',
      story: 'Above the jhoola floats a pink heart balloon full of helium. Number 2: Helium.',
      weird: 'Weirder now: the balloon heart talks in a squeaky helium voice. Helium.' },
    { id: 'lithium', answer: 'Lithium', kit: 'bulb', color: 'natural', modifier: 'glowing', suggested: 'bookshelf',
      story: 'On the bookshelf, a bulb glows from a lithium battery, like the one in your phone. Number 3: Lithium.',
      weird: 'Weirder now: the bulb charges every phone on the shelf at once. Lithium.' },
    { id: 'beryllium', answer: 'Beryllium', kit: 'morphGem', color: 'green', modifier: 'none', suggested: 'window',
      story: 'On the window sill, a green gem: emeralds are a beryl, so Beryllium. Number 4.',
      weird: 'Weirder now: the emerald turns into a giant green berry. Beryllium.' },
    { id: 'boron', answer: 'Boron', kit: 'hourglass', color: 'natural', modifier: 'none', suggested: 'clock',
      story: 'Under the clock, an hourglass so slow it is boring: Boron. Number 5.',
      weird: 'Weirder now: the hourglass yawns every time a grain falls. Boron.' },
    { id: 'carbon', answer: 'Carbon', kit: 'mountain', color: 'black', modifier: 'none', suggested: 'lamp',
      story: 'On the brass lamp, a black mountain of soot: the lamp\'s soot is pure carbon. Number 6: Carbon.',
      weird: 'Weirder now: the black mountain sparkles, because diamonds are carbon too. Carbon.' },
    { id: 'nitrogen', answer: 'Nitrogen', kit: 'tree', color: 'green', modifier: 'none', suggested: 'tulsi',
      story: 'By the tulsi plant, a tree that grows on nitrogen, the gas that makes up most of the air. Number 7: Nitrogen.',
      weird: 'Weirder now: the tree breathes in the whole room and puffs it out green. Nitrogen.' },
    { id: 'oxygen', answer: 'Oxygen', kit: 'planet', color: 'blue', modifier: 'floating', suggested: 'rangoli',
      story: 'Over the rangoli floats a blue planet that breathes oxygen. Number 8: Oxygen.',
      weird: 'Weirder now: the planet blows bubbles of fresh air across the floor. Oxygen.' },
  ],
};

export const SPANISH_DECK: Deck = {
  id: 'spanish',
  title: 'Six everyday Spanish greetings',
  intro: 'Six Spanish words you will use every day, one at each spot.',
  cards: [
    { id: 'hola', answer: 'Hola', kit: 'key', color: 'gold', modifier: 'none', suggested: 'door',
      story: 'By the door, a gold key opens up and calls out "Hola!": hello.',
      weird: 'Weirder now: the door says "Hola!" every time anyone walks past. Hola.' },
    { id: 'gracias', answer: 'Gracias', kit: 'tree', color: 'green', modifier: 'none', suggested: 'jhoola',
      story: 'On the jhoola, a tree hands you a mango and you say "Gracias": thank you.',
      weird: 'Weirder now: the tree bows and says "Gracias" back to you. Gracias.' },
    { id: 'por-favor', answer: 'Por favor', kit: 'book', color: 'blue', modifier: 'none', suggested: 'bookshelf',
      story: 'On the bookshelf, a book you may borrow only if you say "Por favor": please.',
      weird: 'Weirder now: the book will not open until you say "Por favor" twice. Por favor.' },
    { id: 'buenos-dias', answer: 'Buenos días', kit: 'bulb', color: 'gold', modifier: 'glowing', suggested: 'window',
      story: 'At the window, the morning sun bulb wakes you: "Buenos días", good morning.',
      weird: 'Weirder now: the sun bulb sings "Buenos días" like a rooster. Buenos días.' },
    { id: 'buenas-noches', answer: 'Buenas noches', kit: 'planet', color: 'purple', modifier: 'floating', suggested: 'clock',
      story: 'Under the clock at midnight, a sleepy purple moon-planet whispers "Buenas noches": good night.',
      weird: 'Weirder now: the moon-planet snores and the clock hands go to sleep. Buenas noches.' },
    { id: 'adios', answer: 'Adiós', kit: 'rocket', color: 'red', modifier: 'none', suggested: 'lamp',
      story: 'On the brass lamp, a red rocket waves as it leaves: "Adiós", goodbye.',
      weird: 'Weirder now: the rocket waves a tiny handkerchief as it blasts off. Adiós.' },
  ],
};

/** Ready palaces on the start screen; the first three show at once, the rest under More palaces. */
export const PRESET_DECKS: Deck[] = [OOP_DECK, OSI_DECK, PLANETS_DECK, ACID_DECK, MUGHALS_DECK, RIGHTS_DECK, ELEMENTS_DECK, NEWTON_DECK, SPANISH_DECK];
