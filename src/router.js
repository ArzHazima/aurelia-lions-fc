// נתב פשוט מבוסס "#" (hash). למשל: #/stadium/match-1
// ב-GitHub Pages אין שרת שיודע להפנות כתובות, ולכן hash הוא הפתרון הבטוח.
// כל עמוד הוא מודול עם פונקציה render(root, params) שיכולה להחזיר פונקציית ניקוי.

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
    if (id !== navId) return; // המשתמש כבר עבר לעמוד אחר בזמן הטעינה

    cleanup?.();
    cleanup = null;
    outlet.replaceChildren();
    window.scrollTo(0, 0);
    cleanup = mod.render(outlet, route.params ? route.params(match) : {}) || null;
  }

  window.addEventListener('hashchange', navigate);
  navigate();
}
