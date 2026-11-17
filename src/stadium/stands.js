// The four stands: stepped concrete tiers, club-colored front wall, stairs between
// sections, a roof over the main stand and a scoreboard. The seats live in seats.js.
import * as THREE from 'three';
import { COLORS, ROW, SEAT, STANDS } from './config.js';
import { signTexture, fitText, FONT } from './textures.js';

const BACK_WALL = 3.2;

// Seat and aisle positions along one row (the stand's local x axis), left to right
// as seen by a fan sitting in the stand and facing the pitch.
export function rowLayout(stand) {
  const blockWidth = stand.seatsPerBlock * SEAT.spacing;
  const total = stand.blocks * blockWidth + (stand.blocks - 1) * SEAT.aisle;
  const seats = [];
  const aisles = [];
  let x = -total / 2;
  for (let b = 0; b < stand.blocks; b++) {
    for (let s = 0; s < stand.seatsPerBlock; s++) seats.push(x + (s + 0.5) * SEAT.spacing);
    x += blockWidth;
    if (b < stand.blocks - 1) {
      aisles.push(x + SEAT.aisle / 2);
      x += SEAT.aisle;
    }
  }
  return { seats, aisles, total };
}

// Height and front edge of a row's floor (row index starts at 0)
export function treadPosition(row) {
  return { y: ROW.base + row * ROW.rise, z: row * ROW.depth };
}

export function standMetrics(stand) {
  const back = stand.rows * ROW.depth;
  const topTread = ROW.base + (stand.rows - 1) * ROW.rise;
  return { back, topTread, wallTop: topTread + BACK_WALL };
}

export function createStands({ match } = {}) {
  const mats = createMaterials();
  const group = new THREE.Group();
  group.name = 'stands';
  for (const stand of STANDS) group.add(createStand(stand, mats, match));
  return group;
}

function createMaterials() {
  return {
    concrete: new THREE.MeshStandardMaterial({ color: COLORS.concrete, roughness: 0.9, flatShading: true }),
    cap: new THREE.MeshStandardMaterial({ color: COLORS.concreteDark, roughness: 0.9, flatShading: true }),
    navy: new THREE.MeshStandardMaterial({ color: COLORS.navy, roughness: 0.6 }),
    gold: new THREE.MeshStandardMaterial({
      color: COLORS.gold,
      roughness: 0.4,
      metalness: 0.2,
      emissive: COLORS.gold,
      emissiveIntensity: 0.2,
    }),
    aisle: new THREE.MeshStandardMaterial({ color: COLORS.aisle, roughness: 0.9 }),
    roof: new THREE.MeshStandardMaterial({ color: COLORS.navyLight, roughness: 0.5, metalness: 0.3, flatShading: true }),
    steel: new THREE.MeshStandardMaterial({ color: '#3a4258', roughness: 0.6, metalness: 0.4 }),
    lamp: new THREE.MeshBasicMaterial({ color: '#fff6e2' }),
  };
}

// Side profile of the tiers: horizontal = away from the pitch, vertical = height
function standProfile(rows) {
  const { depth: d, rise: r, base: b } = ROW;
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(0, b);
  for (let i = 0; i < rows; i++) {
    const y = b + i * r;
    shape.lineTo((i + 1) * d, y);
    if (i < rows - 1) shape.lineTo((i + 1) * d, y + r);
  }
  const back = rows * d;
  const top = b + (rows - 1) * r + BACK_WALL;
  shape.lineTo(back, top);
  shape.lineTo(back + 0.6, top);
  shape.lineTo(back + 0.6, 0);
  shape.closePath();
  return shape;
}

function createStand(stand, mats, match) {
  const g = new THREE.Group();
  g.name = stand.id;
  g.position.set(stand.x, 0, stand.z);
  g.rotation.y = stand.rotationY;

  const L = stand.length;
  const { back, topTread, wallTop } = standMetrics(stand);

  // Stand body: the profile is extruded along the length of the stand
  const bodyGeo = new THREE.ExtrudeGeometry(standProfile(stand.rows), { depth: L, bevelEnabled: false });
  bodyGeo.rotateY(-Math.PI / 2);
  bodyGeo.translate(L / 2, 0, 0);
  const body = new THREE.Mesh(bodyGeo, [mats.cap, mats.concrete]);
  body.castShadow = true;
  body.receiveShadow = true;
  g.add(body);

  // Navy front wall with a gold stripe
  const front = new THREE.Mesh(new THREE.BoxGeometry(L, ROW.base, 0.2), mats.navy);
  front.position.set(0, ROW.base / 2, -0.1);
  front.receiveShadow = true;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(L, 0.16, 0.24), mats.gold);
  stripe.position.set(0, ROW.base - 0.1, -0.1);
  g.add(front, stripe);

  // Light-colored stairs between seating sections
  const { aisles } = rowLayout(stand);
  const aisleMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(SEAT.aisle * 0.8, 0.05, ROW.depth),
    mats.aisle,
    aisles.length * stand.rows,
  );
  const m = new THREE.Matrix4();
  let i = 0;
  for (let r = 0; r < stand.rows; r++) {
    const t = treadPosition(r);
    for (const x of aisles) {
      m.makeTranslation(x, t.y + 0.025, t.z + ROW.depth / 2);
      aisleMesh.setMatrixAt(i++, m);
    }
  }
  aisleMesh.receiveShadow = true;
  g.add(aisleMesh);

  // Back wall: navy band on the inside and outside
  const band = new THREE.Mesh(new THREE.PlaneGeometry(L, BACK_WALL), mats.navy);
  band.rotation.y = Math.PI;
  band.position.set(0, topTread + BACK_WALL / 2, back - 0.01);
  const outer = new THREE.Mesh(new THREE.PlaneGeometry(L, 3), mats.navy);
  outer.position.set(0, wallTop - 1.5, back + 0.61);
  const outerStripe = new THREE.Mesh(new THREE.BoxGeometry(L, 0.2, 0.05), mats.gold);
  outerStripe.position.set(0, wallTop - 3.1, back + 0.62);
  g.add(band, outer, outerStripe);

  if (stand.sign) g.add(createSign(L * 0.5, back, topTread));
  if (stand.roof) g.add(createRoof(L, mats, back, wallTop));
  if (stand.scoreboard) g.add(createScoreboard(mats, back, wallTop, match));
  return g;
}

function createSign(width, back, topTread) {
  const tex = signTexture(2048, 128, (ctx, w, h) => {
    ctx.font = `800 80px ${FONT}`;
    ctx.fillStyle = COLORS.gold;
    ctx.fillText('★  SAHAR STARS  ★', w / 2, h / 2 + 4);
  });
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(width, (width * 128) / 2048),
    new THREE.MeshBasicMaterial({ map: tex }),
  );
  sign.rotation.y = Math.PI;
  sign.position.set(0, topTread + BACK_WALL / 2, back - 0.03);
  return sign;
}

function createRoof(standLength, mats, back, wallTop) {
  const g = new THREE.Group();
  const L = standLength + 2;
  const depth = 8;
  const y = wallTop + 2.6;

  const roof = new THREE.Group();
  roof.position.set(0, y, back + 1.4 - depth / 2);
  roof.rotation.x = 0.08; // the front edge sits slightly higher

  const slab = new THREE.Mesh(new THREE.BoxGeometry(L, 0.35, depth), mats.roof);
  slab.castShadow = true;
  slab.receiveShadow = true;
  const edge = new THREE.Mesh(new THREE.BoxGeometry(L, 0.55, 0.3), mats.gold);
  edge.position.set(0, 0, -depth / 2);
  roof.add(slab, edge);

  // Light strips under the roof
  const lampGeo = new THREE.BoxGeometry(1.6, 0.12, 0.5);
  for (let x = -L / 2 + 4; x <= L / 2 - 4; x += 8) {
    const lamp = new THREE.Mesh(lampGeo, mats.lamp);
    lamp.position.set(x, -0.24, -depth / 2 + 0.8);
    roof.add(lamp);
  }
  g.add(roof);

  // Columns behind the stand
  const colH = y + 0.4;
  const colGeo = new THREE.CylinderGeometry(0.28, 0.35, colH, 8);
  for (let k = 0; k <= 7; k++) {
    const col = new THREE.Mesh(colGeo, mats.steel);
    col.position.set(-L / 2 + 2 + (k * (L - 4)) / 7, colH / 2, back + 1.0);
    col.castShadow = true;
    g.add(col);
  }
  return g;
}

function createScoreboard(mats, back, wallTop, match) {
  const g = new THREE.Group();
  const W = 18;
  const H = 6;
  const y = wallTop + 1.4 + H / 2;

  const home = (match?.home ?? 'Sahar Stars').toUpperCase();
  const away = (match?.away ?? 'Visitors').toUpperCase();

  const tex = signTexture(1024, 342, (ctx, w, h) => {
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ctx.fillStyle = COLORS.gold;
    ctx.font = `700 38px ${FONT}`;
    ctx.fillText('FLAME ARENA', w / 2, h * 0.2);
    ctx.fillStyle = '#ffffff';
    fitText(ctx, home, w * 0.26, h * 0.52, w * 0.4, 800, 64);
    fitText(ctx, away, w * 0.74, h * 0.52, w * 0.4, 800, 64);
    ctx.fillStyle = COLORS.gold;
    ctx.font = `800 52px ${FONT}`;
    ctx.fillText('VS', w / 2, h * 0.52);
    ctx.fillStyle = '#9fb0cc';
    ctx.font = `500 32px ${FONT}`;
    ctx.fillText(match?.competition ?? 'Welcome', w / 2, h * 0.8);
  });

  const frame = new THREE.Mesh(new THREE.BoxGeometry(W + 0.8, H + 0.8, 0.6), mats.steel);
  frame.position.set(0, y, back + 0.3);
  frame.castShadow = true;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: tex }));
  screen.rotation.y = Math.PI;
  screen.position.set(0, y, back - 0.02);

  const legH = y - H / 2;
  const legGeo = new THREE.BoxGeometry(0.6, legH, 0.6);
  for (const x of [-W * 0.35, W * 0.35]) {
    const leg = new THREE.Mesh(legGeo, mats.steel);
    leg.position.set(x, legH / 2, back + 0.9);
    leg.castShadow = true;
    g.add(leg);
  }
  g.add(frame, screen);
  return g;
}
