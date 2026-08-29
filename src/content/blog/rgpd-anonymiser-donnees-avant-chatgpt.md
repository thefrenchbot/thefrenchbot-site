---
title: "Vous envoyez vos dossiers clients à ChatGPT ? Le RGPD n'attend pas votre excuse."
description: "Trois outils concrets pour anonymiser vos données sensibles avant de les envoyer à une IA — Presidio, Aux Redxs, Limina. RGPD et déontologie obligent."
pubDate: 2026-08-29
author: "Julian Luneau"
tags: ["RGPD", "IA", "Anonymisation"]
---

La CNIL n'a pas besoin de vous prendre la main dans le sac. Il lui suffit d'un signalement, d'un contrôle de routine, ou d'un client mécontent qui pose la mauvaise question. Et si vous êtes avocat, médecin, ou expert-comptable, la question qui tue est simple : "Vous avez collé mon dossier où, exactement ?"

Soyons honnêtes : la majorité des professionnels qui utilisent l'IA au quotidien copient-collent des données sensibles sans se poser la question. Pas par malveillance. Par ignorance, ou par flemme. Sauf que le RGPD s'en fiche de vos excuses, et votre déontologie encore plus.

Alors voici trois outils qui font le travail à votre place : anonymiser ou pseudonymiser vos données avant qu'elles ne rentrent dans un prompt.

## Pourquoi ce sujet ne peut plus attendre

Le problème n'est pas nouveau, mais il devient urgent. De plus en plus de cabinets — avocats, experts-comptables, professionnels de santé — intègrent l'IA dans leur quotidien. Rédaction de conclusions, synthèse de dossiers médicaux, analyse de bilans comptables : l'usage explose.

Le hic, c'est que ces données sont, par nature, sensibles. Un dossier médical, une conclusion d'avocat, un bilan client : tout ça tombe sous le coup du RGPD, et souvent sous une déontologie professionnelle qui interdit purement et simplement la fuite de données vers un tiers non maîtrisé.

Et un modèle d'IA grand public, c'est un tiers non maîtrisé. Point final.

Deux discours dominent en ce moment. Le premier : "L'IA c'est risqué, on n'y touche pas." Le deuxième : "On verra bien, ça n'arrivera pas chez nous." Les deux sont faux. Le terrain montre autre chose : on peut utiliser l'IA sereinement, à condition d'anonymiser ou de pseudonymiser en amont. Ce n'est pas une option de confort. C'est un prérequis.

## Microsoft Presidio : l'option open source pour les cabinets équipés

Premier outil : **Microsoft Presidio**. C'est une solution open source, donc gratuite à l'usage, qui tourne en local.

L'avantage est évident : vos données ne sortent jamais de chez vous. Aucune donnée envoyée à un serveur tiers. Pour un cabinet qui manipule des dossiers médicaux ou des pièces judiciaires, c'est exactement le niveau de contrôle qu'on cherche.

L'inconvénient, lui, est tout aussi évident : il faut une machine capable de le faire tourner. Un ordinateur puissant, ou mieux, une machine dédiée en interne — un Mac Mini ou une puce suffisamment costaude. On peut aussi l'installer sur un VPS, mais la mise en place est plus technique et ce n'est pas l'objet de cet article.

**Pour qui ?** Les structures qui ont déjà (ou peuvent investir dans) une infrastructure interne, et qui veulent zéro dépendance à un service en ligne.

## Aux Redxs : la solution en ligne qui détecte tout seul

Deuxième outil, plus accessible : **Aux Redxs**. Celui-là fonctionne en ligne, ce qui change la donne pour les cabinets qui n'ont ni le temps ni les moyens de gérer une infrastructure locale.

Le principe est simple : vous fournissez vos informations, l'outil détecte automatiquement ce qui pose problème. IBAN, adresse email, numéro de téléphone — il repère les données sensibles et vous permet de les masquer en quelques clics.

C'est du concret, du rapide, et ça fait le travail sans demander de compétences techniques particulières.

**Pour qui ?** Les professionnels qui veulent une solution immédiate, sans installation ni maintenance.

## Limina : l'offre gratuite qui a ses limites

Troisième outil : **Limina**. Il propose un plan starter gratuit, jusqu'à 75 requêtes par jour.

Attention cependant : 75 requêtes, ça sonne bien sur le papier, mais dans la vraie vie, c'est vite serré. On l'a mis en place chez un client récemment. Verdict : ça ne suffisait pas. Il a fallu passer au plan supérieur.

Si votre usage reste occasionnel — quelques documents par semaine, pas un flux quotidien — le plan gratuit peut suffire. Si vous anonymisez au quotidien, prévoyez le budget pour l'offre payante dès le départ. Ça vous évitera une déconvenue.

**Pour qui ?** Les petits usages, ou les cabinets qui veulent tester avant d'investir.

## Ce qu'il faut retenir

Trois outils, trois logiques différentes :

- **Microsoft Presidio** : gratuit, local, mais demande une infrastructure.
- **Aux Redxs** : en ligne, rapide, détection automatique.
- **Limina** : gratuit jusqu'à un certain volume, payant au-delà.

Aucun de ces outils n'est un gadget. Ce sont des garde-fous face à deux obligations qui ne négocient pas : le RGPD d'un côté, votre déontologie professionnelle de l'autre. Avocat, professionnel de santé : vous n'avez tout simplement pas le choix d'anonymiser ou de pseudonymiser vos données avant de les confier à une IA.

On l'a fait pour des cabinets de santé. On l'a fait pour des avocats. Résultat : un outil qui fonctionne en interne, sans jamais faire sortir la moindre donnée de leurs locaux. C'est exactement ce niveau d'exigence qu'il faut viser.

Un guide complet existe, avec une liste exhaustive de solutions gratuites et payantes selon vos cas d'usage — PDF, Excel, Word. Commentez "anonymisation" sous la vidéo correspondante et il vous sera envoyé.

Vous voulez qu'on regarde ensemble ce qui se passe réellement dans vos dossiers avant de foncer tête baissée dans l'IA ? On commence toujours par un audit. 30 minutes, sans langue de bois : [calendly.com/thefrenchbot-coaching/30min](https://calendly.com/thefrenchbot-coaching/30min).
