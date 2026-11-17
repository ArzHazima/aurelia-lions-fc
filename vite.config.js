import { defineConfig } from 'vite';

// באתר שעולה ל-GitHub Pages הכתובת היא https://<user>.github.io/clubStadiom/
// לכן בבנייה (build) כל הקבצים צריכים להיטען מתוך /clubStadiom/.
// בפיתוח מקומי (npm run dev) נשארים על "/" כדי שהכתובת תהיה פשוטה.
// אם תקרא למאגר ב-GitHub בשם אחר – שנה כאן את REPO_NAME.
const REPO_NAME = 'clubStadiom';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${REPO_NAME}/` : '/',
  build: {
    chunkSizeWarningLimit: 900,
  },
}));
