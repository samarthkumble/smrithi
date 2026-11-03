/** Tiny synthesized chimes (no audio files): bright rising notes or a soft low pair. */
let ctx: AudioContext | null = null;

export function chime(kind: 'right' | 'wrong' | 'soft'): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const notes = kind === 'right' ? [784, 1175, 1568] : kind === 'wrong' ? [349, 262] : [659];
    notes.forEach((freq, i) => {
      const o = ctx!.createOscillator();
      const g = ctx!.createGain();
      o.type = kind === 'wrong' ? 'triangle' : 'sine';
      o.frequency.value = freq;
      const t0 = ctx!.currentTime + i * 0.11;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(kind === 'wrong' ? 0.12 : 0.16, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.7);
      o.connect(g).connect(ctx!.destination);
      o.start(t0);
      o.stop(t0 + 0.75);
    });
  } catch {
    /* audio is optional */
  }
}
