---
title: "J'ai construit mon commercial qui ne dort jamais. Il s'appelle Elmer."
description: "Comment j'ai créé Elmer, un agent Claude Cowork connecté à Granola, HubSpot et Gmail, qui gère mon pipeline commercial pendant que je dors. Tuto étape par étape."
pubDate: 2026-07-02
author: "Julian Luneau"
tags: ["Claude", "Agents IA", "Commercial", "Automatisation", "TPE"]
---

Un deal qui traîne. Un devis qu'on a oublié d'envoyer. Une relance qui devait partir à J+3 et qui part à J+15, quand le client a déjà signé ailleurs.

Vous savez quoi ? Ça n'arrive jamais à cause d'un manque de compétence. Ça arrive parce que personne, dans une TPE, n'a une seule mission : surveiller le pipeline commercial 24 heures sur 24. Vous portez quinze casquettes, et celle du closeur méticuleux tombe toujours par terre en premier.

Alors j'ai réglé le problème autrement. J'ai construit un agent. Il s'appelle Elmer Deal Breaker, et il ne prend jamais de pause déjeuner.

## Le problème qu'on ne regarde jamais en face

Un commercial solo — ou un dirigeant qui fait aussi office de commercial, ce qui est le cas de 90% de mes clients — perd des affaires pour une seule raison : le suivi. Pas le talent de vente. Pas le prix. Le suivi.

Vous avez un appel avec un prospect un mardi. Vous notez trois actions dans un coin de votre tête : envoyer le devis, relancer à J+3, créer la fiche client dans le CRM. Le mercredi, vous avez deux autres appels, un client qui gueule sur un délai, une facture à faire. Et la fiche client ? Elle n'existe toujours pas. La relance ? Envolée.

**Ce n'est pas de la fainéantise. C'est de la surcharge cognitive.** Et aucun être humain, aussi discipliné soit-il, ne gagne durablement contre ça.

Ce qu'on ne vous dit pas assez dans le discours ambiant sur l'IA, c'est qu'elle n'est pas là pour vous remplacer sur le closing. Elle est là pour tenir le carnet que vous, humain fatigué, laissez systématiquement tomber.

## Comment j'ai construit Elmer, étape par étape

J'utilise Claude Cowork. Pour ceux qui ne connaissent pas encore, il y a trois briques dans l'univers Claude aujourd'hui. Le chat classique, pour discuter, rédiger un article de blog, une description YouTube — la version simple. Puis il y a Cowork, qui permet de construire des **plugins**. Et c'est avec ces plugins qu'on fabrique un véritable agent métier.

Voici l'image que je donne à mes clients en formation, parce qu'elle marche à tous les coups : imaginez que le plugin est un individu. Elmer, c'est cet individu. Et tous les outils qu'on lui connecte — Gmail, Granola, HubSpot — c'est l'immeuble dans lequel il habite et travaille. Le contexte, c'est son terrain de jeu. Sans lui donner les clés de l'immeuble, il ne peut rien faire.

### Étape 1 : donner les clés à Elmer

Dans Cowork, on crée une nouvelle tâche et on dicte le brief à Claude, en langage naturel, comme si on briefait un nouvel employé :

- Accès au connecteur **Granola** (l'outil de prise de notes en réunion)
- Accès aux **mails** (pour voir tous les échanges avec les clients)
- Accès à **HubSpot** (le CRM, là où vivent tous les contacts)

Et on décrit la mission : dès qu'un rendez-vous client se termine et que le transcript atterrit dans Granola, Elmer va vérifier si le client existe déjà dans HubSpot. S'il n'existe pas, il le crée. Et il génère automatiquement les tâches qui vont avec — envoi d'un devis, relance à J+3.

### Étape 2 : le rythme du scan

Claude n'a pas d'accès temps réel à Granola. Il pose lui-même la question : à quelle fréquence dois-je scanner ? On ne le laisse pas deviner, on tranche. J'ai choisi une fois par jour, à 18h, pour ne pas cramer trop de crédits inutilement.

Résultat : chaque soir, Elmer scanne les réunions du jour, met à jour ou crée les contacts, pose les tâches. **C'est tout.**

### Étape 3 : le bilan bihebdomadaire

Là où ça devient vraiment intéressant, c'est la deuxième mission que j'ai donnée à Elmer : deux fois par semaine — le lundi matin et le mercredi matin, à 8h — il croise mes mails, mon HubSpot et mon Granola, et il me sort un plan d'action.

"Julian, ça fait 3 jours que tu devais relancer Christophe qui devait te payer." "Tu avais promis un devis à ce prospect, tu ne l'as pas envoyé, tu es en train de perdre l'affaire."

Brutal, mais libérateur. Personne d'autre ne me dirait ça avec cette froideur factuelle un lundi à 8h.

## Pourquoi je n'utilise presque jamais Granola directement

Petite confession : j'ai Granola installé, je paie même l'abonnement, et je n'y mets quasiment jamais les pieds. Je l'utilise à travers Claude. C'est ça, la vraie bascule qui est en train de se produire : on ne va plus chercher l'info dans quinze applications différentes, on la fait remonter à un seul endroit, celui qui orchestre tout le reste.

Version gratuite de Granola : 30 jours d'historique. Version payante : 14 dollars par mois, mémoire illimitée. Le calcul est vite fait pour n'importe quelle activité commerciale un tant soit peu active.

## L'usage le plus rentable de Claude en 2026 : les agents par vertical

Voilà le point que je veux vraiment que vous reteniez. Ce qu'on vient de construire avec Elmer, ce n'est pas un cas isolé. C'est une méthode qui se réplique sur n'importe quel métier :

- Un agent RH qui scanne les candidatures et relance les entretiens en attente
- Un agent recrutement qui suit les process de A à Z
- Un agent commercial comme Elmer, qui garde le pipeline vivant

**C'est l'usage le plus performant de Claude aujourd'hui.** Pas le prompt isolé qu'on tape une fois. L'agent qui vit dans votre stack, connecté à vos vrais outils, qui tourne pendant que vous dormez.

Et pendant qu'on en parle : Sonnet 5 vient de sortir il y a quelques jours. Fable 5 fait son retour après une suspension liée aux contrôles à l'export américains, levée fin juin. Ce paysage bouge vite — trop vite pour attendre le moment "parfait" pour s'y mettre.

## Ce que ça change concrètement pour votre TPE

Un cabinet d'expertise comptable qui utilise l'IA et un cabinet qui ne l'utilise pas, dans 4 à 5 ans, ce n'est plus une question de confort. C'est une question de survie du cabinet. Je le dis sans filtre parce que c'est ce que je vois sur le terrain, formation après formation.

Les gains de productivité qu'on observe tournent autour de 25% sur les tâches administratives — l'administration française elle-même déploie des agents en interne et gagne un temps monstre. Alors un dirigeant de PME qui traite ses relances commerciales à la main en 2026, il ne se bat pas à armes égales.

Une heure ou deux récupérées chaque jour. Sur une semaine, ça fait une journée entière rendue au vrai travail : vendre, produire, développer. **C'est énorme.**

## Ce qu'il faut retenir

1. **Le problème n'est jamais la vente. C'est le suivi.** Réglez le suivi, vous réglez 80% des affaires perdues.
2. **Un agent, ça se construit en langage naturel.** Pas besoin de coder. Vous briefez Claude comme un nouvel employé, connecteur par connecteur.
3. **Donnez-lui un rythme, pas une présence permanente.** Un scan quotidien, un bilan bihebdomadaire — ça suffit largement et ça ne cramera pas vos crédits.
4. **Répliquez la méthode sur chaque métier de votre boîte.** RH, recrutement, commercial : même logique, connecteurs différents.

Arf. Je sais ce que certains vont penser : "encore un truc de plus à mettre en place." Sauf que ce truc, une fois configuré, il travaille pour vous pendant que vous dormez. Le temps de mise en place se rembourse en une semaine.

On a deux dates de formation Claude cet été : le **22 juillet** et le **12 août**. On y construit exactement ce genre d'agent, avec vos outils à vous, pas les miens. Si vous voulez qu'on regarde ensemble ce que ça donnerait dans votre activité, 30 minutes suffisent, sans langue de bois : [calendly.com/thefrenchbot-coaching/30min](https://calendly.com/thefrenchbot-coaching/30min).

Et si vous préférez recevoir ce type de décryptage directement dans votre boîte mail, sans spam, juste du concret : [inscrivez-vous à la newsletter](https://forms.gle/VFNEeBGGMBstm1py5).
