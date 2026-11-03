/**
 * Floating answer orb for recall: a marigold ball with a readable label above it.
 * Touch it (poke) or point and pinch (ray) to choose.
 */
import {
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SphereGeometry,
  SRGBColorSpace,
} from '@iwsdk/core';

export const ORB_COLORS = {
  idle: new Color('#E8A317'),
  right: new Color('#4CC37A'),
  wrong: new Color('#B8573A'),
  dim: new Color('#6B5A44'),
};

export interface OrbParts {
  root: Group;
  ball: Mesh;
  mat: MeshStandardMaterial;
  /** mark draws a tick or cross so right/wrong never depends on colour alone. */
  setLabel(text: string, mark?: 'right' | 'wrong'): void;
  setTint(c: Color): void;
}

const W = 512;
const H = 160;

export function makeAnswerOrb(): OrbParts {
  const root = new Group();
  const mat = new MeshStandardMaterial({
    color: ORB_COLORS.idle,
    emissive: ORB_COLORS.idle,
    emissiveIntensity: 0.55,
    roughness: 0.35,
    metalness: 0.1,
  });
  const ball = new Mesh(new SphereGeometry(0.04, 24, 16), mat);
  ball.name = 'OrbBall';
  root.add(ball);

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const tex = new CanvasTexture(canvas);
  tex.colorSpace = SRGBColorSpace;
  const labelMat = new MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false });
  const label = new Mesh(new PlaneGeometry(0.2, 0.0625), labelMat);
  label.name = 'OrbLabel';
  label.position.set(0, 0.082, 0);
  label.renderOrder = 2;
  root.add(label);

  let accent = '#E3A21A';
  let text = '';
  let mark: 'right' | 'wrong' | undefined;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const r = 46;
    ctx.beginPath();
    ctx.roundRect(8, 8, W - 16, H - 16, r);
    ctx.fillStyle = 'rgba(38, 22, 12, 0.92)';
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = accent;
    ctx.stroke();
    let size = 64;
    ctx.font = `600 ${size}px system-ui, "Segoe UI", sans-serif`;
    while (ctx.measureText(text).width > W - 70 && size > 30) {
      size -= 2;
      ctx.font = `600 ${size}px system-ui, "Segoe UI", sans-serif`;
    }
    const shift = mark ? 38 : 0;
    if (mark) {
      const cx = 64;
      const cy = H / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.fillStyle = accent;
      ctx.fill();
      ctx.strokeStyle = '#1b120b';
      ctx.lineWidth = 9;
      ctx.lineCap = 'round';
      ctx.beginPath();
      if (mark === 'right') {
        ctx.moveTo(cx - 14, cy + 1);
        ctx.lineTo(cx - 3, cy + 12);
        ctx.lineTo(cx + 15, cy - 11);
      } else {
        ctx.moveTo(cx - 11, cy - 11);
        ctx.lineTo(cx + 11, cy + 11);
        ctx.moveTo(cx + 11, cy - 11);
        ctx.lineTo(cx - 11, cy + 11);
      }
      ctx.stroke();
      size = Math.min(size, 54);
      ctx.font = `600 ${size}px system-ui, "Segoe UI", sans-serif`;
      while (ctx.measureText(text).width > W - 70 - shift * 2 && size > 28) {
        size -= 2;
        ctx.font = `600 ${size}px system-ui, "Segoe UI", sans-serif`;
      }
    }
    ctx.fillStyle = '#F7EEDC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2 + shift, H / 2 + 3);
    tex.needsUpdate = true;
  };

  return {
    root,
    ball,
    mat,
    setLabel(t: string, m?: 'right' | 'wrong') {
      text = t;
      mark = m;
      draw();
    },
    setTint(c: Color) {
      mat.color.copy(c);
      mat.emissive.copy(c);
      accent = `#${c.getHexString()}`;
      draw();
    },
  };
}
