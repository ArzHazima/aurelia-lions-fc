// TEMPORARY page to compare the three crest options. Removed after one is chosen.
const base = import.meta.env.BASE_URL;
const OPTIONS = [
  { id: 'a', name: 'A · Classic', text: 'Traditional shield, lion facing front, crown on top, name on a ribbon, EST. / 1924 either side.' },
  { id: 'b', name: 'B · Modern premium', text: 'Sharp angular shield, lion in profile from bold flat shapes, name on an arc, double gold outline.' },
  { id: 'c', name: 'C · Roundel', text: 'Circular badge: name and year around the ring, laurels, small shield with the lion, crown on top.' },
];

export function render(root) {
  const card = (o) => `
    <article class="crest-card">
      <h2>${o.name}</h2>
      <p>${o.text}</p>
      <div class="crest-card__big"><img src="${base}crests/crest-${o.id}.svg" alt="Crest option ${o.name}" /></div>
      <div class="crest-card__sizes">
        <div class="on-light">
          <img src="${base}crests/crest-${o.id}.svg" alt="" height="96" />
          <img src="${base}crests/crest-${o.id}.svg" alt="" height="48" />
          <img src="${base}crests/crest-${o.id}.svg" alt="" height="32" />
          <img src="${base}crests/crest-${o.id}.svg" alt="" height="16" />
        </div>
        <div class="on-dark">
          <img src="${base}crests/crest-${o.id}.svg" alt="" height="96" />
          <img src="${base}crests/crest-${o.id}.svg" alt="" height="48" />
          <img src="${base}crests/crest-${o.id}.svg" alt="" height="32" />
          <img src="${base}crests/crest-${o.id}.svg" alt="" height="16" />
        </div>
      </div>
    </article>`;

  root.innerHTML = `
    <main class="crest-preview">
      <header>
        <span class="crest-preview__tag">Temporary preview</span>
        <h1>Aurelia Lions FC: choose a crest</h1>
        <p>Each option shown large, then at navbar (48px), small (32px) and favicon (16px) size, on light and dark backgrounds.</p>
      </header>
      <div class="crest-grid">${OPTIONS.map(card).join('')}</div>
    </main>`;
}
