// עמוד האצטדיון: מציג את סצנת התלת-ממד ואת שכבת הממשק שמעליה.
// Three.js נטען כאן בטעינה דינמית (import) כדי ששאר האתר ייטען מהר.

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function render(root /* , { matchId } */) {
  root.innerHTML = `
    <section class="stadium-page">
      <div class="stadium-canvas"></div>

      <header class="stadium-topbar">
        <a class="glass-btn" href="#/">→ חזרה</a>
        <div class="stadium-title">
          <span class="eyebrow">זירת הלהבה</span>
          <h1>בחירת מקום</h1>
        </div>
      </header>

      <div class="stadium-loading" role="status">
        <div class="spinner"></div>
        <p>בונים את האצטדיון…</p>
      </div>

      <button class="glass-btn skip-intro" type="button" hidden>דלג על הפתיחה</button>
      <p class="stadium-hint" hidden>גררו כדי לסובב · גלגלת או צביטה לזום</p>
    </section>
  `;

  const $ = (sel) => root.querySelector(sel);
  let stadium = null;
  let disposed = false;

  (async () => {
    try {
      // מחכים לגופן כדי שהשלטים בתוך האצטדיון יצוירו בגופן הנכון
      await Promise.race([document.fonts?.load('800 48px Rubik'), wait(1500)]);
      const { createStadium } = await import('../stadium/index.js');
      if (disposed) return;

      stadium = createStadium($('.stadium-canvas'));
      $('.stadium-loading').classList.add('is-done');
      $('.skip-intro').hidden = false;

      await stadium.playIntro();
      if (disposed) return;
      $('.skip-intro').hidden = true;
      $('.stadium-hint').hidden = false;
    } catch (err) {
      console.error(err);
      $('.stadium-loading p').textContent =
        'לא הצלחנו לטעון את האצטדיון. ייתכן שהדפדפן לא תומך ב-WebGL.';
      $('.spinner')?.remove();
    }
  })();

  $('.skip-intro').addEventListener('click', () => stadium?.skipIntro());

  return () => {
    disposed = true;
    stadium?.dispose();
  };
}
