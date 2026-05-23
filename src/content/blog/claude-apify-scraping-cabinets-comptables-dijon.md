---
title: "Claude + Apify : comment j'ai scrapé 32 cabinets comptables à Dijon en 10 minutes (et pourquoi LinkedIn m'a mis des bâtons dans les roues)"
description: "32 cabinets comptables. Classés par score. Avec leurs numéros, leurs avis Google, leur taille d'équipe. En moins de dix minutes. Voici comment utiliser Claude comme outil de prospection actif avec Apify."
pubDate: 2026-05-23
author: "Julian Luneau"
tags: ["prospection", "apify", "scraping", "claude", "ia", "tpe-pme", "linkedin", "google-maps", "automatisation"]
---

32 cabinets comptables. Classés par score. Avec leurs numéros, leurs avis Google, leur taille d'équipe. En moins de dix minutes.

C'est ce que Claude m'a pondu pendant que je préparais la suite de la démo.

Voilà ce qu'on va voir dans cet article : comment utiliser Claude comme un outil de prospection actif — pas pour rédiger des textes, pas pour résumer des documents — pour aller chercher des clients là où ils sont.

---

## Le problème avec la prospection en 2025 : tout le monde "utilise l'IA" mais personne ne l'utilise vraiment

Posez la question à n'importe quel commercial, consultant ou indépendant : "Vous utilisez l'IA dans votre prospection ?"

Réponse quasi-systématique : "Oui, pour rédiger mes emails."

Arf. C'est bien. C'est 5% du potentiel.

Ce que peu de gens font encore — et c'est là que ça devient intéressant — c'est d'utiliser Claude non pas pour *écrire*, mais pour *agir*. Aller chercher des données, les trier, les scorer, en faire un plan d'attaque opérationnel.

La différence entre "je demande à Claude de rédiger un email de prospection" et "je demande à Claude de me trouver les 30 meilleurs prospects de ma zone, de les scorer selon mes critères, et de me préparer une liste prête à contacter" — cette différence, c'est une heure de travail contre dix minutes.

**Voilà exactement ce qu'on va décortiquer.**

---

## Apify : le connecteur que (presque) personne ne connaît dans Claude

Claude, dans sa version connecteurs, c'est bien plus qu'un chatbot. C'est une interface centrale depuis laquelle vous pouvez déclencher des actions dans vos applications : Gmail, Google Drive, votre CRM, votre agenda Calendly...

Mais il y a un connecteur qui m'a particulièrement intéressé pour la prospection : **Apify**.

Apify, c'est un outil de scraping — comprendre : un logiciel qui va sur des sites web et en extrait des données structurées. Google Maps, sites d'annonces, pages publiques... il aspire l'information et vous la restitue proprement.

La puissance, quand vous le connectez à Claude, c'est que vous ne faites plus une simple requête. Vous faites une requête *avec un tri, avec un scoring, avec une logique métier*. Claude ne se contente pas de ramener des données brutes — il les interprète, les classe, les met en forme selon vos critères.

Vous savez quoi ? C'est exactement ce que ferait un bon assistant commercial. Sauf qu'il le fait en dix minutes et ne prend pas de pause café.

---

## Le cas concret : 32 cabinets comptables à Dijon, classés et scorés

Voici le prompt exact que j'ai utilisé :

> *"Utilise Apify avec un scrappeur Google Maps et donne-moi tous les cabinets comptables sur Dijon ou dans un rayon de 20 km."*

Simple. Direct. Spécifique.

J'ai ensuite ajouté un tableau de scoring :

- Cabinet situé à Dijon ou très proche → **+2 points**
- Présence d'un site web → **+1 point**
- Plus de 10 avis Google → **+1 point**
- Structure avec plusieurs associés (pas solo) → **+1 point**

Résultat : un tableau Excel avec 32 cabinets, leurs coordonnées, leurs notes d'avis, leur taille estimée, et leur score de priorité.

Le raisonnement derrière le scoring ? Simple : former une équipe de 8 personnes à l'IA, c'est plus rentable — pour eux et pour moi — que former un expert-comptable solo. Et un cabinet qui a un site web et des avis Google est clairement plus "ouvert au monde" qu'un cabinet qui n'existe pas sur internet en 2025.

**En dix minutes, j'avais ma liste de prospection.**

Pas une liste générique achetée à un agrégateur. Une liste pensée, triée, adaptée à ma façon de travailler et à ma zone géographique.

Faites le calcul : combien d'heures vous passez habituellement à construire une telle liste manuellement ?

---

## LinkedIn : le château fort fermé (et pourquoi ce n'est pas plus mal)

Soyons honnêtes sur ce point — et je préfère vous le dire clairement plutôt que de faire semblant que tout fonctionne parfaitement.

LinkedIn bloque le scraping. Massivement. Et Apify n'y échappe pas.

J'ai voulu extraire les personnes qui avaient commenté un de mes posts — 212 commentaires, des gens intéressés pour intégrer Claude dans leur quotidien. L'objectif : repérer ceux qui viennent de Dijon pour leur proposer une formation en présentiel.

Apify n'a pas pu passer la barrière. LinkedIn a verrouillé les accès non authentifiés depuis plusieurs mois. Frustrant ? Oui. Surprenant ? Non.

LinkedIn appartient à Microsoft. Et comme Meta avec WhatsApp, la tendance est au contrôle strict des API et des accès automatisés. Ça ne changera probablement pas.

Mais — et c'est là où l'adaptabilité compte — il existe une solution.

**Claude dans Chrome.** L'extension Claude pour navigateur vous permet d'ouvrir directement une conversation avec Claude depuis n'importe quelle page LinkedIn. Claude accède alors à ce que *vous* voyez, dans votre session authentifiée. Il ne scrape pas en aveugle — il lit ce que vous lisez.

J'ai testé sur mon post avec 186 commentaires. Claude a parcouru les commentaires, extrait les noms, et identifié les profils dijonnais. Le tout avec un bandeau orange discret autour de la page — signe qu'il travaille.

C'est moins automatisé qu'Apify, mais c'est légal, c'est fiable, et ça fonctionne.

---

## Ce que ça change vraiment pour votre prospection

Je vais être direct.

La plupart des gens qui "utilisent l'IA pour prospecter" font du cosmétique. Ils génèrent des emails avec ChatGPT, ils demandent à Claude d'écrire leur message de connexion LinkedIn, et ils appellent ça de la prospection augmentée.

Ce n'est pas suffisant.

La vraie valeur, c'est en amont : **qui contacter, pourquoi eux, et dans quel ordre**. C'est ce que j'ai fait avec les 32 cabinets comptables. Et c'est ce que vous pouvez reproduire, que vous cherchiez des agences immobilières, des CGP, des cabinets RH, ou n'importe quel autre profil.

Quelques règles que j'applique systématiquement :

**Soyez géographiques.** Une liste nationale de 5000 prospects, c'est inutilisable. Une liste de 30 prospects dans votre zone, c'est exploitable dès aujourd'hui.

**Scorez avec votre logique métier.** Pas avec des critères génériques. Avec ce qui compte pour *vous* : taille d'équipe, secteur, présence digitale, maturité...

**Combinez les sources.** Google Maps pour les données locales, LinkedIn pour les décideurs, l'export de vos connexions pour les contacts chauds. Claude orchestre tout ça.

---

## En résumé : ce que vous pouvez faire dès cette semaine

1. **Installez Apify comme connecteur dans Claude.** Gratuit pour commencer, suffisant pour tester.
2. **Définissez votre zone et votre cible.** Soyez précis : ville + métier + critères de scoring.
3. **Lancez une première extraction Google Maps.** Demandez à Claude de vous retourner un tableau avec scores.
4. **Pour LinkedIn, utilisez Claude dans Chrome.** Pas d'Apify — accès direct depuis votre session.
5. **Passez à l'action.** La liste ne vaut rien si vous ne l'utilisez pas.

Brutal, mais libérateur.

---

Si vous voulez voir tout ça en direct, les mains dans le clavier, c'est exactement ce qu'on fait en formation. Le **17 juin**, on travaille Claude à travers Excel, PowerPoint et les connecteurs — dont Apify. Le **22 juillet**, on remet ça avec Claude Code, la création de site et la prospection avancée.

Places limitées. Ce n'est pas du marketing — c'est la réalité quand on fait du présentiel.

30 minutes pour en parler ? [Réservez ici.](https://calendly.com/thefrenchbot-coaching/30min)

Et si vous préférez commencer par la newsletter — chaque semaine, un cas concret comme celui-ci, sans blabla — [c'est par là.](https://forms.gle/VFNEeBGGMBstm1py5)

---

*Julian — The French Bot*
