---
title: "Connecter Claude à Pennylane : la combo qui va changer la vie des cabinets comptables (et de leurs clients)"
description: "165 outils. Une clé API. Cinq minutes de configuration. Comment brancher Claude directement sur votre comptabilité Pennylane via MCP — et ce que ça change vraiment."
pubDate: 2026-05-10
author: "Julian Luneau"
tags: ["MCP", "Pennylane", "Comptabilité", "Claude", "Automatisation", "Expert-comptable"]
---

165 outils. Une clé API. Cinq minutes de configuration.

Voilà ce qu'il faut aujourd'hui pour brancher Claude directement sur votre comptabilité Pennylane et lui permettre d'aller piocher dans vos écritures, vos factures, vos balances, vos devis. En langage naturel. Sans copier-coller. Sans export Excel.

Et le plus dingue dans l'histoire ? **Pennylane n'a rien sorti officiellement.** Tout vient de la communauté. Trois développeurs indépendants ont construit en quelques mois ce qui est en train de devenir l'un des cas d'usage les plus puissants du Model Context Protocol pour les TPE/PME françaises.

Bon Dieu, j'attendais ce moment depuis longtemps.

[IMAGE : capture d'écran Claude Desktop avec l'icône MCP Pennylane activée et une requête du type "Donne-moi mes 10 plus gros clients du dernier trimestre"]

## Le contexte : ce qu'on fait déjà avec Pennylane (et ce qu'on ne peut pas faire)

Pennylane a construit l'une des comptabilités augmentées les plus solides du marché français. Catégorisation IA, OCR factures, autopilote qui traite jusqu'à 75% des écritures sans intervention humaine, ComptAssistant pour répondre aux questions comptables en contexte. Le logiciel est devenu **Plateforme de Dématérialisation Partenaire** auprès de la DGFiP — autrement dit, prêt pour la facturation électronique obligatoire qui se déploie en ce moment.

Sur le papier, c'est costaud.

Sur le terrain, je vois quand même la même limite revenir partout dans mes formations : **l'IA native de Pennylane reste enfermée dans Pennylane.** Elle ne sait pas croiser vos données comptables avec votre CRM. Elle ne sait pas générer un mail à un client en s'appuyant sur l'historique relationnel ET la situation comptable. Elle ne sait pas réconcilier vos devis HubSpot avec vos factures Pennylane.

C'est précisément le trou dans la raquette que le MCP vient combler.

## Le MCP, en deux phrases pour ceux qui suivent pas

Le Model Context Protocol, c'est un standard ouvert créé par Anthropic (la maison mère de Claude) qui permet à une IA de se brancher sur n'importe quel outil — comme une prise universelle. Au lieu de demander à Claude de lire un fichier que vous lui copiez-collez, vous lui donnez un accès direct à votre logiciel.

Il interroge les données. Il croise. Il agit. Vous validez.

J'en ai déjà parlé en long et en large dans d'autres articles. Pour Pennylane, c'est exactement ce qu'il fallait pour casser le silo.

[IMAGE : schéma simple — Claude au centre, connecté par flèches à Pennylane / HubSpot / Qonto / Stripe]

## Trois serveurs MCP Pennylane disponibles. Lequel choisir ?

Parce que oui, il y en a trois. Tous open source, tous gratuits, tous maintenus par des développeurs indépendants. Aucun n'est officiel — et ça a son importance, on y revient.

### 1. Le plus complet : Wanadev (165 outils)

Le serveur `@wanadev/pennylane-mcp` est auto-généré directement depuis la spécification OpenAPI officielle de Pennylane. Résultat : **165 outils MCP** qui couvrent à peu près tout ce que l'API V2 sait faire — clients, factures, fournisseurs, produits, transactions, écritures, journaux, devis, catégories. La totale.

Mon préféré pour démarrer. Installation en une ligne via npx, config dans le fichier Claude Desktop, et c'est plié.

### 2. Le plus métier : Melvyn Morice (87 outils, multi-dossiers)

Celui-là est différent. Il a été pensé par un expert-comptable, **pour des experts-comptables**. 87 outils, mais surtout : **gestion multi-dossiers native**. Vous switchez entre les comptabilités de vos clients à la volée, vous interrogez plusieurs dossiers en parallèle. Pour un cabinet qui gère 30, 50 ou 200 dossiers, c'est pas un détail. C'est LA fonctionnalité.

### 3. Le plus déployable : Studio Catapulte

Plus orienté production, avec plusieurs modes de transport (STDIO pour Claude Desktop, HTTP pour des déploiements web) et un support OAuth. Si vous voulez l'intégrer à un workflow d'entreprise, c'est celui-ci.

**Mon take personnel :** pour un cabinet ou une PME qui veut tester, partez sur Wanadev. Pour un expert-comptable qui veut industrialiser son cabinet, c'est Melvyn Morice. Pour un déploiement avec plusieurs utilisateurs en interne, Studio Catapulte.

## Le setup en 5 minutes (vraiment)

Je prends Wanadev parce que c'est le plus rapide à montrer. Voilà la séquence :

**Étape 1 — Récupérer votre clé API Pennylane**
Direction *Paramètres > Intégrations > API* dans votre espace Pennylane. Vous générez une clé. **Vous la copiez immédiatement** — Pennylane ne vous la remontrera plus une fois la fenêtre fermée. C'est volontaire, c'est sécurité, c'est très bien.

**Étape 2 — Avoir Claude Desktop installé**
Mac ou PC, version gratuite ou payante. Si vous lisez cet article, vous l'avez déjà.

**Étape 3 — Avoir Node.js 18.17+ installé**
C'est le seul prérequis technique. Si vous ne savez pas si vous l'avez, ouvrez un terminal et tapez `node -v`. S'il vous renvoie un numéro de version, c'est bon.

**Étape 4 — Éditer le fichier de config Claude Desktop**
- Sur Mac : `~/Library/Application Support/Claude/claude_desktop_config.json`
- Sur Windows : `%APPDATA%\Claude\claude_desktop_config.json`

Vous y collez ce bout de JSON :

```json
{
  "mcpServers": {
    "pennylane": {
      "command": "npx",
      "args": ["-y", "@wanadev/pennylane-mcp"],
      "env": {
        "PENNYLANE_API_KEY": "votre-token-pennylane-ici"
      }
    }
  }
}
```

**Étape 5 — Redémarrer Claude Desktop**

C'est tout.

À l'icône marteau (en bas du chat), vous verrez apparaître les 165 outils Pennylane. Vous demandez "Donne-moi la liste de mes 20 derniers clients par chiffre d'affaires", Claude tape l'API, ramène les données, vous formate la réponse. Brutal. Direct.

[IMAGE : capture d'écran d'un dialogue Claude où l'utilisateur demande une analyse de chiffre d'affaires, avec le retour formaté par Claude]

## Le bonus qui fait basculer : le Skill Claude Code dédié à Pennylane

En février 2026, le créateur de StackGuide a sorti un Skill Claude Code spécifique à Pennylane. Et là on monte d'un cran.

Pourquoi ? Parce que ce Skill embarque **les règles comptables de l'ANC en vigueur au 1er janvier 2026**. Concrètement, il peut prendre un dossier Pennylane et le confronter aux règles ANC pour détecter des anomalies de premier niveau : comptes 471 oubliés, TVA aberrante, doublons potentiels, écritures qui sentent mauvais.

À chaque session, le Skill fait trois vérifications automatiques :
- Les règles comptables sont-elles à jour ? Si non, il propose de les récupérer.
- La clé API Pennylane est-elle bien stockée en variable d'environnement (et pas en dur dans le code) ?
- La version de l'API Pennylane embarquée correspond-elle à celle en vigueur ?

Pour un cabinet qui veut une **pré-révision augmentée** avant la période fiscale, c'est de l'or. Vous lancez la passe sur 50 dossiers, vous récupérez ceux qui ont le plus d'anomalies potentielles, vous priorisez votre charge de travail.

C'est en Beta. Sandbox uniquement. Mais la direction est posée.

## Ce qu'on peut faire concrètement (5 cas d'usage testés)

Parce qu'à un moment, faut redescendre du nuage et montrer ce que ça change vraiment.

**Cas 1 — La synthèse financière en langage naturel.**
*"Donne-moi un résumé de ma situation financière sur les 3 derniers mois : chiffre d'affaires, charges principales, résultat net estimé, et compare au même trimestre l'an dernier."*
Avant : export Excel, formules, mise en forme, 30 minutes. Maintenant : une requête, une réponse synthétique chiffrée, prête à être présentée. **C'est énorme.**

**Cas 2 — La détection d'anomalies sur écritures.**
*"Analyse mes écritures comptables du dernier trimestre et signale-moi les doublons potentiels, les montants inhabituels, ou les fournisseurs qui apparaissent avec des libellés différents."*
Claude passe en revue, vous sort un rapport. Vous gagnez un temps considérable avant de transmettre le dossier au cabinet — ou avant de faire votre révision si vous êtes le cabinet.

**Cas 3 — La réconciliation CRM × comptabilité.**
*"Quels devis signés dans HubSpot n'ont pas encore de facture émise dans Pennylane ?"*
Là on entre dans la magie du MCP. Claude croise deux outils. Il vous sort la liste des trous. Ce fichier Excel manuel qu'on fait tous les trimestres — fini. **Brutal, mais libérateur.**

**Cas 4 — Le tableau de bord sur mesure.**
Marge par client. Coût horaire réel par mission. Rentabilité par segment. En langage naturel. Ajustable d'une semaine à l'autre, sans appeler le développeur, sans payer un BI à 200 euros par mois.

**Cas 5 — La communication client contextualisée.**
*"Rédige un mail de fin d'exercice pour ce client en croisant ses données comptables et son historique CRM."*
Le mail arrive avec les bons chiffres et le bon ton. Vous validez, vous envoyez. Vous l'auriez mis 20 minutes à écrire. Là, deux.

## Le piège qu'il faut absolument adresser

Soyons raccord : **ces serveurs MCP ne sont pas des produits Pennylane officiels.**

Pas de SLA. Pas de support client. Pas de garantie de continuité. Ce sont des projets open source maintenus par des indépendants — passionnés, mais indépendants.

Et il y a un sujet plus sensible encore : **le secret professionnel.**

Par défaut, les données que Claude traite transitent par les serveurs d'Anthropic. Si vous interrogez la comptabilité d'un client via Claude, vous envoyez potentiellement des données couvertes par le secret professionnel à un tiers. Pour un cabinet, ce n'est pas une option. C'est un point bloquant tant qu'il n'est pas adressé proprement.

Les solutions existent :
- **Autorisation écrite du client** avant tout test en dehors d'un dossier de démonstration
- **Vérification des paramètres Claude** : votre plan doit avoir le no-training activé sur vos données (c'est le cas par défaut sur les plans Pro et Team)
- **Sandbox d'abord** : on teste sur un dossier fictif ou anonymisé avant de lancer en réel
- **Lecture seule** : vous configurez les permissions API Pennylane pour empêcher toute modification

Et pour les vrais paranos : **modèle local via Ollama.** Vous faites tourner un Claude-équivalent sur votre propre machine. Plus rien ne sort. Plus complexe à mettre en place, mais zéro fuite.

## Ce qu'il faut retenir, et ce qu'il faut faire maintenant

Le MCP Pennylane n'est pas un gadget. C'est l'un des premiers vrais cas où une IA externe peut **augmenter** un logiciel SaaS français sans demander la permission à l'éditeur. Et ça, c'est une bascule philosophique qu'aucun discours marketing ne peut effacer.

Pour vous, dirigeant de TPE/PME ou expert-comptable, voilà ce que je recommande concrètement :

1. **Si vous gérez votre propre comptabilité sur Pennylane** : installez Wanadev MCP cette semaine. 5 minutes. Testez 3 requêtes. Vous verrez ce que ça change.
2. **Si vous êtes en cabinet** : commencez en sandbox sur un dossier de démonstration avec le serveur Melvyn Morice. Avant la prochaine période fiscale, vous serez fixé.
3. **Si vous êtes dirigeant et que votre comptable n'est pas sur Pennylane** : c'est peut-être le moment d'en discuter avec lui. Pas pour le forcer à changer d'outil — mais pour comprendre ce que la combo MCP + Pennylane pourrait apporter à votre pilotage.

Et pour ceux qui veulent aller plus loin sans toucher à une ligne de code : **Zapier propose déjà un MCP Pennylane no-code**. Plus limité que les serveurs open source, mais zéro setup technique. C'est une porte d'entrée correcte.

L'IA native de Pennylane est excellente. Elle reste dans Pennylane. Le MCP ouvre la porte du dehors. Dans 12 mois, ne pas l'avoir testé sera un retard.

---

**Vous voulez qu'on regarde ensemble comment connecter Claude à votre stack (Pennylane, HubSpot, Qonto, n8n) pour automatiser ce qui peut l'être sans abdiquer le contrôle ?** Je propose des appels stratégiques de 30 minutes, sans langue de bois — on regarde votre setup et on identifie 2-3 leviers concrets. [Bloquez un créneau ici.](https://calendly.com/thefrenchbot-coaching/30min)

Et si vous voulez recevoir ce genre de décryptage chaque semaine, sans spam et sans hype : [la newsletter The French Bot, c'est par ici.](https://forms.gle/VFNEeBGGMBstm1py5)

*Automatisation oui, abdication non.*
