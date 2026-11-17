// Small text-formatting helpers shared across pages

export function formatMatchDate(match) {
  const date = new Date(`${match.date}T${match.time}:00`);
  const day = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `${day} · ${match.time}`;
}

export const formatPrice = (amount) => `$${amount}`;
