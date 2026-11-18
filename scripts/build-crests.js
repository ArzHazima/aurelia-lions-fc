// Builds the three crest options as SVG files in public/crests/.
// Run with:  node scripts/build-crests.js
// The shapes are generated in code so repeated details (mane spikes, laurel
// leaves, stripes, stars) stay perfectly even and symmetric.
import { writeFileSync, mkdirSync } from 'node:fs';

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

// ---------- Lion head in profile, bold flat shapes (faces right) ----------
function lionProfile() {
  // Full jagged mane behind the head, so it reads as a lion (not a fox or wolf)
  const mane = [];
  const n = 15;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 ? 40 : 60 + (i % 4 === 0 ? 5 : 0);
    mane.push([-10 + Math.cos(a) * r, 2 + Math.sin(a) * r]);
  }
  const strands = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.PI / n;
    strands.push(`M${r2(-10 + Math.cos(a) * 34)} ${r2(2 + Math.sin(a) * 34)} L${r2(-10 + Math.cos(a) * 50)} ${r2(2 + Math.sin(a) * 50)}`);
  }
  return `
  <g stroke-linejoin="round">
    <polygon points="${pts(mane)}" fill="${C.gold}" stroke="${C.navy}" stroke-width="2.5"/>
    <path d="${strands.join(' ')}" stroke="${C.goldDark}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="-10" cy="2" r="36" fill="${C.goldDark}"/>
    <!-- ear -->
    <path d="M-8 -34 Q-4 -50 10 -38 Z" fill="${C.gold}" stroke="${C.navy}" stroke-width="2.5"/>
    <!-- head: round forehead, short broad muzzle, strong jaw -->
    <path d="M-16 -28 C0 -42 26 -40 38 -26 L50 -20 C58 -17 61 -9 57 -2 L55 6 C51 11 45 11 40 11 L36 19
             C30 27 14 29 2 25 C-12 19 -20 5 -20 -9 C-20 -19 -19 -24 -16 -28 Z"
      fill="${C.goldLight}" stroke="${C.navy}" stroke-width="2.5"/>
    <!-- shading planes -->
    <path d="M38 -26 L50 -20 L41 -12 Z" fill="${C.goldPale}"/>
    <path d="M2 25 C14 29 30 27 36 19 L40 11 L26 12 Z" fill="${C.gold}"/>
    <!-- brow, eye, nose, mouth, whiskers -->
    <path d="M18 -30 L36 -26" stroke="${C.navy}" stroke-width="3" stroke-linecap="round"/>
    <path d="M22 -24 L35 -22 L26 -17 Z" fill="${C.navy}"/>
    <path d="M51 -21 L60 -15 L57 -7 L49 -11 Z" fill="${C.navy}"/>
    <path d="M55 5 L40 7 L34 12" fill="none" stroke="${C.navy}" stroke-width="2.5" stroke-linecap="round"/>
    <g fill="${C.goldDark}"><circle cx="44" cy="-3" r="1.4"/><circle cx="48" cy="1" r="1.4"/><circle cx="41" cy="2" r="1.4"/></g>
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
    'Aurelia Lions FC crest – classic',
  );
}

// ================= B: Modern angular shield =================
function crestB() {
  const shield = 'M110 34 L200 58 L190 176 L110 270 L30 176 L20 58 Z';
  const s = (k) => `translate(110 150) scale(${k}) translate(-110 -150)`;
  return svg(
    220,
    290,
    `
  <defs>
    <path id="b-arc" d="M32 108 Q110 58 188 108"/>
    <linearGradient id="b-field" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${C.blueLight}"/><stop offset="1" stop-color="${C.blueDark}"/>
    </linearGradient>
  </defs>
  <!-- double gold outline -->
  <path d="${shield}" fill="${C.gold}" stroke="${C.navy}" stroke-width="3"/>
  <path d="${shield}" transform="${s(0.95)}" fill="${C.navy}"/>
  <path d="${shield}" transform="${s(0.91)}" fill="${C.gold}"/>
  <path d="${shield}" transform="${s(0.87)}" fill="url(#b-field)"/>
  <!-- diagonal split for a modern look -->
  <path d="M110 46 L190 66 L182 170 Z" fill="${C.white}" opacity="0.07"/>
  <!-- club name on an arc -->
  <text ${FONT} font-size="14" fill="${C.gold}" text-anchor="middle" letter-spacing="1.5">
    <textPath href="#b-arc" startOffset="50%">AURELIA LIONS</textPath>
  </text>
  <g transform="translate(106 142) scale(0.78)">${lionProfile()}</g>
  <!-- bottom: FC + year -->
  <g ${FONT} text-anchor="middle">
    <text x="110" y="211" font-size="15" fill="${C.white}" letter-spacing="3">FC</text>
    <text x="110" y="225" font-size="7" fill="${C.gold}" letter-spacing="0.6">EST. 1924</text>
  </g>
  <path d="M84 205 H96 M124 205 H136" stroke="${C.gold}" stroke-width="2"/>
  <!-- slim crown sitting on the top point -->
  <g transform="translate(110 30) scale(0.8)">${crown(60, 30)}</g>`,
    'Aurelia Lions FC crest – modern',
  );
}

// ================= C: Roundel with laurels =================
function crestC() {
  const cx = 130;
  const cy = 150;
  // Two laurel branches climbing up both sides of the inner ring.
  // phi = angle from the bottom of the circle; each leaf follows the ring's tangent
  // and leans outward a little, like a real laurel.
  const leaves = [];
  const stems = [];
  const R = 66;
  for (const side of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const phi = ((22 + i * 14) * Math.PI) / 180;
      const px = cx + side * R * Math.sin(phi);
      const py = cy + R * Math.cos(phi);
      const radial = (Math.atan2(Math.cos(phi), side * Math.sin(phi)) * 180) / Math.PI;
      for (const lean of [-1, 1]) {
        const ox = px + Math.cos((radial * Math.PI) / 180) * lean * 6;
        const oy = py + Math.sin((radial * Math.PI) / 180) * lean * 6;
        leaves.push(`<ellipse cx="${r2(ox)}" cy="${r2(oy)}" rx="3.6" ry="8.5" transform="rotate(${r2(radial + lean * side * 28)} ${r2(ox)} ${r2(oy)})"/>`);
      }
    }
    const a0 = (18 * Math.PI) / 180;
    const a1 = (124 * Math.PI) / 180;
    stems.push(
      `<path d="M${r2(cx + side * R * Math.sin(a0))} ${r2(cy + R * Math.cos(a0))} A${R} ${R} 0 0 ${side > 0 ? 0 : 1} ${r2(cx + side * R * Math.sin(a1))} ${r2(cy + R * Math.cos(a1))}"/>`,
    );
  }
  const shield = 'M130 92 L176 104 V146 C176 176 156 194 130 204 C104 194 84 176 84 146 V104 Z';
  return svg(
    260,
    290,
    `
  <defs>
    <path id="c-top" d="M${cx - 92} ${cy} A92 92 0 0 1 ${cx + 92} ${cy}"/>
    <path id="c-bottom" d="M${cx - 92} ${cy} A92 92 0 0 0 ${cx + 92} ${cy}"/>
  </defs>
  <!-- rings -->
  <circle cx="${cx}" cy="${cy}" r="118" fill="${C.gold}" stroke="${C.navy}" stroke-width="3"/>
  <circle cx="${cx}" cy="${cy}" r="110" fill="${C.navy}"/>
  <circle cx="${cx}" cy="${cy}" r="106" fill="${C.blue}"/>
  <circle cx="${cx}" cy="${cy}" r="78" fill="${C.blueDark}" stroke="${C.gold}" stroke-width="3"/>
  <!-- ring text -->
  <g ${FONT} fill="${C.white}" text-anchor="middle">
    <text font-size="19" letter-spacing="3"><textPath href="#c-top" startOffset="50%">AURELIA LIONS FC</textPath></text>
    <text font-size="14" letter-spacing="4" dy="12"><textPath href="#c-bottom" startOffset="50%">EST. 1924</textPath></text>
  </g>
  <g fill="${C.gold}">${star(cx - 100, cy + 2, 6, 2.6)}${star(cx + 100, cy + 2, 6, 2.6)}</g>
  <!-- laurels -->
  <g fill="none" stroke="${C.goldDark}" stroke-width="2.5">${stems.join('')}</g>
  <g fill="${C.gold}" stroke="${C.goldDark}" stroke-width="1">${leaves.join('')}</g>
  <!-- inner shield with the lion -->
  <path d="${shield}" fill="${C.gold}" stroke="${C.navy}" stroke-width="2.5"/>
  <path d="${shield}" transform="translate(130 148) scale(0.9) translate(-130 -148)" fill="${C.blue}"/>
  <g transform="translate(130 152) scale(0.72)">${lionFront()}</g>
  <!-- crown breaking out of the top of the roundel -->
  <g transform="translate(${cx} ${cy - 119}) scale(0.82)">${crown(64, 36)}</g>`,
    'Aurelia Lions FC crest – roundel',
  );
}

const dir = new URL('../public/crests/', import.meta.url);
mkdirSync(dir, { recursive: true });
writeFileSync(new URL('crest-a.svg', dir), crestA());
writeFileSync(new URL('crest-b.svg', dir), crestB());
writeFileSync(new URL('crest-c.svg', dir), crestC());
console.log('Wrote public/crests/crest-a.svg, crest-b.svg, crest-c.svg');
