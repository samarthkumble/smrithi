/** One shared AudioContext, created lazily after a user gesture (entering XR). */
let ctx: AudioContext | null = null;

export function audioContext(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}
