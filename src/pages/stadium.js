// Stadium page: the 3D scene plus the HTML overlay on top of it.
// Three.js is loaded with a dynamic import so the rest of the site stays fast.
import matches from '../data/matches.json';
import { createStadiumUI } from '../stadium/ui.js';
import { CATEGORIES } from '../stadium/config.js';
import { CLUB } from '../club.js';
import { formatMatchDate, formatPrice } from '../utils/format.js';

const seatFiles = import.meta.glob('../data/seats/*.json');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const isTouch = window.matchMedia('(pointer: coarse)').matches;

const HINTS = {
  overview: isTouch
    ? 'Tap a section to zoom in · Pinch to zoom'
    : 'Hover a section for prices · Click to zoom in · Drag to rotate',
  section: isTouch ? 'Tap a green seat to see the view from it' : 'Hover a seat · Click a green seat to see the view',
};

export function render(root, { matchId }) {
  const match = matches.find((m) => m.id === matchId);
  const loadSeats = seatFiles[`../data/seats/${matchId}.json`];

  if (!match || !loadSeats) {
    root.innerHTML = `
      <main class="temp-home">
        <h1>Match not found</h1>
        <p>We couldn't find that match.</p>
        <a class="btn btn-gold" href="#/">Back to home</a>
      </main>`;
    return;
  }

  const priceList = Object.values(CATEGORIES)
    .sort((a, b) => b.price - a.price)
    .map((c) => `<li><span>${c.label}</span><strong>${formatPrice(c.price)}</strong></li>`)
    .join('');

  root.innerHTML = `
    <section class="stadium-page">
      <div class="stadium-canvas"></div>

      <header class="stadium-topbar">
        <a class="glass-btn" href="#/matches">← Matches</a>
        <img class="stadium-crest" src="${CLUB.crest}" alt="${CLUB.name}" width="38" height="52" />
        <div class="stadium-title">
          <span class="eyebrow">${CLUB.stadium} · ${formatMatchDate(match)}</span>
          <h1>${match.home} <em>vs</em> ${match.away}</h1>
        </div>
        <div class="stadium-legend" aria-label="Seat legend">
          <span><i class="legend-dot is-free"></i>Available</span>
          <span><i class="legend-dot is-taken"></i>Taken</span>
          <span><i class="legend-dot is-blocked"></i>Not on sale</span>
          <span class="legend-count"></span>
          <details class="price-list">
            <summary>Prices</summary>
            <ul>${priceList}</ul>
          </details>
        </div>
      </header>

      <div class="stadium-loading" role="status">
        <img class="stadium-loading__crest" src="${CLUB.crest}" alt="" width="120" height="164" />
        <div class="spinner"></div>
        <p>Building ${CLUB.stadium}…</p>
      </div>

      <button class="glass-btn skip-intro" type="button" hidden>Skip intro</button>
      <p class="stadium-hint" hidden></p>
    </section>
  `;

  const $ = (sel) => root.querySelector(sel);
  const page = $('.stadium-page');
  const hint = $('.stadium-hint');
  let stadium = null;
  let disposed = false;

  const updateCount = () => {
    if (!stadium) return;
    $('.legend-count').textContent =
      `${stadium.availableCount().toLocaleString('en-US')} of ${stadium.totalCount().toLocaleString('en-US')} free`;
  };

  const ui = createStadiumUI(page, {
    match,
    onAllSections: () => stadium?.backToOverview(),
    onBack: () => stadium?.backFromSeat(),
    onConfirm: (seat) => {
      stadium?.markTaken(seat);
      updateCount();
    },
    onDone: () => stadium?.backFromSeat(),
  });

  function onModeChange(mode, context) {
    ui.showTooltip(null);
    hint.hidden = !HINTS[mode];
    if (HINTS[mode]) hint.textContent = HINTS[mode];
    if (mode === 'section') {
      const stats = context.seats.reduce((n, s) => n + (s.status === 'free' ? 1 : 0), 0);
      ui.showSectionBar(context, { free: stats });
    } else ui.hideSectionBar();
    if (mode === 'seat') ui.showSeatPanel(context);
    else ui.hideSeatPanel();
  }

  (async () => {
    try {
      // Wait for the font so the signs inside the stadium are drawn with it
      await Promise.race([document.fonts?.load('800 48px Rubik'), wait(1500)]);
      const [{ createStadium }, seatModule] = await Promise.all([import('../stadium/index.js'), loadSeats()]);
      if (disposed) return;

      stadium = createStadium($('.stadium-canvas'), {
        match,
        occupancy: seatModule.default,
        onHover: (info, x, y) => ui.showTooltip(info, x, y),
        onModeChange,
      });
      updateCount();
      $('.stadium-loading').classList.add('is-done');
      $('.skip-intro').hidden = false;

      await stadium.playIntro();
      if (disposed) return;
      $('.skip-intro').hidden = true;
    } catch (err) {
      console.error(err);
      $('.stadium-loading p').textContent = "Couldn't load the stadium. Your browser may not support WebGL.";
      $('.spinner')?.remove();
    }
  })();

  $('.skip-intro').addEventListener('click', () => stadium?.skipIntro());

  // Escape: close the dialog → leave the seat → leave the section
  const onKey = (e) => {
    if (e.key !== 'Escape' || !stadium) return;
    if (ui.isModalOpen()) ui.closeModal();
    else if (stadium.mode === 'seat') stadium.backFromSeat();
    else if (stadium.mode === 'section') stadium.backToOverview();
  };
  window.addEventListener('keydown', onKey);

  return () => {
    disposed = true;
    window.removeEventListener('keydown', onKey);
    stadium?.dispose();
  };
}
