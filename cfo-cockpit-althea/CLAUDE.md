# Projet CFO Cockpit (charte Althéa) — Les Délices de Bourgogne SAS

## Contexte
PME agroalimentaire dijonnaise (moutardes, pain d'épices, crèmes de cassis, condiments). Exercice 2026, situation arrêtée au 30/09/2026.
Source unique de vérité : `data/CFO_Cockpit_Delices_de_Bourgogne_2026.xlsx`.

## Règles non négociables
- Aucun chiffre écrit à la main dans le HTML. Tout chiffre affiché vient de `metrics.json`, généré par `build_metrics.py` à partir de l'Excel.
- Les commentaires « board » sont construits par règles à partir des chiffres calculés, jamais inventés.
- L'assistant « Ask the CFO » ne répond qu'à partir de `metrics.json`. Si la donnée n'existe pas, il le dit.
- Toute anomalie de réconciliation est signalée, jamais lissée ni corrigée en silence.

## Stack
- Python 3 + pandas + openpyxl pour les calculs.
- Un seul fichier `cockpit.html` autonome (Chart.js via CDN), ouvrable sans serveur.

## Langue et style (charte Althéa)
- Copie du cockpit `../cfo-cockpit/` avec l'identité Althéa. Ne pas modifier l'original depuis ce dossier.
- Interface et commentaires en français. Montants en euros, format français (1 234 567 €).
- Logo : `assets/logo-althea.png`, embarqué en base64 dans `cockpit_template.html`.
- Couleurs relevées sur le logo : marine #0B1D59 (titres, réel, KPI), bleu ciel #3B8CDB (accent, forecast). Dégradé #0B1D59 → #3B8CDB réservé aux titres, KPI clés et boutons.
- Fond blanc, texte #12203F, bordures #E2E8F0, gris budget #8A93A6. Vert/rouge réservés aux statuts.
- Titres en Exo 2 (sans serif géométrique proche du logo), corps en Inter.
- Charte reconstituée à partir du logo seul : althea-groupe.com était injoignable. À valider avec le client.
