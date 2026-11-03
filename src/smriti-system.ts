/**
 * Smriti's core loop.
 * Place: memories float within reach; pinch one, move it toward a memory spot
 * and let go, and it flies there and stays.
 * Recall: Smriti hides them, lights one spot at a time and floats three answers;
 * a miss is shown again, reimagined weirder, and asked once more at the end.
 */
import {
  createSystem,
  type Entity,
  Grabbed,
  type Object3D,
  Hovered,
  OneHandGrabbable,
  PokeInteractable,
  Pressed,
  RayInteractable,
  VisibilityState,
  PointLight,
  Quaternion,
  type UIKitMLAsset,
  Vector3,
} from '@iwsdk/core';
import { makeAnswerOrb, ORB_COLORS, type OrbParts } from './answer-orb.js';
import { chime } from './chime.js';
import { deckSource } from './deck-source.js';
import { OOP_DECK, type Deck, type MemoryCard } from './decks.js';
import { animateKit, styleKit, type Styled } from './kit-style.js';
import { loadPalace, nextReviewText, recordReview, savePlacement } from './palace-store.js';
import { settings } from './settings.js';
import { KITS } from './memory-kits.js';
import { makeDiya, makeMarigold, makeSpotRing } from './memory-objects.js';
import { LOCI, type Locus, TRAY } from './palace-layout.js';
import { AnswerOrb, MemoryItem, MemoryPhase, SpotMarker } from './smriti-components.js';

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

type Mode = 'tutorial' | 'waiting' | 'place' | 'ready' | 'recall' | 'done';
const TUTORIAL_ID = 'tutorial';
const WEIRD_SCALE = 1.35;
const REVEAL_TIME = 0.45;

interface Orb extends OrbParts {
  entity: Entity;
  value: string;
  shown: boolean;
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
  pressed: { required: [AnswerOrb, Pressed] },
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
  // Recall state
  private mode: Mode = 'tutorial';
  private tutorial: Entity | null = null;
  private styled = new Map<Entity, Styled>();
  private seenVersion = -1;
  private seenSteps = 0;
  /** Memories wait smaller on the tray when the deck is big. */
  private trayScale = 1;
  private begun = false;
  private orbs: Orb[] = [];
  private queue: Entity[] = [];
  private current: Entity | null = null;
  private askLocus = '';
  private awaiting = false;
  private round = 1;
  private firstTry = new Map<Entity, boolean>();
  private secondTry = new Map<Entity, boolean>();
  private hidden = new Set<Entity>();
  private weird = new Set<Entity>();
  private reveals = new Map<Entity, number>();
  private nextAt = -1;
  private nextAction: (() => void) | null = null;

  init(): void {
    this.setupCaption();
    this.spawnDiya();
    this.spawnMarkers();
    this.spawnOrbs();
    this.cleanupFuncs.push(
      // Outside the headset only the room and the start panel show.
      this.world.visibilityState.subscribe((state) => {
        const inXR = state !== VisibilityState.NonImmersive;
        this.diya.visible = inXR;
        for (const e of this.queries.items.entities) if (e.object3D) e.object3D.visible = inXR && !this.hidden.has(e);
        this.markersVisible = inXR;
        if (inXR && !this.begun) this.begin();
      }),
      this.queries.held.subscribe('qualify', (e) => this.onGrab(e)),
      this.queries.held.subscribe('disqualify', (e) => this.onRelease(e)),
      this.queries.pressed.subscribe('qualify', (e) => this.onOrbPressed(e)),
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
    this.deck = deckSource.deck;
    const n = this.deck.cards.length;
    const perRow = n > 4 ? Math.ceil(n / 2) : n;
    this.trayScale = n > 4 ? 0.72 : 1;
    this.deck.cards.forEach((card, i) => {
      const kit = KITS[card.kit].make();
      const st = styleKit(kit, card.color ?? 'natural', card.modifier ?? 'none');
      const obj = st.root;
      const e = this.world.createTransformEntity(obj);
      e.object3D!.name = `Memory ${card.answer}`;
      const row = Math.floor(i / perRow);
      const inRow = row === 0 ? perRow : n - perRow;
      const col = i - row * perRow;
      const [cx, cy, cz] = TRAY.center;
      const off = col - (inRow - 1) / 2;
      const sp = TRAY.spacing * (n > 4 ? 0.85 : 1);
      const home = new Vector3(cx + off * sp, cy + row * 0.09, cz - row * 0.16 - Math.abs(off) * 0.03);
      e.object3D!.position.copy(home);
      e.object3D!.scale.setScalar(this.trayScale);
      e.object3D!.lookAt(this.tmpA.set(0, home.y, 0.5));
      e.addComponent(OneHandGrabbable, { rotate: true, translate: true });
      e.addComponent(MemoryItem, { cardId: card.id, locus: '', phase: MemoryPhase.Tray });
      this.home.set(e, home);
      this.cards.set(e, card);
      this.styled.set(e, st);
      const formNames = kit.userData.morphForms as string[] | undefined;
      if (formNames) {
        const forms = formNames.map((nm) => kit.getObjectByName(nm)).filter((f): f is Object3D => !!f);
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
    if (this.mode === 'ready' || this.mode === 'done') {
      this.mode = 'place';
      this.hideOrbs();
    }
    this.flights.delete(e);
    this.reveals.delete(e);
    e.object3D?.scale.setScalar(this.trayScale);
    this.styled.get(e)?.pivot.scale.setScalar(1);
    this.freeLocus(e);
    e.setValue(MemoryItem, 'phase', MemoryPhase.Tray);
    chime('tick');
    if (e === this.tutorial) {
      e.object3D?.scale.set(2.2, 2.2, 2.2);
      this.say('Good, you are holding it.', 'Now move it toward any glowing ring and let go.');
      return;
    }
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
    const st = this.styled.get(e);
    if (st) st.pivot.scale.setScalar(st.sizeScale);
    chime('soft');
    if (e === this.tutorial) {
      this.finishTutorial(e);
      return;
    }
    const placed = this.queries.items.entities;
    let count = 0;
    for (const it of placed) {
      if (it !== this.tutorial && it.getValue(MemoryItem, 'phase') === MemoryPhase.Placed) count++;
    }
    const total = this.deck.cards.length;
    const spot = LOCI.find((l) => l.id === f.locus);
    if (count >= total) {
      this.mode = 'ready';
      this.savePalaceNow();
      this.say(
        `All ${total} memories are in your palace. Look around once and say them in your head.`,
        'When you are ready, touch the orb in front of you.',
      );
      this.showOrbs(['', 'Test me', '']);
    } else if (card) {
      this.say(card.story.replace(/^On [^,]+, |^Under [^,]+, /, `At ${spot?.label ?? 'this spot'}, `), `${total - count} left to place.`);
    }
  }

  // ----------------------------------------------------------------- start

  /** First entry into the headset: review a saved palace, or start a new one. */
  private begin(): void {
    this.begun = true;
    const caption = this.world.getSceneObject('caption-panel');
    if (caption && settings.largeText) caption.scale.multiplyScalar(1.35);
    if (deckSource.review) {
      this.restoreReview();
      return;
    }
    let tutorialDone = false;
    try {
      tutorialDone = localStorage.getItem('smriti.tutorialDone') === '1';
    } catch {
      /* ignore */
    }
    if (!tutorialDone) {
      this.spawnTutorial();
    } else if (deckSource.status === 'building') {
      this.mode = 'waiting';
      this.seenSteps = -1;
      this.say('Welcome back. I am imagining your palace.', this.progressHint());
    } else {
      this.arriveDeck();
    }
  }

  /** Put every saved memory back on its spot, then walk the palace with a test. */
  private restoreReview(): void {
    const saved = deckSource.review!;
    this.spawnDeck();
    for (const e of this.queries.items.entities) {
      const card = this.cards.get(e);
      const locus = card ? LOCI.find((l) => l.id === saved.placed[card.id]) : undefined;
      if (!card || !locus || this.occupant.has(locus.id)) continue;
      this.occupant.set(locus.id, e);
      e.setValue(MemoryItem, 'locus', locus.id);
      e.setValue(MemoryItem, 'phase', MemoryPhase.Placed);
      e.object3D!.position.set(...locus.anchor);
      e.object3D!.quaternion.identity();
      e.object3D!.scale.setScalar(placedScale(locus.id));
      const st = this.styled.get(e);
      if (st) st.pivot.scale.setScalar(st.sizeScale);
      if (saved.weird.includes(card.id)) this.weird.add(e);
    }
    const streak = saved.streak > 0 ? ` Your streak is ${saved.streak} day${saved.streak === 1 ? '' : 's'}.` : '';
    this.mode = 'ready';
    this.say(`Welcome back to your palace: ${this.deck.title}.${streak}`, 'Look around once. Then I will hide them and test you.');
    this.later(6, () => this.startRecall());
  }

  private savePalaceNow(): void {
    const placed: Record<string, string> = {};
    const weird: string[] = [];
    for (const [e, card] of this.cards) {
      const locus = e.getValue(MemoryItem, 'locus') as string;
      if (locus) placed[card.id] = locus;
      if (this.weird.has(e)) weird.push(card.id);
    }
    savePlacement(this.deck, placed, weird);
  }

  // -------------------------------------------------------------- tutorial

  /** First pinch: one marigold, one instruction, before any real content arrives. */
  private spawnTutorial(): void {
    const obj = makeMarigold();
    const e = this.world.createTransformEntity(obj);
    e.object3D!.name = 'Tutorial Marigold';
    const [cx, cy, cz] = TRAY.center;
    const home = new Vector3(cx, cy + 0.04, cz + 0.02);
    e.object3D!.position.copy(home);
    e.object3D!.scale.setScalar(2.2);
    e.addComponent(OneHandGrabbable, { rotate: true, translate: true });
    e.addComponent(MemoryItem, { cardId: TUTORIAL_ID, locus: '', phase: MemoryPhase.Tray });
    this.home.set(e, home);
    this.tutorial = e;
    this.say(
      'Hi, I am Smriti, the little lamp. This room will hold what you learn.',
      'First, pinch the marigold in front of you with your thumb and finger.',
    );
  }

  private finishTutorial(e: Entity): void {
    try {
      localStorage.setItem('smriti.tutorialDone', '1');
    } catch {
      /* ignore */
    }
    this.later(1.2, () => {
      this.freeLocus(e);
      this.home.delete(e);
      this.tutorial = null;
      e.dispose();
      if (deckSource.status === 'building') {
        this.mode = 'waiting';
        this.seenSteps = -1;
        this.say('That is all it takes. I am still imagining your palace.', this.progressHint());
      } else {
        this.say('That is all it takes.', '');
        this.later(1, () => this.arriveDeck());
      }
    });
  }

  private progressHint(): string {
    const made = deckSource.steps.filter((st) => st.ok && st.tool === 'create_image').length;
    const last = [...deckSource.steps].reverse().find((st) => st.ok && st.tool === 'create_image');
    if (!last) return 'Choosing what is worth remembering...';
    return `Images ready: ${made}. Latest: ${last.note.replace(' -> ', ', ').replace(' on ', ' on the ')}.`;
  }

  /** Bring in whatever deck the start screen chose (preset or the agent's). */
  private arriveDeck(): void {
    this.mode = 'place';
    const failed = deckSource.status === 'error';
    this.spawnDeck();
    for (const it of this.queries.items.entities) this.reveal(it);
    chime('right');
    const intro = failed
      ? `I could not finish your palace (${deckSource.error}), so let us start with ${this.deck.title}.`
      : this.deck.intro ?? `Here come your memories: ${this.deck.title}.`;
    this.say(intro, 'Pinch a picture, move it toward a glowing ring, and let go.');
  }

  // ---------------------------------------------------------------- recall

  private spawnOrbs(): void {
    for (let slot = 0; slot < 3; slot++) {
      const parts = makeAnswerOrb();
      const e = this.world.createTransformEntity(parts.root);
      e.object3D!.name = `Answer ${slot + 1}`;
      e.addComponent(AnswerOrb, { slot });
      e.addComponent(RayInteractable);
      e.addComponent(PokeInteractable);
      parts.root.visible = false;
      parts.root.position.set(0, -50, 0);
      this.orbs.push({ ...parts, entity: e, value: '', shown: false });
    }
  }

  /** Float the orbs just within reach, in front of wherever the player's head is. */
  private showOrbs(values: string[]): void {
    this.player.head.updateWorldMatrix(true, false);
    this.head.setFromMatrixPosition(this.player.head.matrixWorld);
    const y = Math.min(1.35, Math.max(0.75, this.head.y - 0.3));
    for (const orb of this.orbs) {
      const slot = orb.entity.getValue(AnswerOrb, 'slot') as number;
      const v = values[slot] ?? '';
      orb.value = v;
      orb.entity.setValue(AnswerOrb, 'label', v);
      orb.shown = v !== '';
      orb.root.visible = orb.shown;
      if (!orb.shown) {
        orb.root.position.set(0, -50, 0);
        continue;
      }
      orb.setTint(ORB_COLORS.idle);
      orb.setLabel(v);
      orb.root.position.set(this.head.x + (slot - 1) * 0.24, y, this.head.z - 0.42);
      orb.root.lookAt(this.head.x, y, this.head.z);
    }
  }

  private hideOrbs(): void {
    this.showOrbs(['', '', '']);
  }

  private later(seconds: number, fn: () => void): void {
    this.nextAt = this.elapsed + seconds;
    this.nextAction = fn;
  }

  private setHidden(e: Entity, hide: boolean): void {
    if (hide) this.hidden.add(e);
    else this.hidden.delete(e);
    if (e.object3D) e.object3D.visible = !hide;
  }

  private startRecall(): void {
    this.mode = 'recall';
    this.round = 1;
    this.firstTry.clear();
    this.secondTry.clear();
    this.hideOrbs();
    const order = (e: Entity) => LOCI.findIndex((l) => l.id === e.getValue(MemoryItem, 'locus'));
    this.queue = [...this.queries.items.entities]
      .filter((e) => e.getValue(MemoryItem, 'phase') === MemoryPhase.Placed)
      .sort((a, b) => order(a) - order(b));
    for (const e of this.queue) {
      this.setHidden(e, true);
      if (e.hasComponent(OneHandGrabbable)) e.removeComponent(OneHandGrabbable);
    }
    chime('soft');
    this.say('I hid your memories. Walk the room with your eyes, spot by spot.', 'A spot will glow. Pick what you left there.');
    this.later(3, () => this.askNext());
  }

  private askNext(): void {
    this.hideOrbs();
    if (this.queue.length === 0) {
      const missed = [...this.firstTry].filter(([, ok]) => !ok).map(([e]) => e);
      if (this.round === 1 && missed.length > 0) {
        this.round = 2;
        this.queue = missed;
        for (const e of missed) this.setHidden(e, true);
        this.say('Second look. I made the tricky ones weirder. Let us try them again.', '');
        this.later(3, () => this.askNext());
      } else {
        this.finish();
      }
      return;
    }
    const e = this.queue.shift()!;
    const card = this.cards.get(e)!;
    this.current = e;
    this.askLocus = e.getValue(MemoryItem, 'locus') as string;
    const spot = LOCI.find((l) => l.id === this.askLocus);
    const others = this.deck.cards.filter((c) => c.id !== card.id).map((c) => c.answer);
    shuffle(others);
    const options = [card.answer, others[0], others[1]].filter(Boolean) as string[];
    shuffle(options);
    while (options.length < 3) options.push('');
    this.showOrbs(options);
    this.awaiting = true;
    this.say(`What did you leave at ${spot?.label ?? 'the glowing spot'}?`, 'Touch the right answer, or point and pinch.');
  }

  private onOrbPressed(orbEntity: Entity): void {
    const orb = this.orbs.find((o) => o.entity === orbEntity);
    if (!orb || !orb.shown) return;
    if (this.mode === 'ready' || this.mode === 'done') {
      this.startRecall();
      return;
    }
    if (this.mode !== 'recall' || !this.awaiting || !this.current) return;
    this.awaiting = false;
    const e = this.current;
    const card = this.cards.get(e)!;
    const ok = orb.value === card.answer;
    (this.round === 1 ? this.firstTry : this.secondTry).set(e, ok);
    for (const o of this.orbs) {
      if (!o.shown) continue;
      if (o.value === card.answer) {
        o.setTint(ORB_COLORS.right);
        o.setLabel(o.value, 'right');
      } else if (o === orb) {
        o.setTint(ORB_COLORS.wrong);
        o.setLabel(o.value, 'wrong');
      }
      else o.setTint(ORB_COLORS.dim);
    }
    this.askLocus = '';
    if (ok) {
      chime('right');
      this.reveal(e);
      this.say(`Yes. ${card.answer}.`, this.round === 2 ? 'The weird version stuck.' : '');
      this.later(2, () => this.askNext());
    } else {
      chime('wrong');
      this.weird.add(e);
      this.reveal(e);
      this.say(card.weird, `You picked ${orb.value}. It was ${card.answer}.`);
      this.later(5, () => this.askNext());
    }
  }

  private reveal(e: Entity): void {
    this.setHidden(e, false);
    e.object3D?.scale.set(0.01, 0.01, 0.01);
    this.reveals.set(e, 0);
  }

  private finish(): void {
    this.mode = 'done';
    this.current = null;
    const total = this.firstTry.size;
    let first = 0;
    for (const ok of this.firstTry.values()) if (ok) first++;
    let recovered = 0;
    for (const ok of this.secondTry.values()) if (ok) recovered++;
    for (const e of this.queries.items.entities) {
      this.setHidden(e, false);
      if (!e.hasComponent(OneHandGrabbable)) e.addComponent(OneHandGrabbable, { rotate: true, translate: true });
    }
    const weirdIds = [...this.weird].map((e) => this.cards.get(e)?.id ?? '').filter(Boolean);
    if (!loadPalace()) this.savePalaceNow();
    const saved = recordReview(first, total, weirdIds);
    chime(first === total ? 'right' : 'soft');
    const after = this.secondTry.size > 0 ? ` After the weird remake, ${first + recovered} of ${total}.` : '';
    const streak = saved ? ` Streak: ${saved.streak} day${saved.streak === 1 ? '' : 's'}.` : '';
    const next = saved ? `${nextReviewText(saved)}. ` : '';
    this.say(`You remembered ${first} of ${total}.${after}${streak}`, `${next}Touch the orb to test again.`);
    this.showOrbs(['', 'Test again', '']);
  }

  update(delta: number): void {
    this.elapsed += delta;
    const t = this.elapsed;
    if (this.nextAction && t >= this.nextAt) {
      const fn = this.nextAction;
      this.nextAction = null;
      fn();
    }
    if (this.mode === 'waiting' && deckSource.version !== this.seenVersion) {
      this.seenVersion = deckSource.version;
      if (deckSource.status === 'building') {
        if (deckSource.steps.length !== this.seenSteps) {
          this.seenSteps = deckSource.steps.length;
          this.setCaption('SMRITI', 'I am imagining your palace...', this.progressHint());
        }
      } else {
        this.arriveDeck();
      }
    }
    for (const st of this.styled.values()) animateKit(st, t, delta);
    // Recall reveals: pop back in with a little overshoot
    for (const [e, rt] of this.reveals) {
      const obj = e.object3D;
      if (!obj) continue;
      const nt = Math.min(1, rt + delta / REVEAL_TIME);
      this.reveals.set(e, nt);
      const locus = e.getValue(MemoryItem, 'locus') as string;
      const base = (locus ? placedScale(locus) : this.trayScale) * (this.weird.has(e) ? WEIRD_SCALE : 1);
      const k = 1 + Math.sin(nt * Math.PI) * 0.25 * (1 - nt);
      const sc = base * nt * k;
      obj.scale.set(sc, sc, sc);
      if (nt >= 1) this.reveals.delete(e);
    }
    // Reimagined memories: bigger, wobbling and spinning so they stick
    for (const e of this.weird) {
      const obj = e.object3D;
      if (!obj || this.reveals.has(e) || this.flights.has(e) || this.hidden.has(e)) continue;
      if (e.getValue(MemoryItem, 'phase') !== MemoryPhase.Placed) continue;
      const base = placedScale(e.getValue(MemoryItem, 'locus') as string) * WEIRD_SCALE;
      const w = base * (1 + Math.sin(t * 4.2) * 0.06);
      if (settings.calm) {
        obj.scale.setScalar(base);
        continue;
      }
      obj.scale.set(w, base * (1 + Math.sin(t * 4.2 + 1.6) * 0.06), w);
      obj.rotation.y += delta * 1.4;
    }
    // Answer orbs: gentle bob, swell when pointed at
    for (const orb of this.orbs) {
      if (!orb.shown) continue;
      const slot = orb.entity.getValue(AnswerOrb, 'slot') as number;
      orb.ball.position.y = settings.calm ? 0 : Math.sin(t * 2 + slot) * 0.008;
      const target = orb.entity.hasComponent(Hovered) ? 1.2 : 1;
      const s = orb.ball.scale.x + (target - orb.ball.scale.x) * Math.min(1, delta * 10);
      orb.ball.scale.set(s, s, s);
    }
    // Flights: smooth arc to the target, upright on landing
    for (const [e, f] of this.flights) {
      const obj = e.object3D;
      if (!obj) continue;
      f.t = Math.min(1, f.t + delta / FLIGHT_TIME);
      const k = f.t * f.t * (3 - 2 * f.t);
      obj.position.lerpVectors(f.from, f.to, k);
      obj.position.y += Math.sin(Math.PI * k) * 0.25;
      const target = f.locus ? placedScale(f.locus) : e === this.tutorial ? 2.2 : this.trayScale;
      const sc = obj.scale.x + (target - obj.scale.x) * Math.min(1, delta * 6);
      obj.scale.set(sc, sc, sc);
      obj.quaternion.slerp(this.upright, Math.min(1, delta * 8));
      if (f.t >= 1) {
        const fin = f.locus ? placedScale(f.locus) : e === this.tutorial ? 2.2 : this.trayScale;
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
      const asked = this.askLocus !== '' && id === this.askLocus;
      obj.visible = this.markersVisible && (this.mode === 'recall' ? asked : !this.occupant.has(id));
      const s = (asked ? 1.5 : 1) + Math.sin(t * (asked ? 5 : 3) + id.length) * (asked ? 0.15 : 0.08);
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

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}
