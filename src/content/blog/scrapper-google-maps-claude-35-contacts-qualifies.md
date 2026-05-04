---
title: "Scrapper Google Maps avec Claude : comment j'ai récupéré 35 contacts qualifiés en moins de 30 minutes (légalement)"
description: "35 cabinets de conseil en gestion de patrimoine. Nom, adresse, téléphone, site web, note Google. En moins d'une heure, sans écrire une ligne de code. Voici exactement comment j'ai fait avec Claude et la Places API de Google."
pubDate: 2026-05-01
author: "Julian Luneau"
tags: ["prospection", "google-maps", "scraping", "claude", "ia", "tpe-pme", "automatisation"]
---

35 cabinets de conseil en gestion de patrimoine. Nom, adresse, téléphone, site web, note Google. Sur mon bureau, en moins d'une heure.

Voilà ce que j'ai obtenu en branchant Claude sur Google Maps. Sans écrire une ligne de code. Moi. Julian. Celui qui ne sait toujours pas distinguer un float d'un integer.

Si vous cherchez un argument pour vous lancer sérieusement dans l'IA, j'espère que celui-là va faire son effet.

## Le vrai problème de la prospection B2B locale

Parlons vrai. La prospection, c'est le nerf de la guerre pour tout indépendant ou cabinet TPE/PME. Et le premier obstacle, avant même de décrocher son téléphone, c'est de trouver les contacts.

Vous avez trois options classiques :

**Option 1** — Vous achetez une base de données à un prestataire. Comptez entre 300 et 2 000 € pour des données souvent obsolètes, triées à la truelle, et que vous partagez avec 50 autres acheteurs.

**Option 2** — Vous construisez votre liste manuellement sur LinkedIn ou Google. Vous passez vos soirées à copier-coller des noms dans un tableur. C'est gratuit, c'est chronophage, et c'est déprimant.

**Option 3** — Vous scrapez.

Le scraping, c'est le fait d'extraire automatiquement des données publiques d'une plateforme. Dans notre cas : Google Maps. Et contrairement à ce que certains "gourous du growth hacking" vous vendent, il y a une façon légale de le faire.

C'est précisément ce qu'on va voir aujourd'hui.

## L'approche illégale vs l'approche intelligente

Avant d'aller plus loin, soyons clairs sur un point que beaucoup esquivent.

Il existe des outils qui grattent Google Maps sans autorisation. C'est rapide, c'est gratuit, et c'est une mauvaise idée. Votre adresse IP se fait détecter et bloquer. Vous récupérez des données incomplètes ou incorrectes. Et surtout, vous êtes hors des clous légaux.

L'approche que j'utilise passe par la **Places API de Google**. C'est l'accès officiel que Google propose aux développeurs — et aux non-développeurs qui savent bien s'entourer — pour interroger sa base de données de lieux. Le coût ? Quelques centimes par requête. Littéralement.

Pour 35 cabinets de gestion de patrimoine à Dijon, j'ai dépensé moins que mon café du matin.

Et j'ai tout fait avec Claude.

## Comment ça se passe concrètement, étape par étape

### Étape 1 — Ouvrir un projet sur Google Cloud

La première chose à faire, c'est de vous rendre sur Google Cloud Console. C'est le tableau de bord de Google pour accéder à ses API. Vous créez un nouveau projet — moi je l'ai appelé "Dijon Contact Google Maps", sans originalité excessive — et vous activez la Places API.

Google va vous demander un moyen de paiement. C'est normal. Vous ne payez que ce que vous consommez, et pour des volumes humains (50, 100, 200 contacts), on parle de quelques dizaines de centimes.

### Étape 2 — Générer et sécuriser votre clé API

Une clé API, c'est votre pass d'accès. Imaginez un port USB spécifique à votre projet, qui permet à Claude de se connecter à Google Maps.

Point important : **restreignez cette clé à votre adresse IP**. C'est une mesure de sécurité de base. Si quelqu'un met la main sur votre clé sans cette restriction, il peut faire des requêtes à votre place — à vos frais.

Google Cloud vous permet de faire ça en deux clics dans les paramètres de la clé.

### Étape 3 — Demander à Claude d'écrire le code

Et c'est là que ça devient intéressant.

Je me suis rendu dans Claude et j'ai simplement expliqué ce que je voulais faire : récupérer tous les cabinets de conseil en gestion de patrimoine à Dijon, avec leur nom, adresse, téléphone, site web et note Google.

Claude m'a sorti un script Python complet. Il m'a dit où coller ma clé API dans le code. Il m'a expliqué comment ouvrir mon terminal — cette petite fenêtre noire qui fait peur à 80% des non-développeurs — et comment coller le script dedans pour le lancer.

J'ai suivi les instructions à la lettre.

Résultat : 35 cabinets CGP récupérés en quelques secondes.

Attendez.

Ce n'est pas la fin.

### Étape 4 — Exporter et nettoyer les données

Les données brutes sortent parfois dans un format un peu ingrat. Dans mon cas, tout était regroupé dans une seule colonne Excel, avec des virgules comme séparateurs.

J'aurais pu passer 20 minutes à réorganiser ça manuellement.

À la place, j'ai ouvert Claude dans Excel — oui, Claude est maintenant intégré directement dans Excel — et je lui ai simplement montré le document en lui demandant de le restructurer en colonnes propres : nom du cabinet, adresse, téléphone, site internet, note.

En moins de deux minutes, le tableau était parfait.

Nom du cabinet. Adresse complète. Numéro de téléphone. Site web. Note Google. 35 lignes, prêtes à l'emploi.

C'est cette expérience-là qui m'a définitivement convaincu qu'on est passé dans une autre ère.

## Ce que ça change vraiment pour vous

La question que vous devez vous poser, ce n'est pas "est-ce que cette technique fonctionne" — elle fonctionne, on vient de le voir.

La vraie question, c'est : **pour quel secteur, dans quelle ville, et avec quel objectif ?**

Moi, j'ai ciblé les CGP à Dijon parce que c'est un secteur où je vois un fort potentiel d'automatisation : analyse de documents d'assurance, simulation d'investissement SCPI, préparation de recommandations patrimoniales. C'est mon terrain, je connais les douleurs.

Mais la même mécanique fonctionne pour :

- Les **agences immobilières** d'une ville cible, si vous vendez une solution de gestion locative ou de génération de leads
- Les **restaurants** d'un quartier, si vous proposez un système de réservation ou de réponse automatique
- Les **cabinets d'expertise comptable**, si vous formez des équipes à l'IA
- Les **artisans et TPE** de n'importe quel secteur, si vous êtes consultant ou prestataire de services

Ce que vous avez en main, c'est une base de prospection locale, fraîche, légale, et structurée. Pas une liste achetée il y a 18 mois avec 30% de numéros obsolètes.

Faites le calcul. 35 cabinets. Un taux de conversion de 10%, c'est 3 à 4 clients potentiels. Dans la plupart des secteurs, une mission couvre largement le coût de l'opération — qui, je le rappelle, se compte en centimes.

## Ce que j'ai retenu de cette manipulation

Quelques points pratiques avant de vous lancer :

**La clé API n'est pas optionnelle.** Le scraping non autorisé finit mal. Investissez 30 minutes pour configurer la console Google correctement — vous ne le regretterez pas.

**Claude vous guide pas à pas.** Vous n'avez pas besoin de savoir coder. Vous avez besoin de savoir décrire précisément ce que vous voulez, et de suivre les instructions. C'est ça, la compétence clé en 2025.

**Supprimez votre clé API après usage (ou désactivez-la).** Claude me l'a rappelé lui-même dans le chat. Ça m'a fait sourire, mais c'est un vrai conseil de sécurité — une clé exposée peut générer des coûts imprévus.

**La qualité des données dépend de Google Maps.** Les établissements sans site web ni email ne sortiront pas dans les résultats. Ce n'est pas un bug, c'est une limite de la source.

## Pour aller plus loin

Ce cas d'usage, c'est une brique parmi d'autres. Une fois que vous avez votre liste, encore faut-il savoir quoi en faire : personnaliser vos messages, automatiser vos relances, intégrer ça dans un CRM.

C'est exactement ce qu'on fait dans les formations The French Bot — pas de la théorie, pas du hype autour des outils. Du pratico-pratique, avec des cas concrets tirés du terrain.

Si vous voulez voir comment ça s'articule pour votre activité spécifiquement, 30 minutes suffisent pour en avoir une idée claire. Sans langue de bois, sans pitch commercial déguisé.

**[Réservez un créneau ici →](https://calendly.com/thefrenchbot)**

Et si vous préférez avancer à votre rythme, ma newsletter décrypte chaque semaine ce genre de manipulation concrète — avec les outils, les limites, et ce que ça vaut vraiment dans la vraie vie.

**[S'abonner à la newsletter →](https://thefrenchbot.com/#newsletter)**
