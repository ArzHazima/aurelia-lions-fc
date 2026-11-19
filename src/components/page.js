// Shared page behaviour: subtle fade-in of .reveal elements as they scroll into view,
// plus footer links. Returns a cleanup function for the router.
import { bindFooter } from './footer.js';

export function mountPage(root) {
  bindFooter(root);
  const items = root.querySelectorAll('.reveal');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return () => {};
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: '0px 0px -40px 0px', threshold: 0.08 },
  );
  items.forEach((el) => observer.observe(el));
  return () => observer.disconnect();
}
