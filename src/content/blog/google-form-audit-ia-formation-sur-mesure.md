---
title: "Comment un Google Form + Claude remplace 2 jours d'audit manuel"
description: "J'ai transformé un simple Google Form en outil d'audit interactif qui bluffe mes clients avant même le premier jour de formation. Voici la mécanique complète."
pubDate: 2026-09-27
author: "Julian Luneau"
tags: ["Formation IA", "Audit", "Claude", "Google Forms", "Automatisation"]
---

69 000.

C'est le nombre d'entreprises qui vont fermer si personne n'embarque ses équipes sur l'IA correctement. Bon, ça c'est pour un autre article.

Aujourd'hui, je vous montre un truc plus terre à terre : comment j'ai transformé un simple Google Form en outil d'audit qui bluffe mes clients avant même le premier jour de formation.

## Le problème : former à l'aveugle

Soyons honnêtes.

La plupart des cabinets qui se lancent dans la formation IA font une erreur de débutant : ils arrivent avec un programme générique, le même pour tout le monde, et ils croisent les doigts.

Résultat ? Une formation qui rate sa cible pour la moitié de la salle.

Chez The French Bot, on ne fonctionne pas comme ça. Avant chaque formation, on fait un audit. On récolte la parole de chaque collaborateur : quelles tâches il fait déjà avec l'IA, où il bloque, ce qu'il utilise au quotidien sur le plan pro. On cartographie les habitudes de toute l'équipe. Et à partir de ça — et uniquement de ça — on construit une formation sur mesure.

Le problème, c'est qu'un audit qui donne un fichier Excel de 30 réponses à décortiquer à la main, ça prend un temps fou. Et ce temps, je préfère le passer à préparer une vraie prestation, pas à faire du tri manuel dans un tableur.

Alors j'ai changé de méthode.

## De Google Form à Claude : la mécanique complète

Voici le cas concret : un cabinet de géomètre-expert qui veut former son équipe.

**Étape un, le questionnaire.** On l'a fait avec Claude, entièrement. Pas juste rédiger les questions — générer le script Google qui construit le formulaire directement dans Google Forms. Vous collez le code, ça crée le questionnaire de A à Z. Zéro clic manuel dans l'interface Google.

**Étape deux, les réponses.** Plus de 30 retours, exportés en Excel. Et là, soyons raccord : étudier 30 réponses ligne par ligne, croiser les tendances à la main, c'est long, c'est chiant, et c'est le genre de tâche qui ne mérite pas votre temps de dirigeant.

J'ai donné le fichier Excel brut à Claude Code. Une seule consigne : montre-moi d'abord les grandes tendances, puis affine réponse par réponse. L'objectif, c'était d'arriver le jour de la formation en connaissant déjà les habitudes réelles de chaque personne dans la salle.

Et c'est là que ça devient intéressant.

## L'artefact React : le livrable qui change tout

Plutôt qu'un rapport PDF de plus, j'ai demandé un artefact React. Un outil interactif, cliquable, où on navigue dans les grandes tendances du questionnaire.

Vous savez quoi ? C'est ça, le vrai levier.

Un client qui reçoit un tableau Excel avec 30 lignes de réponses, il ferme le fichier et il oublie. Un client qui reçoit un outil visuel, interactif, où il clique et voit la cartographie de son équipe apparaître sous ses yeux — celui-là, il montre l'outil à son associé, à ses collaborateurs, à son comptable.

Je suis très visuel, et j'ai beaucoup de clients qui me remercient de leur donner un visuel plutôt qu'un tableau de chiffres. C'est exactement pour ça que je pousse ce format.

Mais il y avait un souci. L'artefact généré directement dans Claude vit derrière un lien claude.ai. Un lien privé, propre techniquement, mais qui ne fait pas très professionnel quand vous l'envoyez à un client qui paie plusieurs milliers d'euros une prestation de formation sur mesure.

## Le déploiement sur Vercel : le détail qui fait pro

Alors j'ai poussé l'artefact sur Vercel.

Résultat : un lien propre, hébergé, que je peux envoyer à mon client sans avoir l'air d'improviser un truc dans un coin. On clique, on ouvre, et on a directement accès à l'analyse complète des réponses au questionnaire.

C'est ce genre de détail qui ne se voit pas sur une plaquette commerciale, mais qui fait toute la différence dans la perception d'un client. Un cabinet de géomètre-expert qui investit dans une formation IA, il veut sentir qu'il a affaire à quelqu'un de sérieux, pas à quelqu'un qui bricole des slides PowerPoint la veille au soir.

Brutal, mais c'est comme ça que ça marche.

## Ce qu'il faut retenir

Trois choses à garder si vous voulez reproduire ce système :

**Un.** L'audit avant la formation n'est pas une option, c'est le socle. Sans lui, vous formez à l'aveugle, et vous le payez en efficacité.

**Deux.** Claude ne vous fait pas gagner du temps sur la création du questionnaire seulement. Il vous en fait gagner sur l'analyse, qui est la partie la plus chronophage et la moins valorisante de tout le processus.

**Trois.** Le format du livrable compte autant que le contenu. Un outil interactif hébergé proprement vaut dix rapports PDF envoyés par email.

C'est ça, le code de triche dont je parle souvent. Si vous êtes dans le jeu et que vous ne l'utilisez pas, vous vous posez la mauvaise question. La bonne question, c'est : dans 6 à 8 mois, si vous n'avez pas embarqué vos équipes sur l'IA, où est-ce que vous en serez face à ceux qui l'ont fait ?

Si vous voulez qu'on regarde ensemble comment structurer un audit pour votre équipe, [30 minutes, sans langue de bois](https://calendly.com/thefrenchbot/30min).
