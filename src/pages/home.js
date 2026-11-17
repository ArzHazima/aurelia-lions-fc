// Temporary home page – replaced by the full home page in a later stage
import matches from '../data/matches.json';
import { formatMatchDate } from '../utils/format.js';

const logoUrl = `${import.meta.env.BASE_URL}logo.svg`;

export function render(root) {
  const list = matches
    .map(
      (m) => `
        <a class="temp-match" href="#/stadium/${m.id}">
          <span class="temp-match__teams">${m.home} <em>vs</em> ${m.away}</span>
          <span class="temp-match__meta">${m.competition} · ${formatMatchDate(m)}</span>
          <span class="temp-match__cta">Choose seat →</span>
        </a>`,
    )
    .join('');

  root.innerHTML = `
    <main class="temp-home">
      <img class="temp-logo" src="${logoUrl}" alt="Sahar Stars FC crest" width="120" height="120" />
      <h1>Sahar Stars FC</h1>
      <p>The full site is under construction. Pick a match to choose your seat at Flame Arena.</p>
      <div class="temp-matches">${list}</div>
    </main>
  `;
}
