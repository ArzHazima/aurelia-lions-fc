// Two giant video screens hanging in opposite corners under the roof.
// They cycle through: the club crest → a live-style scoreboard → an animated mini-match.
import * as THREE from 'three';
import { COLORS, ROOF } from './config.js';
import { segmentById, pointAt } from './bowl/path.js';
import { canvasTexture, fitText, FONT } from './textures.js';
import { CLUB } from '../club.js';

const W = 17.6;
const H = 9.9;
const CENTER_Y = 37;
const SCENE_SECONDS = 7;
const FPS = 15;

// The real club crest (public/crest.svg), drawn onto the screen canvas
const crestImg = new Image();
crestImg.src = CLUB.crest;
const CREST_ASPECT = 220 / 300; // width / height of the crest's viewBox

function drawCrest(ctx, cx, top, height) {
  if (!crestImg.complete || !crestImg.naturalWidth) return; // still loading: skip this frame
  const width = height * CREST_ASPECT;
  ctx.drawImage(crestImg, cx - width / 2, top, width, height);
}

function sceneCrest(ctx, w, h, t) {
  const g = ctx.createRadialGradient(w / 2, h * 0.4, 10, w / 2, h / 2, w * 0.6);
  g.addColorStop(0, COLORS.blue);
  g.addColorStop(1, COLORS.navy);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  drawCrest(ctx, w / 2, 14 + Math.sin(t * 2) * 3, 190);
  ctx.fillStyle = COLORS.gold;
  ctx.font = `800 30px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(CLUB.name.toUpperCase(), w / 2, h - 48);
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 17px ${FONT}`;
  ctx.fillText(`WELCOME TO ${CLUB.stadium.toUpperCase()}`, w / 2, h - 20);
}

function sceneScore(ctx, w, h, t, match) {
  ctx.fillStyle = COLORS.navy;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = COLORS.blue;
  ctx.fillRect(0, 0, w, 44);
  drawCrest(ctx, w / 2, h - 66, 56);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Blinking "LIVE" dot
  ctx.fillStyle = Math.floor(t * 2) % 2 ? '#e5484d' : '#7a1f22';
  ctx.beginPath();
  ctx.arc(28, 22, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 18px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText('MATCHDAY', 42, 23);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#dce6ff';
  ctx.fillText(match.competition.toUpperCase(), w - 16, 23);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  fitText(ctx, match.home.toUpperCase(), w * 0.22, h * 0.48, w * 0.36, 800, 30);
  fitText(ctx, match.away.toUpperCase(), w * 0.78, h * 0.48, w * 0.36, 800, 30);
  ctx.fillStyle = COLORS.gold;
  ctx.font = `800 64px ${FONT}`;
  ctx.fillText('0 – 0', w / 2, h * 0.5);
  ctx.fillStyle = '#dce6ff';
  ctx.font = `600 18px ${FONT}`;
  ctx.fillText(`KICK-OFF ${match.time}`, w / 2, h * 0.68);
}

// Little animated match: 22 dots moving around their positions, plus a ball
const FORMATION = [
  [0.06, 0.5], [0.2, 0.18], [0.2, 0.39], [0.2, 0.61], [0.2, 0.82], [0.36, 0.25],
  [0.36, 0.5], [0.36, 0.75], [0.46, 0.2], [0.46, 0.5], [0.46, 0.8],
];

function sceneMatch(ctx, w, h, t) {
  const px = 24;
  const py = 20;
  const pw = w - px * 2;
  const ph = h - py * 2;
  ctx.fillStyle = '#1f6b2c';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = i % 2 ? '#2a7a37' : '#237030';
    ctx.fillRect(px + (pw / 10) * i, py, pw / 10, ph);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pw, ph);
  ctx.beginPath();
  ctx.moveTo(w / 2, py);
  ctx.lineTo(w / 2, py + ph);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 30, 0, Math.PI * 2);
  ctx.stroke();

  // The whole match drifts toward whichever end the ball is in
  const ballX = 0.5 + 0.38 * Math.sin(t * 0.7) * Math.cos(t * 0.23);
  const ballY = 0.5 + 0.35 * Math.sin(t * 1.1 + 1);
  const shift = (ballX - 0.5) * 0.25;
  const dot = (fx, fy, fill) => {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(px + fx * pw, py + fy * ph, 6, 0, Math.PI * 2);
    ctx.fill();
  };
  FORMATION.forEach(([fx, fy], i) => {
    const wob = (k) => Math.sin(t * (0.8 + i * 0.07) + i * k) * 0.025;
    dot(fx + shift + wob(1), fy + wob(2), COLORS.gold);
    dot(1 - fx + shift + wob(3), 1 - fy + wob(4), '#e5484d');
  });
  dot(ballX, ballY, '#ffffff');
}

export function createScreens(match) {
  const group = new THREE.Group();
  group.name = 'screens';
  const scenes = [sceneCrest, sceneScore, sceneMatch];
  let ctx;
  const tex = canvasTexture(512, 288, (c) => (ctx = c));
  const screenMat = new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true });
  const frameMat = new THREE.MeshStandardMaterial({ color: '#1b2233', roughness: 0.6, metalness: 0.3, transparent: true });
  const cableMat = new THREE.MeshStandardMaterial({ color: '#3a4258', transparent: true });
  const fading = [screenMat, frameMat, cableMat];
  const roofUnderside = ROOF.innerY - ROOF.thickness - 0.4;

  for (const id of ['nw', 'se']) {
    const p = pointAt(segmentById(id), 0.5, 17);
    const screen = new THREE.Group();
    screen.position.set(p.x, CENTER_Y, p.z);
    screen.rotation.y = p.beta + Math.PI; // face the pitch

    const frame = new THREE.Mesh(new THREE.BoxGeometry(W + 0.8, H + 0.8, 0.8), frameMat);
    frame.position.z = -0.42;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(W, H), screenMat);
    const cableLen = roofUnderside - (CENTER_Y + H / 2);
    for (const sx of [-W * 0.35, W * 0.35]) {
      const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, cableLen, 6), cableMat);
      cable.position.set(sx, H / 2 + 0.4 + cableLen / 2, -0.4);
      screen.add(cable);
    }
    screen.add(frame, face);
    group.add(screen);
  }

  let acc = 1;
  return {
    group,
    // The screens hang from the roof, so they fade in and out together with it
    setOpacity(o) {
      for (const m of fading) {
        m.opacity = o;
        m.depthWrite = o > 0.99;
      }
      group.visible = o > 0.005;
    },
    update(dt, time) {
      if (!group.visible) return;
      acc += dt;
      if (acc < 1 / FPS) return;
      acc = 0;
      const scene = scenes[Math.floor(time / SCENE_SECONDS) % scenes.length];
      scene(ctx, 512, 288, time, match);
      tex.needsUpdate = true;
    },
  };
}
