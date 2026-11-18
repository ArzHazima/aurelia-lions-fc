// Shared dimensions, colors and pricing for the whole stadium. All sizes are in meters.
// This file has no Three.js import, so the seat-data script (Node) can use it too.

export const COLORS = {
  blue: '#1E4FD8', // club primary
  blueDark: '#163CA8',
  gold: '#F5B800', // club accent
  navy: '#0B1E4A', // small accents only
  grassA: '#3d9a48',
  grassB: '#4aab55',
  concrete: '#a3abbe',
  concreteDark: '#5b6680',
  aisle: '#d3d9e4',
  fog: '#4b3d63',
};

export const SEAT_COLORS = {
  free: '#22c55e',
  taken: '#e5484d',
  blocked: '#6b7385',
  hover: '#ffd23f',
};

// Regulation pitch with a strip of grass around it
export const PITCH = { length: 105, width: 68, margin: 7 };

// The front of the lower tier follows a rounded rectangle around the pitch.
// Every row further back is the same shape pushed outward, so the corners stay filled.
export const BOWL = { halfX: 59.5, halfZ: 42, radius: 12 };

// Seat spacing along a row, and the width of the stairs between sections
export const SEAT = { spacing: 0.8, aisle: 1.2 };

// Tiers, from the front of the bowl backwards.
//   start = distance from the bowl front line, depth = row depth,
//   rise = height step per row, base = floor height of the first row
export const TIERS = {
  lower: { id: 'lower', label: 'Lower tier', start: 0, rows: 24, depth: 0.85, rise: 0.42, base: 1.2 },
  vip: { id: 'vip', label: 'VIP level', start: 20.4, rows: 2, depth: 0.95, rise: 0.3, base: 11.6 },
  upper: { id: 'upper', label: 'Upper tier', start: 22.4, rows: 30, depth: 0.85, rise: 0.6, base: 17.2 },
};

// Glass hospitality boxes sit between the tiers, under the front of the upper tier
export const BOX = { front: 22.4, back: 26.4, floor: 12.2, ceiling: 15.8 };

// Back of the upper tier (outer wall) and its height
export const UPPER_BACK = TIERS.upper.start + TIERS.upper.rows * TIERS.upper.depth; // 47.9
export const UPPER_TOP = TIERS.upper.base + (TIERS.upper.rows - 1) * TIERS.upper.rise + 3; // wall top

// Roof ring: from `inner` (open above the pitch) to `outer`, sloping slightly outward
export const ROOF = { inner: 14, outer: 50, innerY: 46, outerY: 41, thickness: 0.7 };

// Players' tunnel: removes the first rows of seats around the halfway line of the main stand
export const TUNNEL = { segment: 'north', halfWidth: 2.4, rows: 5 };

// Ticket categories and prices
export const CATEGORIES = {
  vip: { label: 'VIP box', price: 450 },
  premium: { label: 'Premium centre', price: 140 },
  central: { label: 'Central', price: 95 },
  corner: { label: 'Corner & upper side', price: 70 },
  away: { label: 'Away section', price: 55 },
  behind: { label: 'Behind the goal', price: 45 },
};

// Away supporters get the upper tier of the north-east corner
export const AWAY_SECTIONS = ['207', '208', '209'];

// The home end (season-ticket holders, loudest fans)
export const HOME_END = 'west';
