/**
 * Smriti's room: a warm, low-poly Mangalore-style home built in code.
 * Shell (floor, walls, ceiling beams) plus the eight memory-spot props, all
 * placed from src/palace-layout.ts so runtime snapping matches the geometry.
 */
import {
  AdditiveBlending,
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  type BufferGeometry,
  DataTexture,
  DoubleSide,
  Group,
  LatheGeometry,
  type Material,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  RepeatWrapping,
  RGBAFormat,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
} from '@iwsdk/core';
import { mergeStatic } from './lib/merge-static.js';
import { ROOM } from '../palace-layout.js';
import { bevelBox } from './lib/hardsurface.js';

const mat = (color: string, roughness = 0.85, extra: Partial<MeshStandardMaterial> = {}) =>
  Object.assign(new MeshStandardMaterial({ color, roughness, metalness: 0 }), extra);

export const M = {
  wall: mat('#EFE3CF', 0.95),
  wallLow: mat('#C8643C', 0.9), // red-oxide dado band
  floor: mat('#8E2F1F', 0.42), // polished red oxide floor
  ceiling: mat('#E9DCC6', 0.95),
  teak: mat('#6B3E22', 0.7),
  teakDark: mat('#4A2A16', 0.7),
  brass: mat('#C9962E', 0.35, { metalness: 0.75 }),
  brassDark: mat('#9C6F1C', 0.4, { metalness: 0.7 }),
  rope: mat('#B89A6A', 0.95),
  glassSky: mat('#F4B860', 1, { emissive: new MeshStandardMaterial().emissive.set('#F29A3A'), emissiveIntensity: 0.85 }),
  clockFace: mat('#FBF3E2', 0.8),
  ink: mat('#2B2118', 0.8),
  flame: mat('#FFC861', 1, { emissive: new MeshStandardMaterial().emissive.set('#FFB43A'), emissiveIntensity: 2.2 }),
  leaf: mat('#3F7A3A', 0.85),
  leafLight: mat('#5E9A45', 0.85),
  terracotta: mat('#B85A34', 0.9),
  limeWhite: mat('#F6F1E6', 0.9),
  rangoliRed: mat('#D7263D', 0.9),
  rangoliYellow: mat('#F2B705', 0.9),
  rangoliWhite: mat('#FBF7EE', 0.9),
  rangoliGreen: mat('#2E8B57', 0.9),
  rangoliBlue: mat('#2D4F9E', 0.9),
  book: ['#8C2F39', '#2F5D8C', '#C9962E', '#3F7A3A', '#6B3E22', '#5A4A8A'].map((c) => mat(c, 0.8)),
};

function mesh(geometry: BufferGeometry, material: Material, name?: string): Mesh {
  const m = new Mesh(geometry, material);
  if (name) m.name = name;
  return m;
}

function at<T extends { position: { set(x: number, y: number, z: number): unknown } }>(
  obj: T,
  x: number,
  y: number,
  z: number,
): T {
  obj.position.set(x, y, z);
  return obj;
}

/** Deterministic value noise for small procedural textures. */
function hash2(x: number, y: number, seed: number): number {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

function greyTexture(size: number, repeat: [number, number], f: (x: number, y: number) => number): DataTexture {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = Math.max(0, Math.min(255, Math.round(f(x, y))));
      const i = (y * size + x) * 4;
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const tex = new DataTexture(data, size, size, RGBAFormat);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/** Teak grain: long wavy streaks along one axis. */
function woodTexture(seed: number): DataTexture {
  return greyTexture(128, [2, 2], (x, y) => {
    const wave = Math.sin((x + Math.sin(y * 0.09 + seed) * 6) * 0.42 + seed) * 0.5 + 0.5;
    const fleck = hash2(x, y >> 3, seed) * 0.25;
    return 205 + wave * 38 + fleck * 30 - (hash2(x >> 1, 0, seed) > 0.93 ? 40 : 0);
  });
}

/** Limewash: soft blotches with a little brush texture. */
function plasterTexture(seed: number): DataTexture {
  return greyTexture(128, [3, 2], (x, y) => {
    const blot = (hash2(x >> 4, y >> 4, seed) + hash2((x + 8) >> 4, (y + 8) >> 4, seed + 1)) * 0.5;
    return 228 + blot * 22 + hash2(x, y, seed + 2) * 8;
  });
}

M.teak.map = woodTexture(1);
M.teakDark.map = woodTexture(7);
M.wall.map = plasterTexture(3);
M.wallLow.map = plasterTexture(5);
M.ceiling.map = plasterTexture(9);

/** Subtle tile grid for the red-oxide floor (deterministic, no DOM). */
function floorTexture(): DataTexture {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const grout = x === 0 || y === 0;
      const v = grout ? 150 : 255 - ((x * 7 + y * 13) % 9);
      data[i] = v;
      data[i + 1] = v;
      data[i + 2] = v;
      data[i + 3] = 255;
    }
  }
  const tex = new DataTexture(data, size, size, RGBAFormat);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(9, 7);
  tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function buildShell(): Group {
  const g = new Group();
  g.name = 'Shell';
  const W = ROOM.halfWidth * 2;
  const D = ROOM.frontZ - ROOM.backZ;
  const cz = (ROOM.frontZ + ROOM.backZ) / 2;
  const H = ROOM.height;

  const floorMat = M.floor.clone();
  floorMat.map = floorTexture();
  const floor = mesh(new PlaneGeometry(W, D), floorMat, 'Floor');
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, cz);
  floor.receiveShadow = true;
  g.add(floor);

  const ceiling = mesh(new PlaneGeometry(W, D), M.ceiling, 'Ceiling');
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, H, cz);
  g.add(ceiling);

  // Walls: limewash above a red-oxide dado band (0.9 m), facing inward.
  const walls: Array<[string, number, number, number, number, number]> = [
    // name, width, x, z, rotY
    ['BackWall', W, 0, ROOM.backZ, 0, 0],
    ['FrontWall', W, 0, ROOM.frontZ, Math.PI, 0],
    ['LeftWall', D, -ROOM.halfWidth, cz, Math.PI / 2, 0],
    ['RightWall', D, ROOM.halfWidth, cz, -Math.PI / 2, 0],
  ];
  for (const [name, width, x, z, ry] of walls) {
    const wall = new Group();
    wall.name = name;
    const upper = mesh(new PlaneGeometry(width, H - 0.9), M.wall);
    upper.position.y = 0.9 + (H - 0.9) / 2;
    const lower = mesh(new PlaneGeometry(width, 0.9), M.wallLow);
    lower.position.y = 0.45;
    const trim = mesh(new BoxGeometry(width, 0.05, 0.03), M.teak);
    trim.position.set(0, 0.9, 0.015);
    wall.add(upper, lower, trim);
    wall.position.set(x, 0, z);
    wall.rotation.y = ry;
    g.add(wall);
  }

  // Exposed teak ceiling beams, running front-to-back.
  const beamGeo = new BoxGeometry(0.14, 0.16, D);
  for (let i = -2; i <= 2; i++) {
    const beam = mesh(beamGeo, M.teakDark, 'Beam');
    beam.position.set(i * 1.05, H - 0.08, cz);
    g.add(beam);
  }
  const ridge = mesh(new BoxGeometry(W, 0.18, 0.18), M.teakDark, 'Ridge');
  ridge.position.set(0, H - 0.1, -0.6);
  g.add(ridge);
  return g;
}

function buildDoor(): Group {
  // On the left wall, facing +X (towards the player).
  const g = new Group();
  g.name = 'Door';
  const frame = new Group();
  const side = new BoxGeometry(0.12, 2.15, 0.12);
  frame.add(at(mesh(side, M.teakDark), 0, 1.075, -0.56), at(mesh(side, M.teakDark), 0, 1.075, 0.56));
  frame.add(at(mesh(new BoxGeometry(0.14, 0.14, 1.26), M.teakDark), 0, 2.2, 0));
  const leafGeo = bevelBox(0.5, 2.05, 0.06, 0.01);
  for (const s of [-1, 1]) {
    const leaf = mesh(leafGeo, M.teak, 'DoorLeaf');
    leaf.rotation.y = Math.PI / 2;
    leaf.position.set(0.02, 1.03, s * 0.255);
    g.add(leaf);
    // Carved panels
    for (const py of [0.55, 1.45]) {
      const panel = mesh(bevelBox(0.36, 0.62, 0.03, 0.008), M.teakDark);
      panel.rotation.y = Math.PI / 2;
      panel.position.set(0.055, py, s * 0.255);
      g.add(panel);
    }
    const ring = mesh(new TorusGeometry(0.045, 0.009, 6, 16), M.brass, 'DoorRing');
    ring.rotation.y = Math.PI / 2;
    ring.position.set(0.07, 1.05, s * 0.07);
    g.add(ring);
  }
  g.add(frame);
  g.position.set(-ROOM.halfWidth + 0.02, 0, -0.7);
  return g;
}

function faceOrigin(g: Group, x: number, z: number): void {
  g.rotation.y = Math.atan2(-x, -z);
}

function buildJhoola(): Group {
  const g = new Group();
  g.name = 'Jhoola';
  const seat = mesh(bevelBox(0.82, 0.06, 0.38, 0.015), M.teak, 'JhoolaSeat');
  seat.rotation.x = -Math.PI / 2;
  seat.position.y = 0.52;
  g.add(seat);
  const rail = mesh(bevelBox(0.82, 0.16, 0.04, 0.01), M.teakDark, 'JhoolaBack');
  rail.position.set(0, 0.66, -0.2);
  g.add(rail);
  const ropeLen = 2.8 - 0.55;
  const ropeGeo = new CylinderGeometry(0.012, 0.012, ropeLen, 6);
  for (const sx of [-0.38, 0.38]) {
    for (const sz of [-0.15, 0.15]) {
      g.add(at(mesh(ropeGeo, M.brassDark, 'JhoolaChain'), sx, 0.55 + ropeLen / 2, sz));
    }
  }
  g.position.set(-1.38, 0, -1.28);
  faceOrigin(g, -1.38, -1.28);
  return g;
}

function buildBookshelf(): Group {
  const g = new Group();
  g.name = 'Bookshelf';
  const w = 0.92;
  const h = 1.95;
  const d = 0.32;
  const sideGeo = new BoxGeometry(0.04, h, d);
  g.add(at(mesh(sideGeo, M.teak), -w / 2, h / 2, 0), at(mesh(sideGeo, M.teak), w / 2, h / 2, 0));
  g.add(at(mesh(new BoxGeometry(w, h, 0.02), M.teakDark), 0, h / 2, -d / 2 + 0.01));
  const shelfGeo = new BoxGeometry(w, 0.035, d);
  const shelves = [0.05, 0.5, 0.95, 1.4, 1.93];
  for (const y of shelves) g.add(at(mesh(shelfGeo, M.teak, 'Shelf'), 0, y, 0));
  // Books on three shelves (skip the middle one: it's the memory spot)
  let k = 0;
  for (const y of [0.05, 0.5, 1.4]) {
    let x = -w / 2 + 0.05;
    while (x < w / 2 - 0.08) {
      const bw = 0.035 + ((k * 37) % 5) * 0.008;
      const bh = 0.24 + ((k * 53) % 7) * 0.02;
      const book = mesh(new BoxGeometry(bw, bh, 0.2), M.book[k % M.book.length], 'Book');
      book.position.set(x + bw / 2, y + 0.018 + bh / 2, 0.02);
      if (k % 9 === 4) book.rotation.z = 0.18;
      g.add(book);
      x += bw + 0.006;
      k++;
    }
  }
  g.position.set(-1.12, 0, ROOM.backZ + d / 2 + 0.01);
  return g;
}

function buildWindow(): Group {
  const g = new Group();
  g.name = 'Window';
  const w = 1.1;
  const h = 1.2;
  const cy = 1.62;
  const sky = mesh(new PlaneGeometry(w, h), M.glassSky, 'EveningSky');
  sky.position.set(0, cy, 0.006);
  g.add(sky);
  const bar = (bw: number, bh: number, x: number, y: number) =>
    at(mesh(new BoxGeometry(bw, bh, 0.07), M.teakDark), x, y, 0.04);
  g.add(bar(w + 0.12, 0.08, 0, cy + h / 2), bar(w + 0.12, 0.08, 0, cy - h / 2));
  g.add(bar(0.08, h, -w / 2, cy), bar(0.08, h, w / 2, cy));
  g.add(bar(0.04, h, 0, cy), bar(w, 0.035, 0, cy + 0.2));
  // Vertical iron grille bars typical of old homes
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    g.add(at(mesh(new CylinderGeometry(0.008, 0.008, h, 6), M.ink), i * 0.14, cy, 0.03));
  }
  const sill = mesh(bevelBox(w + 0.3, 0.06, 0.3, 0.01), M.teak, 'WindowSill');
  sill.rotation.x = -Math.PI / 2;
  sill.position.set(0, cy - h / 2 - 0.03, 0.14);
  g.add(sill);
  // Open shutters angled into the room
  for (const s of [-1, 1]) {
    const shutter = mesh(bevelBox(0.42, h * 0.9, 0.035, 0.008), M.teak, 'Shutter');
    shutter.geometry.translate(s * 0.21, 0, 0);
    shutter.position.set(s * (w / 2 + 0.06), cy, 0.03);
    shutter.rotation.y = s * -1.35;
    g.add(shutter);
  }
  // Warm evening light falling from the window onto the floor
  const shaftMat = new MeshBasicMaterial({
    color: '#FFC27A', transparent: true, opacity: 0.075, blending: AdditiveBlending,
    depthWrite: false, side: DoubleSide,
  });
  const shaft = mesh(new CylinderGeometry(0.62, 0.95, 2.1, 4, 1, true), shaftMat, 'LightShaft');
  shaft.rotation.y = Math.PI / 4;
  const tilt = new Group();
  tilt.name = 'LightShaftPivot';
  tilt.position.set(0, 0.95, 0.75);
  tilt.rotation.x = 0.62;
  tilt.add(shaft);
  shaft.userData.iwsdkPreviewBounds = 'exclude';
  g.add(tilt);
  g.position.set(-0.18, 0, ROOM.backZ);
  return g;
}

function buildPictures(): Group {
  // Framed pictures on the right wall: family photo and an old landscape
  const g = new Group();
  g.name = 'WallPictures';
  const frames: Array<[number, number, number, number, string]> = [
    [0.42, 0.52, -1.9, 1.75, '#C98B5B'],
    [0.62, 0.42, -0.6, 1.85, '#5E8C6A'],
    [0.3, 0.3, 0.45, 1.6, '#B0563A'],
  ];
  for (const [w, h, z, y, color] of frames) {
    const frame = mesh(bevelBox(w, h, 0.035, 0.008), M.teakDark, 'PictureFrame');
    frame.position.set(0, y, z);
    frame.rotation.y = -Math.PI / 2;
    const art = mesh(new PlaneGeometry(w - 0.07, h - 0.07), mat(color, 0.9), 'PictureArt');
    art.position.set(-0.02, y, z);
    art.rotation.y = -Math.PI / 2;
    g.add(frame, art);
  }
  g.position.set(ROOM.halfWidth - 0.02, 0, 0);
  return g;
}

function buildClock(): Group {
  const g = new Group();
  g.name = 'WallClock';
  const cy = 1.92;
  const rim = mesh(new CylinderGeometry(0.24, 0.24, 0.07, 28), M.teakDark, 'ClockRim');
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, cy, 0.04);
  const face = mesh(new CircleGeometry(0.2, 28), M.clockFace, 'ClockFace');
  face.position.set(0, cy, 0.077);
  g.add(rim, face);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const tick = mesh(new BoxGeometry(0.012, i % 3 === 0 ? 0.04 : 0.022, 0.004), M.ink);
    tick.position.set(Math.sin(a) * 0.17, cy + Math.cos(a) * 0.17, 0.08);
    tick.rotation.z = -a;
    g.add(tick);
  }
  const hour = mesh(new BoxGeometry(0.016, 0.1, 0.005), M.ink, 'HourHand');
  hour.geometry.translate(0, 0.045, 0);
  hour.position.set(0, cy, 0.083);
  hour.rotation.z = -2.1;
  const minute = mesh(new BoxGeometry(0.01, 0.15, 0.005), M.ink, 'MinuteHand');
  minute.geometry.translate(0, 0.07, 0);
  minute.position.set(0, cy, 0.086);
  minute.rotation.z = 0.5;
  const pendulumBox = mesh(bevelBox(0.16, 0.34, 0.06, 0.01), M.teakDark, 'PendulumCase');
  pendulumBox.position.set(0, cy - 0.38, 0.03);
  const bob = mesh(new CylinderGeometry(0.035, 0.035, 0.01, 16), M.brass, 'Pendulum');
  bob.rotation.x = Math.PI / 2;
  bob.position.set(0, cy - 0.44, 0.065);
  // Small wall shelf below: the memory spot
  const shelf = mesh(bevelBox(0.5, 0.04, 0.24, 0.008), M.teak, 'ClockShelf');
  shelf.rotation.x = -Math.PI / 2;
  shelf.position.set(0, 1.48, 0.12);
  g.add(hour, minute, pendulumBox, bob, shelf);
  g.position.set(0.95, 0, ROOM.backZ);
  return g;
}

function buildLamp(): Group {
  const g = new Group();
  g.name = 'BrassLamp';
  const pedestal = mesh(new CylinderGeometry(0.3, 0.32, 0.5, 20), M.teak, 'LampPedestal');
  pedestal.position.y = 0.25;
  g.add(pedestal);
  // Kuthu vilakku: lathe profile in metres (radius, height) above the pedestal
  const pts: Array<[number, number]> = [
    [0.001, 0], [0.13, 0], [0.12, 0.03], [0.05, 0.06], [0.03, 0.1], [0.022, 0.35],
    [0.035, 0.38], [0.02, 0.42], [0.02, 0.56], [0.1, 0.6], [0.13, 0.63], [0.1, 0.64],
    [0.02, 0.65], [0.025, 0.7], [0.05, 0.76], [0.001, 0.82],
  ];
  const lamp = mesh(new LatheGeometry(pts.map(([r, y]) => new Vector2(r, y)), 20), M.brass, 'Vilakku');
  lamp.position.set(0, 0.5, -0.1);
  g.add(lamp);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const flame = mesh(new SphereGeometry(0.018, 8, 6), M.flame, 'LampFlame');
    flame.scale.set(1, 1.8, 1);
    flame.position.set(Math.sin(a) * 0.115, 0.5 + 0.665, -0.1 + Math.cos(a) * 0.115);
    g.add(flame);
  }
  g.position.set(1.22, 0, -1.5);
  faceOrigin(g, 1.22, -1.5);
  return g;
}

function buildTulsi(): Group {
  const g = new Group();
  g.name = 'TulsiKatte';
  const base = mesh(bevelBox(0.5, 0.78, 0.5, 0.02), M.limeWhite, 'TulsiPedestal');
  base.position.y = 0.39;
  const band = mesh(new BoxGeometry(0.52, 0.06, 0.52), M.terracotta);
  band.position.y = 0.6;
  const pot = mesh(new CylinderGeometry(0.15, 0.11, 0.2, 14), M.terracotta, 'TulsiPot');
  pot.position.set(0, 0.88, -0.08);
  g.add(base, band, pot);
  const leafGeo = new SphereGeometry(0.07, 7, 5);
  const spots: Array<[number, number, number]> = [
    [0, 1.05, -0.08], [0.08, 1.12, -0.05], [-0.08, 1.14, -0.1], [0.02, 1.24, -0.1],
    [-0.05, 1.3, -0.05], [0.07, 1.33, -0.12], [0, 1.42, -0.08],
  ];
  spots.forEach(([x, y, z], i) => {
    const leaf = mesh(leafGeo, i % 2 ? M.leaf : M.leafLight, 'TulsiLeaves');
    leaf.position.set(x, y, z);
    leaf.scale.set(1, 0.8, 1);
    g.add(leaf);
  });
  g.position.set(1.7, 0, -0.9);
  faceOrigin(g, 1.7, -0.9);
  return g;
}

function buildRangoli(): Group {
  const g = new Group();
  g.name = 'Rangoli';
  const disc = (r: number, m: Material, y: number) => {
    const d = mesh(new CircleGeometry(r, 40), m, 'RangoliRing');
    d.rotation.x = -Math.PI / 2;
    d.position.y = y;
    return d;
  };
  g.add(disc(0.5, M.rangoliWhite, 0.002), disc(0.46, M.rangoliRed, 0.003));
  g.add(disc(0.36, M.rangoliYellow, 0.004), disc(0.27, M.rangoliGreen, 0.005), disc(0.16, M.rangoliBlue, 0.006));
  const petalGeo = new CircleGeometry(0.07, 12);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const petal = mesh(petalGeo, M.rangoliWhite, 'RangoliPetal');
    petal.rotation.x = -Math.PI / 2;
    petal.scale.set(0.6, 1.4, 1);
    petal.rotation.z = a;
    petal.position.set(Math.sin(a) * 0.31, 0.007, Math.cos(a) * 0.31);
    g.add(petal);
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const dot = mesh(new CircleGeometry(0.018, 8), M.rangoliWhite, 'RangoliDot');
    dot.rotation.x = -Math.PI / 2;
    dot.position.set(Math.sin(a) * 0.43, 0.007, Math.cos(a) * 0.43);
    g.add(dot);
  }
  g.position.set(0, 0, -1.15);
  return g;
}

function buildDoorStool(): Group {
  const g = new Group();
  g.name = 'DoorStool';
  const top = mesh(bevelBox(0.42, 0.05, 0.32, 0.012), M.teak, 'StoolTop');
  top.rotation.x = -Math.PI / 2;
  top.position.y = 0.42;
  g.add(top);
  const legGeo = new BoxGeometry(0.05, 0.4, 0.05);
  for (const x of [-0.17, 0.17]) for (const z of [-0.12, 0.12]) g.add(at(mesh(legGeo, M.teakDark), x, 0.2, z));
  g.position.set(-2.08, 0, -0.7);
  g.rotation.y = Math.PI / 2;
  return g;
}

/** The whole palace room. Origin at floor level under the seated player. */
export function createPalaceRoom(): Group {
  const root = new Group();
  root.name = 'PalaceRoom';
  root.add(
    buildShell(),
    buildDoor(),
    buildDoorStool(),
    buildJhoola(),
    buildBookshelf(),
    buildWindow(),
    buildClock(),
    buildLamp(),
    buildTulsi(),
    buildRangoli(),
    buildPictures(),
  );
  root.traverse((o) => {
    if ((o as Mesh).isMesh) {
      (o as Mesh).castShadow = false;
      (o as Mesh).receiveShadow = false;
    }
  });
  // Animated flames stay separate; everything else static is fused by material.
  mergeStatic(root, (mesh) => mesh.name.includes('Flame'));
  return root;
}

export { DoubleSide };
