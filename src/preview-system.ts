/**
 * Mouse and camera outside the headset.
 * - On the start screen the camera drifts slowly round the room (unless calm motion is on).
 * - In preview, dragging empty space looks around and the pointer drives Smriti's carry.
 * Allocation-free per frame.
 */
import { createSystem, Euler, type Object3D, Quaternion, Vector3, VisibilityState } from '@iwsdk/core';
import { preview } from './preview.js';
import { settings } from './settings.js';

export class PreviewSystem extends createSystem({}) {
  private base = new Quaternion();
  private drift = new Quaternion();
  private euler = new Euler(0, 0, 0, 'YXZ');
  private yaw = 0;
  private pitch = -0.36;
  private caption: Object3D | undefined;
  private fwd = new Vector3();
  private right = new Vector3();
  private up = new Vector3();
  private started = false;
  private inXR = false;
  private t = 0;
  private lastX = 0;
  private lastY = 0;
  private moved = 0;
  private reduced = false;

  init(): void {
    this.base.copy(this.world.camera.quaternion);
    try {
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      /* ignore */
    }
    const el = this.world.renderer.domElement;
    const toNdc = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      preview.ndcX = ((e.clientX - r.left) / r.width) * 2 - 1;
      preview.ndcY = -((e.clientY - r.top) / r.height) * 2 + 1;
    };
    const down = (e: PointerEvent) => {
      if (!preview.active || e.button !== 0) return;
      toNdc(e);
      preview.down = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.moved = 0;
      el.style.cursor = 'grabbing';
    };
    const move = (e: PointerEvent) => {
      if (!preview.active) return;
      toNdc(e);
      if (!preview.down || preview.carrying) return;
      const dx = e.clientX - this.lastX;
      const dy = e.clientY - this.lastY;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.moved += Math.abs(dx) + Math.abs(dy);
      if (this.moved < 4) return;
      this.yaw -= dx * 0.004;
      this.pitch = Math.max(-1.2, Math.min(1.0, this.pitch - dy * 0.004));
    };
    const up = () => {
      preview.down = false;
      if (preview.active) el.style.cursor = 'grab';
    };
    const key = (e: KeyboardEvent) => {
      if (!preview.active) return;
      if (e.key === 'ArrowLeft') this.yaw += 0.12;
      else if (e.key === 'ArrowRight') this.yaw -= 0.12;
      else if (e.key === 'ArrowUp') this.pitch = Math.min(1.0, this.pitch + 0.1);
      else if (e.key === 'ArrowDown') this.pitch = Math.max(-1.2, this.pitch - 0.1);
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('keydown', key);
    this.cleanupFuncs.push(
      () => el.removeEventListener('pointerdown', down),
      () => window.removeEventListener('pointermove', move),
      () => window.removeEventListener('pointerup', up),
      () => window.removeEventListener('keydown', key),
      this.world.visibilityState.subscribe((s) => (this.inXR = s !== VisibilityState.NonImmersive)),
    );
  }

  update(delta: number): void {
    if (this.inXR) return;
    this.t += delta;
    const cam = this.world.camera;
    if (preview.active) {
      if (!this.started) {
        this.started = true;
        cam.position.set(0, 1.25, 0.3);
        this.world.renderer.domElement.style.cursor = 'grab';
        this.caption = this.world.getSceneObject('caption-panel');
        if (this.caption) this.caption.visible = true;
      }
      this.euler.set(this.pitch, this.yaw, 0);
      cam.quaternion.setFromEuler(this.euler);
      // On a flat screen Smriti's caption rides at the top right of the view, like subtitles.
      if (this.caption) {
        cam.updateMatrixWorld();
        this.fwd.set(0, 0, -1).applyQuaternion(cam.quaternion);
        this.right.set(1, 0, 0).applyQuaternion(cam.quaternion);
        this.up.set(0, 1, 0).applyQuaternion(cam.quaternion);
        cam.getWorldPosition(this.caption.position);
        this.caption.position.addScaledVector(this.fwd, 1).addScaledVector(this.right, 0.5).addScaledVector(this.up, 0.2);
        this.caption.quaternion.copy(cam.quaternion);
      }
      return;
    }
    // Start screen: a slow look around the room behind the panel.
    if (settings.calm || this.reduced) return;
    this.euler.set(Math.sin(this.t * 0.09) * 0.03, Math.sin(this.t * 0.06) * 0.22 - 0.08, 0);
    this.drift.setFromEuler(this.euler);
    cam.quaternion.copy(this.base).multiply(this.drift);
  }
}
