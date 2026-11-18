// The pitch: striped grass, white lines, technical areas, goals with nets and corner flags
import * as THREE from 'three';
import { COLORS, PITCH } from './config.js';
import { canvasTexture } from './textures.js';

export function createPitch(maxAnisotropy = 4) {
  const group = new THREE.Group();
  group.name = 'pitch';

  const W = PITCH.length + PITCH.margin * 2;
  const H = PITCH.width + PITCH.margin * 2;
  const texture = createPitchTexture();
  texture.anisotropy = maxAnisotropy;

  const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(W, H),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95 }),
  );
  grass.rotation.x = -Math.PI / 2;
  grass.receiveShadow = true;

  group.add(grass, createGoal(1), createGoal(-1), createCornerFlags());
  return group;
}

// ---------- Grass and lines are drawn onto one large canvas ----------
function createPitchTexture() {
  const S = 16; // pixels per meter
  const L = PITCH.length;
  const Wd = PITCH.width;
  const W = L + PITCH.margin * 2;
  const H = Wd + PITCH.margin * 2;

  return canvasTexture(Math.round(W * S), Math.round(H * S), (ctx) => {
    const X = (m) => (m + W / 2) * S;
    const Y = (m) => (m + H / 2) * S;

    // Mowing stripes
    const stripes = 18;
    const sw = L / stripes;
    for (let i = -2; i < stripes + 2; i++) {
      ctx.fillStyle = i % 2 === 0 ? COLORS.grassA : COLORS.grassB;
      ctx.fillRect(X(-L / 2 + i * sw), 0, sw * S + 1, H * S);
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.lineWidth = 0.15 * S;

    const hl = L / 2;
    const hw = Wd / 2;
    const dot = (x, y, r) => {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    };

    // Touchlines, halfway line, center circle
    ctx.strokeRect(X(-hl), Y(-hw), L * S, Wd * S);
    ctx.beginPath();
    ctx.moveTo(X(0), Y(-hw));
    ctx.lineTo(X(0), Y(hw));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(X(0), Y(0), 9.15 * S, 0, Math.PI * 2);
    ctx.stroke();
    dot(X(0), Y(0), 0.3 * S);

    // Penalty areas, goal areas, penalty spots and arcs
    for (const side of [-1, 1]) {
      const gx = side * hl;
      const box = (depth, width) => {
        const x0 = side > 0 ? gx - depth : gx;
        ctx.strokeRect(X(x0), Y(-width / 2), depth * S, width * S);
      };
      box(16.5, 40.32);
      box(5.5, 18.32);

      const px = gx - side * 11;
      dot(X(px), Y(0), 0.25 * S);

      const a = Math.acos(5.5 / 9.15);
      ctx.beginPath();
      if (side > 0) ctx.arc(X(px), Y(0), 9.15 * S, Math.PI - a, Math.PI + a);
      else ctx.arc(X(px), Y(0), 9.15 * S, -a, a);
      ctx.stroke();
    }

    // Corner arcs (only the part inside the pitch)
    ctx.save();
    ctx.beginPath();
    ctx.rect(X(-hl), Y(-hw), L * S, Wd * S);
    ctx.clip();
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(X(sx * hl), Y(sz * hw), 1 * S, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.restore();

    // Dashed technical areas in front of the two dugouts (north side)
    ctx.save();
    ctx.setLineDash([0.5 * S, 0.4 * S]);
    ctx.lineWidth = 0.1 * S;
    for (const sx of [-1, 1]) {
      const x0 = sx > 0 ? 6 : -16;
      ctx.strokeRect(X(x0), Y(-hw - 4.6), 10 * S, 3.6 * S);
    }
    ctx.restore();
  });
}

// ---------- Goal ----------
function scaleUV(geometry, sx, sy) {
  const uv = geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * sx, uv.getY(i) * sy);
  return geometry;
}

function netTexture() {
  const tex = canvasTexture(32, 32, (ctx) => {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(0, 0, 32, 3);
    ctx.fillRect(0, 0, 3, 32);
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function createGoal(side) {
  const goal = new THREE.Group();
  goal.position.x = side * (PITCH.length / 2);
  goal.rotation.y = side > 0 ? 0 : Math.PI; // the net always sits outside the pitch

  const w = 7.32;
  const h = 2.44;
  const t = 0.12;
  const depth = 2;
  const cell = 0.22;

  const postMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.35 });
  const add = (geo, x, y, z, rotZ = 0) => {
    const m = new THREE.Mesh(geo, postMat);
    m.position.set(x, y, z);
    m.rotation.z = rotZ;
    m.castShadow = true;
    goal.add(m);
  };

  // Posts and crossbar
  const upright = new THREE.BoxGeometry(t, h, t);
  add(upright, 0, h / 2, -w / 2);
  add(upright, 0, h / 2, w / 2);
  add(new THREE.BoxGeometry(t, t, w + t), 0, h, 0);

  // Thin back frame
  const thin = t * 0.5;
  add(new THREE.BoxGeometry(thin, thin, w), depth, thin / 2, 0);
  add(new THREE.BoxGeometry(thin, thin, w), depth / 2, h, 0);
  const slopeLen = Math.hypot(depth / 2, h);
  const slopeAngle = Math.atan2(depth / 2, h);
  for (const z of [-w / 2, w / 2]) {
    add(new THREE.BoxGeometry(depth / 2, thin, thin), depth / 4, h, z);
    add(new THREE.BoxGeometry(thin, slopeLen, thin), depth * 0.75, h / 2, z, slopeAngle);
  }

  // Net
  const netMat = new THREE.MeshBasicMaterial({
    map: netTexture(),
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  const top = scaleUV(new THREE.PlaneGeometry(depth / 2, w), depth / 2 / cell, w / cell);
  top.rotateX(-Math.PI / 2);
  const topNet = new THREE.Mesh(top, netMat);
  topNet.position.set(depth / 4, h, 0);

  const back = scaleUV(new THREE.PlaneGeometry(w, slopeLen), w / cell, slopeLen / cell);
  back.rotateY(Math.PI / 2);
  back.rotateZ(slopeAngle);
  const backNet = new THREE.Mesh(back, netMat);
  backNet.position.set(depth * 0.75, h / 2, 0);

  const sideShape = new THREE.Shape([
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0, h),
    new THREE.Vector2(depth / 2, h),
    new THREE.Vector2(depth, 0),
  ]);
  const sideGeo = scaleUV(new THREE.ShapeGeometry(sideShape), 1 / cell, 1 / cell);
  for (const z of [-w / 2, w / 2]) {
    const sideNet = new THREE.Mesh(sideGeo, netMat);
    sideNet.position.z = z;
    goal.add(sideNet);
  }
  goal.add(topNet, backNet);
  return goal;
}

// ---------- Corner flags ----------
function createCornerFlags() {
  const group = new THREE.Group();
  const poleGeo = new THREE.CylinderGeometry(0.035, 0.035, 1.6, 6);
  const poleMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
  const flagGeo = new THREE.PlaneGeometry(0.45, 0.32);
  const flagMat = new THREE.MeshStandardMaterial({ color: COLORS.gold, side: THREE.DoubleSide });

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const x = (sx * PITCH.length) / 2;
      const z = (sz * PITCH.width) / 2;
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(x, 0.8, z);
      pole.castShadow = true;
      const flag = new THREE.Mesh(flagGeo, flagMat);
      flag.position.set(x - sx * 0.23, 1.42, z);
      group.add(pole, flag);
    }
  }
  return group;
}
