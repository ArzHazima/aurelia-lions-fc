// Illustrated player avatar (no photos): a silhouette in the Aurelia Lions shirt,
// with the shirt number on the chest and the player's initials in a small badge.

const initials = (name) =>
  name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

// Gentle variety between players: three hair/skin-neutral silhouette tones
const TONES = ['#22325a', '#2b3a63', '#1b294d'];

export function avatar({ name, number = '', coach = false }) {
  const tone = TONES[name.length % TONES.length];
  const shirt = coach ? '#0B1E4A' : '#1E4FD8';
  const collar = coach ? '#FFFFFF' : '#F5B800';
  return `
    <svg class="avatar" viewBox="0 0 120 120" role="img" aria-label="Illustration of ${name}">
      <rect width="120" height="120" rx="60" fill="#EEF3FF"/>
      <!-- shoulders / shirt -->
      <path d="M18 120 C20 92 36 80 60 80 C84 80 100 92 102 120 Z" fill="${shirt}"/>
      <path d="M48 81 L60 96 L72 81" fill="none" stroke="${collar}" stroke-width="4" stroke-linejoin="round"/>
      ${coach ? '' : `<text x="60" y="114" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-weight="800" font-size="16" fill="#FFFFFF">${number}</text>`}
      <!-- neck and head -->
      <rect x="52" y="64" width="16" height="18" rx="6" fill="${tone}"/>
      <ellipse cx="60" cy="48" rx="20" ry="23" fill="${tone}"/>
      <!-- initials badge -->
      <circle cx="96" cy="26" r="15" fill="#F5B800"/>
      <text x="96" y="31" text-anchor="middle" font-family="Rubik, Arial, sans-serif" font-weight="800" font-size="13" fill="#0B1E4A">${initials(name)}</text>
    </svg>`;
}
