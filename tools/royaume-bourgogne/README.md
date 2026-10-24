# Royaume de Bourgogne

Le jeu de suivi commercial (HubSpot → quêtes, missives, gobelins) publié en artifact privé sur claude.ai :
https://claude.ai/artifact/2GRzH53R7XgHZ798jjp78v

Ce dossier n'est pas déployé par Astro : il sert de source et de sauvegarde.

- `SPEC.md` : le cahier des charges (règles du jeu, formats HubSpot/Gmail, interfaces).
- `src/` : `art.js` (pixel art + sons), `logic.js` (règles + connecteurs), `ui.html` / `ui.css` / `ui.js`.
- `build.mjs` : assemble `royaume.html`, le fichier publié.
- `test/logic.test.mjs` : tests des règles (`node test/logic.test.mjs`).
- `test/run.mjs` : tests Playwright en mode démo et avec de faux connecteurs (`node test/run.mjs`).

Modifier : éditer `src/`, lancer `node build.mjs`, puis republier `royaume.html` sur la même URL d'artifact.
