// The fictional season, kept "current" forever.
// The JSON files hold one fixed set of dates. Once the first upcoming match has kicked
// off, every date (fixtures, results, news) moves forward by whole weeks, so:
//  - there is always a next match to count down to,
//  - weekdays and the gaps between dates stay exactly the same.
import rawMatches from './matches.json';
import rawResults from './results.json';
import rawNews from './news.json';

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;

const firstKickoff = new Date(`${rawMatches[0].date}T${rawMatches[0].time}:00`).getTime();
const weeks = Math.max(0, Math.ceil((Date.now() - firstKickoff) / WEEK));

// "2026-11-28" + n weeks → "YYYY-MM-DD" (calculated at midday, so clock changes never shift the day)
function shift(date) {
  if (!weeks) return date;
  const d = new Date(`${date}T12:00:00`);
  d.setDate(d.getDate() + weeks * 7);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const matches = rawMatches.map((m) => ({ ...m, date: shift(m.date) }));
export const results = rawResults.map((r) => ({ ...r, date: shift(r.date) }));
export const news = rawNews.map((n) => ({ ...n, date: shift(n.date) }));

// Football seasons run August → May, e.g. "2026/27"
const first = new Date(`${matches[0].date}T12:00:00`);
const startYear = first.getMonth() >= 6 ? first.getFullYear() : first.getFullYear() - 1;
export const seasonLabel = `${startYear}/${String(startYear + 1).slice(2)}`;
