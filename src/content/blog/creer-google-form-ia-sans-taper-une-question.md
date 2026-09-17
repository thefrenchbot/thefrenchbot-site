---
title: "Comment créer un Google Form de A à Z avec l'IA (sans taper une seule question à la main)"
description: "47 questions, 4 minutes, zéro copier-coller. Comment Claude génère un Google Form complet via Apps Script — sections, logique conditionnelle et lien de partage inclus."
pubDate: 2026-09-16
author: "Julian Luneau"
tags: ["Claude", "Google Form", "Automatisation", "Productivité", "Formation"]
---

47 questions. 4 minutes 16. Zéro copier-coller manuel.

C'est le temps qu'il m'a fallu pour créer un questionnaire de préaudit complet pour un cabinet d'expertise comptable — avec Claude, sans toucher à l'interface Google Form une seule fois. Pas pour rédiger les questions. Pour créer le formulaire entier, sections et logique conditionnelle comprises.

## Le problème que personne ne résout correctement

Je fais des préaudits avant chaque formation. Je pose des questions en amont pour coller à la réalité du client, pas pour lui vendre une formation générique qu'il aura payée pour rien.

Le discours ambiant sur l'IA et les questionnaires, c'est : "Demandez à Claude ou ChatGPT de vous générer des questions, puis rentrez-les dans Google Form." Sympa. Vous gagnez du temps sur la réflexion, vous perdez une heure trente sur la saisie.

C'est exactement ce que je faisais avant. Je jonglais entre l'onglet Claude et l'onglet Google Form. Copier la question, vérifier si c'est un choix unique ou des cases à cocher, retourner sur Google Form, ajouter le champ, coller, configurer. Question après question. Sur un questionnaire de 47 questions pour un gros cabinet comptable, ça représente une heure et demie de manutention pure.

Aïe. Une heure et demie à faire ce qu'une machine fait en quatre minutes.

## Ce que j'ai découvert (et que je n'avais pas vu)

À la fin d'une génération de questionnaire, Claude m'a signalé un détail que j'avais loupé : il peut générer directement le script qui construit le formulaire. Pas les questions à copier — le code qui crée le Google Form lui-même.

Concrètement, Claude produit du JavaScript. Vous n'avez besoin de rien comprendre à ce langage. Vous copiez le code, vous allez sur script.google.com, vous créez un nouveau projet, vous collez, vous cliquez sur "Exécuter". Google vous demande d'autoriser l'accès à votre Drive — logique, c'est là que vit votre formulaire. Vous validez.

Et voilà. Le script vous génère deux liens : un lien d'édition pour ajuster le questionnaire, un lien de partage prêt à envoyer.

C'est tout.

## Comment structurer le prompt pour que ça marche vraiment

Le piège classique, c'est de balancer un prompt vague du type "fais-moi un questionnaire sur l'IA". Vous obtenez dix questions génériques que n'importe quel générateur en ligne aurait pu produire.

Ma méthode, en trois étapes :

### 1. Donnez du contexte réel

Je récupère le transcript de ma visio avec le client via Granola (l'outil qui enregistre automatiquement mes appels). Je donne ce transcript à Claude avec les infos sur l'entreprise : secteur, taille, problématique. Sur mon exemple du cabinet comptable, ça donne des questions comme "Sur quel secteur avez-vous le plus de dossiers : BTP, automobile, industrie ?" ou "Votre compte CLM est-il testé ?" — des questions impossibles à générer sans connaître le client.

### 2. Validez le plan avant de lancer le script

Ne demandez pas directement le code. Demandez d'abord un plan de questions, une durée cible (3 à 5 minutes pour un questionnaire salarié, ça suffit), une structure en sections. Vous validez, vous ajustez, et seulement après vous demandez le JavaScript.

### 3. Précisez le comportement du script

Dites explicitement : formulaire en brouillon, collecte des emails désactivée si nécessaire (RGPD, on ne rigole pas avec ça), possibilité de relancer le script s'il retrouve le formulaire déjà créé.

Le pragmatique dira : "Je m'en fous du script, je copie mes dix questions en cinq minutes." Le stratège comprendra que sur un métier où vous multipliez les préaudits — courtage, RH, immobilier, conseil — les cinq minutes économisées par formulaire, multipliées par cinquante clients dans l'année, ça fait une différence qui se compte en journées de travail récupérées.

## L'usage réel derrière la démo : le multitâche

Ce qui compte le plus dans cette méthode, ce n'est pas le gain de quatre minutes en soi. C'est ce que vous faites pendant ces quatre minutes.

Pendant que Claude construit le script, je réponds à des mails. Je prépare un post LinkedIn. Je fais une autre visio. L'IA travaille en tâche de fond pendant que je continue à produire ailleurs. C'est la vraie bascule : arrêter de faire une tâche à la fois pour faire tourner plusieurs machines en parallèle, avec vous comme chef d'orchestre.

Et non, ce n'est pas de la triche. Enfin, si — c'est un code de triche. Mais dans un jeu où tout le monde a accès au même outil, celui qui ne l'utilise pas ne joue pas dans la même catégorie. Vous entrez dans une boîte sans utiliser l'IA aujourd'hui, d'ici six à huit mois vous êtes déclassé. C'est la même bascule qu'Internet en son temps — sauf que celle-là va plus vite.

## Ce qu'il faut retenir

Un générateur de questions IA ne suffit pas. Demandez le script de création du formulaire, pas juste le contenu.

Le contexte fait toute la différence : donnez un transcript réel, pas une consigne vague.

Ça fonctionne avec Claude et ChatGPT — le mécanisme (Apps Script) est identique.

Vérifiez toujours le formulaire généré avant diffusion. L'IA structure, vous validez.

Sur les données sensibles (RGPD, licences, usages internes), désactivez la collecte d'emails si le contexte l'exige.

Ce genre de méthode, c'est exactement ce qu'on construit en formation : pas de la théorie sur l'IA, des automatisations concrètes calées sur vos tâches du quotidien. Devis à répétition, mails en masse, préaudits — même logique.

Si vous voulez qu'on regarde ce qui, chez vous, mérite ce traitement, [30 minutes suffisent pour le savoir](https://calendly.com/thefrenchbot-coaching/30min).
