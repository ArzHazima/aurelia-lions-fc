// The VIP level between the two tiers: a ring of glass hospitality boxes with warm
// lights inside, a glass balcony rail, and a scrolling LED ribbon on the upper-tier front.
import * as THREE from 'three';
import { COLORS, TIERS, BOX } from './config.js';
import { ribbon, alongLoop, fillInstances } from './bowl/geometry.js';
import { canvasTexture, FONT } from './textures.js';

// Warm box interiors: lit back wall with a lamp and a few guests' silhouettes
function interiorTexture() {
  const tex = canvasTexture(256, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#ffd9a0');
    g.addColorStop(1, '#e38a3f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(70, 35, 20, 0.45)';
    for (const x of [60, 92, 170]) {
      ctx.beginPath();
      ctx.arc(x, 66, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x - 15, 78, 30, 50);
    }
    ctx.fillStyle = 'rgba(255, 250, 230, 0.9)';
    ctx.fillRect(110, 8, 36, 6);
  });
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

function ledTexture() {
  const tex = canvasTexture(1280, 64, (ctx, w, h) => {
    ctx.fillStyle = COLORS.blue;
    ctx.fillRect(0, 0, w, h);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.font = `800 38px ${FONT}`;
    // Lay the words out side by side with equal gaps so the tile repeats seamlessly
    const parts = ['AURELIA LIONS', '★', 'AURELIA PARK', '★', 'COME ON YOU LIONS', '★'];
    const widths = parts.map((p) => ctx.measureText(p).width);
    const gap = (w - widths.reduce((a, b) => a + b, 0)) / parts.length;
    let x = gap / 2;
    parts.forEach((p, i) => {
      ctx.fillStyle = i === 0 || i === 4 ? COLORS.gold : '#ffffff';
      ctx.fillText(p, x, h / 2 + 2);
      x += widths[i] + gap;
    });
  });
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

export function createVip() {
  const group = new THREE.Group();
  group.name = 'vip';
  const boxHeight = BOX.ceiling - BOX.floor;
  const boxDepth = BOX.back - BOX.front;

  // Glass front of the boxes
  const glass = new THREE.Mesh(
    ribbon(BOX.front + 0.02, BOX.floor, BOX.ceiling, { facing: 'in' }),
    new THREE.MeshStandardMaterial({
      color: '#a8c8ff',
      transparent: true,
      opacity: 0.25,
      roughness: 0.05,
      metalness: 0.4,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );

  // Warm lit interiors (back wall of each box)
  const interior = new THREE.Mesh(
    ribbon(BOX.back - 0.03, BOX.floor, BOX.ceiling, { facing: 'in', uvScale: 4.4 }),
    new THREE.MeshBasicMaterial({ map: interiorTexture() }),
  );

  // Walls between the boxes
  const dividerItems = alongLoop((BOX.front + BOX.back) / 2, 4.4);
  const dividers = fillInstances(
    new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.14, boxHeight, boxDepth),
      new THREE.MeshStandardMaterial({ color: COLORS.navy, roughness: 0.6 }),
      dividerItems.length,
    ),
    dividerItems,
    (o, it) => {
      o.position.set(it.x, BOX.floor + boxHeight / 2, it.z);
      o.rotation.y = it.beta;
    },
  );

  // Warm ceiling lights
  const lightItems = alongLoop(BOX.front + 1.4, 2.2);
  const lights = fillInstances(
    new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 0.06, 0.35), new THREE.MeshBasicMaterial({ color: '#ffe2b0' }), lightItems.length),
    lightItems,
    (o, it) => {
      o.position.set(it.x, BOX.ceiling - 0.05, it.z);
      o.rotation.y = it.beta;
    },
  );

  // Glass balcony rail in front of the VIP seats
  const rail = new THREE.Mesh(
    ribbon(TIERS.vip.start + 0.05, TIERS.vip.base, TIERS.vip.base + 0.9, { facing: 'in' }),
    new THREE.MeshStandardMaterial({
      color: '#cfe0ff',
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      depthWrite: false,
      side: THREE.DoubleSide,
    }),
  );

  // Scrolling LED ribbon on the front of the upper tier
  const led = ledTexture();
  const ledRibbon = new THREE.Mesh(
    ribbon(TIERS.upper.start - 0.04, BOX.ceiling + 0.05, TIERS.upper.base - 0.05, { facing: 'in', uvScale: 26 }),
    new THREE.MeshBasicMaterial({ map: led }),
  );

  group.add(glass, interior, dividers, lights, rail, ledRibbon);
  return {
    group,
    update(dt) {
      led.offset.x -= dt * 0.05;
    },
  };
}
