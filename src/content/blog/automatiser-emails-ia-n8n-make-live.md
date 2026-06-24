---
title: "10 mails non lus, brouillons vides — et pourtant, ça a marché"
description: "Automatisation email en live avec N8N et Make : setup, plantage, correction et résultat. Le guide terrain pour TPE/PME qui veulent gagner des heures."
pubDate: 2026-06-25
author: "Julian Luneau"
tags: ["Automatisation", "N8N", "Make", "Email", "IA"]
---

10 mails non lus. Brouillons vides. Et pourtant, ça a marché.

C'est la première chose que je voudrais vous dire avant même de rentrer dans le sujet : ce que vous allez lire, c'est pas une démo léchée tournée trois fois pour faire genre. C'est un setup en direct, avec les ratés au milieu. Parce que la vraie automatisation, elle ressemble à ça — pas à une publicité Apple.

## Le problème que tout le monde a et que personne ne règle

Pendant nos questionnaires préformation, on prend le pouls des équipes avant chaque session Claude. On leur demande : quelles sont les tâches répétitives qui vous bouffent du temps sans apporter de valeur ?

La réponse qui revient systématiquement, peu importe le secteur ? Les emails.

Répondre aux mêmes questions. Relancer les mêmes prospects. Rédiger les mêmes accusés de réception. Des heures par semaine, englouties dans une tâche qui n'a aucune valeur stratégique. Et non, ce n'est pas réservé aux grosses structures avec un service client de quinze personnes. C'est exactement la même chose pour un courtier solo ou une TPE de trois employés.

**Alors j'ai décidé de monter le scénario en live, de A à Z, avec deux outils : N8N et Make.**

## N8N vs Make : arrêtez de chercher LE meilleur outil

Première chose à clarifier, parce que c'est la question qu'on me pose tout le temps : lequel est le meilleur ?

Mauvaise question.

N8N permet des choses beaucoup plus complexes. Si vous le maîtrisez déjà, vous êtes sur le bon choix, entre guillemets. Mais si vous partez de zéro, Make va vous permettre de faire la même chose sans vous noyer dans la complexité technique.

Petite précision qui compte pour votre trésorerie : Make est plus cher que N8N à l'usage. Vous avez des crédits gratuits au départ, comme sur la plupart des IA — et au-delà d'un certain seuil, le robinet du gratuit se coupe. Vous passez à l'abonnement.

Donc oui, je préconise N8N sur le long terme. Mais Make reste une excellente porte d'entrée pour comprendre la logique avant de monter en complexité.

[IMAGE : schéma comparatif N8N vs Make — courbe de complexité / coût]

## Le schéma de base : trois briques, et c'est tout

Le scénario qu'on va construire ensemble repose sur une logique simple, qu'on soit sur Gmail ou Outlook :

1. **Réception du mail** sur votre boîte
2. **Passage dans la moulinette de l'IA** pour générer une réponse
3. **Création d'un brouillon** — jamais un envoi automatique

Trois étapes. Pas vingt-cinq. C'est tout l'intérêt de commencer simple.

### Étape 1 : brancher la boîte mail

Premier module : on choisit "Watch emails". Concrètement, ce module scanne votre boîte et identifie les mails qui n'ont pas eu de réponse.

Petit conseil terrain : prenez l'option qui couvre toutes les boîtes mail, pas seulement Gmail. Ensuite, choisissez où il va chercher — boîte de réception, messages envoyés, spams. Restez sur "inbox", tous les messages, sans critère, et limitez à 10 messages maximum par run. Pas besoin de plus pour tester.

### Étape 2 : brancher l'intelligence artificielle

Deuxième module : OpenAI, et le modèle "Generate a response". C'est lui qui rédige la réponse.

Ici, une précision technique qui compte : quand vous connectez OpenAI directement, vous n'êtes plus sur votre abonnement ChatGPT classique. Vous passez par l'API, et vous puisez dans des crédits séparés — typiquement 10€ chargés sur votre compte OpenAI.

**Conseil clé : prenez un modèle "mini".** Pas la version la plus puissante. Pour ce type de tâche — répondre à un email simple — un modèle léger fait le job, consomme moins de crédits, et reste largement suffisant.

Le prompt que j'ai utilisé, pour vous donner une base de départ :

*"Tu es l'assistant email de Julian Luneau, fondateur de The French Bot, formation pour TPE/PME. Tu reçois un mail et tu rédiges une réponse directe sans poser de questions. Le ton est chaleureux, direct, un peu pro. Si pertinent, tu proposes un rendez-vous avec le lien vers le Calendly."*

Pourquoi "sans poser de questions" ? Parce qu'on est dans un système automatisé — il n'y a personne pour répondre à l'IA si elle pose une question en retour. Donc on bloque cette option dès le prompt.

Et là, on peut aller beaucoup plus loin : segmenter par type de demande. Mail sur les formations → réponse A. Mail service client → réponse B. Mail facturation → réponse C. Vous compartimentez vos réponses selon le sujet détecté.

[IMAGE : capture du prompt OpenAI dans Make]

### Étape 3 : la création du brouillon (jamais l'envoi)

Troisième et dernier module : "Create draft". Pas "Send".

**Je ne vous laisse jamais l'IA envoyer un mail les yeux fermés. Jamais.** L'automatisation, ce n'est pas l'abdication. Vous gardez la main sur l'envoi final, vous vérifiez, et vous cliquez. Si déjà 50% du travail de rédaction est fait par la machine, c'est déjà énorme.

Dans ce module, vous reliez : l'adresse de destination (récupérée depuis le module 1), l'objet, et le corps du texte — qui doit pointer vers la réponse générée par OpenAI à l'étape 2.

## Là où ça a planté (et pourquoi c'est utile de le savoir)

Premier run : dix brouillons créés. Tous vides. Zéro contenu, juste le nom du destinataire.

Aïe.

Le module était bien connecté — la preuve, il créait bien des brouillons à 15h43, 15h44, en chaîne. Le problème : la liaison entre le texte généré par OpenAI et le champ "body" du brouillon n'était pas enregistrée correctement. Une fois corrigée, deuxième run : les réponses arrivent, complètes, cohérentes, avec proposition de rendez-vous et lien Calendly intégré.

**C'est exactement ce point qui sépare une automatisation qui marche d'une automatisation qui fait illusion en démo.** Le diable est dans le câblage des champs, pas dans le choix de l'outil.

[IMAGE : capture des brouillons générés dans Gmail]

## Ce que ça change concrètement pour vous

Sur cette session, plus d'une dizaine de réponses ont été générées et placées en brouillon, prêtes à être vérifiées et envoyées en quelques secondes chacune.

Multipliez ça par votre volume hebdomadaire de mails répétitifs. Vous voyez où ça mène.

Mais attention à un point : ce que je vous ai montré reste une version basique. Pour un usage en production, sur du service client par exemple, il faut compartimenter les réponses par type de demande, affiner le ton selon le contexte, et parfois enchaîner plusieurs workflows selon la nature du mail.

C'est exactement ce qu'on construit en formation Claude — pas la théorie de l'automatisation, le câblage réel, avec les pannes et les corrections en direct.

## Ce qu'il faut retenir

- **Make ou N8N** : commencez par Make si vous débutez, migrez vers N8N quand la complexité de vos besoins le justifie
- **Modèle IA léger** ("mini") suffit largement pour de la rédaction d'email standard
- **Brouillon, jamais envoi automatique** — l'humain garde la main sur le clic final
- **Testez avec un petit volume** (10 messages) avant de scaler
- **Le câblage des champs entre modules** est le point de défaillance le plus fréquent, pas le choix de l'outil

Aujourd'hui, ne pas utiliser l'intelligence artificielle dans votre entreprise, c'est comme arriver au bureau en disant que vous n'utilisez pas l'ordinateur. Votre place se retrouve vite sur la touche.

On a deux dates de formation Claude pour creuser ce genre d'automatisation avec votre propre boîte mail : le 22 juillet et le 12 août. 30 minutes avec moi pour parler de vos besoins précis, sans langue de bois : [calendly.com/thefrenchbot-coaching/30min](https://calendly.com/thefrenchbot-coaching/30min)
