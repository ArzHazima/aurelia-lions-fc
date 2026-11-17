// מידות וצבעים משותפים לכל חלקי האצטדיון. כל המידות במטרים.

export const COLORS = {
  navy: '#0b1f3a',
  navyLight: '#1d3762',
  gold: '#f2b632',
  grassA: '#3d9a48',
  grassB: '#4aab55',
  concrete: '#a3abbe',
  concreteDark: '#5b6680',
  aisle: '#d3d9e4',
  fog: '#4b3d63',
};

// מגרש בגודל תקני, עם שוליים של דשא מסביב
export const PITCH = { length: 105, width: 68, margin: 6 };

// המרחק בין קו המגרש לשורה הראשונה ביציע
export const STAND_GAP = 7;

// כל שורה ביציע: עומק, כמה היא גבוהה מהקודמת, וגובה השורה הראשונה
export const ROW = { depth: 0.9, rise: 0.42, base: 1.2 };

// רוחב כיסא ורוחב מעבר מדרגות בין גושי כיסאות
export const SEAT = { spacing: 0.75, aisle: 1.2 };

const sideZ = PITCH.width / 2 + STAND_GAP;
const endX = PITCH.length / 2 + STAND_GAP;

// ארבעת היציעים. כל יציע נבנה במערכת צירים מקומית שבה
// x = לאורך היציע, z = הרחק מהמגרש, ואז מסובב למקומו.
export const STANDS = [
  {
    id: 'north',
    name: 'יציע צפון',
    rows: 18,
    blocks: 6,
    seatsPerBlock: 20,
    length: 104,
    x: 0,
    z: -sideZ,
    rotationY: Math.PI,
    roof: true,
    sign: true,
  },
  {
    id: 'south',
    name: 'יציע דרום',
    rows: 18,
    blocks: 6,
    seatsPerBlock: 20,
    length: 104,
    x: 0,
    z: sideZ,
    rotationY: 0,
  },
  {
    id: 'east',
    name: 'יציע מזרח',
    rows: 14,
    blocks: 4,
    seatsPerBlock: 18,
    length: 66,
    x: endX,
    z: 0,
    rotationY: Math.PI / 2,
  },
  {
    id: 'west',
    name: 'יציע מערב',
    rows: 14,
    blocks: 4,
    seatsPerBlock: 18,
    length: 66,
    x: -endX,
    z: 0,
    rotationY: -Math.PI / 2,
    scoreboard: true,
  },
];
