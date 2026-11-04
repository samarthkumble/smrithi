/**
 * Palm-up menu (hands only): turn your left palm up toward your face and three
 * buttons rise above it: Repeat (Smriti's last line), Voice (on or off) and Exit.
 * Press them with the other hand (touch, or point and pinch).
 *
 * The palm direction comes from joint positions (wrist, index and pinky knuckles),
 * not from axis conventions, so it is the same on every runtime. With no hand
 * tracking, nothing appears. Allocation-free apart from the browser's own joint poses.
 */
import {
  createSystem,
  type Entity,
  Matrix4,
  PokeInteractable,
  Pressed,
  RayInteractable,
  Vector3,
  VisibilityState,
} from '@iwsdk/core';
import { makeAnswerOrb, ORB_COLORS, type OrbParts } from './answer-orb.js';
import { chime } from './chime.js';
import { preview } from './preview.js';
import { sessionBus } from './session-bus.js';
import { saveSettings, settings } from './settings.js';
import { PalmButton } from './smriti-components.js';
import { hush } from './voice.js';

const OPEN_AFTER = 0.35; // seconds palm-up before the menu opens
const CLOSE_AFTER = 0.3;
const ACTIONS = ['repeat', 'voice', 'exit'] as const;

export class PalmMenuSystem extends createSystem({
  pressed: { required: [PalmButton, Pressed] },
}) {
  private buttons: { entity: Entity; parts: OrbParts; action: string }[] = [];
  private inXR = false;
  private open = false;
  private upFor = 0;
  private downFor = 0;
  private wrist = new Vector3();
  private index = new Vector3();
  private pinky = new Vector3();
  private middle = new Vector3();
  private a = new Vector3();
  private b = new Vector3();
  private normal = new Vector3();
  private center = new Vector3();
  private head = new Vector3();
  private toHead = new Vector3();
  private side = new Vector3();
  private rig = new Matrix4();

  init(): void {
    for (const action of ACTIONS) {
      const parts = makeAnswerOrb();
      parts.root.scale.setScalar(0.55);
      parts.root.visible = false;
      parts.root.position.set(0, -50, 0);
      const entity = this.world.createTransformEntity(parts.root);
      entity.object3D!.name = `Palm ${action}`;
      entity.addComponent(PalmButton, { action });
      entity.addComponent(RayInteractable);
      entity.addComponent(PokeInteractable);
      this.buttons.push({ entity, parts, action });
    }
    this.refreshLabels();
    this.cleanupFuncs.push(
      this.world.visibilityState.subscribe((s) => {
        this.inXR = s !== VisibilityState.NonImmersive;
        if (!this.inXR) this.setOpen(false);
      }),
      this.queries.pressed.subscribe('qualify', (e) => this.onPress(e)),
    );
  }

  private refreshLabels(): void {
    for (const b of this.buttons) {
      b.parts.setTint(ORB_COLORS.idle);
      b.parts.setLabel(b.action === 'repeat' ? 'Repeat' : b.action === 'voice' ? (settings.voice ? 'Voice on' : 'Voice off') : 'Exit');
    }
  }

  private setOpen(open: boolean): void {
    if (this.open === open) return;
    this.open = open;
    sessionBus.menuOpen = open;
    for (const b of this.buttons) {
      b.parts.root.visible = open;
      if (!open) b.parts.root.position.set(0, -50, 0);
    }
    if (open) chime('tick');
  }

  private onPress(e: Entity): void {
    if (!this.open) return;
    const action = e.getValue(PalmButton, 'action') as string;
    if (action === 'repeat') sessionBus.repeat++;
    else if (action === 'voice') {
      settings.voice = !settings.voice;
      saveSettings();
      if (!settings.voice) hush();
      this.refreshLabels();
    } else if (action === 'exit') {
      this.setOpen(false);
      this.world.exitXR();
    }
    chime('soft');
  }

  /** Read one joint's position into out (world space). Returns false when the joint is not tracked. */
  private joint(frame: XRFrame, ref: XRReferenceSpace, hand: XRHand, name: XRHandJoint, out: Vector3): boolean {
    const space = hand.get(name);
    const pose = space ? frame.getJointPose?.(space, ref) : undefined;
    if (!pose) return false;
    const p = pose.transform.position;
    out.set(p.x, p.y, p.z).applyMatrix4(this.rig);
    return true;
  }

  update(delta: number): void {
    if (!this.inXR || preview.active) return;
    const xr = this.world.renderer.xr;
    const frame = xr.getFrame?.();
    const ref = xr.getReferenceSpace?.();
    const session = xr.getSession?.();
    if (!frame || !ref || !session) return;
    let hand: XRHand | undefined;
    for (const src of session.inputSources) if (src.hand && src.handedness === 'left') hand = src.hand;
    if (!hand) {
      this.upFor = 0;
      this.setOpen(false);
      return;
    }
    this.player.updateWorldMatrix(true, false);
    this.rig.copy(this.player.matrixWorld);
    const ok =
      this.joint(frame, ref, hand, 'wrist', this.wrist) &&
      this.joint(frame, ref, hand, 'index-finger-metacarpal', this.index) &&
      this.joint(frame, ref, hand, 'pinky-finger-metacarpal', this.pinky) &&
      this.joint(frame, ref, hand, 'middle-finger-metacarpal', this.middle);
    if (!ok) return;
    // Left hand: palm normal = (pinky - wrist) x (index - wrist), pointing out of the palm.
    this.a.subVectors(this.index, this.wrist);
    this.b.subVectors(this.pinky, this.wrist);
    this.normal.crossVectors(this.b, this.a).normalize();
    this.center.addVectors(this.wrist, this.middle).multiplyScalar(0.5);
    this.player.head.updateWorldMatrix(true, false);
    this.head.setFromMatrixPosition(this.player.head.matrixWorld);
    this.toHead.subVectors(this.head, this.center).normalize();
    const up = this.normal.y;
    sessionBus.palmUp = up;
    const facing = this.normal.dot(this.toHead);
    if (up > 0.6 && facing > 0.2) {
      this.upFor += delta;
      this.downFor = 0;
    } else {
      this.downFor += delta;
      this.upFor = 0;
    }
    if (!this.open && this.upFor > OPEN_AFTER) this.setOpen(true);
    if (this.open && this.downFor > CLOSE_AFTER) this.setOpen(false);
    if (!this.open) return;
    // Lay the buttons in a row above the palm, across the person's view.
    // Left to right as the person sees it: Repeat, Voice, Exit.
    this.side.crossVectors(this.normal, this.toHead).normalize();
    for (let i = 0; i < this.buttons.length; i++) {
      const root = this.buttons[i].parts.root;
      root.position
        .copy(this.center)
        .addScaledVector(this.normal, 0.075)
        .addScaledVector(this.side, (i - 1) * 0.12);
      root.lookAt(this.head);
    }
  }
}
