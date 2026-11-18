// Home page (temporary version: hero + upcoming matches). Full home page comes later.
import matches from '../data/matches.json';
import { CLUB } from '../club.js';
import { navbar, bindNavbar } from '../components/navbar.js';
import { formatMatchDate } from '../utils/format.js';

function availability(match) {
  if (match.demand >= 0.9) return { label: 'Almost sold out', cls: 'is-hot' };
  if (match.demand >= 0.65) return { label: 'Selling fast', cls: 'is-warm' };
  return { label: 'Tickets available', cls: 'is-open' };
}

export function render(root) {
  const cards = matches
    .map((m) => {
      const a = availability(m);
      const date = new Date(`${m.date}T${m.time}:00`);
      return `
        <article class="match-card">
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
    })
    .join('');

  root.innerHTML = `
    ${navbar('home')}
    <main>
      <section class="hero">
        <div class="hero__text">
          <span class="eyebrow">Est. ${CLUB.founded} · ${CLUB.stadium}</span>
          <h1>${CLUB.name}</h1>
          <p>Pride of the city for a hundred years. Pick your match, find your seat in 3D and see the view before you book.</p>
          <div class="hero__actions">
            <a class="btn btn-primary btn-lg" href="#/stadium/${matches[0].id}">Choose your seat</a>
            <a class="btn btn-outline btn-lg" href="#/" data-scroll="matches">Upcoming matches</a>
          </div>
        </div>
        <div class="hero__crest">
          <img src="${CLUB.crest}" alt="${CLUB.name} crest" width="320" height="436" />
        </div>
      </section>

      <section class="section" id="matches">
        <div class="section__head">
          <span class="eyebrow">Tickets</span>
          <h2>Upcoming home matches</h2>
        </div>
        <div class="match-list">${cards}</div>
      </section>
    </main>
    <footer class="site-footer">
      <img src="${CLUB.crest}" alt="" width="28" height="38" />
      <span>${CLUB.name} is a fictional club. This is a demo site: no real tickets are sold.</span>
    </footer>
  `;
  bindNavbar(root);
}
