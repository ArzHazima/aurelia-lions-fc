// Site footer: crest, club info, page links and (fake, demo-only) social links
import { CLUB } from '../club.js';

// Simple generic icons (letters in circles) – no real brand logos
const SOCIAL = [
  { label: 'Instagram', short: 'IG' },
  { label: 'YouTube', short: 'YT' },
  { label: 'Facebook', short: 'FB' },
  { label: 'X', short: 'X' },
];

export function footer() {
  return `
    <footer class="site-footer">
      <div class="site-footer__inner">
        <div class="site-footer__club">
          <img src="${CLUB.crest}" alt="${CLUB.name} crest" width="56" height="76" />
          <div>
            <strong>${CLUB.name}</strong>
            <span>Est. ${CLUB.founded} · ${CLUB.stadium}</span>
            <span>1 Lion Gate, Aurelia</span>
          </div>
        </div>
        <nav class="site-footer__links" aria-label="Footer">
          <a href="#/">Home</a>
          <a href="#/squad">Squad</a>
          <a href="#/matches">Matches</a>
          <a href="#/matches">Tickets</a>
        </nav>
        <div class="site-footer__social" aria-label="Social media (demo links)">
          ${SOCIAL.map((s) => `<a href="#" data-fake-link aria-label="${s.label} (demo link)" title="${s.label} (demo link)">${s.short}</a>`).join('')}
        </div>
      </div>
      <p class="site-footer__note">${CLUB.name} is a fictional club. This is a demo site: no real tickets are sold.</p>
    </footer>`;
}

// Fake social links do nothing (and don't change the page)
export function bindFooter(root) {
  root.querySelectorAll('[data-fake-link]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
}
