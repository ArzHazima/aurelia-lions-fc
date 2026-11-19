// Home page: hero, next match with countdown, latest news, squad preview, footer
import matches from '../data/matches.json';
import news from '../data/news.json';
import squad from '../data/players.json';
import { CLUB } from '../club.js';
import { navbar } from '../components/navbar.js';
import { footer } from '../components/footer.js';
import { playerCard } from '../components/cards.js';
import { mountPage } from '../components/page.js';
import { formatMatchDate } from '../utils/format.js';

const kickoff = (m) => new Date(`${m.date}T${m.time}:00`);
const pad = (n) => String(n).padStart(2, '0');
const initials = (name) =>
  name
    .split(' ')
    .filter((w) => w !== 'FC')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);

function nextMatch() {
  const now = Date.now();
  return matches.find((m) => kickoff(m).getTime() > now) ?? matches[matches.length - 1];
}

function nextMatchSection(m) {
  return `
    <section class="section" aria-labelledby="next-title">
      <div class="next-match reveal">
        <div class="next-match__head">
          <span class="eyebrow">Next match · ${m.competition}</span>
          <h2 id="next-title">${m.home} <em>vs</em> ${m.away}</h2>
          <span class="next-match__when">${formatMatchDate(m)} · ${CLUB.stadium}</span>
        </div>
        <div class="next-match__teams" aria-hidden="true">
          <img src="${CLUB.crest}" alt="" width="72" height="98" />
          <span class="next-match__vs">VS</span>
          <span class="team-badge">${initials(m.away)}</span>
        </div>
        <div class="countdown" role="timer" aria-live="off" aria-label="Time until kick-off">
          ${['days', 'hours', 'minutes', 'seconds']
            .map((u) => `<div class="countdown__cell"><strong data-unit="${u}">--</strong><span>${u}</span></div>`)
            .join('')}
        </div>
        <a class="btn btn-gold btn-lg" href="#/stadium/${m.id}">Get tickets</a>
      </div>
    </section>`;
}

function newsSection() {
  const cards = news
    .map((n, i) => {
      const date = new Date(`${n.date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      return `
        <article class="news-card reveal" style="--delay:${i * 80}ms">
          <div class="news-card__art" aria-hidden="true"><span>${n.icon}</span></div>
          <div class="news-card__body">
            <span class="news-card__meta"><span class="news-card__tag">${n.tag}</span> ${date}</span>
            <h3>${n.title}</h3>
            <p>${n.text}</p>
          </div>
        </article>`;
    })
    .join('');
  return `
    <section class="section section--soft" aria-labelledby="news-title">
      <div class="section__inner">
        <div class="section__head reveal">
          <span class="eyebrow">News</span>
          <h2 id="news-title">Latest from the Lions</h2>
        </div>
        <div class="news-grid">${cards}</div>
      </div>
    </section>`;
}

function squadPreview() {
  const key = squad.players.filter((p) => p.key);
  return `
    <section class="section" aria-labelledby="squad-title">
      <div class="section__head section__head--row reveal">
        <div>
          <span class="eyebrow">Squad</span>
          <h2 id="squad-title">Key players</h2>
        </div>
        <a class="link-arrow" href="#/squad">See full squad →</a>
      </div>
      <div class="player-grid">${key.map((p, i) => playerCard(p, i * 70)).join('')}</div>
    </section>`;
}

export function render(root) {
  const next = nextMatch();
  root.innerHTML = `
    ${navbar('home')}
    <main>
      <section class="hero">
        <div class="hero__text">
          <span class="eyebrow">Est. ${CLUB.founded} · ${CLUB.stadium}</span>
          <h1>${CLUB.name}</h1>
          <p>Pride of the city for a hundred years. Pick your match, find your seat in 3D and see the view before you book.</p>
          <div class="hero__actions">
            <a class="btn btn-primary btn-lg" href="#/stadium/${next.id}">Choose your seat</a>
            <a class="btn btn-outline btn-lg" href="#/matches">All matches</a>
          </div>
        </div>
        <div class="hero__crest">
          <img src="${CLUB.crest}" alt="${CLUB.name} crest" width="320" height="436" />
        </div>
      </section>
      ${nextMatchSection(next)}
      ${newsSection()}
      ${squadPreview()}
    </main>
    ${footer()}`;

  // Live countdown to kick-off
  const cells = Object.fromEntries([...root.querySelectorAll('[data-unit]')].map((el) => [el.dataset.unit, el]));
  const target = kickoff(next).getTime();
  function tick() {
    const left = Math.max(0, target - Date.now());
    const s = Math.floor(left / 1000);
    cells.days.textContent = Math.floor(s / 86400);
    cells.hours.textContent = pad(Math.floor((s % 86400) / 3600));
    cells.minutes.textContent = pad(Math.floor((s % 3600) / 60));
    cells.seconds.textContent = pad(s % 60);
  }
  tick();
  const timer = setInterval(tick, 1000);

  const cleanupPage = mountPage(root);
  return () => {
    clearInterval(timer);
    cleanupPage();
  };
}
