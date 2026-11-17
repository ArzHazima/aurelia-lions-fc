// דף בית זמני – יוחלף בדף בית מלא בשלב 5
const logoUrl = `${import.meta.env.BASE_URL}logo.svg`;

export function render(root) {
  root.innerHTML = `
    <main class="temp-home">
      <img class="temp-logo" src="${logoUrl}" alt="סמל כוכבי סהר" width="120" height="120" />
      <h1>כוכבי סהר</h1>
      <p>האתר בבנייה. בינתיים אפשר לבקר באצטדיון התלת-ממדי.</p>
      <a class="btn btn-gold" href="#/stadium/match-1">לזירת הלהבה ←</a>
    </main>
  `;
}
