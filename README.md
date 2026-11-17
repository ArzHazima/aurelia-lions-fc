# Sahar Stars FC ⭐

Website for a fictional football club, with a 3D stadium for choosing your seat.
Everything is made up: the club, players, stadium and opponents.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser.

## Regenerate seat data

```bash
npm run seats
```

Writes `src/data/seats/<match-id>.json` for every match in `src/data/matches.json`.

## Production build

```bash
npm run build
```

The output goes to `dist/` and is configured for GitHub Pages under `/clubStadiom/` (see `vite.config.js`).

## Tech

Vite, JavaScript and Three.js.
