---
title: "MCP Pennylane : votre comptabilité vient de rejoindre l'IA. Et non, ce n'est pas du marketing."
description: "Pennylane sort son connecteur MCP : interrogez vos comptes, clients et rapports financiers depuis Claude, ChatGPT ou Mistral. Ce que ça change vraiment pour les cabinets et les dirigeants."
pubDate: 2026-08-05
author: "Julian Luneau"
tags: ["MCP", "Pennylane", "Comptabilité", "IA", "Expert-comptable"]
---

Mardi 4 août. Pennylane sort son connecteur MCP. Mercredi 5 août, je vous écris ces lignes en l'ayant déjà branché sur trois assistants IA différents. Zéro export. Zéro copier-coller. Zéro fichier Excel qui traîne sur un bureau.

On va pas se mentir : les annonces "révolutionnaires" dans la comptabilité, j'en ai vu défiler des dizaines depuis un an. Celle-ci mérite qu'on s'arrête dessus. Pas parce que c'est magique — parce que c'est du concret, tout de suite exploitable, pour les cabinets comme pour les dirigeants.

## Le MCP, pour ceux qui débarquent

Le protocole MCP — Model Context Protocol — a été introduit par Anthropic, la société derrière Claude, en novembre 2024. Son rôle : servir de connecteur universel entre votre assistant IA et vos outils du quotidien.

Prenez un exemple simple. Vous dites à Claude : "J'ai une ordonnance pour une IRM à la cheville, prends-moi un rendez-vous." Le MCP va chercher dans votre calendrier, puis dans Doctolib, et vous propose des créneaux. Pas de bascule d'application. Pas de recherche manuelle. L'IA fait le pont.

Aujourd'hui, ce pont existe pour Pennylane. Votre assistant IA — Claude, ChatGPT ou Mistral — peut interroger directement votre environnement comptable. Vous posez la question dans la conversation, il va chercher la donnée. C'est tout.

**Brutal, mais libérateur.**

## Ce que le connecteur peut faire aujourd'hui — et ce qu'il ne peut pas encore faire

Soyons raccord : ce MCP est en **lecture seule**. Vous pouvez interroger vos comptes, vos clients, vos fournisseurs, vos rapports financiers, vos journaux, vos déclarations de TVA. Vous ne pouvez pas encore créer une facture ou un devis depuis votre assistant.

Ça viendra. Pennylane l'annonce clairement, l'écriture arrivera dans un second temps. Je le fais déjà avec Qonto pour ma propre facturation, donc je sais que le mouvement est enclenché sur l'ensemble des outils financiers.

Mais ne sous-estimez pas ce que la lecture seule permet déjà. Voici les scopes accessibles : comptes, journal des modifications, clients, rapports financiers, journaux, produits, fournisseurs, transactions, déclarations fiscales, déclarations de TVA.

Concrètement, ça veut dire que vous pouvez déjà :

- Lister vos cinq plus gros clients et les classer par chiffre d'affaires
- Vérifier, entreprise par entreprise, si une lettre de mission est bien en face de chaque client de votre portefeuille
- Croiser vos ventes avec votre compte en banque pour identifier votre dépendance réelle à un client
- Auditer en quelques minutes ce qui prenait avant des heures d'export et de nettoyage de fichiers

Avant, pour faire ce travail, vous exportiez des données depuis Pennylane, vous nettoyiez des fichiers Excel, vous croisiez à la main. Maintenant, une requête en langage naturel fait le travail. C'est ce changement d'échelle qui compte, pas la promesse.

## Le discours qu'on vous vend vs ce que je vois sur le terrain

Le discours dominant sur l'IA en cabinet comptable, c'est "gain de temps massif, révolution du métier, l'expert-comptable de demain". J'entends ça depuis deux ans. C'est vrai sur le papier.

Ce que je vois vraiment, en accompagnant plus d'une trentaine de cabinets d'experts-comptables depuis mai 2025 : la majorité des collaborateurs n'ont jamais testé un connecteur MCP de leur vie. Ils ont entendu parler de ChatGPT, peut-être utilisé Claude une fois pour reformuler un mail. Le fossé entre le discours et l'usage réel est énorme.

**Et non**, ce n'est pas de la mauvaise volonté. C'est un problème d'accompagnement. Personne ne leur a montré, étape par étape, comment brancher un outil comme ça sur leur environnement de travail réel.

D'ici 6 à 8 mois, si les cabinets ne prennent pas ce virage, l'écart avec ceux qui l'ont pris va devenir difficile à rattraper. Ce n'est pas de l'alarmisme, c'est de l'arithmétique : un cabinet qui audite ses lettres de mission en 5 minutes contre un cabinet qui le fait en deux jours, sur un portefeuille de 300 clients, ce n'est pas la même année.

## Comment le connecter — étape par étape

Le processus est quasi identique sur ChatGPT, Claude et Mistral.

**Sur ChatGPT** : dans la section plugins/connecteurs, vous créez un MCP personnalisé. Vous nommez le connecteur "Pennylane", vous collez l'URL de la documentation Pennylane fournie par l'éditeur, vous validez. ChatGPT vous avertit — normal, c'est une mise en garde standard sur les connecteurs personnalisés pour éviter les malwares. Rien d'inquiétant ici, le MCP est bien créé par Pennylane. Vous vous connectez ensuite avec votre email et votre mot de passe Pennylane, et vous acceptez les scopes de lecture proposés.

**Sur Claude** : même logique, dans la colonne des connecteurs personnalisés. Vous ajoutez un nouveau connecteur, vous le nommez, vous collez la même URL, vous vous authentifiez.

**Sur Mistral** : section connecteurs, ajout d'un MCP personnalisé, même URL, même nom.

Trois outils, une seule manipulation à apprendre. Une fois fait, vous n'y touchez plus.

## Ce que ça change concrètement pour vous

**Si vous êtes dirigeant de TPE/PME** : vous n'avez plus besoin d'attendre votre expert-comptable ou d'ouvrir Pennylane pour avoir une photo de votre activité. Vous demandez directement à votre assistant : "quels sont mes cinq plus gros clients ce trimestre" ou "quelle part de mon chiffre d'affaires dépend de mon client X". Vous pilotez avec de la donnée en temps réel, pas avec un tableau Excel vieux de trois semaines.

**Si vous êtes cabinet d'expertise comptable** : vous gagnez un outil d'audit interne redoutable. Lettres de mission manquantes, cohérence des dossiers, contrôle qualité — tout ce qui était fastidieux devient une requête. Ce n'est pas un gadget, c'est un levier de productivité directe sur vos missions récurrentes.

Vous savez quoi ? C'est exactement le genre de cas d'usage qu'on travaille en formation. Veille juridique, création de lettres de mission, recherche fiscale, automatisation des mails — le MCP Pennylane vient s'ajouter à une bibliothèque de cas d'usage qu'on déploie déjà depuis un an dans les cabinets.

## Ce qu'il faut retenir

- Le MCP Pennylane est sorti le 4 août, accessible dès maintenant sur Claude, ChatGPT et Mistral
- Accès en lecture seule pour l'instant : comptes, clients, fournisseurs, rapports financiers, TVA, transactions
- L'écriture (factures, devis) arrivera plus tard — ce n'est pas encore le cas
- La connexion prend 5 minutes, la même manipulation sur les trois outils
- L'usage réel reste minoritaire dans les cabinets, malgré le discours ambiant

Utilisez ce code de triche pendant qu'il est encore un avantage. Dans six mois, ce sera juste la norme, et vous n'aurez plus d'avance.

Si vous voulez qu'on regarde ensemble comment brancher ça — et le reste de votre stack — sur votre cabinet ou votre entreprise, 30 minutes suffisent pour savoir si ça vaut le coup. [Calendly](https://calendly.com/thefrenchbot-coaching/30min), sans langue de bois.
