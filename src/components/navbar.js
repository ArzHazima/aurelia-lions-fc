// Site navigation bar: crest + club name on the left, links on the right
import { CLUB } from '../club.js';

export function navbar(active = 'home') {
  return `
    <header class="site-nav">
      <a class="site-nav__brand" href="#/" aria-label="${CLUB.name} home">
        <img src="${CLUB.crest}" alt="" width="40" height="55" />
        <span>${CLUB.name}</span>
      </a>
      <nav class="site-nav__links" aria-label="Main">
        <a href="#/" ${active === 'home' ? 'aria-current="page"' : ''}>Home</a>
        <a href="#/" data-scroll="matches">Matches</a>
        <a class="btn btn-primary btn-sm" href="#/" data-scroll="matches">Tickets</a>
      </nav>
    </header>`;
}

// "Matches" / "Tickets" scroll to the match list on the home page
export function bindNavbar(root) {
  root.querySelectorAll('[data-scroll]').forEach((link) =>
    link.addEventListener('click', (e) => {
      const target = document.getElementById(link.dataset.scroll);
      if (!target) return; // not on the home page: the normal link takes us there
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }),
  );
}
