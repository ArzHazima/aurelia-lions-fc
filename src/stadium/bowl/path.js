// The shape of the bowl: a rounded rectangle around the pitch made of 8 segments
// (4 straight sides + 4 curved corners). Any point of the stadium can be described as
//   (segment, t, d):  t = 0..1 along the segment,  d = meters outward from the bowl front.
// Because every row is the same shape pushed outward, stairs and section borders
// line up perfectly from the front row to the back row.
// No Three.js here – plain numbers – so Node scripts can use it too.
import { BOWL } from '../config.js';

const { halfX: A, halfZ: B, radius: R } = BOWL;
const AX = A - R;
const BZ = B - R;
const HP = Math.PI / 2;

// beta = direction of the outward normal: (sin beta, cos beta) in the x/z plane.
// A seat facing the pitch has rotationY = beta.
export const SEGMENTS = [
  { id: 'north', kind: 'line', name: 'North Stand', from: [-AX, -B], dir: [1, 0], len: 2 * AX, beta: Math.PI, sections: 6, vip: true },
  { id: 'ne', kind: 'arc', name: 'North-East Corner', center: [AX, -BZ], b0: Math.PI, b1: HP, sections: 3 },
  { id: 'east', kind: 'line', name: 'East Stand', from: [A, -BZ], dir: [0, 1], len: 2 * BZ, beta: HP, sections: 4 },
  { id: 'se', kind: 'arc', name: 'South-East Corner', center: [AX, BZ], b0: HP, b1: 0, sections: 3 },
  { id: 'south', kind: 'line', name: 'South Stand', from: [AX, B], dir: [-1, 0], len: 2 * AX, beta: 0, sections: 6, vip: true },
  { id: 'sw', kind: 'arc', name: 'South-West Corner', center: [-AX, BZ], b0: 0, b1: -HP, sections: 3 },
  { id: 'west', kind: 'line', name: 'West Stand', from: [-A, BZ], dir: [0, -1], len: 2 * BZ, beta: -HP, sections: 4 },
  { id: 'nw', kind: 'arc', name: 'North-West Corner', center: [-AX, -BZ], b0: -HP, b1: -Math.PI, sections: 3 },
];

export const segmentById = (id) => SEGMENTS.find((s) => s.id === id);

// Point at (segment, t, d) → { x, z, beta }
export function pointAt(seg, t, d) {
  if (seg.kind === 'line') {
    const s = t * seg.len;
    return {
      x: seg.from[0] + seg.dir[0] * s + Math.sin(seg.beta) * d,
      z: seg.from[1] + seg.dir[1] * s + Math.cos(seg.beta) * d,
      beta: seg.beta,
    };
  }
  const beta = seg.b0 + (seg.b1 - seg.b0) * t;
  const r = R + d;
  return { x: seg.center[0] + Math.sin(beta) * r, z: seg.center[1] + Math.cos(beta) * r, beta };
}

// Length of a segment at distance d from the front (corners get longer further back)
export function segmentLength(seg, d) {
  return seg.kind === 'line' ? seg.len : Math.abs(seg.b1 - seg.b0) * (R + d);
}

// The reverse of pointAt: which segment / t / d is the world point (x, z) on?
export function locate(x, z) {
  if (Math.abs(x) <= AX) {
    return z < 0
      ? { seg: SEGMENTS[0], t: (x + AX) / (2 * AX), d: -z - B }
      : { seg: SEGMENTS[4], t: (AX - x) / (2 * AX), d: z - B };
  }
  if (Math.abs(z) <= BZ) {
    return x > 0
      ? { seg: SEGMENTS[2], t: (z + BZ) / (2 * BZ), d: x - A }
      : { seg: SEGMENTS[6], t: (BZ - z) / (2 * BZ), d: -x - A };
  }
  const seg = SEGMENTS.find((s) => s.kind === 'arc' && Math.sign(s.center[0]) === Math.sign(x) && Math.sign(s.center[1]) === Math.sign(z));
  const dx = x - seg.center[0];
  const dz = z - seg.center[1];
  const beta = Math.atan2(dx, dz);
  const t = Math.min(1, Math.max(0, (beta - seg.b0) / (seg.b1 - seg.b0)));
  return { seg, t, d: Math.hypot(dx, dz) - R };
}
