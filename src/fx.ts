/**
 * Celebration petals: one pooled InstancedMesh of marigold petals (a single draw
 * call). burst() throws a handful outward; trail() drops one behind a flying
 * memory. No allocation per frame; with calm motion on, bursts are small and slow.
 */
import { Color, DynamicDrawUsage, InstancedMesh, MeshStandardMaterial, Object3D, SphereGeometry, type Vector3 } from '@iwsdk/core';
import { settings } from './settings.js';

const N = 180;
const GRAVITY = -2.4;
const PALETTE = ['#F59A1B', '#FFB52E', '#E8740E', '#FFD36B', '#D8433A'].map((c) => new Color(c));

export class Petals {
  readonly mesh: InstancedMesh;
  private pos = new Float32Array(N * 3);
  private vel = new Float32Array(N * 3);
  private life = new Float32Array(N);
  private max = new Float32Array(N);
  private spin = new Float32Array(N);
  private size = new Float32Array(N);
  private next = 0;
  private dummy = new Object3D();

  constructor() {
    const geo = new SphereGeometry(0.012, 6, 4);
    geo.scale(1.3, 0.35, 0.8);
    const mat = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.6, emissive: '#7a3a00', emissiveIntensity: 0.35 });
    this.mesh = new InstancedMesh(geo, mat, N);
    this.mesh.name = 'Petals';
    this.mesh.frustumCulled = false;
    this.mesh.instanceMatrix.setUsage(DynamicDrawUsage);
    for (let i = 0; i < N; i++) {
      this.mesh.setColorAt(i, PALETTE[i % PALETTE.length]);
      this.dummy.scale.setScalar(0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  private spawn(x: number, y: number, z: number, vx: number, vy: number, vz: number, life: number, size: number): void {
    const i = this.next;
    this.next = (this.next + 1) % N;
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = z;
    this.vel[i * 3] = vx;
    this.vel[i * 3 + 1] = vy;
    this.vel[i * 3 + 2] = vz;
    this.life[i] = life;
    this.max[i] = life;
    this.spin[i] = (Math.random() - 0.5) * 14;
    this.size[i] = size;
  }

  /** A ring of petals thrown up and out from a point. */
  burst(at: Vector3, count = 22, power = 1): void {
    const calm = settings.calm;
    const n = calm ? Math.ceil(count / 3) : count;
    const p = calm ? power * 0.4 : power;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const out = (0.4 + Math.random() * 0.8) * p;
      this.spawn(at.x, at.y + 0.05, at.z, Math.cos(a) * out, (0.9 + Math.random() * 1.1) * p, Math.sin(a) * out, 1.1 + Math.random() * 0.7, 0.8 + Math.random() * 0.7);
    }
  }

  /** One petal left behind a flying memory. */
  trail(at: Vector3): void {
    if (settings.calm) return;
    this.spawn(at.x, at.y, at.z, (Math.random() - 0.5) * 0.2, 0.1, (Math.random() - 0.5) * 0.2, 0.6, 0.55);
  }

  update(delta: number): void {
    const d = this.dummy;
    let any = false;
    for (let i = 0; i < N; i++) {
      if (this.life[i] <= 0) continue;
      any = true;
      this.life[i] -= delta;
      const k = i * 3;
      this.vel[k + 1] += GRAVITY * delta;
      this.vel[k] *= 1 - 1.4 * delta;
      this.vel[k + 2] *= 1 - 1.4 * delta;
      this.pos[k] += this.vel[k] * delta;
      this.pos[k + 1] += this.vel[k + 1] * delta;
      this.pos[k + 2] += this.vel[k + 2] * delta;
      const t = Math.max(0, this.life[i] / this.max[i]);
      d.position.set(this.pos[k], this.pos[k + 1], this.pos[k + 2]);
      d.rotation.set(this.life[i] * this.spin[i], this.life[i] * this.spin[i] * 0.7, 0);
      d.scale.setScalar(t > 0 ? this.size[i] * Math.min(1, t * 3) : 0);
      d.updateMatrix();
      this.mesh.setMatrixAt(i, d.matrix);
    }
    if (any) this.mesh.instanceMatrix.needsUpdate = true;
  }
}
