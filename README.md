# Strategos v0.3.3 — Modular Recovery Build

Modular GitHub Pages build of Strategos by OneArete.

## Files

- `index.html`: stable bootstrap and visible startup diagnostics
- `styles.css`: interface and design system
- `src/app.js`: UI flow
- `src/core/engine.js`: decision engine
- `src/core/storage.js`: resilient local persistence
- `src/data/codex.js`: mission knowledge

## Deployment

Upload every file and folder to the repository root and publish the `main` branch from `/ (root)` in GitHub Pages.

This build intentionally has no service worker. Offline caching will return only after the startup path is stable.
