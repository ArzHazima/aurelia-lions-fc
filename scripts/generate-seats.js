// Generates fictional seat-occupancy data for every match in src/data/matches.json.
// Run with:  npm run seats
//
// Output: src/data/seats/<match-id>.json
// Each stand has one string per row (front row first); each character is one seat
// from left to right: "1" = taken (red), "0" = available (green).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { STANDS } from '../src/stadium/config.js';
import { createRandom } from '../src/utils/random.js';

const root = new URL('../', import.meta.url);
const matches = JSON.parse(readFileSync(new URL('src/data/matches.json', root), 'utf8'));
const outDir = new URL('src/data/seats/', root);
mkdirSync(outDir, { recursive: true });

// How full each match is (cycled if there are more matches)
const FULLNESS = [0.62, 0.45, 0.8, 0.3];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

matches.forEach((match, i) => {
  const random = createRandom(1000 + i * 97);
  const level = FULLNESS[i % FULLNESS.length];
  const stands = {};
  let total = 0;
  let taken = 0;

  for (const stand of STANDS) {
    const perRow = stand.blocks * stand.seatsPerBlock;
    const rows = [];
    for (let r = 0; r < stand.rows; r++) {
      let row = '';
      let prev = false;
      for (let s = 0; s < perRow; s++) {
        // Seats near the middle, near the front and in the main stand sell first
        const centrality = 1 - Math.abs(s / (perRow - 1) - 0.5) * 2;
        const p = clamp(
          level + 0.22 * (centrality - 0.5) - 0.14 * (r / (stand.rows - 1)) + (stand.id === 'north' ? 0.06 : 0),
          0.03,
          0.97,
        );
        // Taken seats come in groups (friends and families sit together)
        const isTaken = prev ? random() < Math.min(0.97, p + 0.22) : random() < p * 0.8;
        row += isTaken ? '1' : '0';
        prev = isTaken;
        total++;
        if (isTaken) taken++;
      }
      rows.push(row);
    }
    stands[stand.id] = rows;
  }

  const data = { matchId: match.id, stands };
  writeFileSync(new URL(`${match.id}.json`, outDir), JSON.stringify(data, null, 2) + '\n');
  console.log(`${match.id}: ${taken}/${total} seats taken (${Math.round((taken / total) * 100)}%)`);
});
