/**
 * Smriti's image library: simple, bold symbols the agent combines with a colour
 * and an effect to picture any fact. Each kit is built in code, origin at the
 * base, about 0.15-0.24 m tall. A material with userData.tint takes the card's colour.
 */
import {
  BoxGeometry,
  ConeGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Group,
  IcosahedronGeometry,
  LatheGeometry,
  type Material,
  Mesh,
  MeshStandardMaterial,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
} from '@iwsdk/core';
import { makeButtonTV, makeCapsuleChest, makeMorphGem, makeParrotCrown } from './memory-objects.js';

const mat = (color: string, roughness = 0.55, metalness = 0, emissive = '#000000', ei = 0) =>
  new MeshStandardMaterial({ color, roughness, metalness, emissive, emissiveIntensity: ei });
const tint = (color: string, roughness = 0.5, metalness = 0) => {
  const m = mat(color, roughness, metalness);
  m.userData.tint = true;
  return m;
};

const K = {
  white: mat('#F4F1EA', 0.5),
  grey: mat('#8F96A3', 0.4, 0.6),
  dark: mat('#2A2C33', 0.5),
  gold: mat('#E8B23A', 0.3, 0.85),
  brass: mat('#C99A3B', 0.35, 0.8),
  wood: mat('#7A4A26', 0.75),
  green: mat('#3DA35A', 0.6),
  red: mat('#D8433A', 0.45),
  glass: new MeshStandardMaterial({ color: '#FFF6D6', emissive: '#FFE7A0', emissiveIntensity: 0.6, roughness: 0.15, transparent: true, opacity: 0.75 }),
  snow: mat('#FFFFFF', 0.7),
  paper: mat('#FBF5E4', 0.9),
  sand: mat('#E9C46A', 0.9),
  flame: new MeshStandardMaterial({ color: '#FFD27A', emissive: '#FF9A2E', emissiveIntensity: 2.2, roughness: 1 }),
};

function m(geo: ConstructorParameters<typeof Mesh>[0], material: Material, name: string, x = 0, y = 0, z = 0): Mesh {
  const mesh = new Mesh(geo, material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  return mesh;
}
const group = (name: string) => {
  const g = new Group();
  g.name = name;
  return g;
};
const lathe = (pts: [number, number][], seg = 20) => new LatheGeometry(pts.map(([x, y]) => new Vector2(x, y)), seg);

/** Rocket: launch, speed, start, ambition, space travel. */
export function makeRocket(): Group {
  const g = group('Rocket');
  const body = tint('#E9EEF5', 0.4, 0.2);
  g.add(m(lathe([[0, 0.03], [0.04, 0.035], [0.045, 0.1], [0.04, 0.16], [0.022, 0.2], [0, 0.225]]), body, 'Body'));
  g.add(m(new SphereGeometry(0.016, 14, 10), mat('#4FA3E0', 0.2, 0.3, '#1D5E9C', 0.3), 'Porthole', 0, 0.13, 0.04));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const fin = m(new BoxGeometry(0.008, 0.06, 0.04), K.red, `Fin${i}`, Math.sin(a) * 0.045, 0.055, Math.cos(a) * 0.045);
    fin.rotation.y = a;
    g.add(fin);
  }
  g.add(m(new ConeGeometry(0.03, 0.05, 12), K.flame, 'Exhaust', 0, 0.01, 0));
  (g.getObjectByName('Exhaust') as Mesh).rotation.x = Math.PI;
  return g;
}

/** Ringed planet: space, worlds, orbits, scale, the whole system. */
export function makePlanet(): Group {
  const g = group('Planet');
  const surface = tint('#E07A3E', 0.6);
  g.add(m(new SphereGeometry(0.085, 28, 20), surface, 'Globe', 0, 0.1, 0));
  g.add(m(new SphereGeometry(0.0865, 28, 8, 0, Math.PI * 2, 1.2, 0.25), mat('#F4D8B0', 0.7), 'Band', 0, 0.1, 0));
  const ring = m(new TorusGeometry(0.125, 0.009, 6, 48), mat('#F2E3C6', 0.5), 'Ring', 0, 0.1, 0);
  ring.rotation.set(Math.PI / 2 - 0.35, 0.25, 0);
  ring.scale.set(1, 1, 0.25);
  g.add(ring);
  return g;
}

/** Key: unlocking, access, the answer, a solution. */
export function makeKey(): Group {
  const g = group('Key');
  const metal = tint('#E8B23A', 0.3, 0.85);
  const bow = m(new TorusGeometry(0.035, 0.012, 10, 28), metal, 'Bow', 0, 0.19, 0);
  g.add(bow);
  g.add(m(new CylinderGeometry(0.009, 0.009, 0.15, 10), metal, 'Shaft', 0, 0.085, 0));
  g.add(m(new BoxGeometry(0.035, 0.014, 0.012), metal, 'Tooth1', 0.02, 0.025, 0));
  g.add(m(new BoxGeometry(0.025, 0.014, 0.012), metal, 'Tooth2', 0.015, 0.05, 0));
  g.add(m(new CylinderGeometry(0.014, 0.014, 0.012, 12), metal, 'Collar', 0, 0.152, 0));
  return g;
}

/** Padlock: security, locked down, restriction, privacy. */
export function makePadlock(): Group {
  const g = group('Padlock');
  const body = tint('#D8433A', 0.4, 0.3);
  g.add(m(new BoxGeometry(0.13, 0.11, 0.05), body, 'Body', 0, 0.055, 0));
  const shackle = m(new TorusGeometry(0.042, 0.011, 10, 24, Math.PI), K.grey, 'Shackle', 0, 0.12, 0);
  g.add(shackle);
  g.add(m(new CylinderGeometry(0.011, 0.011, 0.02, 10), K.grey, 'LegL', -0.042, 0.115, 0));
  g.add(m(new CylinderGeometry(0.011, 0.011, 0.02, 10), K.grey, 'LegR', 0.042, 0.115, 0));
  g.add(m(new CylinderGeometry(0.012, 0.012, 0.01, 12), K.dark, 'Keyhole', 0, 0.06, 0.026));
  (g.getObjectByName('Keyhole') as Mesh).rotation.x = Math.PI / 2;
  return g;
}

/** Bridge: connection, linking two things, crossing over, transition. */
export function makeBridge(): Group {
  const g = group('Bridge');
  const stone = tint('#B9A78E', 0.85);
  g.add(m(new BoxGeometry(0.26, 0.018, 0.08), K.wood, 'Deck', 0, 0.09, 0));
  const arch = m(new TorusGeometry(0.085, 0.012, 8, 28, Math.PI), stone, 'Arch', 0, 0.0, 0);
  g.add(arch);
  for (const x of [-0.12, 0.12]) g.add(m(new BoxGeometry(0.03, 0.09, 0.08), stone, `Pier${x > 0 ? 'R' : 'L'}`, x, 0.045, 0));
  for (const z of [-0.035, 0.035]) g.add(m(new BoxGeometry(0.26, 0.008, 0.006), K.wood, `Rail${z > 0 ? 'F' : 'B'}`, 0, 0.13, z));
  for (let i = 0; i < 6; i++) {
    const x = -0.11 + i * 0.044;
    for (const z of [-0.035, 0.035]) g.add(m(new BoxGeometry(0.006, 0.04, 0.006), K.wood, `Post${i}${z > 0 ? 'F' : 'B'}`, x, 0.11, z));
  }
  return g;
}

/** Coin stack: money, value, cost, trade, the economy. */
export function makeCoins(): Group {
  const g = group('Coins');
  const coin = tint('#E8B23A', 0.3, 0.85);
  const geo = new CylinderGeometry(0.045, 0.045, 0.014, 24);
  for (let i = 0; i < 8; i++) {
    const c = m(geo, coin, `Coin${i}`, Math.sin(i * 1.7) * 0.006, 0.007 + i * 0.0145, Math.cos(i * 2.3) * 0.006);
    g.add(c);
  }
  const top = m(geo, coin, 'TiltedCoin', 0.06, 0.05, 0.02);
  top.rotation.set(1.2, 0, 0.3);
  g.add(top);
  return g;
}

/** Tree: growth, family, hierarchy, roots and branches, nature. */
export function makeTree(): Group {
  const g = group('Tree');
  const leaves = tint('#3DA35A', 0.7);
  g.add(m(new CylinderGeometry(0.014, 0.022, 0.11, 10), K.wood, 'Trunk', 0, 0.055, 0));
  const blob = new IcosahedronGeometry(0.06, 1);
  const spots: [number, number, number, number][] = [[0, 0.15, 0, 1], [-0.045, 0.125, 0.01, 0.75], [0.045, 0.13, -0.01, 0.8], [0.005, 0.195, 0.005, 0.7]];
  spots.forEach(([x, y, z, s], i) => {
    const b = m(blob, leaves, `Canopy${i}`, x, y, z);
    b.scale.setScalar(s);
    g.add(b);
  });
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.4;
    const root = m(new ConeGeometry(0.008, 0.04, 6), K.wood, `Root${i}`, Math.cos(a) * 0.02, 0.006, Math.sin(a) * 0.02);
    root.rotation.set(Math.sin(a) * 1.3, 0, -Math.cos(a) * 1.3);
    g.add(root);
  }
  return g;
}

/** Horseshoe magnet: attraction, force, pulling together, bonding. */
export function makeMagnet(): Group {
  const g = group('Magnet');
  const body = tint('#D8433A', 0.4, 0.2);
  const arc = m(new TorusGeometry(0.06, 0.022, 12, 28, Math.PI), body, 'Arc', 0, 0.16, 0);
  arc.rotation.z = 0;
  g.add(arc);
  for (const x of [-0.06, 0.06]) {
    g.add(m(new CylinderGeometry(0.022, 0.022, 0.09, 14), body, `Arm${x > 0 ? 'R' : 'L'}`, x, 0.115, 0));
    g.add(m(new CylinderGeometry(0.0225, 0.0225, 0.04, 14), K.grey, `Tip${x > 0 ? 'R' : 'L'}`, x, 0.05, 0));
  }
  return g;
}

/** Book: knowledge, a record, a law, history, a definition. */
export function makeBook(): Group {
  const g = group('Book');
  const cover = tint('#2F6BDE', 0.6);
  const open = group('OpenBook');
  open.position.y = 0.02;
  for (const side of [-1, 1]) {
    const half = group(side < 0 ? 'LeftHalf' : 'RightHalf');
    half.rotation.z = side * -0.22;
    half.add(m(new BoxGeometry(0.11, 0.008, 0.15), cover, 'Cover', side * 0.055, 0, 0));
    half.add(m(new BoxGeometry(0.1, 0.018, 0.14), K.paper, 'Pages', side * 0.052, 0.012, 0));
    open.add(half);
  }
  g.add(open);
  g.add(m(new BoxGeometry(0.018, 0.02, 0.15), cover, 'Spine', 0, 0.012, 0));
  const ribbon = m(new BoxGeometry(0.008, 0.002, 0.06), K.red, 'Ribbon', 0.01, 0.006, 0.09);
  g.add(ribbon);
  return g;
}

/** Light bulb: an idea, insight, energy, electricity. */
export function makeBulb(): Group {
  const g = group('Bulb');
  const glow = K.glass.clone();
  glow.userData.tint = true;
  g.add(m(lathe([[0.022, 0.05], [0.03, 0.08], [0.055, 0.12], [0.06, 0.15], [0.045, 0.19], [0.02, 0.205], [0, 0.208]], 24), glow, 'Glass'));
  g.add(m(lathe([[0, 0], [0.016, 0.004], [0.024, 0.012], [0.024, 0.05], [0, 0.05]], 16), K.grey, 'Base'));
  for (let i = 0; i < 3; i++) g.add(m(new TorusGeometry(0.025, 0.003, 6, 18), K.brass, `Thread${i}`, 0, 0.018 + i * 0.012, 0));
  (g.children.slice(-3) as Mesh[]).forEach((t) => (t.rotation.x = Math.PI / 2));
  g.add(m(new TorusGeometry(0.014, 0.002, 6, 16, Math.PI), K.flame, 'Filament', 0, 0.12, 0));
  return g;
}

function extruded(shape: Shape, depth: number, bevel = 0.006) {
  const geo = new ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 16 });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

/** Heart: love, life, health, blood, care. */
export function makeHeart(): Group {
  const g = group('Heart');
  const s = new Shape();
  s.moveTo(0, 0.02);
  s.bezierCurveTo(0, 0.02, -0.01, 0.07, -0.06, 0.1);
  s.bezierCurveTo(-0.11, 0.13, -0.1, 0.2, -0.055, 0.2);
  s.bezierCurveTo(-0.025, 0.2, -0.005, 0.18, 0, 0.165);
  s.bezierCurveTo(0.005, 0.18, 0.025, 0.2, 0.055, 0.2);
  s.bezierCurveTo(0.1, 0.2, 0.11, 0.13, 0.06, 0.1);
  s.bezierCurveTo(0.01, 0.07, 0, 0.02, 0, 0.02);
  g.add(m(extruded(s, 0.035, 0.012), tint('#E0453A', 0.35), 'HeartShape'));
  return g;
}

/** Shield: protection, defence, safety, immunity. */
export function makeShield(): Group {
  const g = group('Shield');
  const s = new Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.09, 0.05, 0.09, 0.13);
  s.lineTo(0.09, 0.2);
  s.quadraticCurveTo(0.045, 0.22, 0, 0.215);
  s.quadraticCurveTo(-0.045, 0.22, -0.09, 0.2);
  s.lineTo(-0.09, 0.13);
  s.quadraticCurveTo(-0.09, 0.05, 0, 0);
  g.add(m(extruded(s, 0.02), tint('#2F6BDE', 0.4, 0.3), 'Face'));
  const stripe = m(new BoxGeometry(0.03, 0.2, 0.04), K.gold, 'Stripe', 0, 0.11, 0);
  stripe.scale.z = 0.9;
  g.add(stripe);
  g.add(m(new BoxGeometry(0.16, 0.03, 0.04), K.gold, 'Bar', 0, 0.14, 0));
  return g;
}

/** Hourglass: time, waiting, duration, deadlines, history. */
export function makeHourglass(): Group {
  const g = group('Hourglass');
  const frame = tint('#7A4A26', 0.7);
  for (const y of [0.008, 0.212]) g.add(m(new CylinderGeometry(0.06, 0.06, 0.016, 20), frame, y < 0.1 ? 'BaseBottom' : 'BaseTop', 0, y, 0));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    g.add(m(new CylinderGeometry(0.005, 0.005, 0.2, 8), frame, `Post${i}`, Math.cos(a) * 0.05, 0.11, Math.sin(a) * 0.05));
  }
  g.add(m(lathe([[0.004, 0.016], [0.04, 0.03], [0.042, 0.06], [0.008, 0.108], [0.008, 0.112], [0.042, 0.16], [0.04, 0.19], [0.004, 0.204]], 20), K.glass, 'Glass'));
  g.add(m(new ConeGeometry(0.034, 0.035, 18), K.sand, 'SandBottom', 0, 0.035, 0));
  const top = m(new ConeGeometry(0.03, 0.03, 18), K.sand, 'SandTop', 0, 0.135, 0);
  top.rotation.x = Math.PI;
  g.add(top);
  g.add(m(new CylinderGeometry(0.0018, 0.0018, 0.06, 4), K.sand, 'Stream', 0, 0.09, 0));
  return g;
}

/** Balance scales: balance, justice, fairness, comparison, equality. */
export function makeScales(): Group {
  const g = group('Scales');
  const metal = tint('#C99A3B', 0.35, 0.8);
  g.add(m(new CylinderGeometry(0.05, 0.06, 0.015, 20), metal, 'Foot', 0, 0.0075, 0));
  g.add(m(new CylinderGeometry(0.006, 0.008, 0.19, 10), metal, 'Post', 0, 0.105, 0));
  g.add(m(new BoxGeometry(0.22, 0.008, 0.01), metal, 'Beam', 0, 0.2, 0));
  g.add(m(new SphereGeometry(0.012, 12, 8), metal, 'Knob', 0, 0.21, 0));
  for (const x of [-0.1, 0.1]) {
    const side = x > 0 ? 'R' : 'L';
    g.add(m(new CylinderGeometry(0.0015, 0.0015, 0.1, 4), K.grey, `String${side}`, x, 0.15, 0));
    g.add(m(new SphereGeometry(0.045, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), metal, `Pan${side}`, x, 0.1, 0));
  }
  return g;
}

/** Ladder: steps, levels, order, ranking, climbing up a sequence. */
export function makeLadder(): Group {
  const g = group('Ladder');
  const wood = tint('#B07A45', 0.75);
  const lean = group('Lean');
  lean.rotation.x = -0.18;
  for (const x of [-0.045, 0.045]) lean.add(m(new BoxGeometry(0.012, 0.24, 0.016), wood, `Rail${x > 0 ? 'R' : 'L'}`, x, 0.12, 0));
  for (let i = 0; i < 5; i++) {
    const rung = m(new CylinderGeometry(0.005, 0.005, 0.09, 8), wood, `Rung${i}`, 0, 0.03 + i * 0.045, 0);
    rung.rotation.z = Math.PI / 2;
    lean.add(rung);
  }
  g.add(lean);
  return g;
}

/** Mountain: a big obstacle, height, peak, the top, stability. */
export function makeMountain(): Group {
  const g = group('Mountain');
  const rock = tint('#7C8794', 0.85);
  g.add(m(new ConeGeometry(0.11, 0.2, 7), rock, 'Peak', 0, 0.1, 0));
  g.add(m(new ConeGeometry(0.07, 0.12, 6), rock, 'SidePeak', 0.085, 0.06, 0.02));
  g.add(m(new ConeGeometry(0.042, 0.055, 7), K.snow, 'Snow', 0, 0.175, 0));
  g.add(m(new ConeGeometry(0.025, 0.03, 6), K.snow, 'SideSnow', 0.085, 0.108, 0.02));
  return g;
}

// ------------------------------------------------------------------ registry


/** Every image kit, with the meaning hint the agent sees. Keep api/agent.ts KITS in step. */
export const KITS = {
  capsuleChest: { make: makeCapsuleChest, hint: 'capsule locked around a chest (hiding, containing)' },
  parrotCrown: { make: makeParrotCrown, hint: 'parrot passing a crown to its baby (inheriting)' },
  morphGem: { make: makeMorphGem, hint: 'gem that keeps changing shape (many forms)' },
  buttonTV: { make: makeButtonTV, hint: 'TV with one ON button, wires hidden (simple surface)' },
  rocket: { make: makeRocket, hint: 'rocket (launch, speed, start)' },
  planet: { make: makePlanet, hint: 'ringed planet (space, world, orbit)' },
  key: { make: makeKey, hint: 'key (unlock, access, solution)' },
  padlock: { make: makePadlock, hint: 'padlock (security, locked)' },
  bridge: { make: makeBridge, hint: 'bridge (connection, crossing)' },
  coins: { make: makeCoins, hint: 'coin stack (money, value)' },
  tree: { make: makeTree, hint: 'tree (growth, hierarchy, roots)' },
  magnet: { make: makeMagnet, hint: 'magnet (attraction, force)' },
  book: { make: makeBook, hint: 'open book (knowledge, law, record)' },
  bulb: { make: makeBulb, hint: 'light bulb (idea, energy)' },
  heart: { make: makeHeart, hint: 'heart (love, life, health)' },
  shield: { make: makeShield, hint: 'shield (protection, defence)' },
  hourglass: { make: makeHourglass, hint: 'hourglass (time, waiting)' },
  scales: { make: makeScales, hint: 'balance scales (fairness, comparison)' },
  ladder: { make: makeLadder, hint: 'ladder (steps, order, levels)' },
  mountain: { make: makeMountain, hint: 'mountain (peak, obstacle, height)' },
} as const;
export type KitId = keyof typeof KITS;
export const isKit = (id: string): id is KitId => Object.prototype.hasOwnProperty.call(KITS, id);

/** All kits in a 5-wide grid, for one isolated preview sheet. */
export function makeKitGallery(): Group {
  const g = group('KitGallery');
  Object.entries(KITS).forEach(([id, kit], i) => {
    const k = kit.make();
    k.name = id;
    k.position.set((i % 5) * 0.3 - 0.6, -Math.floor(i / 5) * 0.3, 0);
    k.rotation.y = -0.35;
    g.add(k);
  });
  return g;
}
