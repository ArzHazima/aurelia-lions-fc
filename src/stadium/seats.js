// Every individual seat in the stadium.
// All seats share ONE InstancedMesh (one draw call for thousands of chairs). Each instance
// has its own position/rotation matrix and its own color, and raycasting returns the
// instanceId of the exact chair under the pointer.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ROW, SEAT_COLORS, STANDS } from './config.js';
import { rowLayout, treadPosition } from './stands.js';

const COLOR = {
  available: new THREE.Color(SEAT_COLORS.available),
  taken: new THREE.Color(SEAT_COLORS.taken),
  hover: new THREE.Color(SEAT_COLORS.hover),
};
const HOVER_SCALE = 1.25;

// A simple low-poly stadium chair: seat pan, backrest and a center post.
// The origin is on the floor; the backrest faces away from the pitch (+z).
function chairGeometry() {
  const pan = new THREE.BoxGeometry(0.78, 0.1, 0.5);
  pan.translate(0, 0.42, 0);
  const back = new THREE.BoxGeometry(0.78, 0.6, 0.08);
  back.rotateX(0.12);
  back.translate(0, 0.78, 0.25);
  const post = new THREE.BoxGeometry(0.16, 0.37, 0.16);
  post.translate(0, 0.185, 0.02);
  const geo = mergeGeometries([pan, back, post]);
  [pan, back, post].forEach((g) => g.dispose());
  return geo;
}

/**
 * @param {object} occupancy seat data from src/data/seats/<match>.json
 *   { stands: { north: ["0110...", ...one string per row], ... } }  "1" = taken
 */
export function createSeats(occupancy) {
  const seats = [];
  const up = new THREE.Vector3(0, 1, 0);

  for (const stand of STANDS) {
    const standMatrix = new THREE.Matrix4().compose(
      new THREE.Vector3(stand.x, 0, stand.z),
      new THREE.Quaternion().setFromAxisAngle(up, stand.rotationY),
      new THREE.Vector3(1, 1, 1),
    );
    const rows = occupancy?.stands?.[stand.id] ?? [];
    const { seats: xs } = rowLayout(stand);

    for (let r = 0; r < stand.rows; r++) {
      const t = treadPosition(r);
      const rowData = rows[r] ?? '';
      xs.forEach((x, s) => {
        const position = new THREE.Vector3(x, t.y, t.z + ROW.depth * 0.5).applyMatrix4(standMatrix);
        seats.push({
          index: seats.length,
          standId: stand.id,
          standName: stand.name,
          section: String.fromCharCode(65 + Math.floor(s / stand.seatsPerBlock)),
          row: r + 1,
          number: s + 1,
          price: stand.price,
          taken: rowData[s] === '1',
          position,
          rotationY: stand.rotationY,
        });
      });
    }
  }

  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.55 });
  const mesh = new THREE.InstancedMesh(chairGeometry(), material, seats.length);
  mesh.name = 'seats';
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  function writeInstance(seat, highlighted) {
    quat.setFromAxisAngle(up, seat.rotationY);
    scale.setScalar(highlighted ? HOVER_SCALE : 1);
    matrix.compose(seat.position, quat, scale);
    mesh.setMatrixAt(seat.index, matrix);
    mesh.setColorAt(seat.index, highlighted ? COLOR.hover : seat.taken ? COLOR.taken : COLOR.available);
  }

  seats.forEach((seat) => writeInstance(seat, false));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor.needsUpdate = true;
  mesh.computeBoundingSphere();

  let highlighted = null;

  function refresh() {
    mesh.instanceMatrix.needsUpdate = true;
    mesh.instanceColor.needsUpdate = true;
  }

  return {
    mesh,
    seats,

    // Highlight exactly one seat (or none with null)
    setHighlighted(seat) {
      if (seat === highlighted) return;
      if (highlighted) writeInstance(highlighted, false);
      highlighted = seat;
      if (seat) writeInstance(seat, true);
      refresh();
    },

    setTaken(seat, taken = true) {
      seat.taken = taken;
      writeInstance(seat, seat === highlighted);
      refresh();
    },

    availableCount() {
      return seats.reduce((n, s) => n + (s.taken ? 0 : 1), 0);
    },

    // Returns the seat under the ray, or null. Stands and roof are tested too,
    // so a seat hidden behind them can't be picked.
    pick(raycaster, occluders = []) {
      const hits = raycaster.intersectObjects([mesh, ...occluders], true);
      const hit = hits[0];
      if (!hit || hit.object !== mesh || hit.instanceId == null) return null;
      return seats[hit.instanceId];
    },
  };
}
