---
title: "Créer un site internet avec Claude Code et Vercel : j'ai testé pour vous (et le résultat m'a surpris)"
description: "J'ai déployé une landing page complète en moins d'une heure, sans toucher à une ligne de code. Voici exactement ce que j'ai fait, comment ça s'est passé, et ce que ça change pour vous."
pubDate: 2026-05-03
author: "Julian Luneau"
tags: ["Claude Code", "Vercel", "Site internet", "Landing page", "Création web"]
---

Vous savez ce qui me tue avec le monde du développement web ? L'idée que créer un site internet, c'est l'affaire des "gens techniques". Des devs avec cinq ans de formation, un terminal ouvert en permanence et une collection de memes sur les frameworks JavaScript.

En 2025, c'est une excuse qui tient plus.

J'ai déployé un site internet complet — landing page, témoignages, FAQ, CTA, calendrier intégré — en moins d'une heure. Sans toucher à une ligne de code. En parlant à voix haute.

Voilà exactement ce que j'ai fait, comment ça s'est passé, et ce que ça change concrètement pour vous.

[IMAGE : capture d'écran du site final déployé sur Vercel, vue desktop]

## La barrière technique est morte. Ce qui reste, c'est votre imagination.

On va pas se mentir : il y a encore deux ans, créer un site internet sans développeur, c'était soit Wix (et vous aviez honte de donner l'URL), soit WordPress (et vous passiez trois semaines à lutter contre des plugins cassés).

Claude Code change la donne. FONDAMENTALEMENT.

Ce n'est pas un générateur de templates. Ce n'est pas un constructeur drag-and-drop. C'est un agent qui comprend ce que vous voulez, qui pose des questions quand il en a besoin, qui corrige lui-même ses erreurs — et qui déploie votre site directement sur internet.

La barrière elle n'est plus technique. Elle est dans la capacité à imaginer, à projeter, à articuler ce qu'on veut. Et ça, vous l'avez déjà.

## Claude Code : qu'est-ce que c'est concrètement ?

Pour ceux qui découvrent, Claude Code c'est l'interface en ligne de commande de Claude — celle qui vous permet de lui demander de créer des fichiers, d'écrire du code, de déployer des applications. C'est la version "mains dans le cambouis" de l'IA.

Dans l'écosystème Claude, vous avez trois modes :

- La partie chat classique — vous posez des questions, vous obtenez des réponses. Simple, efficace.
- Cowork — l'agent semi-autonome qui peut prendre le contrôle de votre ordinateur, aller sur LinkedIn, classer vos dossiers, interagir avec vos outils.
- Claude Code — la création technique pure : code, fichiers, déploiement.

C'est ce troisième mode qu'on utilise pour créer des sites internet.

Le modèle ? Sonnet 4.6. C'est l'équilibre parfait entre performance et rapidité pour le quotidien. Il y a des niveaux supérieurs (notamment vers 4.7), mais pour 95% des cas d'usage, Sonnet fait le job sans forcer.

[IMAGE : schéma des trois modes Claude — Chat, Cowork, Code — avec icônes]

## Le protocole : de l'idée au site en ligne

Voilà ce que j'ai tapé dans Claude Code. Mot pour mot :

> "Je veux que tu déploies un site internet Astro qui va me permettre ensuite d'être déployé sur Vercel. Avec ce site internet, je veux présenter mes formations sur l'intelligence artificielle à Dijon en présentiel."

C'est tout. Pas de specs techniques. Pas de brief de 40 pages. Une phrase.

Il a pris le relais.

Claude Code a immédiatement activé une skill — une compétence préconfigurée, en l'occurrence un "landing page generator". Il a posé quelques questions ciblées : mes offres principales, ma charte graphique, le lien de mon calendrier.

Et là, j'ai fait quelque chose que je ne recommande pas toujours : j'ai dit "invente une charte graphique fictive". J'avais envie de voir ce qu'il allait sortir sans ma palette habituelle. Un peu d'audace.

Aïe — premier couac. Il a déployé le site sur Netlify au lieu de Vercel. Ce n'est pas un drame — Netlify est un outil valide — mais c'était pas l'objectif de la démo. Et il a demandé un mot de passe que je n'avais pas.

Donc je lui ai dit, à la voix : "Non, je veux pas déployer sur Netlify, je veux Vercel."

Il a recorrigé. Et livré.

## Le résultat : honnêtement, j'étais bluffé

Voilà ce que le site contenait, sans que je lui aie demandé explicitement :

- Une section héro avec l'accroche "L'IA qui vous fait gagner 10h" — il a inventé ça. Seul.
- Trois offres tarifées : L'IA Starter à 500€, L'IA Intensive à 1 000€, le Pack Automatisation à 1 400€.
- Les trois étapes de mon parcours client : appel de découverte, formation en direct, suivi des résultats.
- Une section témoignages.
- Une FAQ.
- Mon profil en bas de page : "Julian, fondateur de The French Bot."

C'est une landing page complète. Elle défile. Elle est propre. Elle est audacieuse dans le design.

Et elle est EN LIGNE. Avec une URL Vercel.app opérationnelle.

Je dois avouer que j'ai failli l'utiliser telle quelle — et je suis fondateur d'une boîte d'IA, j'en vois des dizaines par mois.

[IMAGE : vue mobile du site généré — section héro et offres]

## Ce que vous devez comprendre sur Vercel (et pourquoi c'est le bon outil)

Vercel, c'est la plateforme qui va "pousser" votre code sur internet. Elle transforme vos fichiers locaux en site accessible depuis n'importe quel navigateur, partout dans le monde.

Deux options concrètes :

- **Vercel.app** — gratuit, vous avez une URL du type monprojet.vercel.app. C'est parfait pour des prototypes, des outils internes, des landing pages de test.
- **Nom de domaine custom** — vous branchez votre domaine classique (thefrenchbot.com par exemple) sur Vercel en quelques clics.

Ce que j'apprécie avec Vercel, c'est sa simplicité. Claude Code s'y intègre nativement. La boucle création → déploiement → mise en ligne prend littéralement quelques minutes.

Pour des sites comme des Waze, des Airbnb, des Netflix — non, soyons sérieux. Mais pour une landing page, un outil métier simple, un générateur interactif, un site de présentation ? AMPLEMENT suffisant.

## Le vrai sujet : qu'est-ce que ça débloque pour vous ?

Permettez-moi de rire d'une chose : en 2023, des agences web facturaient 3 000 à 8 000 euros pour une landing page pareille. Un site avec FAQ, témoignages, trois offres, formulaire de contact.

Là, on parle d'une heure de travail. Avec Claude Code. Pour un résultat professionnel.

Je ne dis pas que les développeurs vont mourir — loin de là. Pour des applications complexes, des logiciels métier, des intégrations pointues, ils restent indispensables. Mais pour créer votre présence en ligne, tester une offre, déployer un outil pour votre équipe ? La barrière technique n'existe plus.

Ce qui compte désormais, c'est votre capacité à :

- Articuler clairement ce que vous voulez
- Itérer rapidement avec l'agent
- Savoir reconnaître un bon résultat quand vous en voyez un

Ça, c'est pas technique. C'est de la compétence humaine pure.

[IMAGE : comparaison avant/après — site basique vs site Claude Code — ou screenshot du terminal Claude Code en action]

## Ce qu'on voit aussi dans nos formations

Dans nos sessions avec des TPE et PME, ce cas d'usage revient régulièrement. Un artisan qui veut une page pour ses prestations. Un consultant qui veut tester une nouvelle offre sans payer une agence. Un responsable RH qui veut déployer un formulaire candidature interne.

Dans tous ces cas, Claude Code + Vercel est la réponse. Pas un constructeur de site. Pas une agence. Un agent IA + une plateforme de déploiement.

Et dans ces mêmes formations, on va encore plus loin :

- Claude dans Excel — automatiser la gestion de données sans toucher aux formules complexes
- Claude dans PowerPoint — générer des présentations structurées depuis un brief
- Les automatisations quotidiennes — les tâches qui vous grignotent la santé mentale, semaine après semaine

L'objectif n'est jamais de vous rendre dépendant de l'IA. C'est de vous en rendre maître.

## Ce que vous devez retenir

Un site internet, aujourd'hui, c'est une phrase bien formulée dans Claude Code + Vercel. C'est tout.

Le reste — la technique, le code, le déploiement — c'est l'affaire de l'agent.

Votre travail à vous : savoir ce que vous voulez, être capable de le dire clairement, et itérer jusqu'au résultat.

Si vous créez encore des sites à l'ancienne — ou pire, si vous n'en avez pas parce que "c'est trop technique" — c'est le moment de mettre à jour vos croyances.

---

**Deux dates de formation : mercredi 20 mai et mercredi 17 juin.**

On y couvre Claude Code, Vercel, les automatisations, Claude dans Excel et PowerPoint, et les cas d'usage concrets pour votre activité. En présentiel, à Dijon. En petits groupes.

Commentez FORMATION en dessous de la vidéo, ou réservez directement votre appel de découverte ici : [Calendly 30 min](https://calendly.com/thefrenchbot)

Et si vous voulez recevoir chaque semaine ce genre de décryptage — sans hype, sans bullshit, juste du concret — rejoignez la newsletter : [S'abonner ici](https://www.thefrenchbot.com)

---

*Julian Luneau — Fondateur, The French Bot*
*contact@thefrenchbot.com | www.thefrenchbot.com*
