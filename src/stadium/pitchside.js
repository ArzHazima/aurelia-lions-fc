// Everything between the touchline and the stands: animated LED advertising boards,
// the players' tunnel, both dugouts and the fourth official's table.
import * as THREE from 'three';
import { COLORS, PITCH, BOWL } from './config.js';
import { canvasTexture, FONT } from './textures.js';

const HL = PITCH.length / 2;
const HW = PITCH.width / 2;
const BOARD_Z = HW + 3.2;
const BOARD_X = HL + 4;
const MESSAGE_SECONDS = 6;

// ---------- LED boards ----------

function boardMessages(match) {
  return [
    { bg: COLORS.navy, parts: [['SAHAR STARS', COLORS.gold], ['★', '#ffffff'], ['FLAME ARENA', '#ffffff']] },
    { bg: '#13284a', parts: [[`WELCOME ${match.away.toUpperCase()} FANS`, '#ffffff']] },
    { bg: COLORS.gold, parts: [['COME ON YOU STARS!', COLORS.navy], ['★', COLORS.navy]] },
    { bg: '#13284a', parts: [[match.competition.toUpperCase(), '#9fb0cc'], ['★', COLORS.gold], [`KICK-OFF ${match.time}`, '#ffffff']] },
  ];
}

// Draws one message so that the tile repeats seamlessly along a board
function drawBoard(ctx, w, h, msg) {
  ctx.fillStyle = msg.bg;
  ctx.fillRect(0, 0, w, h);
  ctx.font = `800 38px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const widths = msg.parts.map(([text]) => ctx.measureText(text).width);
  const gap = (w - widths.reduce((a, b) => a + b, 0)) / msg.parts.length;
  let x = gap / 2;
  msg.parts.forEach(([text, color], i) => {
    ctx.fillStyle = color;
    ctx.fillText(text, x, h / 2 + 2);
    x += widths[i] + gap;
  });
}

function createBoards(match) {
  const group = new THREE.Group();
  const messages = boardMessages(match);
  let ctx;
  const base = canvasTexture(1024, 72, (c, w, h) => {
    ctx = c;
    drawBoard(c, w, h, messages[0]);
  });
  base.wrapS = THREE.RepeatWrapping;

  const backMat = new THREE.MeshStandardMaterial({ color: '#141b2b', roughness: 0.8 });
  // North side leaves a gap for the tunnel and dugouts
  const segments = [
    { x: 0, z: BOARD_Z, len: 92 },
    { x: -33, z: -BOARD_Z, len: 26 },
    { x: 33, z: -BOARD_Z, len: 26 },
    { x: BOARD_X, z: 0, len: 58 },
    { x: -BOARD_X, z: 0, len: 58 },
  ];
  const textures = [];
  for (const seg of segments) {
    const board = new THREE.Group();
    board.position.set(seg.x, 0, seg.z);
    board.rotation.y = Math.atan2(-seg.x, -seg.z); // face the center of the pitch

    const tex = base.clone(); // shares the canvas, has its own scroll offset
    tex.repeat.set(seg.len / 14, 1);
    textures.push(tex);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(seg.len, 0.9), new THREE.MeshBasicMaterial({ map: tex }));
    screen.position.set(0, 0.55, 0.01);
    const box = new THREE.Mesh(new THREE.BoxGeometry(seg.len + 0.2, 1.05, 0.25), backMat);
    box.position.set(0, 0.52, -0.13);
    box.castShadow = true;
    board.add(box, screen);
    group.add(board);
  }

  let current = 0;
  return {
    group,
    update(dt, time) {
      for (const t of textures) t.offset.x -= dt * 0.08;
      const next = Math.floor(time / MESSAGE_SECONDS) % messages.length;
      if (next !== current) {
        current = next;
        drawBoard(ctx, 1024, 72, messages[current]);
        base.needsUpdate = true; // the clones share this canvas, so all boards update
      }
    },
  };
}

// ---------- Players' tunnel ----------

function textPlane(text, width, height, color = COLORS.gold) {
  const tex = canvasTexture(512, Math.round((512 * height) / width), (ctx, w, h) => {
    ctx.fillStyle = COLORS.navy;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = color;
    ctx.font = `800 ${Math.round(h * 0.55)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 2);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: tex }));
}

function createTunnel(mats) {
  const g = new THREE.Group();
  const z0 = -BOWL.halfZ; // front wall of the main stand

  // Housing under the first rows of the stand
  const housing = new THREE.Mesh(new THREE.BoxGeometry(5.2, 3.9, 4.3), mats.navy);
  housing.position.set(0, 1.95, z0 - 2.15);
  const sign = textPlane("PLAYERS' TUNNEL", 4.8, 0.7);
  sign.position.set(0, 3.35, z0 + 0.01);
  const opening = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.6), new THREE.MeshBasicMaterial({ color: '#04070d' }));
  opening.position.set(0, 1.3, z0 + 0.02);

  // Extendable tunnel tube reaching toward the pitch
  const tubeGeo = new THREE.CylinderGeometry(1.9, 1.9, 5, 14, 1, true, 0, Math.PI);
  tubeGeo.rotateX(Math.PI / 2);
  tubeGeo.rotateZ(Math.PI / 2);
  const tube = new THREE.Mesh(tubeGeo, mats.tube);
  tube.position.set(0, 0, z0 + 2.5);
  tube.castShadow = true;
  const archGeo = new THREE.TorusGeometry(1.9, 0.1, 6, 18, Math.PI);
  for (const z of [z0 + 0.05, z0 + 5]) {
    const arch = new THREE.Mesh(archGeo, mats.gold);
    arch.position.set(0, 0, z);
    g.add(arch);
  }
  g.add(housing, sign, opening, tube);
  return g;
}

// ---------- Dugouts ----------

function createDugout(x, seatColor, mats) {
  const g = new THREE.Group();
  g.position.set(x, 0, -(HW + 5.6));
  const W = 8;
  const D = 2.2;
  const H = 2.3;

  const floor = new THREE.Mesh(new THREE.BoxGeometry(W, 0.12, D), mats.dark);
  floor.position.y = 0.06;
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.15), mats.navy);
  back.position.set(0, H / 2, -D / 2);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, 0.08, D + 0.4), mats.plexi);
  roof.position.set(0, H + 0.05, 0.15);
  roof.rotation.x = -0.06;
  g.add(floor, back, roof);
  for (const sx of [-1, 1]) {
    const side = new THREE.Mesh(new THREE.BoxGeometry(0.12, H, D), mats.plexi);
    side.position.set((sx * W) / 2, H / 2, 0);
    g.add(side);
  }

  // Padded bench seats facing the pitch
  const n = 9;
  const seatMat = new THREE.MeshStandardMaterial({ color: seatColor, roughness: 0.5 });
  const pan = new THREE.InstancedMesh(new THREE.BoxGeometry(0.72, 0.2, 0.55), seatMat, n);
  const rest = new THREE.InstancedMesh(new THREE.BoxGeometry(0.72, 0.85, 0.14), seatMat, n);
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    const sx = (i - (n - 1) / 2) * 0.82;
    pan.setMatrixAt(i, m.makeTranslation(sx, 0.5, -0.45));
    rest.setMatrixAt(i, m.makeTranslation(sx, 0.95, -0.8));
  }
  g.add(pan, rest);
  return g;
}

function createFourthOfficial(mats) {
  const g = new THREE.Group();
  g.position.set(0, 0, -(HW + 2.6));
  const table = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.8, 0.7), mats.navy);
  table.position.y = 0.4;
  const board = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.06), new THREE.MeshBasicMaterial({ color: '#ffb02e' }));
  board.position.set(0.4, 0.95, 0);
  board.rotation.x = -0.4;
  g.add(table, board);
  return g;
}

export function createPitchside(match) {
  const group = new THREE.Group();
  group.name = 'pitchside';
  const mats = {
    navy: new THREE.MeshStandardMaterial({ color: COLORS.navy, roughness: 0.6 }),
    gold: new THREE.MeshStandardMaterial({ color: COLORS.gold, roughness: 0.4, metalness: 0.3 }),
    dark: new THREE.MeshStandardMaterial({ color: '#1b2233', roughness: 0.9 }),
    tube: new THREE.MeshStandardMaterial({ color: COLORS.navyLight, roughness: 0.5, side: THREE.DoubleSide }),
    plexi: new THREE.MeshStandardMaterial({
      color: '#c6dcff',
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      depthWrite: false,
    }),
  };

  const boards = createBoards(match);
  group.add(
    boards.group,
    createTunnel(mats),
    createDugout(-11, COLORS.gold, mats), // home bench
    createDugout(11, '#c2410c', mats), // away bench
    createFourthOfficial(mats),
  );
  return { group, update: boards.update };
}
