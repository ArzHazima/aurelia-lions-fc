// Generates fictional but realistic ticket sales for every match in src/data/matches.json.
// Run with:  npm run seats
//
// Output: src/data/seats/<match-id>.json
//   { matchId, sections: { "101": ["0110x...", ...one string per row, front row first] } }
//   Each character is one seat in layout order: "1" = sold, "0" = free, "x" = not on sale.
//
// Rules (per section, not per random seat):
//  - Home end lower tier: season tickets, sold out except a few returned single seats
//  - Season-ticket block: middle rows of the central lower sections
//  - Away section: filled from the front, as far back as the away demand reaches,
//    with a "not on sale" buffer next to the home fans
//  - Premium centre / VIP: partly filled, bought in pairs or corporate groups
//  - Behind the goals: cheap and busy
//  - Upper tier: the back rows sell last
//  - Seats are bought in groups (1–6), leaving realistic gaps
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { buildLayout, countSeats } from '../src/stadium/bowl/layout.js';
import { HOME_END, AWAY_SECTIONS } from '../src/stadium/config.js';
import { createRandom } from '../src/utils/random.js';

const root = new URL('../', import.meta.url);
const matches = JSON.parse(readFileSync(new URL('src/data/matches.json', root), 'utf8'));
const outDir = new URL('src/data/seats/', root);
mkdirSync(outDir, { recursive: true });

const layout = buildLayout();
const clamp = (v, a = 0.02, b = 0.97) => Math.min(b, Math.max(a, v));
const BUFFER = 4; // seats kept empty between away fans and home fans

// Sections next to the away block (same tier), and which side touches it
const awayNeighbours = new Map();
{
  const upper = layout.sections.filter((s) => s.tierId === 'upper');
  const first = upper.findIndex((s) => AWAY_SECTIONS.includes(s.id));
  const last = upper.findLastIndex((s) => AWAY_SECTIONS.includes(s.id));
  awayNeighbours.set(upper[(first - 1 + upper.length) % upper.length].id, 'end'); // touches with its high-t end
  awayNeighbours.set(upper[(last + 1) % upper.length].id, 'start');
}

// Fills a row with groups of buyers so that roughly `fill` of the seats are sold
function groupRow(n, fill, groups, random) {
  const row = new Array(n).fill('0');
  const meanGroup = groups.reduce((a, b) => a + b, 0) / groups.length;
  const meanGap = 2;
  const p = fill >= 0.98 ? 1 : (fill * meanGap) / (meanGroup * (1 - fill) + fill * meanGap);
  let i = 0;
  while (i < n) {
    if (random() < p) {
      const g = groups[Math.floor(random() * groups.length)];
      for (let j = 0; j < g && i < n; j++) row[i++] = '1';
    } else i += 1 + Math.floor(random() * 3);
  }
  return row;
}

// Sold out, apart from a few returned single seats
function seasonRow(n, random, returns = 0.015) {
  return Array.from({ length: n }, () => (random() < returns ? '0' : '1'));
}

function sectionRows(section, match, random) {
  const D = match.demand;
  const rows = section.rows;
  const last = rows.length - 1;

  return rows.map((seats, r) => {
    const n = seats.length;
    const f = last ? r / last : 0; // 0 = front row, 1 = back row
    let row;

    if (section.category === 'away') {
      const reach = Math.ceil(rows.length * match.awayDemand);
      row = r < reach ? groupRow(n, 0.92, [2, 3, 4, 5, 6], random) : new Array(n).fill('0');
    } else if (section.segId === HOME_END && section.tierId === 'lower') {
      row = seasonRow(n, random);
    } else if (section.category === 'central' && section.tierId === 'lower' && r >= 3 && r <= 11) {
      row = seasonRow(n, random, 0.02);
    } else {
      // [fill, group sizes]; back rows sell last unless demand is very high
      const back = f * (1 - D);
      const rules = {
        premium: [(0.5 + 0.5 * D) * (1 - 0.3 * Math.abs(f - 0.45)), [2, 2, 2, 3, 4]],
        central: [0.55 + 0.45 * D - 0.3 * back, [1, 2, 2, 3, 4]],
        corner: [0.35 + 0.65 * D - 0.5 * back, [1, 2, 2, 3, 4, 5]],
        behind: [0.6 + 0.4 * D - 0.2 * back, [2, 2, 3, 4, 4, 5]],
        vip: [0.4 + 0.45 * D, [4, 6, 8]],
      };
      let [fill, groups] = rules[section.category];
      if (section.segId === HOME_END) fill += 0.25; // home end upper tier is busy too
      row = groupRow(n, clamp(fill), groups, random);
    }

    // Segregation buffer next to the away block
    const side = awayNeighbours.get(section.id);
    if (side === 'end') for (let i = Math.max(0, n - BUFFER); i < n; i++) row[i] = 'x';
    if (side === 'start') for (let i = 0; i < Math.min(BUFFER, n); i++) row[i] = 'x';
    return row.join('');
  });
}

console.log(`Stadium capacity: ${countSeats(layout).toLocaleString('en-US')} seats in ${layout.sections.length} sections`);

matches.forEach((match, i) => {
  const random = createRandom(1000 + i * 97);
  const sections = {};
  let sold = 0;
  let total = 0;
  for (const section of layout.sections) {
    sections[section.id] = sectionRows(section, match, random);
    for (const row of sections[section.id]) {
      total += row.length;
      for (const c of row) if (c !== '0') sold++;
    }
  }
  writeFileSync(new URL(`${match.id}.json`, outDir), JSON.stringify({ matchId: match.id, sections }) + '\n');
  console.log(`${match.id} vs ${match.away}: ${sold}/${total} unavailable (${Math.round((sold / total) * 100)}%)`);
});
