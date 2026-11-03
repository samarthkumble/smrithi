/**
 * Vivid memory images for Smriti, built in code (origin at the base, about
 * 0.15-0.25 m so they sit comfortably in a pinch). The agent picks one of
 * these "image kits" per fact; preset decks map facts to kits directly.
 */
import {
  BoxGeometry,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  IcosahedronGeometry,
  LatheGeometry,
  type Material,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  CatmullRomCurve3,
  Vector2,
  Vector3,
} from '@iwsdk/core';

const std = (color: string, roughness = 0.6, emissive?: string, ei = 0) =>
  new MeshStandardMaterial({ color, roughness, metalness: 0, emissive: emissive ?? '#000000', emissiveIntensity: ei });

const C = {
  gold: new MeshStandardMaterial({ color: '#E8B23A', roughness: 0.3, metalness: 0.8 }),
  wood: std('#7A4A26', 0.7),
  woodDark: std('#4F2E16', 0.7),
  red: std('#E0453A', 0.45),
  white: std('#F7F3EA', 0.5),
  green: std('#3DBA4E', 0.55),
  greenDark: std('#23853A', 0.55),
  orange: std('#F28C28', 0.5),
  black: std('#1E1E24', 0.5),
  screen: std('#20314F', 0.3, '#3E7BD6', 0.35),
  wire: [std('#E0453A', 0.6), std('#2F6BDE', 0.6), std('#F2C230', 0.6), std('#3DBA4E', 0.6)],
  morph: [std('#9B5DE5', 0.35, '#9B5DE5', 0.25), std('#00BBF9', 0.35, '#00BBF9', 0.25), std('#F15BB5', 0.35, '#F15BB5', 0.25)],
  terracotta: std('#B5552E', 0.85),
  flame: new MeshStandardMaterial({ color: '#FFD27A', emissive: '#FFB02E', emissiveIntensity: 2.5, roughness: 1 }),
  marigold: new MeshStandardMaterial({ color: '#E3A21A', emissive: '#E3A21A', emissiveIntensity: 1.2, roughness: 0.6, transparent: true, opacity: 0.85 }),
};

function m(geo: ConstructorParameters<typeof Mesh>[0], mat: Material, name: string, x = 0, y = 0, z = 0): Mesh {
  const mesh = new Mesh(geo, mat);
  mesh.name = name;
  mesh.position.set(x, y, z);
  return mesh;
}

/** Encapsulation: a giant capsule pill locks a treasure chest shut. */
export function makeCapsuleChest(): Group {
  const g = new Group();
  g.name = 'CapsuleChest';
  g.add(m(new BoxGeometry(0.2, 0.11, 0.13), C.wood, 'ChestBody', 0, 0.055, 0));
  const lid = m(new CylinderGeometry(0.065, 0.065, 0.2, 14, 1, false, 0, Math.PI), C.woodDark, 'ChestLid', 0, 0.11, 0);
  lid.rotation.z = Math.PI / 2;
  lid.rotation.y = Math.PI / 2;
  g.add(lid);
  for (const x of [-0.07, 0.07]) g.add(m(new BoxGeometry(0.02, 0.115, 0.135), C.gold, 'ChestBand', x, 0.058, 0));
  // The capsule wraps over the lid like a lock
  const capRed = m(new CapsuleGeometry(0.035, 0.09, 6, 12), C.red, 'CapsuleRed', -0.045, 0.2, 0);
  capRed.rotation.z = Math.PI / 2;
  const capWhite = m(new CapsuleGeometry(0.035, 0.09, 6, 12), C.white, 'CapsuleWhite', 0.045, 0.2, 0);
  capWhite.rotation.z = Math.PI / 2;
  g.add(capRed, capWhite);
  return g;
}

function parrot(scale: number): Group {
  const p = new Group();
  p.name = 'Parrot';
  const body = m(new SphereGeometry(0.05, 12, 10), C.green, 'ParrotBody', 0, 0.06, 0);
  body.scale.set(0.9, 1.25, 0.9);
  const head = m(new SphereGeometry(0.035, 12, 10), C.green, 'ParrotHead', 0, 0.135, 0.012);
  const beak = m(new ConeGeometry(0.014, 0.035, 8), C.red, 'ParrotBeak', 0, 0.13, 0.05);
  beak.rotation.x = Math.PI / 2 + 0.5;
  const tail = m(new ConeGeometry(0.02, 0.09, 6), C.greenDark, 'ParrotTail', 0, 0.02, -0.05);
  tail.rotation.x = -2.4;
  for (const s of [-1, 1]) {
    const eye = m(new SphereGeometry(0.006, 6, 6), C.black, 'ParrotEye', s * 0.022, 0.145, 0.035);
    p.add(eye);
  }
  p.add(body, head, beak, tail);
  p.scale.setScalar(scale);
  return p;
}

function crown(): Group {
  const c = new Group();
  c.name = 'Crown';
  c.add(m(new CylinderGeometry(0.03, 0.03, 0.02, 12, 1, true), C.gold, 'CrownBand', 0, 0.01, 0));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    c.add(m(new ConeGeometry(0.008, 0.025, 4), C.gold, 'CrownPoint', Math.sin(a) * 0.028, 0.032, Math.cos(a) * 0.028));
  }
  return c;
}

/** Inheritance: a crown passes from a big parrot to its baby. */
export function makeParrotCrown(): Group {
  const g = new Group();
  g.name = 'ParrotCrown';
  const parent = parrot(1.25);
  parent.position.set(-0.05, 0, 0);
  const baby = parrot(0.7);
  baby.position.set(0.075, 0, 0.02);
  const cr = crown();
  cr.name = 'InheritedCrown';
  cr.position.set(0.075, 0.115, 0.03);
  cr.scale.setScalar(0.85);
  const perch = m(new CylinderGeometry(0.012, 0.012, 0.24, 8), C.woodDark, 'Perch', 0.01, 0.004, 0);
  perch.rotation.z = Math.PI / 2;
  g.add(perch, parent, baby, cr);
  return g;
}

/** Polymorphism: one gem that keeps changing form (animated by the runtime). */
export function makeMorphGem(): Group {
  const g = new Group();
  g.name = 'MorphGem';
  const forms = [
    m(new BoxGeometry(0.12, 0.12, 0.12), C.morph[0], 'FormCube', 0, 0.09, 0),
    m(new IcosahedronGeometry(0.08, 1), C.morph[1], 'FormSphere', 0, 0.09, 0),
    m(new OctahedronGeometry(0.09, 0), C.morph[2], 'FormDiamond', 0, 0.09, 0),
  ];
  forms.forEach((f, i) => {
    f.visible = i === 0;
    g.add(f);
  });
  g.add(m(new CylinderGeometry(0.06, 0.07, 0.02, 16), C.gold, 'MorphBase', 0, 0.01, 0));
  g.userData.morphForms = forms.map((f) => f.name);
  return g;
}

/** Abstraction: a TV that shows only a big ON button; the wires hide behind. */
export function makeButtonTV(): Group {
  const g = new Group();
  g.name = 'ButtonTV';
  g.add(m(new BoxGeometry(0.22, 0.15, 0.06), C.black, 'TVBody', 0, 0.105, 0));
  g.add(m(new BoxGeometry(0.19, 0.12, 0.005), C.screen, 'TVScreen', 0, 0.105, 0.031));
  const btn = m(new CylinderGeometry(0.035, 0.035, 0.02, 20), C.red, 'BigOnButton', 0, 0.105, 0.04);
  btn.rotation.x = Math.PI / 2;
  g.add(btn);
  g.add(m(new BoxGeometry(0.03, 0.03, 0.03), C.black, 'TVStand', 0, 0.015, 0));
  // Tangled wires behind the TV, hidden from the front
  C.wire.forEach((wm, i) => {
    const pts = [0, 1, 2, 3, 4].map((k) => new Vector3(
      Math.sin(k * 1.7 + i) * 0.08,
      0.03 + k * 0.03 + Math.cos(k + i) * 0.015,
      -0.05 - Math.abs(Math.cos(k * 2.1 + i)) * 0.04,
    ));
    g.add(m(new TubeGeometry(new CatmullRomCurve3(pts), 24, 0.005, 5, false), wm, 'HiddenWire'));
  });
  return g;
}

/** Smriti, the guide: a small clay diya with a living flame. */
export function makeDiya(): Group {
  const g = new Group();
  g.name = 'SmritiDiya';
  const profile = [[0.001, 0], [0.05, 0.004], [0.075, 0.02], [0.085, 0.045], [0.08, 0.05], [0.066, 0.03], [0.001, 0.026]]
    .map(([r, y]) => new Vector2(r, y));
  const bowl = m(new LatheGeometry(profile, 20), C.terracotta, 'DiyaBowl');
  g.add(bowl);
  const spout = m(new ConeGeometry(0.02, 0.05, 8), C.terracotta, 'DiyaSpout', 0, 0.035, 0.08);
  spout.rotation.x = Math.PI / 2;
  g.add(spout);
  const flame = m(new SphereGeometry(0.02, 10, 8), C.flame, 'DiyaFlame', 0, 0.075, 0.075);
  flame.scale.set(0.8, 2, 0.8);
  g.add(flame);
  return g;
}

/** Glowing ring that marks an empty memory spot while you place things. */
export function makeSpotRing(): Mesh {
  const ring = m(new TorusGeometry(0.11, 0.008, 6, 32), C.marigold, 'SpotRing');
  ring.rotation.x = Math.PI / 2;
  return ring;
}

export const MEMORY_KITS = {
  capsuleChest: makeCapsuleChest,
  parrotCrown: makeParrotCrown,
  morphGem: makeMorphGem,
  buttonTV: makeButtonTV,
} as const;
export type MemoryKitId = keyof typeof MEMORY_KITS;
