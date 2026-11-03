/**
 * Small touches of life: dust drifting in the window light and the brass
 * lamp's flames flickering. No per-frame allocation.
 */
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  createSystem,
  type Object3D,
  Points,
  PointsMaterial,
} from '@iwsdk/core';

const MOTES = 70;

export class AmbienceSystem extends createSystem({}) {
  private pos!: Float32Array;
  private seed!: Float32Array;
  private attr!: BufferAttribute;
  private flames: Object3D[] = [];
  private t = 0;

  init(): void {
    this.pos = new Float32Array(MOTES * 3);
    this.seed = new Float32Array(MOTES);
    for (let i = 0; i < MOTES; i++) {
      this.seed[i] = (i * 0.6180339) % 1;
      this.place(i, this.seed[i]);
    }
    const geo = new BufferGeometry();
    this.attr = new BufferAttribute(this.pos, 3);
    geo.setAttribute('position', this.attr);
    const motes = new Points(
      geo,
      new PointsMaterial({ color: '#FFD9A0', size: 0.012, transparent: true, opacity: 0.55, depthWrite: false, blending: AdditiveBlending }),
    );
    motes.name = 'DustMotes';
    motes.frustumCulled = false;
    this.world.createTransformEntity(motes);
    const room = this.world.getSceneObject('palace-room');
    room?.traverse((o) => {
      if (o.name === 'LampFlame') this.flames.push(o);
    });
  }

  /** Motes live in the slanted beam between the window and the floor. */
  private place(i: number, s: number): void {
    const k = (s + this.t * 0.012 * (0.5 + s)) % 1;
    this.pos[i * 3] = -0.18 + Math.sin(i * 12.9898) * 0.45;
    this.pos[i * 3 + 1] = 1.75 - k * 1.6 + Math.sin(this.t * 0.3 + i) * 0.03;
    this.pos[i * 3 + 2] = -2.45 + k * 1.05 + Math.cos(i * 78.233) * 0.25;
  }

  update(delta: number): void {
    this.t += delta;
    for (let i = 0; i < MOTES; i++) this.place(i, this.seed[i]);
    this.attr.needsUpdate = true;
    for (let i = 0; i < this.flames.length; i++) {
      const f = 0.85 + Math.sin(this.t * 13 + i * 2.1) * 0.08 + Math.sin(this.t * 5.3 + i) * 0.07;
      this.flames[i].scale.set(f, 1.8 * f, f);
    }
  }
}
