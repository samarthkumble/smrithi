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
  setLabel(text: string): void;
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
    ctx.fillStyle = '#F7EEDC';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, H / 2 + 3);
    tex.needsUpdate = true;
  };

  return {
    root,
    ball,
    mat,
    setLabel(t: string) {
      text = t;
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
