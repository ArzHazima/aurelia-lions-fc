// Shared dimensions and colors for every part of the stadium. All sizes are in meters.

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

// Seat colors (also used by the legend in the UI)
export const SEAT_COLORS = {
  available: '#22c55e',
  taken: '#e5484d',
  hover: '#ffd23f',
};

// Regulation-size pitch with a strip of grass around it
export const PITCH = { length: 105, width: 68, margin: 6 };

// Distance from the touchline to the first row of a stand
export const STAND_GAP = 7;

// Each row: how deep it is, how much higher than the previous row, and the height of row 1
export const ROW = { depth: 1.0, rise: 0.5, base: 1.2 };

// Center-to-center seat spacing, and the width of the stairs between sections
export const SEAT = { spacing: 1.0, aisle: 1.6 };

const sideZ = PITCH.width / 2 + STAND_GAP;
const endX = PITCH.length / 2 + STAND_GAP;

// The four stands. Each stand is built in its own local space where
// x = along the stand and z = away from the pitch, then rotated into place.
// seatsPerBlock × blocks = seats in one row; blocks are lettered A, B, C...
export const STANDS = [
  {
    id: 'north',
    name: 'North Stand',
    rows: 20,
    blocks: 4,
    seatsPerBlock: 22,
    length: 104,
    price: 85,
    x: 0,
    z: -sideZ,
    rotationY: Math.PI,
    roof: true,
    sign: true,
  },
  {
    id: 'south',
    name: 'South Stand',
    rows: 20,
    blocks: 4,
    seatsPerBlock: 22,
    length: 104,
    price: 60,
    x: 0,
    z: sideZ,
    rotationY: 0,
  },
  {
    id: 'east',
    name: 'East Stand',
    rows: 16,
    blocks: 3,
    seatsPerBlock: 16,
    length: 66,
    price: 45,
    x: endX,
    z: 0,
    rotationY: Math.PI / 2,
  },
  {
    id: 'west',
    name: 'West Stand',
    rows: 16,
    blocks: 3,
    seatsPerBlock: 16,
    length: 66,
    price: 45,
    x: -endX,
    z: 0,
    rotationY: -Math.PI / 2,
    scoreboard: true,
  },
];
