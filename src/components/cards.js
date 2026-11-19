// Reusable cards: player, coach, upcoming match, result
import { CLUB } from '../club.js';
import { avatar } from './avatar.js';
import { flag, countryName } from './flags.js';
import { formatMatchDate } from '../utils/format.js';

export function playerCard(p, delay = 0) {
  return `
    <article class="player-card reveal" style="--delay:${delay}ms">
      <div class="player-card__art">
        <span class="player-card__number" aria-label="Shirt number">${p.number}</span>
        ${avatar(p)}
        ${p.captain ? '<span class="player-card__captain" title="Captain">C</span>' : ''}
      </div>
      <div class="player-card__body">
        <h3>${p.name}</h3>
        <span class="player-card__pos">${p.position}</span>
        <span class="player-card__nation">${flag(p.country)} ${countryName(p.country)}</span>
      </div>
    </article>`;
}

export function coachCard(c) {
  return `
    <article class="coach-card reveal">
      ${avatar({ name: c.name, coach: true })}
      <div>
        <span class="eyebrow">${c.role} · since ${c.since}</span>
        <h3>${c.name}</h3>
        <span class="player-card__nation">${flag(c.country)} ${countryName(c.country)}</span>
        <p>${c.bio}</p>
      </div>
    </article>`;
}

function availability(match) {
  if (match.demand >= 0.9) return { label: 'Almost sold out', cls: 'is-hot' };
  if (match.demand >= 0.65) return { label: 'Selling fast', cls: 'is-warm' };
  return { label: 'Tickets available', cls: 'is-open' };
}

export function matchCard(m, delay = 0) {
  const a = availability(m);
  const date = new Date(`${m.date}T${m.time}:00`);
  return `
    <article class="match-card reveal" style="--delay:${delay}ms">
      <div class="match-card__date">
        <span>${date.toLocaleDateString('en-US', { month: 'short' })}</span>
        <strong>${date.getDate()}</strong>
      </div>
      <div class="match-card__info">
        <span class="match-card__comp">${m.competition}</span>
        <h3>${m.home} <em>vs</em> ${m.away}</h3>
        <span class="match-card__meta">${formatMatchDate(m)} · ${CLUB.stadium}</span>
      </div>
      <div class="match-card__cta">
        <span class="badge ${a.cls}">${a.label}</span>
        <a class="btn btn-primary" href="#/stadium/${m.id}">Choose seat →</a>
      </div>
    </article>`;
}

// Result from the Lions' point of view: W / D / L
export function outcome(r) {
  const us = r.home === CLUB.short ? r.homeScore : r.awayScore;
  const them = r.home === CLUB.short ? r.awayScore : r.homeScore;
  return us > them ? 'win' : us < them ? 'loss' : 'draw';
}

const OUTCOME = { win: { short: 'W', label: 'Win' }, draw: { short: 'D', label: 'Draw' }, loss: { short: 'L', label: 'Loss' } };

export function resultCard(r, delay = 0) {
  const o = outcome(r);
  const date = new Date(`${r.date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const team = (name) => `<span class="${name === CLUB.short ? 'is-us' : ''}">${name}</span>`;
  return `
    <article class="result-card reveal" style="--delay:${delay}ms">
      <span class="result-badge is-${o}" title="${OUTCOME[o].label}" aria-label="${OUTCOME[o].label}">${OUTCOME[o].short}</span>
      <div class="result-card__teams">
        ${team(r.home)}
        <strong class="result-card__score">${r.homeScore} – ${r.awayScore}</strong>
        ${team(r.away)}
      </div>
      <div class="result-card__meta">${r.competition} · ${date}</div>
    </article>`;
}
