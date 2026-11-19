// Small SVG flags. (Windows does not display flag emoji, so we draw them.)
// Each flag is drawn in a 30×20 box.

const H = (...colors) => ({ kind: 'h', colors }); // horizontal stripes
const V = (...colors) => ({ kind: 'v', colors }); // vertical stripes

const FLAGS = {
  france: { name: 'France', ...V('#0055A4', '#FFFFFF', '#EF4135') },
  italy: { name: 'Italy', ...V('#009246', '#FFFFFF', '#CE2B37') },
  ireland: { name: 'Ireland', ...V('#169B62', '#FFFFFF', '#FF883E') },
  belgium: { name: 'Belgium', ...V('#000000', '#FDDA24', '#EF3340') },
  nigeria: { name: 'Nigeria', ...V('#008751', '#FFFFFF', '#008751') },
  germany: { name: 'Germany', ...H('#000000', '#DD0000', '#FFCE00') },
  netherlands: { name: 'Netherlands', ...H('#AE1C28', '#FFFFFF', '#21468B') },
  austria: { name: 'Austria', ...H('#ED2939', '#FFFFFF', '#ED2939') },
  poland: { name: 'Poland', ...H('#FFFFFF', '#DC143C') },
  colombia: { name: 'Colombia', ...H('#FCD116', '#FCD116', '#003893', '#CE1126') },
  spain: { name: 'Spain', ...H('#AA151B', '#F1BF00', '#F1BF00', '#AA151B') },
  sweden: { name: 'Sweden', kind: 'cross', bg: '#006AA7', cross: '#FECC02' },
  norway: { name: 'Norway', kind: 'cross', bg: '#BA0C2F', cross: '#FFFFFF', inner: '#00205B' },
  japan: { name: 'Japan', kind: 'japan' },
  morocco: { name: 'Morocco', kind: 'morocco' },
};

function shapes(f) {
  if (f.kind === 'h') {
    const h = 20 / f.colors.length;
    return f.colors.map((c, i) => `<rect y="${i * h}" width="30" height="${h + 0.1}" fill="${c}"/>`).join('');
  }
  if (f.kind === 'v') {
    const w = 30 / f.colors.length;
    return f.colors.map((c, i) => `<rect x="${i * w}" width="${w + 0.1}" height="20" fill="${c}"/>`).join('');
  }
  if (f.kind === 'cross') {
    const inner = f.inner ? `<rect x="10" width="2" height="20" fill="${f.inner}"/><rect y="9" width="30" height="2" fill="${f.inner}"/>` : '';
    return `<rect width="30" height="20" fill="${f.bg}"/><rect x="9" width="4" height="20" fill="${f.cross}"/><rect y="8" width="30" height="4" fill="${f.cross}"/>${inner}`;
  }
  if (f.kind === 'japan') return '<rect width="30" height="20" fill="#FFFFFF"/><circle cx="15" cy="10" r="6" fill="#BC002D"/>';
  // Morocco: red field with a green five-pointed star outline
  return '<rect width="30" height="20" fill="#C1272D"/><path d="M15 4.5 L16.6 9.3 L21.6 9.3 L17.5 12.2 L19.1 17 L15 14 L10.9 17 L12.5 12.2 L8.4 9.3 L13.4 9.3 Z" fill="none" stroke="#006233" stroke-width="1.1"/>';
}

export function flag(code) {
  const f = FLAGS[code];
  if (!f) return '';
  return `<svg class="flag" viewBox="0 0 30 20" width="21" height="14" role="img" aria-label="${f.name}">${shapes(f)}<rect width="30" height="20" fill="none" stroke="rgba(0,0,0,.15)"/></svg>`;
}

export const countryName = (code) => FLAGS[code]?.name ?? code;
