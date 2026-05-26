---
title: "J'ai automatisé mes mails en 15 minutes avec Claude et N8N. Voilà comment."
description: "Comment j'ai construit en 15 minutes un workflow N8N + Claude qui classe mes rendez-vous Calendly et prépare mes relances Gmail automatiquement — sans une ligne de code."
pubDate: 2026-05-26
author: "Julian Luneau"
tags: ["Automatisation", "N8N", "Claude", "Gmail", "Calendly"]
---

10 minutes. Un quart d'heure grand maximum. C'est le temps qu'il m'a fallu pour créer une automatisation qui tourne seule, classe mes rendez-vous, prépare mes mails de relance et les glisse directement dans mes brouillons Gmail. Sans toucher une ligne de code. Sans remplir un formulaire interminable.

Vous voulez qu'on regarde ça ensemble ?

---

[IMAGE : capture d'écran d'un workflow N8N avec nœuds colorés]

---

## N8N : pourquoi pas Make ou Zapier ?

Avant d'aller plus loin, posons les bases.

Vous connaissez peut-être déjà Make ou Zapier — deux outils d'automatisation très populaires, accessibles, bien fichés. Je les connais. Je les utilise. Ils ont leur place.

Mais N8N, c'est une autre catégorie. C'est une société allemande — et ça se sent dans la rigueur de l'outil. N8N vous donne une **architecture orientée ingénierie** : des workflows plus robustes, plus modulaires, plus résilients quand les choses se compliquent.

Arf. Je vous entends déjà : "Mais Julian, si c'est plus technique, c'est fait pour les développeurs non ?"

Et non.

C'est précisément là où Claude entre en jeu.

---

## Le problème concret que je voulais régler

Comme beaucoup d'entre vous, j'ai un lien Calendly. 30 minutes avec moi, sur réservation. Ça marche. Ça génère des appels, des clients, du chiffre.

Ça génère aussi des no-shows.

Des gens qui réservent, qui oublient de noter dans leur calendrier, qui disparaissent le jour J. Un créneau perdu, c'est un créneau qu'un autre prospect aurait pu prendre. Et à la fin du mois, ça fait une différence.

Mon besoin était simple : **dès qu'une réservation arrive, je veux un mail de rappel prêt à partir** — 2 jours avant, 1 heure avant — avec le prénom du prospect, l'heure du call, et une option simple pour me prévenir s'il ne peut pas venir.

Simple dans l'idée. Moins simple à construire sans outil.

---

[IMAGE : schéma du workflow Calendly → extraction données → Gmail brouillon]

---

## Comment j'ai construit ça avec Claude

Je n'ai pas ouvert la documentation de N8N. Je n'ai pas cherché un tutoriel YouTube de 45 minutes.

J'ai ouvert Claude et j'ai parlé.

J'utilise beaucoup **Whisper Flow** pour dicter en vocal — on dit que ça fait gagner quatre fois plus de temps sur la rédaction, et j'y crois. Donc j'ai simplement décrit ce que je voulais en langage naturel : mon Calendly, ma base de données clients, mes brouillons Gmail, mes relances automatiques.

Claude m'a sorti un **plan d'automatisation structuré**.

Et c'est là la méthode que j'enseigne en formation et que je vous recommande : ne le laissez jamais partir à toute berzingue dans une direction. Demandez d'abord un plan. Lisez-le. Corrigez-le. Validez-le. *Ensuite* vous lui dites de construire.

Une fois le plan validé, Claude a généré un fichier **JSON** — le format natif que N8N comprend. Je n'ai pas eu à comprendre ce fichier. Je l'ai téléchargé, je l'ai importé dans N8N avec la fonction "Import from file", et le workflow s'est déployé visuellement devant moi.

Vous savez quoi ? C'est beau à voir.

---

## Les noeuds ne se connectent pas tout seuls — et c'est là que ça devient intéressant

Soyons honnêtes : le workflow généré par Claude ne tourne pas parfaitement du premier coup. Les credentials ne sont pas configurées. Gmail n'est pas connecté. Les nœuds signalent des erreurs.

C'est normal. C'est attendu.

Ce que j'ai fait : j'ai pris une capture d'écran de chaque erreur, et je l'ai envoyée à Claude. "Regarde, mon Calendly trigger ne marche pas. Explique-moi comme si j'avais 5 ans."

Et il a vulgarisé. Étape par étape. En me montrant exactement quoi cliquer, où, dans quel ordre. À un moment, j'avais une faute de frappe dans "authorization" — j'avais oublié le "th". Il l'a repérée sur la capture d'écran.

**J'ai mis 10-15 minutes pour construire quelque chose qui tourne seul en production.**

Faites le calcul de ce que ça représente sur un an.

---

[IMAGE : brouillon Gmail généré automatiquement avec prénom et heure du call]

---

## Ce que ça donne concrètement

Aujourd'hui, dès qu'une nouvelle réservation arrive dans Calendly, le workflow :

1. Extrait les données (nom, prénom, email, motif de l'appel, niveau IA auto-évalué de 1 à 7)
2. Construit un mail personnalisé avec ces données
3. Le dépose dans mes brouillons Gmail à 15h08 — heure à laquelle j'ai fait le test

Je l'ai vu en live. J'ai ouvert mes brouillons pendant la démo. Le mail était là, propre, signé, prêt.

C'est ça l'automatisation qui a du sens : **elle vient s'agréger à ce que vous utilisez déjà**. Gmail, Calendly, votre CRM. Claude ne veut pas vous faire changer d'outil. Il se glisse dans votre existant et le rend plus puissant.

C'est d'ailleurs ce que j'adore dans cette approche : pas de révolution, pas de migration douloureuse. On automatise tout en gardant l'humain dans la boucle.

---

## Ce que vous pouvez répliquer dans votre boîte

N8N + Claude, ça ne s'arrête pas aux relances Calendly. Voici ce que ça peut faire pour une TPE ou un indépendant :

- **Classer vos mails entrants** par catégorie (clients, prospects, fournisseurs, administratif) et les router vers les bonnes boîtes
- **Alimenter votre CRM automatiquement** à chaque nouveau contact ou rendez-vous
- **Générer des rapports hebdomadaires** depuis votre base de données et les envoyer en PDF le lundi matin
- **Relancer vos devis non ouverts** après 48 heures sans réponse

La barrière technique a volé en éclats. Ce qui reste, c'est votre idée.

Et j'insiste là-dessus : **la personne qui a de bonnes idées en 2026 ira très loin.** L'outil est là. Il est puissant. Il est accessible. Ce qui freine les gens aujourd'hui, c'est psychologique, pas technique.

---

## Ce qu'il faut retenir (et faire cette semaine)

Trois choses concrètes si vous voulez commencer :

**1. Identifiez une tâche répétitive qui vous coûte du temps chaque semaine.** Pas la plus complexe. La plus visible. Les relances de mails, le classement des messages, les confirmations de RDV.

**2. Décrivez-la à Claude en langage naturel.** Dites-lui ce que vous voulez, pas comment le faire. Demandez un plan. Validez-le. Puis demandez le JSON N8N.

**3. Importez, configurez les credentials, testez.** Si ça bloque, prenez une capture d'écran et montrez-la à Claude. Dites "explique-moi comme si j'avais 5 ans." Il s'adapte.

C'est tout.

---

Brutal, mais libérateur : pendant que vous lisez cet article, certains de vos concurrents ont déjà automatisé ce que vous faites encore à la main. L'IA, c'est le code de triche. Vous pouvez l'utiliser ou regarder les autres avancer.

Le 17 juin, on passe une journée entière sur ces sujets — N8N, Claude dans Excel, Claude dans PowerPoint, et tout ce que j'ai automatisé dans mon entreprise. Si vous voulez voir comment ça se construit en live, 30 minutes avec moi suffisent pour qu'on évalue si c'est fait pour vous.

[Prenez votre créneau ici →](https://calendly.com/thefrenchbot-coaching/30min)

Et si vous voulez recevoir ce genre de décryptage chaque semaine, directement dans votre boîte mail :

[La newsletter The French Bot →](https://forms.gle/VFNEeBGGMBstm1py5)
