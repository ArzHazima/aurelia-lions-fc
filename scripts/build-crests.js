// Builds the Aurelia Lions FC crest (public/crest.svg): gold lion head on a royal-blue
// shield, crown, name ribbon and founding year.
// Run with:  node scripts/build-crests.js
// The shapes are generated in code so repeated details (mane spikes, stripes,
// stars) stay perfectly even and symmetric.
import { writeFileSync } from 'node:fs';

const C = {
  blue: '#1E4FD8',
  blueLight: '#3A68E8',
  blueDark: '#163CA8',
  gold: '#F5B800',
  goldLight: '#FFD54A',
  goldPale: '#FFE58A',
  goldDark: '#C99200',
  white: '#FFFFFF',
  navy: '#0B1E4A',
};
const FONT = "font-family=\"'Arial Black', Arial, Helvetica, sans-serif\" font-weight=\"900\"";
const r2 = (n) => Math.round(n * 100) / 100;
const pts = (list) => list.map(([x, y]) => `${r2(x)},${r2(y)}`).join(' ');

function star(cx, cy, outer, inner, n = 5, rot = -90) {
  const out = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return `<polygon points="${pts(out)}"/>`;
}

// ---------- Lion head, facing front (designed around 0,0, roughly 110 wide) ----------
function lionFront() {
  const mane = [];
  const n = 18;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 41 : 56 + (i % 4 === 0 ? 4 : 0);
    mane.push([Math.cos(a) * r, Math.sin(a) * r * 1.06 + 4]);
  }
  const strands = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2 + Math.PI / n;
    strands.push(
      `<line x1="${r2(Math.cos(a) * 36)}" y1="${r2(Math.sin(a) * 38 + 4)}" x2="${r2(Math.cos(a) * 48)}" y2="${r2(Math.sin(a) * 51 + 4)}"/>`,
    );
  }
  return `
  <g stroke-linejoin="round">
    <polygon points="${pts(mane)}" fill="${C.gold}" stroke="${C.navy}" stroke-width="2.5"/>
    <g stroke="${C.goldDark}" stroke-width="2.2" stroke-linecap="round">${strands.join('')}</g>
    <ellipse cx="0" cy="4" rx="38" ry="40" fill="${C.goldDark}"/>
    <!-- ears -->
    <circle cx="-25" cy="-26" r="10" fill="${C.gold}" stroke="${C.navy}" stroke-width="2"/>
    <circle cx="25" cy="-26" r="10" fill="${C.gold}" stroke="${C.navy}" stroke-width="2"/>
    <circle cx="-25" cy="-25" r="4.5" fill="${C.navy}"/>
    <circle cx="25" cy="-25" r="4.5" fill="${C.navy}"/>
    <!-- face -->
    <path d="M0 -30 C20 -30 31 -18 30 0 C29 16 19 32 0 38 C-19 32 -29 16 -30 0 C-31 -18 -20 -30 0 -30 Z"
      fill="${C.goldLight}" stroke="${C.navy}" stroke-width="2.5"/>
    <!-- brow and nose bridge -->
    <path d="M-20 -8 Q-10 -14 -3 -6 L0 14 L3 -6 Q10 -14 20 -8" fill="none" stroke="${C.goldDark}" stroke-width="2.5"/>
    <path d="M-22 -10 L-6 -6" stroke="${C.navy}" stroke-width="3" stroke-linecap="round"/>
    <path d="M22 -10 L6 -6" stroke="${C.navy}" stroke-width="3" stroke-linecap="round"/>
    <!-- eyes -->
    <path d="M-21 -1 Q-14 -8 -6 -1 Q-14 3 -21 -1 Z" fill="${C.navy}"/>
    <path d="M21 -1 Q14 -8 6 -1 Q14 3 21 -1 Z" fill="${C.navy}"/>
    <circle cx="-12" cy="-2" r="1.6" fill="${C.white}"/>
    <circle cx="12" cy="-2" r="1.6" fill="${C.white}"/>
    <!-- muzzle, nose, mouth -->
    <ellipse cx="-7" cy="22" rx="9" ry="7.5" fill="${C.goldPale}"/>
    <ellipse cx="7" cy="22" rx="9" ry="7.5" fill="${C.goldPale}"/>
    <path d="M-8 12 L8 12 L0 21 Z" fill="${C.navy}" stroke="${C.navy}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M0 21 L0 26 M-9 30 L-3 28 L0 26 L3 28 L9 30" fill="none" stroke="${C.navy}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    <g fill="${C.goldDark}">
      <circle cx="-11" cy="21" r="1.2"/><circle cx="-14" cy="25" r="1.2"/><circle cx="-8" cy="25" r="1.2"/>
      <circle cx="11" cy="21" r="1.2"/><circle cx="14" cy="25" r="1.2"/><circle cx="8" cy="25" r="1.2"/>
    </g>
  </g>`;
}

// ---------- Crown (centered at x=0, base at y=0) ----------
function crown(w = 64, h = 34) {
  const x = w / 2;
  return `
  <g stroke="${C.navy}" stroke-width="2.2" stroke-linejoin="round">
    <path d="M${-x} 0 L${-x - 4} ${-h * 0.72} L${-x * 0.5} ${-h * 0.35} L0 ${-h} L${x * 0.5} ${-h * 0.35} L${x + 4} ${-h * 0.72} L${x} 0 Z" fill="${C.gold}"/>
    <rect x="${-x - 2}" y="-2" width="${w + 4}" height="10" rx="2" fill="${C.goldLight}"/>
    <circle cx="${-x - 4}" cy="${-h * 0.72 - 3}" r="3.5" fill="${C.white}"/>
    <circle cx="0" cy="${-h - 3.5}" r="4" fill="${C.white}"/>
    <circle cx="${x + 4}" cy="${-h * 0.72 - 3}" r="3.5" fill="${C.white}"/>
  </g>
  <g fill="${C.blue}"><circle cx="${-x * 0.55}" cy="3" r="2.6"/><circle cx="0" cy="3" r="3"/><circle cx="${x * 0.55}" cy="3" r="2.6"/></g>`;
}

const svg = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">
  <title>${title}</title>${body}
</svg>
`;

// ================= A: Classic shield =================
function crestA() {
  const shield = 'M110 52 L196 74 V156 C196 212 158 246 110 266 C62 246 24 212 24 156 V74 Z';
  const stripes = [];
  for (let i = 0; i < 9; i++) stripes.push(`<rect x="${24 + i * 20}" y="52" width="10" height="216" fill="${C.blueLight}" opacity="0.35"/>`);
  return svg(
    220,
    300,
    `
  <defs>
    <clipPath id="a-inner"><path d="${shield}" transform="translate(110 160) scale(0.88) translate(-110 -160)"/></clipPath>
    <path id="a-ribbon" d="M20 250 Q110 272 200 250"/>
  </defs>
  <!-- shield: gold rim, navy line, blue field with stripes -->
  <path d="${shield}" fill="${C.gold}" stroke="${C.navy}" stroke-width="3"/>
  <path d="${shield}" transform="translate(110 160) scale(0.93) translate(-110 -160)" fill="${C.navy}"/>
  <path d="${shield}" transform="translate(110 160) scale(0.88) translate(-110 -160)" fill="${C.blue}"/>
  <g clip-path="url(#a-inner)">${stripes.join('')}</g>
  <!-- EST / 1924 either side of the lion -->
  <g ${FONT} font-size="13" fill="${C.white}" text-anchor="middle" letter-spacing="1">
    <text x="50" y="104">EST.</text><text x="170" y="104">1924</text>
  </g>
  <g fill="${C.gold}">${star(50, 120, 6, 2.6)}${star(170, 120, 6, 2.6)}</g>
  <g transform="translate(110 160) scale(1.12)">${lionFront()}</g>
  <!-- crown above the shield -->
  <g transform="translate(110 56)">${crown(70, 38)}</g>
  <!-- ribbon banner with the club name -->
  <g stroke="${C.navy}" stroke-width="2.5" stroke-linejoin="round">
    <path d="M14 238 L34 236 L34 262 L14 264 L22 251 Z" fill="${C.goldDark}"/>
    <path d="M206 238 L186 236 L186 262 L206 264 L198 251 Z" fill="${C.goldDark}"/>
    <path d="M28 230 Q110 252 192 230 L192 258 Q110 280 28 258 Z" fill="${C.gold}"/>
  </g>
  <text ${FONT} font-size="13.5" fill="${C.navy}" text-anchor="middle" letter-spacing="0.6">
    <textPath href="#a-ribbon" startOffset="50%">AURELIA LIONS FC</textPath>
  </text>`,
    'Aurelia Lions FC crest',
  );
}

const out = new URL('../public/crest.svg', import.meta.url);
writeFileSync(out, crestA());
console.log('Wrote public/crest.svg');
