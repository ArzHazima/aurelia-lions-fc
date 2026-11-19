// Matches page: "Upcoming" and "Results" tabs, plus a small league table.
// The open tab is kept in the address (#/matches or #/matches/results).
import matches from '../data/matches.json';
import results from '../data/results.json';
import league from '../data/league.json';
import { CLUB } from '../club.js';
import { navbar } from '../components/navbar.js';
import { footer } from '../components/footer.js';
import { matchCard, resultCard } from '../components/cards.js';
import { mountPage } from '../components/page.js';

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'results', label: 'Results' },
];

function leagueTable() {
  const rows = league.table
    .map((t, i) => {
      const gd = t.for - t.against;
      const pts = t.won * 3 + t.drawn;
      const us = t.team === CLUB.short;
      return `
        <tr class="${us ? 'is-us' : ''}" ${us ? 'aria-current="true"' : ''}>
          <td>${i + 1}</td>
          <th scope="row">${t.team}</th>
          <td>${t.played}</td>
          <td class="hide-sm">${t.won}</td>
          <td class="hide-sm">${t.drawn}</td>
          <td class="hide-sm">${t.lost}</td>
          <td>${gd > 0 ? '+' : ''}${gd}</td>
          <td><strong>${pts}</strong></td>
        </tr>`;
    })
    .join('');
  return `
    <aside class="league-card reveal" aria-labelledby="league-title">
      <span class="eyebrow">After round ${league.round}</span>
      <h2 id="league-title">${league.name}</h2>
      <table class="league-table">
        <thead>
          <tr>
            <th scope="col" title="Position">#</th>
            <th scope="col">Team</th>
            <th scope="col" title="Played">P</th>
            <th scope="col" class="hide-sm" title="Won">W</th>
            <th scope="col" class="hide-sm" title="Drawn">D</th>
            <th scope="col" class="hide-sm" title="Lost">L</th>
            <th scope="col" title="Goal difference">GD</th>
            <th scope="col" title="Points">Pts</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </aside>`;
}

export function render(root, { tab = 'upcoming' } = {}) {
  root.innerHTML = `
    ${navbar('matches')}
    <main>
      <header class="page-header">
        <div class="page-header__inner reveal">
          <span class="eyebrow">Fixtures & results</span>
          <h1>Matches</h1>
          <p>Book your seat for the next home games, or catch up on how the Lions got on.</p>
        </div>
      </header>
      <div class="section matches-layout">
        <div>
          <div class="tabs" role="tablist" aria-label="Matches">
            ${TABS.map(
              (t) => `<button class="tab" role="tab" id="tab-${t.id}" aria-controls="panel-${t.id}" data-tab="${t.id}">${t.label}</button>`,
            ).join('')}
          </div>
          <div class="tab-panel" role="tabpanel" id="panel-upcoming" aria-labelledby="tab-upcoming">
            <div class="match-list">${matches.map((m, i) => matchCard(m, i * 60)).join('')}</div>
          </div>
          <div class="tab-panel" role="tabpanel" id="panel-results" aria-labelledby="tab-results">
            <div class="result-list">${results.map((r, i) => resultCard(r, i * 50)).join('')}</div>
          </div>
        </div>
        ${leagueTable()}
      </div>
    </main>
    ${footer()}`;

  const buttons = [...root.querySelectorAll('[role="tab"]')];

  function select(id, focus = false) {
    for (const b of buttons) {
      const on = b.dataset.tab === id;
      b.setAttribute('aria-selected', String(on));
      b.tabIndex = on ? 0 : -1;
      root.querySelector(`#panel-${b.dataset.tab}`).hidden = !on;
      if (on && focus) b.focus();
    }
    // newly shown cards fade in right away
    root.querySelectorAll(`#panel-${id} .reveal`).forEach((el) => el.classList.add('is-visible'));
    // keep the tab in the address without reloading the page
    history.replaceState(null, '', id === 'upcoming' ? '#/matches' : `#/matches/${id}`);
  }

  buttons.forEach((b, i) => {
    b.addEventListener('click', () => select(b.dataset.tab));
    // Arrow keys move between tabs (standard tab behaviour)
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const next = buttons[(i + (e.key === 'ArrowRight' ? 1 : -1) + buttons.length) % buttons.length];
      select(next.dataset.tab, true);
    });
  });

  select(TABS.some((t) => t.id === tab) ? tab : 'upcoming');
  return mountPage(root);
}
