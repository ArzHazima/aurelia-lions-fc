// Every individual seat in the stadium (~33,000).
// Seats are grouped into one InstancedMesh per tier and side of the bowl (~20 meshes),
// so Three.js can skip whole groups that are off-screen. Each instance has its own
// matrix and color; raycasting returns (mesh, instanceId) → the exact seat.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { SEAT_COLORS, TIERS } from './config.js';
import { locate, pointAt, segmentById } from './bowl/path.js';

const COLOR = {
  free: new THREE.Color(SEAT_COLORS.free),
  taken: new THREE.Color(SEAT_COLORS.taken),
  blocked: new THREE.Color(SEAT_COLORS.blocked),
  hover: new THREE.Color(SEAT_COLORS.hover),
};
const WHITE = new THREE.Color('#ffffff');
const HOVER_SCALE = 1.35;
const STATUS = { 0: 'free', 1: 'taken', x: 'blocked' };

// A simple low-poly stadium chair: seat pan + backrest (backrest faces away from the pitch)
export function chairGeometry() {
  const pan = new THREE.BoxGeometry(0.62, 0.08, 0.42);
  pan.translate(0, 0.4, 0);
  const back = new THREE.BoxGeometry(0.62, 0.5, 0.07);
  back.rotateX(0.12);
  back.translate(0, 0.66, 0.2);
  const geo = mergeGeometries([pan, back]);
  pan.dispose();
  back.dispose();
  return geo;
}

/**
 * @param layout     from bowl/layout.js
 * @param occupancy  { sections: { "101": ["0110x...", ...one string per row] } }
 *                   "0" = free, "1" = taken, "x" = not on sale
 */
export function createSeats(layout, occupancy) {
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55 });
  const geometry = chairGeometry();
  const up = new THREE.Vector3(0, 1, 0);

  const groups = new Map(); // "tier:segment" → seats
  const sections = [];
  const sectionByKey = new Map();
  const seats = [];

  for (const src of layout.sections) {
    const { rows, ...info } = src;
    const section = { ...info, seats: [], center: null, normal: null };
    const data = occupancy?.sections?.[section.id] ?? [];

    rows.forEach((row, r) => {
      row.forEach((s, i) => {
        const seat = {
          index: seats.length,
          section,
          row: r + 1,
          number: s.number,
          status: STATUS[data[r]?.[i]] ?? 'free',
          position: new THREE.Vector3(s.x, s.y, s.z),
          rotationY: s.beta,
          mesh: null,
          instanceId: -1,
        };
        seats.push(seat);
        section.seats.push(seat);
      });
    });

    // Camera target for this section: middle of the middle row
    const seg = segmentById(section.segId);
    const tier = TIERS[section.tierId];
    const midRow = Math.floor(tier.rows / 2);
    const p = pointAt(seg, (section.t0 + section.t1) / 2, tier.start + (midRow + 0.5) * tier.depth);
    section.center = new THREE.Vector3(p.x, tier.base + midRow * tier.rise, p.z);
    section.normal = new THREE.Vector3(Math.sin(p.beta), 0, Math.cos(p.beta));

    sections.push(section);
    sectionByKey.set(`${section.tierId}:${section.segId}:${section.index}`, section);
    const key = `${section.tierId}:${section.segId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(...section.seats);
  }

  // One InstancedMesh per tier + side
  const meshes = [];
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();
  const tmpColor = new THREE.Color();
  let highlighted = null;
  let highlightedSection = null;

  function write(seat) {
    const hover = seat === highlighted;
    quat.setFromAxisAngle(up, seat.rotationY);
    scale.setScalar(hover ? HOVER_SCALE : 1);
    matrix.compose(seat.position, quat, scale);
    seat.mesh.setMatrixAt(seat.instanceId, matrix);
    if (hover) tmpColor.copy(COLOR.hover);
    else {
      tmpColor.copy(COLOR[seat.status]);
      if (seat.section === highlightedSection) tmpColor.lerp(WHITE, 0.45);
    }
    seat.mesh.setColorAt(seat.instanceId, tmpColor);
  }

  function flush(mesh) {
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  }

  for (const [key, list] of groups) {
    const mesh = new THREE.InstancedMesh(geometry, material, list.length);
    mesh.name = `seats:${key}`;
    mesh.receiveShadow = true;
    mesh.userData.seats = list;
    list.forEach((seat, i) => {
      seat.mesh = mesh;
      seat.instanceId = i;
      write(seat);
    });
    flush(mesh);
    mesh.computeBoundingSphere();
    meshes.push(mesh);
  }

  const stats = (section) => {
    let free = 0;
    for (const s of section.seats) if (s.status === 'free') free++;
    return { free, total: section.seats.length };
  };

  return {
    meshes,
    seats,
    sections,

    // Gold + slightly bigger: exactly one seat at a time
    setHighlighted(seat) {
      if (seat === highlighted) return;
      const prev = highlighted;
      highlighted = seat;
      if (prev) {
        write(prev);
        flush(prev.mesh);
      }
      if (seat) {
        write(seat);
        flush(seat.mesh);
      }
    },

    // Lighten every seat of one section (used when hovering sections in the overview)
    setSectionHighlight(section) {
      if (section === highlightedSection) return;
      const prev = highlightedSection;
      highlightedSection = section;
      for (const s of [prev, section]) {
        if (!s) continue;
        s.seats.forEach(write);
        new Set(s.seats.map((x) => x.mesh)).forEach(flush);
      }
    },

    setStatus(seat, status) {
      seat.status = status;
      write(seat);
      flush(seat.mesh);
    },

    stats,
    availableCount: () => seats.reduce((n, s) => n + (s.status === 'free' ? 1 : 0), 0),

    // Section under a world point that hit the concrete bowl
    sectionAt(point, isUpper) {
      const loc = locate(point.x, point.z);
      const tierId = isUpper ? 'upper' : loc.d < TIERS.vip.start ? 'lower' : 'vip';
      const k = Math.min(loc.seg.sections - 1, Math.max(0, Math.floor(loc.t * loc.seg.sections)));
      return sectionByKey.get(`${tierId}:${loc.seg.id}:${k}`) ?? null;
    },

    // Seat under the ray, or null. Occluders (the concrete) block seats behind them.
    pick(raycaster, occluders = []) {
      const hit = raycaster.intersectObjects([...meshes, ...occluders], false)[0];
      if (!hit || hit.instanceId == null || !hit.object.userData.seats) return null;
      return hit.object.userData.seats[hit.instanceId];
    },
  };
}
