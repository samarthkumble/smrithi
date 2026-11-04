/**
 * A quiet tanpura drone, synthesized live: four strings (Pa, Sa, Sa, low Sa)
 * plucked in a slow cycle, each a buzzy harmonic tone that fades for seconds.
 * Scheduled a little ahead on the audio clock; nothing allocates per frame
 * except the few nodes of each pluck (about one per second).
 */
import { audioContext } from './audio.js';

const SA = 138.6; // C#3, a common tanpura Sa
const STRINGS = [SA * 0.75, SA, SA, SA / 2]; // Pa (below), Sa, Sa, low Sa
const GAP = 1.05; // seconds between plucks

export class Tanpura {
  private out: GainNode | null = null;
  private next = 0;
  private string = 0;
  private playing = false;

  start(): void {
    const ctx = audioContext();
    if (!ctx || this.playing) return;
    if (!this.out) {
      this.out = ctx.createGain();
      const tone = ctx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = 2400;
      // Short echo gives the small room a little air.
      const echo = ctx.createDelay(1);
      echo.delayTime.value = 0.23;
      const fb = ctx.createGain();
      fb.gain.value = 0.28;
      this.out.connect(tone);
      tone.connect(ctx.destination);
      tone.connect(echo);
      echo.connect(fb).connect(echo);
      echo.connect(ctx.destination);
    }
    this.out.gain.cancelScheduledValues(ctx.currentTime);
    this.out.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.out.gain.exponentialRampToValueAtTime(0.05, ctx.currentTime + 3);
    this.next = ctx.currentTime + 0.3;
    this.playing = true;
  }

  stop(): void {
    const ctx = audioContext();
    if (!ctx || !this.out || !this.playing) return;
    this.out.gain.cancelScheduledValues(ctx.currentTime);
    this.out.gain.setValueAtTime(Math.max(0.0001, this.out.gain.value), ctx.currentTime);
    this.out.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
    this.playing = false;
  }

  /** Call every frame; schedules plucks about 0.4 s ahead. */
  tick(): void {
    if (!this.playing || !this.out) return;
    const ctx = audioContext();
    if (!ctx) return;
    while (this.next < ctx.currentTime + 0.4) {
      this.pluck(ctx, STRINGS[this.string], this.next);
      this.string = (this.string + 1) % STRINGS.length;
      this.next += this.string === 0 ? GAP * 1.6 : GAP;
    }
  }

  private pluck(ctx: AudioContext, f: number, t: number): void {
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, t);
    env.gain.exponentialRampToValueAtTime(f < SA * 0.6 ? 0.55 : 0.4, t + 0.02);
    env.gain.exponentialRampToValueAtTime(0.0001, t + 4.2);
    // The tanpura's "jawari" buzz: a bright sawtooth through a resonant band.
    const buzz = ctx.createBiquadFilter();
    buzz.type = 'bandpass';
    buzz.Q.value = 1.4;
    buzz.frequency.setValueAtTime(f * 9, t);
    buzz.frequency.exponentialRampToValueAtTime(f * 3, t + 3.5);
    for (const detune of [-4, 3]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = detune;
      o.connect(buzz);
      o.start(t);
      o.stop(t + 4.3);
    }
    const body = ctx.createOscillator();
    body.type = 'sine';
    body.frequency.value = f;
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.6;
    body.connect(bodyGain).connect(env);
    body.start(t);
    body.stop(t + 4.3);
    buzz.connect(env);
    env.connect(this.out!);
  }
}
