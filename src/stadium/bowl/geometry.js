// Geometry helpers that follow the bowl path:
//  - sweepProfile: drags a 2D side-profile all the way around the bowl (tiers, roof)
//  - ribbon:       a vertical strip around the bowl (walls, glass, LED ribbons, facade)
//  - alongLoop:    evenly spaced points around the bowl (lamps, posts, dividers)
import * as THREE from 'three';
import { SEGMENTS, pointAt, segmentLength } from './path.js';

// Sample points around the whole loop. Straight sides need only their start point
// (the next segment starts where they end); corners are split into small steps.
export function loopParams(arcSteps = 20) {
  const out = [];
  for (const seg of SEGMENTS) {
    if (seg.kind === 'line') out.push({ seg, t: 0 });
    else for (let k = 0; k < arcSteps; k++) out.push({ seg, t: k / arcSteps });
  }
  return out;
}

/**
 * Sweeps a closed side profile around the bowl.
 * @param {Array<[number, number]>} profile  [d, y] points: d = meters from the bowl front, y = height
 */
export function sweepProfile(profile, params = loopParams()) {
  const rings = params.map((p) =>
    profile.map(([d, y]) => {
      const q = pointAt(p.seg, p.t, d);
      return [q.x, y, q.z];
    }),
  );
  const positions = [];
  const N = rings.length;
  const M = profile.length;
  for (let i = 0; i < N; i++) {
    const a = rings[i];
    const b = rings[(i + 1) % N];
    for (let j = 0; j < M; j++) {
      const j2 = (j + 1) % M;
      positions.push(...a[j], ...a[j2], ...b[j2], ...a[j], ...b[j2], ...b[j]);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.computeVertexNormals(); // non-indexed → flat, low-poly shading
  return geo;
}

/**
 * A vertical strip around the bowl at distance d, from height y0 to y1.
 * UV u = meters along the strip / uvScale, so textures repeat evenly and
 * read left-to-right for someone looking at it from the `facing` side.
 */
export function ribbon(d, y0, y1, { facing = 'in', uvScale = 1, params = loopParams() } = {}) {
  const pts = params.map((p) => pointAt(p.seg, p.t, d));
  pts.push(pts[0]);
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  const total = s[s.length - 1];

  const positions = [];
  const uvs = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const ua = (facing === 'in' ? s[i] : total - s[i]) / uvScale;
    const ub = (facing === 'in' ? s[i + 1] : total - s[i + 1]) / uvScale;
    const A0 = [a.x, y0, a.z];
    const A1 = [a.x, y1, a.z];
    const B0 = [b.x, y0, b.z];
    const B1 = [b.x, y1, b.z];
    if (facing === 'in') {
      positions.push(...A0, ...B0, ...B1, ...A0, ...B1, ...A1);
      uvs.push(ua, 0, ub, 0, ub, 1, ua, 0, ub, 1, ua, 1);
    } else {
      positions.push(...A0, ...B1, ...B0, ...A0, ...A1, ...B1);
      uvs.push(ua, 0, ub, 1, ub, 0, ua, 0, ua, 1, ub, 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

// Evenly spaced points around the loop at distance d (about `spacing` meters apart)
export function alongLoop(d, spacing) {
  const out = [];
  for (const seg of SEGMENTS) {
    const n = Math.max(1, Math.round(segmentLength(seg, d) / spacing));
    for (let i = 0; i < n; i++) out.push({ ...pointAt(seg, (i + 0.5) / n, d), seg });
  }
  return out;
}

// Fills an InstancedMesh from a list of items using a helper Object3D
export function fillInstances(mesh, items, place) {
  const dummy = new THREE.Object3D();
  dummy.rotation.order = 'YXZ';
  items.forEach((item, i) => {
    dummy.position.set(0, 0, 0);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    place(dummy, item, i);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}
