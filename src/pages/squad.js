// Squad page: players grouped by position, then the coach
import squad from '../data/players.json';
import { seasonLabel } from '../data/season.js';
import { navbar } from '../components/navbar.js';
import { footer } from '../components/footer.js';
import { playerCard, coachCard } from '../components/cards.js';
import { mountPage } from '../components/page.js';

const GROUPS = [
  { position: 'Goalkeeper', title: 'Goalkeepers' },
  { position: 'Defender', title: 'Defenders' },
  { position: 'Midfielder', title: 'Midfielders' },
  { position: 'Forward', title: 'Forwards' },
];

export function render(root) {
  const groups = GROUPS.map(({ position, title }) => {
    const players = squad.players.filter((p) => p.position === position).sort((a, b) => a.number - b.number);
    return `
      <section class="squad-group" aria-labelledby="g-${position}">
        <div class="squad-group__head reveal">
          <h2 id="g-${position}">${title}</h2>
          <span class="squad-group__count">${players.length} players</span>
        </div>
        <div class="player-grid">${players.map((p, i) => playerCard(p, i * 60)).join('')}</div>
      </section>`;
  }).join('');

  root.innerHTML = `
    ${navbar('squad')}
    <main>
      <header class="page-header">
        <div class="page-header__inner reveal">
          <span class="eyebrow">First team · Season ${seasonLabel}</span>
          <h1>The Squad</h1>
          <p>${squad.players.length} Lions, one shirt. Meet the players who wear the blue and gold.</p>
        </div>
      </header>
      <div class="section">${groups}
        <section class="squad-group" aria-labelledby="g-coach">
          <div class="squad-group__head reveal"><h2 id="g-coach">Coach</h2></div>
          ${coachCard(squad.coach)}
        </section>
      </div>
    </main>
    ${footer()}`;
  return mountPage(root);
}
