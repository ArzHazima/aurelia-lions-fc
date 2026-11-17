// The HTML layer on top of the 3D scene: seat tooltip, seat panel (while sitting
// in a seat) and the booking summary dialog. No real payment happens anywhere.
import { formatMatchDate, formatPrice } from '../utils/format.js';

const seatTitle = (seat) => `${seat.standName} · Section ${seat.section}`;
const seatLine = (seat) => `Row ${seat.row} · Seat ${seat.number}`;

function bookingRef() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let ref = 'SS-';
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return ref;
}

/**
 * @param {HTMLElement} root  element the UI is added to
 * @param {object} opts  { match, onBack(), onConfirm(seat), onDone() }
 */
export function createStadiumUI(root, { match, onBack, onConfirm, onDone }) {
  const tooltip = document.createElement('div');
  tooltip.className = 'seat-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  tooltip.hidden = true;

  const panel = document.createElement('div');
  panel.className = 'seat-panel';
  panel.hidden = true;

  const modal = document.createElement('div');
  modal.className = 'booking-modal';
  modal.hidden = true;

  root.append(tooltip, panel, modal);
  let currentSeat = null;

  // ---------- Tooltip ----------
  function showTooltip(seat, x, y) {
    if (!seat) {
      tooltip.hidden = true;
      return;
    }
    tooltip.innerHTML = `
      <div class="seat-tooltip__stand">${seat.standName}</div>
      <dl class="seat-tooltip__grid">
        <div><dt>Section</dt><dd>${seat.section}</dd></div>
        <div><dt>Row</dt><dd>${seat.row}</dd></div>
        <div><dt>Seat</dt><dd>${seat.number}</dd></div>
      </dl>
      <div class="seat-tooltip__status ${seat.taken ? 'is-taken' : 'is-free'}">
        ${seat.taken ? 'Taken' : `Available · ${formatPrice(seat.price)}`}
      </div>`;
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

  // ---------- Seat panel (shown while viewing from a seat) ----------
  function showSeatPanel(seat) {
    currentSeat = seat;
    panel.innerHTML = `
      <div class="seat-panel__info">
        <span class="eyebrow">${seatTitle(seat)}</span>
        <strong>${seatLine(seat)}</strong>
        <span class="seat-panel__hint">${formatPrice(seat.price)} · Drag to look around</span>
      </div>
      <div class="seat-panel__actions">
        <button class="glass-btn" type="button" data-action="back">← Back to overview</button>
        <button class="btn btn-gold" type="button" data-action="select" ${seat.taken ? 'disabled' : ''}>
          ${seat.taken ? 'Booked' : 'Select this seat'}
        </button>
      </div>`;
    panel.hidden = false;
  }

  function hideSeatPanel() {
    panel.hidden = true;
  }

  panel.addEventListener('click', (e) => {
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'back') {
      hideSeatPanel();
      onBack?.();
    } else if (action === 'select' && currentSeat) {
      showBooking(currentSeat);
    }
  });

  // ---------- Booking summary ----------
  function showBooking(seat) {
    modal.innerHTML = `
      <div class="booking-card" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <span class="eyebrow">Booking summary</span>
        <h2 id="booking-title">${match.home} <em>vs</em> ${match.away}</h2>
        <p class="booking-card__meta">${match.competition} · ${formatMatchDate(match)} · Flame Arena</p>
        <dl class="booking-card__seat">
          <div><dt>Stand</dt><dd>${seat.standName}</dd></div>
          <div><dt>Section</dt><dd>${seat.section}</dd></div>
          <div><dt>Row</dt><dd>${seat.row}</dd></div>
          <div><dt>Seat</dt><dd>${seat.number}</dd></div>
        </dl>
        <div class="booking-card__total"><span>Total</span><strong>${formatPrice(seat.price)}</strong></div>
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
        <p class="booking-card__seatline">${seatTitle(seat)} · ${seatLine(seat)}</p>
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
    showSeatPanel,
    hideSeatPanel,
    isModalOpen: () => !modal.hidden,
    closeModal,
  };
}
