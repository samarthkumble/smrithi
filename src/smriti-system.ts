/**
 * Smriti's core loop (milestone 1): memories float within reach; pinch one,
 * move it toward a memory spot and let go, and it flies there and stays.
 */
import {
  createSystem,
  type Entity,
  Grabbed,
  type Object3D,
  OneHandGrabbable,
  VisibilityState,
  PointLight,
  Quaternion,
  type UIKitMLAsset,
  Vector3,
} from '@iwsdk/core';
import { OOP_DECK, type Deck, type MemoryCard } from './decks.js';
import { makeDiya, makeSpotRing, MEMORY_KITS } from './memory-objects.js';
import { LOCI, type Locus, TRAY } from './palace-layout.js';
import { MemoryItem, MemoryPhase, SpotMarker } from './smriti-components.js';

const SNAP_ANGLE = (30 * Math.PI) / 180; // forgiving "magnetic" aim
const SNAP_NEAR = 0.4; // released this close to a spot -> snap regardless of aim
const FLIGHT_TIME = 0.55;
/** Memories grow on their spot so far ones still read clearly from the chair. */
function placedScale(locusId: string): number {
  const l = LOCI.find((x) => x.id === locusId);
  if (!l) return 1;
  const [x, y, z] = l.anchor;
  const d = Math.hypot(x, y - 1.2, z);
  return Math.min(2.8, Math.max(1.6, 1.25 + 0.6 * d));
}

interface Flight {
  from: Vector3;
  to: Vector3;
  t: number;
  locus: string;
}

export class SmritiSystem extends createSystem({
  items: { required: [MemoryItem] },
  held: { required: [MemoryItem, Grabbed] },
  markers: { required: [SpotMarker] },
}) {
  private deck: Deck = OOP_DECK;
  private home = new Map<Entity, Vector3>();
  private cards = new Map<Entity, MemoryCard>();
  private flights = new Map<Entity, Flight>();
  private occupant = new Map<string, Entity>();
  private morphs: Array<{ forms: Object3D[]; offset: number }> = [];
  private diya!: Object3D;
  private flame: Object3D | undefined;
  private glow!: PointLight;
  private head = new Vector3();
  private tmpA = new Vector3();
  private tmpB = new Vector3();
  private upright = new Quaternion();
  private speakUntil = 0;
  private markersVisible = true;
  private elapsed = 0;
  private setCaption: (who: string, line: string, hint: string) => void = () => {};

  init(): void {
    this.setupCaption();
    this.spawnDiya();
    this.spawnMarkers();
    this.spawnDeck();
    this.say(
      'Welcome. These four memories are the 4 pillars of OOP.',
      'Pinch one, move it toward a glowing spot, and let go.',
    );
    this.cleanupFuncs.push(
      // Outside the headset only the room and the start panel show.
      this.world.visibilityState.subscribe((state) => {
        const inXR = state !== VisibilityState.NonImmersive;
        this.diya.visible = inXR;
        for (const e of this.queries.items.entities) if (e.object3D) e.object3D.visible = inXR;
        this.markersVisible = inXR;
      }),
      this.queries.held.subscribe('qualify', (e) => this.onGrab(e)),
      this.queries.held.subscribe('disqualify', (e) => this.onRelease(e)),
    );
  }

  private setupCaption(): void {
    const panel = this.world.getSceneObject<UIKitMLAsset>('caption-panel');
    const who = panel?.getElementById('CaptionWho');
    const line = panel?.getElementById('CaptionLine');
    const hint = panel?.getElementById('CaptionHint');
    if (!who || !line || !hint) return;
    who.name = 'CaptionWho';
    line.name = 'CaptionLine';
    hint.name = 'CaptionHint';
    this.setCaption = (w, l, h) => {
      who.setProperties({ text: w } as never);
      line.setProperties({ text: l } as never);
      hint.setProperties({ text: h, display: h ? 'flex' : 'none' } as never);
    };
  }

  private say(line: string, hint = ''): void {
    this.setCaption('SMRITI', line, hint);
    this.speakUntil = this.elapsed + Math.min(6, 1.5 + line.length * 0.05);
  }

  private spawnDiya(): void {
    const obj = makeDiya();
    obj.scale.setScalar(1.6);
    this.glow = new PointLight('#FFB45A', 0.35, 1.6, 2);
    this.glow.position.set(0, 0.12, 0.07);
    obj.add(this.glow);
    this.flame = obj.getObjectByName('DiyaFlame') ?? undefined;
    const e = this.world.createTransformEntity(obj);
    e.object3D!.name = 'Smriti';
    e.object3D!.position.set(-0.46, 1.12, -0.95);
    this.diya = e.object3D!;
  }

  private spawnMarkers(): void {
    for (const locus of LOCI) {
      const ring = makeSpotRing();
      const e = this.world.createTransformEntity(ring);
      e.addComponent(SpotMarker, { locus: locus.id });
      const [x, y, z] = locus.anchor;
      e.object3D!.position.set(x, y + 0.006, z);
      e.object3D!.name = `Spot ${locus.id}`;
    }
  }

  private spawnDeck(): void {
    const n = this.deck.cards.length;
    this.deck.cards.forEach((card, i) => {
      const obj = MEMORY_KITS[card.kit]();
      const e = this.world.createTransformEntity(obj);
      e.object3D!.name = `Memory ${card.answer}`;
      const [cx, cy, cz] = TRAY.center;
      const x = cx + (i - (n - 1) / 2) * TRAY.spacing;
      const home = new Vector3(x, cy, cz - Math.abs(i - (n - 1) / 2) * 0.03);
      e.object3D!.position.copy(home);
      e.object3D!.lookAt(this.tmpA.set(0, cy, 0.5));
      e.addComponent(OneHandGrabbable, { rotate: true, translate: true });
      e.addComponent(MemoryItem, { cardId: card.id, locus: '', phase: MemoryPhase.Tray });
      this.home.set(e, home);
      this.cards.set(e, card);
      const formNames = obj.userData.morphForms as string[] | undefined;
      if (formNames) {
        const forms = formNames.map((nm) => obj.getObjectByName(nm)).filter((f): f is Object3D => !!f);
        this.morphs.push({ forms, offset: i * 0.3 });
      }
    });
  }

  private freeLocus(e: Entity): void {
    const locus = e.getValue(MemoryItem, 'locus') as string;
    if (locus && this.occupant.get(locus) === e) this.occupant.delete(locus);
    e.setValue(MemoryItem, 'locus', '');
  }

  private onGrab(e: Entity): void {
    this.flights.delete(e);
    e.object3D?.scale.set(1, 1, 1);
    this.freeLocus(e);
    e.setValue(MemoryItem, 'phase', MemoryPhase.Tray);
    const card = this.cards.get(e);
    if (card) {
      const spot = LOCI.find((l) => l.id === card.suggested);
      this.say(`${card.answer}.`, spot ? `Smriti suggests ${spot.label}. Move it there and let go.` : '');
    }
  }

  /** Pick the free spot the player aimed at (by direction from the head), or a very near one. */
  private pickLocus(objPos: Vector3, self: Entity): Locus | null {
    this.player.head.updateWorldMatrix(true, false);
    this.head.setFromMatrixPosition(this.player.head.matrixWorld);
    const aim = this.tmpA.copy(objPos).sub(this.head).normalize();
    let best: Locus | null = null;
    let bestAngle = SNAP_ANGLE;
    for (const locus of LOCI) {
      const holder = this.occupant.get(locus.id);
      if (holder && holder !== self) continue; // exclusive spot
      const [x, y, z] = locus.anchor;
      const d = this.tmpB.set(x, y, z);
      if (d.distanceTo(objPos) < SNAP_NEAR) return locus;
      const angle = aim.angleTo(d.sub(this.head).normalize());
      if (angle < bestAngle) {
        bestAngle = angle;
        best = locus;
      }
    }
    return best;
  }

  private onRelease(e: Entity): void {
    const obj = e.object3D;
    if (!obj) return;
    obj.getWorldPosition(this.tmpA);
    const from = this.tmpA.clone();
    const locus = this.pickLocus(from, e);
    if (locus) {
      this.occupant.set(locus.id, e);
      e.setValue(MemoryItem, 'locus', locus.id);
      e.setValue(MemoryItem, 'phase', MemoryPhase.Flying);
      this.flights.set(e, { from, to: new Vector3(...locus.anchor), t: 0, locus: locus.id });
    } else {
      const home = this.home.get(e)!;
      e.setValue(MemoryItem, 'phase', MemoryPhase.Flying);
      this.flights.set(e, { from, to: home.clone(), t: 0, locus: '' });
      this.say('Point it toward a glowing spot, then let go.', 'It flies to the spot you aim at.');
    }
  }

  private land(e: Entity, f: Flight): void {
    const card = this.cards.get(e);
    if (!f.locus) {
      e.setValue(MemoryItem, 'phase', MemoryPhase.Tray);
      return;
    }
    e.setValue(MemoryItem, 'phase', MemoryPhase.Placed);
    const placed = this.queries.items.entities;
    let count = 0;
    for (const it of placed) if (it.getValue(MemoryItem, 'phase') === MemoryPhase.Placed) count++;
    const total = this.deck.cards.length;
    const spot = LOCI.find((l) => l.id === f.locus);
    if (count >= total) {
      this.say(
        `All ${total} memories are in your palace. Look around once and say them in your head.`,
        'Next: Smriti will hide them and test you.',
      );
    } else if (card) {
      this.say(card.story.replace(/^On [^,]+, |^Under [^,]+, /, `At ${spot?.label ?? 'this spot'}, `), `${total - count} left to place.`);
    }
  }

  update(delta: number): void {
    this.elapsed += delta;
    const t = this.elapsed;
    // Flights: smooth arc to the target, upright on landing
    for (const [e, f] of this.flights) {
      const obj = e.object3D;
      if (!obj) continue;
      f.t = Math.min(1, f.t + delta / FLIGHT_TIME);
      const k = f.t * f.t * (3 - 2 * f.t);
      obj.position.lerpVectors(f.from, f.to, k);
      obj.position.y += Math.sin(Math.PI * k) * 0.25;
      const target = f.locus ? placedScale(f.locus) : 1;
      const sc = obj.scale.x + (target - obj.scale.x) * Math.min(1, delta * 6);
      obj.scale.set(sc, sc, sc);
      obj.quaternion.slerp(this.upright, Math.min(1, delta * 8));
      if (f.t >= 1) {
        const fin = f.locus ? placedScale(f.locus) : 1;
        obj.scale.set(fin, fin, fin);
        this.flights.delete(e);
        this.land(e, f);
      }
    }
    // Markers: pulse free spots, hide occupied ones
    for (const m of this.queries.markers.entities) {
      const id = m.getValue(SpotMarker, 'locus') as string;
      const obj = m.object3D;
      if (!obj) continue;
      obj.visible = this.markersVisible && !this.occupant.has(id);
      const s = 1 + Math.sin(t * 3 + id.length) * 0.08;
      obj.scale.set(s, s, s);
    }
    // Polymorphism gem changes form
    for (const mo of this.morphs) {
      const idx = Math.floor((t + mo.offset) / 0.8) % mo.forms.length;
      for (let i = 0; i < mo.forms.length; i++) mo.forms[i].visible = i === idx;
      mo.forms[idx].rotation.y = t;
    }
    // Smriti the diya: gentle float, flame flicker, brighter while speaking
    if (this.diya) {
      this.diya.position.y = 1.12 + Math.sin(t * 1.3) * 0.02;
      this.diya.rotation.y = Math.sin(t * 0.4) * 0.3 + 0.6;
      const speaking = t < this.speakUntil;
      const flick = 0.85 + Math.sin(t * 17) * 0.08 + Math.sin(t * 7.3) * 0.07;
      if (this.flame) this.flame.scale.set(0.8 * flick, 2 * flick * (speaking ? 1.25 : 1), 0.8 * flick);
      this.glow.intensity = (speaking ? 0.6 : 0.35) * flick;
    }
  }
}
