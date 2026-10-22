# Projet CFO Cockpit — Les Délices de Bourgogne SAS

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

## Langue et style
- Interface et commentaires en français. Montants en euros, format français (1 234 567 €).
- Fond blanc #FFFFFF, texte principal #0B0A14. Accent dégradé #3524E8 → #E93BF3 réservé aux titres, KPI clés et boutons.
- Cartes blanches, bordure fine #ECEAF5, ombre douce, coins arrondis. Graphiques sur fond blanc, grilles gris clair.
- Titres slab serif bold, corps sans serif épurée.
