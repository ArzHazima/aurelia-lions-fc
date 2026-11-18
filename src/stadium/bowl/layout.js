// Builds the full seat plan: sections → rows → seats, with positions in meters.
// Used by the browser (to place the 3D chairs) and by scripts/generate-seats.js
// (to create matching sales data), so both always agree on every seat.
import { SEGMENTS, pointAt, segmentLength } from './path.js';
import { TIERS, SEAT, CATEGORIES, AWAY_SECTIONS, TUNNEL } from '../config.js';

function categoryFor(seg, tierId, k, id) {
  if (AWAY_SECTIONS.includes(id)) return 'away';
  if (tierId === 'vip') return 'vip';
  if (seg.id === 'east' || seg.id === 'west') return 'behind';
  if (seg.kind === 'arc') return 'corner';
  const middle = k === 2 || k === 3; // the two sections either side of the halfway line
  if (tierId === 'lower') return middle ? 'premium' : 'central';
  return middle ? 'central' : 'corner';
}

function inTunnel(seg, tierId, row, x) {
  return seg.id === TUNNEL.segment && tierId === 'lower' && row < TUNNEL.rows && Math.abs(x) < TUNNEL.halfWidth;
}

let cached = null;

/**
 * @returns {{ sections: Array<{
 *   id, tierId, tierLabel, segId, areaName, index, t0, t1, category, categoryLabel, price, away,
 *   rows: Array<Array<{ x, y, z, beta, number }>>
 * }> }}
 */
export function buildLayout() {
  if (cached) return cached;
  const sections = [];

  for (const tierId of ['lower', 'vip', 'upper']) {
    const tier = TIERS[tierId];
    let num = 1;
    for (const seg of SEGMENTS) {
      if (tierId === 'vip' && !seg.vip) continue;
      for (let k = 0; k < seg.sections; k++, num++) {
        const id = tierId === 'vip' ? `V${String(num).padStart(2, '0')}` : String((tierId === 'lower' ? 100 : 200) + num);
        const category = categoryFor(seg, tierId, k, id);
        const t0 = k / seg.sections;
        const t1 = (k + 1) / seg.sections;
        const section = {
          id,
          tierId,
          tierLabel: tier.label,
          segId: seg.id,
          areaName: seg.name,
          index: k,
          t0,
          t1,
          category,
          categoryLabel: CATEGORIES[category].label,
          price: CATEGORIES[category].price,
          away: category === 'away',
          rows: [],
        };

        for (let r = 0; r < tier.rows; r++) {
          const dSeat = tier.start + r * tier.depth + tier.depth * 0.5;
          const y = tier.base + r * tier.rise;
          const L = segmentLength(seg, dSeat) * (t1 - t0);
          const n = Math.max(0, Math.floor((L - SEAT.aisle) / SEAT.spacing));
          const margin = (L - n * SEAT.spacing) / 2;
          const seats = [];
          for (let i = 0; i < n; i++) {
            const t = t0 + ((margin + (i + 0.5) * SEAT.spacing) / L) * (t1 - t0);
            const p = pointAt(seg, t, dSeat);
            if (inTunnel(seg, tierId, r, p.x)) continue;
            seats.push({ x: p.x, y, z: p.z, beta: p.beta, number: 0 });
          }
          // Seat numbers run left → right as seen by a fan sitting there (higher t = fan's left)
          seats.forEach((s, i) => (s.number = seats.length - i));
          section.rows.push(seats);
        }
        sections.push(section);
      }
    }
  }

  cached = { sections };
  return cached;
}

export function countSeats(layout = buildLayout()) {
  return layout.sections.reduce((n, s) => n + s.rows.reduce((m, r) => m + r.length, 0), 0);
}
