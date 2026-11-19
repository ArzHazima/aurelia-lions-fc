// Site navigation bar: crest + club name on the left, page links on the right.
// The current page's link is highlighted (aria-current="page").
import { CLUB } from '../club.js';

const LINKS = [
  { id: 'home', label: 'Home', href: '#/' },
  { id: 'squad', label: 'Squad', href: '#/squad' },
  { id: 'matches', label: 'Matches', href: '#/matches' },
];

export function navbar(active = 'home') {
  const links = LINKS.map(
    (l) => `<a href="${l.href}" ${l.id === active ? 'aria-current="page"' : ''}>${l.label}</a>`,
  ).join('');
  return `
    <header class="site-nav">
      <a class="site-nav__brand" href="#/" aria-label="${CLUB.name} home">
        <img src="${CLUB.crest}" alt="" width="40" height="55" />
        <span>${CLUB.name}</span>
      </a>
      <nav class="site-nav__links" aria-label="Main">
        ${links}
        <a class="btn btn-primary btn-sm" href="#/matches" ${active === 'tickets' ? 'aria-current="page"' : ''}>Tickets</a>
      </nav>
    </header>`;
}
