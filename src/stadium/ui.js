// The HTML layer on top of the 3D scene: tooltip (section or seat), section bar,
// seat panel (seat view) and the booking dialog. No real payment happens anywhere.
import { formatMatchDate, formatPrice } from '../utils/format.js';
import { CLUB } from '../club.js';

const fmt = (n) => n.toLocaleString('en-US');
const sectionTitle = (s) => `${s.areaName} · Section ${s.id}`;
const seatLine = (seat) => `Row ${seat.row} · Seat ${seat.number}`;
const STATUS_TEXT = { taken: 'Taken', blocked: 'Not on sale' };

function bookingRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'AL-';
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

/**
 * @param {HTMLElement} root  element the UI is added to
 * @param {object} opts  { match, onAllSections(), onBack(), onConfirm(seat), onDone() }
 */
export function createStadiumUI(root, { match, onAllSections, onBack, onConfirm, onDone }) {
  const make = (cls) => {
    const el = document.createElement('div');
    el.className = cls;
    el.hidden = true;
    root.append(el);
    return el;
  };
  const tooltip = make('seat-tooltip');
  tooltip.setAttribute('role', 'tooltip');
  const sectionBar = make('section-bar');
  const panel = make('seat-panel');
  const modal = make('booking-modal');
  let currentSeat = null;

  // ---------- Tooltip ----------
  function tooltipHTML(info) {
    if (info.kind === 'section') {
      const s = info.section;
      return `
        <div class="seat-tooltip__stand">Section ${s.id}</div>
        <div class="seat-tooltip__sub">${s.areaName} · ${s.tierLabel}</div>
        <div class="seat-tooltip__price"><span>${s.categoryLabel}</span><strong>${formatPrice(s.price)}</strong></div>
        ${s.away ? `<div class="seat-tooltip__away">Away supporters · ${match.away}</div>` : ''}
        <div class="seat-tooltip__status ${info.free ? 'is-free' : 'is-taken'}">
          ${info.free ? `${fmt(info.free)} of ${fmt(info.total)} seats free` : 'Sold out'}
        </div>
        <div class="seat-tooltip__cta">Click to zoom in</div>`;
    }
    const seat = info.seat;
    const s = seat.section;
    return `
      <div class="seat-tooltip__stand">${s.areaName}</div>
      <dl class="seat-tooltip__grid">
        <div><dt>Section</dt><dd>${s.id}</dd></div>
        <div><dt>Row</dt><dd>${seat.row}</dd></div>
        <div><dt>Seat</dt><dd>${seat.number}</dd></div>
      </dl>
      ${s.away ? `<div class="seat-tooltip__away">Away supporters · ${match.away}</div>` : ''}
      <div class="seat-tooltip__status ${seat.status === 'free' ? 'is-free' : `is-${seat.status}`}">
        ${seat.status === 'free' ? `Available · ${s.categoryLabel} · ${formatPrice(s.price)}` : STATUS_TEXT[seat.status]}
      </div>`;
  }

  function showTooltip(info, x, y) {
    if (!info) {
      tooltip.hidden = true;
      return;
    }
    tooltip.innerHTML = tooltipHTML(info);
    tooltip.hidden = false;
    // Keep the tooltip inside the screen
    const pad = 16;
    const r = tooltip.getBoundingClientRect();
    let left = x + pad;
    let top = y + pad;
    if (left + r.width > window.innerWidth - 8) left = x - r.width - pad;
    if (top + r.height > window.innerHeight - 8) top = y - r.height - pad;
    tooltip.style.transform = `translate(${Math.max(8, left)}px, ${Math.max(8, top)}px)`;
  }

  // ---------- Section bar (section view) ----------
  function showSectionBar(section, stats) {
    sectionBar.innerHTML = `
      <button class="glass-btn" type="button" data-action="all">← All sections</button>
      <div class="section-bar__info">
        <strong>${sectionTitle(section)}</strong>
        <span>${section.tierLabel} · ${section.categoryLabel} · ${formatPrice(section.price)} · ${fmt(stats.free)} free</span>
      </div>`;
    sectionBar.hidden = false;
  }
  const hideSectionBar = () => (sectionBar.hidden = true);
  sectionBar.addEventListener('click', (e) => {
    if (e.target.closest('[data-action="all"]')) {
      hideSectionBar();
      onAllSections?.();
    }
  });

  // ---------- Seat panel (seat view) ----------
  function showSeatPanel(seat) {
    currentSeat = seat;
    const s = seat.section;
    panel.innerHTML = `
      <div class="seat-panel__info">
        <span class="eyebrow">${sectionTitle(s)}</span>
        <strong>${seatLine(seat)}</strong>
        <span class="seat-panel__hint">${s.categoryLabel} · ${formatPrice(s.price)} · Drag to look around</span>
      </div>
      <div class="seat-panel__actions">
        <button class="glass-btn" type="button" data-action="back">← Back</button>
        <button class="btn btn-gold" type="button" data-action="select" ${seat.status !== 'free' ? 'disabled' : ''}>
          ${seat.status !== 'free' ? 'Booked' : 'Select this seat'}
        </button>
      </div>`;
    panel.hidden = false;
  }
  const hideSeatPanel = () => (panel.hidden = true);
  panel.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'back') {
      hideSeatPanel();
      onBack?.();
    } else if (action === 'select' && currentSeat) showBooking(currentSeat);
  });

  // ---------- Booking dialog ----------
  function showBooking(seat) {
    const s = seat.section;
    modal.innerHTML = `
      <div class="booking-card" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <span class="eyebrow">Booking summary</span>
        <h2 id="booking-title">${match.home} <em>vs</em> ${match.away}</h2>
        <p class="booking-card__meta">${match.competition} · ${formatMatchDate(match)} · ${CLUB.stadium}</p>
        <dl class="booking-card__seat">
          <div><dt>Area</dt><dd>${s.areaName}</dd></div>
          <div><dt>Section</dt><dd>${s.id}</dd></div>
          <div><dt>Row</dt><dd>${seat.row}</dd></div>
          <div><dt>Seat</dt><dd>${seat.number}</dd></div>
        </dl>
        ${s.away ? `<p class="booking-card__away">Away section: reserved for ${match.away} supporters.</p>` : ''}
        <div class="booking-card__total"><span>${s.categoryLabel}</span><strong>${formatPrice(s.price)}</strong></div>
        <p class="booking-card__note">Demo only: no payment is taken and no real ticket is issued.</p>
        <div class="booking-card__actions">
          <button class="glass-btn" type="button" data-action="cancel">Cancel</button>
          <button class="btn btn-gold" type="button" data-action="confirm">Confirm booking</button>
        </div>
      </div>`;
    modal.hidden = false;
    modal.querySelector('[data-action="confirm"]').focus();
  }

  function showSuccess(seat) {
    modal.innerHTML = `
      <div class="booking-card booking-card--success" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <div class="booking-card__check" aria-hidden="true">✓</div>
        <h2 id="booking-title">You're going!</h2>
        <p class="booking-card__meta">${match.home} vs ${match.away} · ${formatMatchDate(match)}</p>
        <p class="booking-card__seatline">${sectionTitle(seat.section)} · ${seatLine(seat)}</p>
        <div class="booking-card__ref">Booking reference <strong>${bookingRef()}</strong></div>
        <div class="booking-card__actions">
          <button class="btn btn-gold" type="button" data-action="done">Back to stadium</button>
        </div>
      </div>`;
    modal.querySelector('[data-action="done"]').focus();
  }

  function closeModal() {
    modal.hidden = true;
    modal.innerHTML = '';
  }

  modal.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (e.target === modal || action === 'cancel') closeModal();
    else if (action === 'confirm' && currentSeat) {
      onConfirm?.(currentSeat);
      showSuccess(currentSeat);
      showSeatPanel(currentSeat); // the panel now shows the seat as booked
    } else if (action === 'done') {
      closeModal();
      hideSeatPanel();
      onDone?.();
    }
  });

  return {
    showTooltip,
    showSectionBar,
    hideSectionBar,
    showSeatPanel,
    hideSeatPanel,
    isModalOpen: () => !modal.hidden,
    closeModal,
  };
}
