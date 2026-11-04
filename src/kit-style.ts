/**
 * Dress a kit for one card: its colour and its effect (giant, glowing, on fire...).
 * Returns a wrapper whose child "Pivot" carries the animated part, so effects never
 * fight the placement transform.
 */
import { mergeStatic } from './scene-assets/lib/merge-static.js';
import { settings } from './settings.js';
import { Box3, ConeGeometry, Group, Mesh, MeshStandardMaterial, type Object3D, Vector3 } from '@iwsdk/core';

export const KIT_COLORS: Record<string, string> = {
  red: '#D8433A',
  blue: '#2F6BDE',
  green: '#3DA35A',
  gold: '#E8B23A',
  purple: '#8E5BD8',
  pink: '#E86BAE',
  white: '#F4F1EA',
  black: '#33353D',
};
export const MODIFIERS = ['none', 'giant', 'tiny', 'glowing', 'spinning', 'bouncing', 'on_fire', 'floating'] as const;
export type Modifier = (typeof MODIFIERS)[number];
export const isModifier = (m: string): m is Modifier => (MODIFIERS as readonly string[]).includes(m);

const flameMat = new MeshStandardMaterial({ color: '#FF8A1F', emissive: '#FF5A00', emissiveIntensity: 1.1, roughness: 1, transparent: true, opacity: 0.92 });
const flameCore = new MeshStandardMaterial({ color: '#FFD36B', emissive: '#FFB020', emissiveIntensity: 0.9, roughness: 1 });
const flameGeo = new ConeGeometry(0.02, 0.075, 10);
const coreGeo = new ConeGeometry(0.01, 0.04, 8);

export interface Styled {
  root: Group;
  pivot: Group;
  modifier: Modifier;
  flames: Mesh[];
  phase: number;
  /** Size effect, applied by the system only once the memory is placed. */
  sizeScale: number;
}

export function styleKit(kit: Object3D, color: string, modifier: string): Styled {
  const root = new Group();
  const pivot = new Group();
  pivot.name = 'Pivot';
  pivot.add(kit);
  root.add(pivot);
  const mod: Modifier = isModifier(modifier) ? modifier : 'none';
  const hex = KIT_COLORS[color];
  const cloned = new Map<unknown, MeshStandardMaterial>();
  kit.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    const mat = mesh.material as MeshStandardMaterial;
    if (!mat?.isMeshStandardMaterial) return;
    const wantsTint = Boolean(hex && mat.userData.tint);
    const wantsGlow = mod === 'glowing' && Boolean(mat.userData.tint);
    if (!wantsTint && !wantsGlow) return;
    let c = cloned.get(mat);
    if (!c) {
      c = mat.clone();
      if (wantsTint) c.color.set(hex);
      if (wantsGlow) {
        c.emissive.copy(c.color);
        c.emissiveIntensity = 0.65;
      }
      cloned.set(mat, c);
    }
    mesh.material = c;
  });
  // Fewer draw calls: fuse each kit's static parts by material (shape-changing forms stay separate).
  const forms = new Set((kit.userData.morphForms as string[] | undefined) ?? []);
  mergeStatic(kit, (mesh) => {
    for (let o: Object3D | null = mesh; o && o !== kit; o = o.parent) if (forms.has(o.name)) return true;
    return false;
  });
  const flames: Mesh[] = [];
  if (mod === 'on_fire') {
    const box = new Box3().setFromObject(kit);
    const size = box.getSize(new Vector3());
    for (let i = 0; i < 3; i++) {
      const f = new Mesh(flameGeo, flameMat);
      f.name = `Flame${i}`;
      f.position.set((i - 1) * size.x * 0.28, box.max.y + 0.02, (i % 2 ? 1 : -1) * size.z * 0.12);
      const core = new Mesh(coreGeo, flameCore);
      core.name = `FlameCore${i}`;
      core.position.y = -0.012;
      f.add(core);
      pivot.add(f);
      flames.push(f);
    }
  }
  return { root, pivot, modifier: mod, flames, phase: Math.random() * 6, sizeScale: mod === 'giant' ? 1.4 : mod === 'tiny' ? 0.65 : 1 };
}

/** Per-frame effect motion; allocation-free. */
export function animateKit(s: Styled, t: number, delta: number): void {
  const p = s.pivot;
  if (settings.calm) {
    // Calm motion: effects hold still (floating keeps its lift, flames stay lit).
    if (s.modifier === 'floating') p.position.y = 0.05;
  } else switch (s.modifier) {
    case 'spinning':
      p.rotation.y += delta * 2.2;
      break;
    case 'bouncing':
      p.position.y = Math.abs(Math.sin(t * 4 + s.phase)) * 0.05;
      break;
    case 'floating':
      p.position.y = 0.05 + Math.sin(t * 1.6 + s.phase) * 0.02;
      p.rotation.y = Math.sin(t * 0.7 + s.phase) * 0.4;
      break;
    case 'glowing':
      break;
  }
  for (let i = 0; i < s.flames.length; i++) {
    const k = 0.8 + Math.sin(t * 13 + i * 2.1 + s.phase) * 0.15 + Math.sin(t * 7.7 + i) * 0.1;
    s.flames[i].scale.set(k, 1.1 * k + 0.15, k);
  }
}
