// Stadium page: the 3D scene plus the HTML overlay on top of it.
// Three.js is loaded with a dynamic import so the rest of the site stays fast.
import matches from '../data/matches.json';
import { createStadiumUI } from '../stadium/ui.js';
import { formatMatchDate } from '../utils/format.js';

const seatFiles = import.meta.glob('../data/seats/*.json');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const isTouch = window.matchMedia('(pointer: coarse)').matches;

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

  root.innerHTML = `
    <section class="stadium-page">
      <div class="stadium-canvas"></div>

      <header class="stadium-topbar">
        <a class="glass-btn" href="#/">← Back</a>
        <div class="stadium-title">
          <span class="eyebrow">Flame Arena · ${formatMatchDate(match)}</span>
          <h1>${match.home} <em>vs</em> ${match.away}</h1>
        </div>
        <div class="stadium-legend" aria-label="Seat legend">
          <span><i class="legend-dot is-free"></i>Available</span>
          <span><i class="legend-dot is-taken"></i>Taken</span>
          <span class="legend-count"></span>
        </div>
      </header>

      <div class="stadium-loading" role="status">
        <div class="spinner"></div>
        <p>Building the stadium…</p>
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

  const showHint = () => {
    hint.textContent = isTouch
      ? 'Tap a green seat to see the view · Pinch to zoom'
      : 'Hover a seat for details · Click a green seat to see the view · Scroll to zoom';
    hint.hidden = false;
  };

  const ui = createStadiumUI(page, {
    match,
    onBack: () => stadium?.flyBack(),
    onConfirm: (seat) => {
      stadium?.markTaken(seat);
      updateCount();
    },
    onDone: () => stadium?.flyBack(),
  });

  (async () => {
    try {
      // Wait for the font so the signs inside the stadium are drawn with it
      await Promise.race([document.fonts?.load('800 48px Rubik'), wait(1500)]);
      const [{ createStadium }, seatModule] = await Promise.all([import('../stadium/index.js'), loadSeats()]);
      if (disposed) return;

      stadium = createStadium($('.stadium-canvas'), {
        match,
        occupancy: seatModule.default,
        onHover: (seat, x, y) => ui.showTooltip(seat, x, y),
        onSeatSelected: () => {
          ui.showTooltip(null);
          hint.hidden = true;
        },
        onSeatView: (seat) => ui.showSeatPanel(seat),
        onOverview: showHint,
      });
      updateCount();
      $('.stadium-loading').classList.add('is-done');
      $('.skip-intro').hidden = false;

      await stadium.playIntro();
      if (disposed) return;
      $('.skip-intro').hidden = true;
      showHint();
    } catch (err) {
      console.error(err);
      $('.stadium-loading p').textContent = "Couldn't load the stadium. Your browser may not support WebGL.";
      $('.spinner')?.remove();
    }
  })();

  $('.skip-intro').addEventListener('click', () => stadium?.skipIntro());

  // Escape closes the dialog, or leaves the seat view
  const onKey = (e) => {
    if (e.key !== 'Escape') return;
    if (ui.isModalOpen()) ui.closeModal();
    else if (stadium?.mode === 'seat') {
      ui.hideSeatPanel();
      stadium.flyBack();
    }
  };
  window.addEventListener('keydown', onKey);

  return () => {
    disposed = true;
    window.removeEventListener('keydown', onKey);
    stadium?.dispose();
  };
}
