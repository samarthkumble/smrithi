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
  const { XRDevice, metaQuest3 } = await import('iwer');
  const device = new XRDevice(metaQuest3);
  device.installRuntime({ forceInstall: true });
  device.primaryInputMode = 'hand';
  device.position.set(0, 1.2, 0);
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
  emu.rec = makeRecorder(world.renderer.domElement);
}

function makeRecorder(canvas: HTMLCanvasElement): Recorder {
  let mr: MediaRecorder | null = null;
  let chunks: Blob[] = [];
  let clip = '';
  const type = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((t) => MediaRecorder.isTypeSupported(t)) ?? 'video/webm';
  return {
    start(name, fps = 30) {
      clip = name;
      chunks = [];
      mr = new MediaRecorder(canvas.captureStream(fps), { mimeType: type, videoBitsPerSecond: 14_000_000 });
      mr.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      mr.start(500);
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
