/**
 * Fuse static meshes that share a material into one mesh per material, so a
 * detailed room costs a handful of draw calls instead of hundreds. Transforms
 * are baked in; mirrored parts get their winding flipped back. Meshes the
 * caller keeps (animated or named parts) and transparent ones are untouched.
 */
import { BufferAttribute, BufferGeometry, type Material, Matrix4, Mesh, type Object3D } from '@iwsdk/core';

export function mergeStatic(root: Object3D, keep: (mesh: Mesh) => boolean): { before: number; after: number } {
  root.updateMatrixWorld(true);
  const toRoot = new Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map<Material, Mesh[]>();
  let before = 0;
  root.traverse((o) => {
    const mesh = o as Mesh;
    if (!mesh.isMesh) return;
    before++;
    const mat = mesh.material as Material;
    if (Array.isArray(mesh.material) || mat.transparent || keep(mesh)) return;
    const list = groups.get(mat) ?? [];
    list.push(mesh);
    groups.set(mat, list);
  });
  let removed = 0;
  let added = 0;
  const m = new Matrix4();
  for (const [mat, meshes] of groups) {
    if (meshes.length < 2) continue;
    const parts: { pos: Float32Array; nrm: Float32Array; uv: Float32Array }[] = [];
    let count = 0;
    for (const mesh of meshes) {
      const src = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
      if (!src.getAttribute('normal')) src.computeVertexNormals();
      m.multiplyMatrices(toRoot, mesh.matrixWorld);
      src.applyMatrix4(m);
      const pos = src.getAttribute('position').array as Float32Array;
      const nrm = src.getAttribute('normal').array as Float32Array;
      const n = pos.length / 3;
      const uvAttr = src.getAttribute('uv');
      const uv = uvAttr ? (uvAttr.array as Float32Array) : new Float32Array(n * 2);
      if (m.determinant() < 0) {
        // Mirrored: swap the 2nd and 3rd vertex of each triangle to keep faces outward.
        for (let t = 0; t + 2 < n; t += 3) {
          for (const [arr, k] of [[pos, 3], [nrm, 3], [uv, 2]] as const) {
            for (let c = 0; c < k; c++) {
              const a = (t + 1) * k + c;
              const b = (t + 2) * k + c;
              const tmp = arr[a];
              arr[a] = arr[b];
              arr[b] = tmp;
            }
          }
        }
      }
      parts.push({ pos, nrm, uv });
      count += n;
      src.dispose();
    }
    const pos = new Float32Array(count * 3);
    const nrm = new Float32Array(count * 3);
    const uv = new Float32Array(count * 2);
    let off = 0;
    for (const p of parts) {
      pos.set(p.pos, off * 3);
      nrm.set(p.nrm, off * 3);
      uv.set(p.uv, off * 2);
      off += p.pos.length / 3;
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(pos, 3));
    geo.setAttribute('normal', new BufferAttribute(nrm, 3));
    geo.setAttribute('uv', new BufferAttribute(uv, 2));
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    const merged = new Mesh(geo, mat);
    merged.name = `Merged_${mat.name || mat.type}_${added}`;
    for (const mesh of meshes) mesh.removeFromParent();
    root.add(merged);
    removed += meshes.length;
    added++;
  }
  return { before, after: before - removed + added };
}
