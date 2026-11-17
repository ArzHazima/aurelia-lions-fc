import { defineConfig } from 'vite';

// On GitHub Pages the site lives at https://<user>.github.io/clubStadiom/,
// so production builds must load every file from /clubStadiom/.
// Local development (npm run dev) stays on "/" for a simple URL.
// If you name the GitHub repository differently, change REPO_NAME.
const REPO_NAME = 'clubStadiom';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? `/${REPO_NAME}/` : '/',
  build: {
    chunkSizeWarningLimit: 900,
  },
}));
