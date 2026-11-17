// Helpers for building textures by drawing on a canvas (signs, goal net, etc.)
import * as THREE from 'three';

export const FONT = '"Rubik", "Segoe UI", Arial, sans-serif';

export function canvasTexture(width, height, draw) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  draw(ctx, width, height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

// Text on a dark club-colored sign background
export function signTexture(width, height, drawText) {
  return canvasTexture(width, height, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#13284a');
    bg.addColorStop(1, '#071428');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    drawText(ctx, w, h);
  });
}

// Draws text, shrinking the font if needed so it fits within maxWidth
export function fitText(ctx, text, x, y, maxWidth, weight, size) {
  let s = size;
  ctx.font = `${weight} ${s}px ${FONT}`;
  while (ctx.measureText(text).width > maxWidth && s > 10) {
    s -= 2;
    ctx.font = `${weight} ${s}px ${FONT}`;
  }
  ctx.fillText(text, x, y);
}
