// A tiny hash-based router, e.g. #/stadium/match-1
// GitHub Pages has no server-side routing, so hash URLs are the safe choice.
// Each page is a module exporting render(root, params), which may return a cleanup function.

const routes = [
  { path: /^\/$/, page: () => import('./pages/home.js') },
  {
    path: /^\/stadium\/([\w-]+)$/,
    page: () => import('./pages/stadium.js'),
    params: (m) => ({ matchId: m[1] }),
  },
];

export function startRouter(outlet) {
  let cleanup = null;
  let navId = 0;

  async function navigate() {
    const id = ++navId;
    const path = decodeURIComponent(location.hash.replace(/^#/, '')) || '/';

    let match = null;
    const route = routes.find((r) => (match = path.match(r.path)));
    if (!route) {
      location.replace('#/');
      return;
    }

    const mod = await route.page();
    if (id !== navId) return; // the user navigated elsewhere while this page was loading

    cleanup?.();
    cleanup = null;
    outlet.replaceChildren();
    window.scrollTo(0, 0);
    cleanup = mod.render(outlet, route.params ? route.params(match) : {}) || null;
  }

  window.addEventListener('hashchange', navigate);
  navigate();
}
