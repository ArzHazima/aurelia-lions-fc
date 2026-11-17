// עזרים ליצירת טקסטורות מציור על canvas (שלטים, רשת שער וכו')
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

// טקסט עם שלט רקע כהה בצבעי הקבוצה
export function signTexture(width, height, drawText) {
  return canvasTexture(width, height, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#13284a');
    bg.addColorStop(1, '#071428');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';
    drawText(ctx, w, h);
  });
}
