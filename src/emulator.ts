/**
 * Hidden demo mode for recording the video on a computer without a headset:
 * `?emulate` installs Meta's Quest 3 emulator (IWER) so the real immersive
 * session runs in a desktop browser, exposes its remote control for scripted
 * hand motion, and records the canvas to a WebM file. Never loaded otherwise.
 */
import type { World } from '@iwsdk/core';

interface Recorder {
  start(name: string, fps?: number): string;
  stop(): Promise<{ name: string; bytes: number }>;
}

declare global {
  interface Window {
    __smritiEmu?: { device: unknown; remote: unknown; world?: World; rec?: Recorder };
  }
}

export const emulateRequested = new URLSearchParams(location.search).has('emulate') && !import.meta.env.DEV;

/** Installs the emulated headset before anything asks whether VR is supported. */
export async function installEmulator(): Promise<void> {
  if (!emulateRequested) return;
  // Keep each frame readable after it is drawn, so the recorder can copy it.
  const getContext = HTMLCanvasElement.prototype.getContext as (this: HTMLCanvasElement, id: string, opts?: object) => RenderingContext | null;
  HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, id: string, opts?: object) {
    return getContext.call(this, id, id.startsWith('webgl') ? { ...opts, preserveDrawingBuffer: true } : opts);
  } as typeof HTMLCanvasElement.prototype.getContext;
  const { XRDevice, metaQuest3 } = await import('iwer');
  const device = new XRDevice(metaQuest3);
  device.installRuntime({ forceInstall: true });
  device.primaryInputMode = 'hand';
  device.position.set(0, 1.2, 0);
  // ?room=<id> adds one of IWER's synthetic rooms, with hit-test, for own-room (passthrough) mode.
  const room = new URLSearchParams(location.search).get('room');
  if (room) {
    const { SyntheticEnvironmentModule } = await import('@iwer/sem');
    device.installSEM(SyntheticEnvironmentModule as never);
    await device.sem?.loadDefaultEnvironment(room);
  }
  window.__smritiEmu = { device, remote: device.remote };
}

/** Once the world exists: let scripted hand steps find objects by name, and add the recorder. */
export async function attachEmulator(world: World): Promise<void> {
  const emu = window.__smritiEmu;
  if (!emu) return;
  const { SceneTargetResolver } = await import('@iwsdk/core');
  const remote = emu.remote as { setTargetResolver(r: unknown): void };
  remote.setTargetResolver(new SceneTargetResolver(world));
  emu.world = world;
  emu.rec = makeRecorder(world, emu.device as XRDeviceLike);
}

interface XRDeviceLike {
  activeSession?: XRSession;
  sem?: { environmentCanvas: HTMLCanvasElement };
}

/** Draws the synthetic room (if any) and the app into one canvas every XR frame, and records that. */
function makeRecorder(world: World, device: XRDeviceLike): Recorder {
  const app = world.renderer.domElement;
  const out = document.createElement('canvas');
  const ctx = out.getContext('2d')!;
  let mr: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let clip = '';
  let looping: XRSession | null = null;
  const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';
  const draw = () => {
    if (out.width !== app.width || out.height !== app.height) {
      out.width = app.width;
      out.height = app.height;
    }
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, out.width, out.height);
    const env = device.sem?.environmentCanvas;
    if (env && env.width) ctx.drawImage(env, 0, 0, out.width, out.height);
    ctx.drawImage(app, 0, 0, out.width, out.height);
  };
  const loop = (session: XRSession) => {
    const tick = () => {
      if (!mr || device.activeSession !== session) {
        looping = null;
        return;
      }
      draw();
      session.requestAnimationFrame(tick);
    };
    looping = session;
    session.requestAnimationFrame(tick);
  };
  return {
    start(name, fps = 30) {
      clip = name;
      chunks = [];
      draw();
      mr = new MediaRecorder(out.captureStream(fps), { mimeType: type, videoBitsPerSecond: 14_000_000 });
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      mr.start(500);
      const session = device.activeSession;
      if (session && looping !== session) loop(session);
      return type;
    },
    stop() {
      return new Promise((resolve) => {
        if (!mr) return resolve({ name: clip, bytes: 0 });
        mr.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `smriti-${clip}.webm`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          resolve({ name: clip, bytes: blob.size });
        };
        mr.stop();
        mr = null;
      });
    },
  };
}
