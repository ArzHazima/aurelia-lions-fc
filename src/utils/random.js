// מחולל מספרים אקראיים "עם זרע" (seed): אותו זרע תמיד נותן אותה סדרה.
// כך העצים, הגבעות ונתוני הכיסאות נראים זהים בכל טעינה.
export function createRandom(seed = 1) {
  let a = seed >>> 0;
  return function random() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
