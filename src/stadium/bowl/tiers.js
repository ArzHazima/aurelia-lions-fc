// The concrete bowl: lower tier (with the VIP terrace behind it) and upper tier,
// stairs between sections, the club-colored front wall and the outer facade.
import * as THREE from 'three';
import { COLORS, TIERS, BOX, TUNNEL, UPPER_BACK, UPPER_TOP } from '../config.js';
import { SEGMENTS, pointAt } from './path.js';
import { sweepProfile, ribbon, fillInstances } from './geometry.js';
import { canvasTexture } from '../textures.js';

// Side profile of the lower tier + VIP terrace, as [distance from front, height]
function lowerProfile() {
  const L = TIERS.lower;
  const V = TIERS.vip;
  const pts = [
    [0, 0],
    [0, L.base],
  ];
  for (let r = 0; r < L.rows; r++) {
    const y = L.base + r * L.rise;
    pts.push([L.start + (r + 1) * L.depth, y]);
    if (r < L.rows - 1) pts.push([L.start + (r + 1) * L.depth, y + L.rise]);
  }
  for (let r = 0; r < V.rows; r++) {
    const y = V.base + r * V.rise;
    pts.push([V.start + r * V.depth, y], [V.start + (r + 1) * V.depth, y]);
  }
  const vBack = V.start + V.rows * V.depth;
  pts.push([vBack, BOX.floor], [BOX.back, BOX.floor], [BOX.back, 0]);
  return pts;
}

// Side profile of the upper tier (its underside is the ceiling of the VIP boxes)
function upperProfile() {
  const U = TIERS.upper;
  const pts = [
    [BOX.back, 0],
    [BOX.back, BOX.ceiling],
    [U.start, BOX.ceiling],
    [U.start, U.base],
  ];
  for (let r = 0; r < U.rows; r++) {
    const y = U.base + r * U.rise;
    pts.push([U.start + (r + 1) * U.depth, y]);
    if (r < U.rows - 1) pts.push([U.start + (r + 1) * U.depth, y + U.rise]);
  }
  pts.push([UPPER_BACK, UPPER_TOP], [UPPER_BACK + 0.6, UPPER_TOP], [UPPER_BACK + 0.6, 0]);
  return pts;
}

// Stairs: light strips on each row at every section border
function createStairs(tierId, material) {
  const tier = TIERS[tierId];
  const items = [];
  for (const seg of SEGMENTS) {
    for (let k = 0; k < seg.sections; k++) {
      const t = k / seg.sections;
      for (let r = 0; r < tier.rows; r++) {
        const p = pointAt(seg, t, tier.start + (r + 0.5) * tier.depth);
        if (tierId === 'lower' && seg.id === TUNNEL.segment && r < TUNNEL.rows && Math.abs(p.x) < TUNNEL.halfWidth + 1) continue;
        items.push({ ...p, y: tier.base + r * tier.rise });
      }
    }
  }
  const mesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.95, 0.05, tier.depth), material, items.length);
  mesh.receiveShadow = true;
  return fillInstances(mesh, items, (o, it) => {
    o.position.set(it.x, it.y + 0.025, it.z);
    o.rotation.y = it.beta;
  });
}

function stripeTexture(bands) {
  const tex = canvasTexture(8, 64, (ctx) => {
    for (const [from, to, color] of bands) {
      ctx.fillStyle = color;
      ctx.fillRect(0, (1 - to) * 64, 8, (to - from) * 64);
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

// Lit concourse windows for the outside of the stadium
function windowTexture() {
  const tex = canvasTexture(128, 64, (ctx) => {
    ctx.fillStyle = '#1a2235';
    ctx.fillRect(0, 0, 128, 64);
    for (let i = 0; i < 4; i++) {
      const g = ctx.createLinearGradient(0, 10, 0, 54);
      g.addColorStop(0, '#ffd89a');
      g.addColorStop(1, '#f59e4a');
      ctx.fillStyle = g;
      ctx.fillRect(6 + i * 32, 10, 22, 44);
    }
  });
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

export function createTiers() {
  const group = new THREE.Group();
  group.name = 'tiers';

  const concrete = new THREE.MeshStandardMaterial({ color: COLORS.concrete, roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
  const upperConcrete = new THREE.MeshStandardMaterial({ color: '#98a1b6', roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
  const stairMat = new THREE.MeshStandardMaterial({ color: COLORS.aisle, roughness: 0.9 });

  const lowerBody = new THREE.Mesh(sweepProfile(lowerProfile()), concrete);
  const upperBody = new THREE.Mesh(sweepProfile(upperProfile()), upperConcrete);
  for (const m of [lowerBody, upperBody]) {
    m.castShadow = true;
    m.receiveShadow = true;
  }
  lowerBody.name = 'lower-tier';
  upperBody.name = 'upper-tier';

  // Royal-blue front wall with a gold top stripe, all the way round
  const frontWall = new THREE.Mesh(
    ribbon(-0.02, 0, TIERS.lower.base, { facing: 'in' }),
    new THREE.MeshStandardMaterial({
      map: stripeTexture([
        [0, 0.82, COLORS.blue],
        [0.82, 1, COLORS.gold],
      ]),
      roughness: 0.6,
    }),
  );

  // Outer facade: lit concourse windows low down, blue band with a gold line
  const outD = UPPER_BACK + 0.62;
  const windows = new THREE.Mesh(
    ribbon(outD, 2.5, 8.5, { facing: 'out', uvScale: 8 }),
    new THREE.MeshBasicMaterial({ map: windowTexture() }),
  );
  const crown = new THREE.Mesh(
    ribbon(outD, UPPER_TOP - 4.4, UPPER_TOP, { facing: 'out' }),
    new THREE.MeshStandardMaterial({
      map: stripeTexture([
        [0, 0.08, COLORS.gold],
        [0.08, 0.16, COLORS.navy],
        [0.16, 1, COLORS.blue],
      ]),
      roughness: 0.6,
    }),
  );

  // Vertical cladding fins between the windows and the crown
  const finTex = canvasTexture(64, 8, (ctx) => {
    ctx.fillStyle = '#8f99b0';
    ctx.fillRect(0, 0, 64, 8);
    ctx.fillStyle = '#5f6880';
    ctx.fillRect(52, 0, 12, 8);
  });
  finTex.wrapS = THREE.RepeatWrapping;
  const cladding = new THREE.Mesh(
    ribbon(outD, 8.5, UPPER_TOP - 4.4, { facing: 'out', uvScale: 2.4 }),
    new THREE.MeshStandardMaterial({ map: finTex, roughness: 0.7 }),
  );

  group.add(lowerBody, upperBody, createStairs('lower', stairMat), createStairs('upper', stairMat), frontWall, windows, crown, cladding);
  return { group, lowerBody, upperBody, bodies: [lowerBody, upperBody] };
}
