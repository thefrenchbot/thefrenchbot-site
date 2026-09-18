---
title: "Claude Fable 5 contre ChatGPT Astra 6 : j'ai demandé une vraie application. Aucun des deux n'a réussi du premier coup."
description: "Test grandeur nature de Claude Fable 5 et ChatGPT Astra 6 sur des cas d'usage métier. Résultat : le \"one shot\" est un mythe. Voici ce que ça change pour votre entreprise."
pubDate: 2026-09-18
author: "Julian Luneau"
tags: ["Claude", "ChatGPT", "Vibe Coding", "TPE-PME", "Test"]
---

28 euros dépensés. Un outil de pilotage commercial. Zéro fonctionnalité qui marche.

Voilà le bilan d'un de mes tests. Pas d'un modèle bas de gamme, mais de Claude Fable 5, l'un des deux meilleurs modèles du marché.

Aïe.

Je viens de mettre face à face Claude Fable 5 et ChatGPT Astra 6. Trois démos, trois cas d'usage concrets, pas de benchmark théorique. Et je vais vous dire ce que personne ne vous dit dans les vidéos "regardez, j'ai créé une app en 30 secondes".

[IMAGE : capture du duel Fable 5 vs Astra 6 côte à côte]

## Le match : trois cas d'usage, zéro triche

Le protocole était simple.

**Démo 1** : comprendre 1 000 lignes d'opportunités commerciales. Un gros fichier Excel (entreprise, segment TPE ou PME, statut gagné ou perdu) et un objectif : sortir un tableau de bord exploitable.

**Démo 2** : créer une application métier de A à Z. J'encadre beaucoup de géomètres experts. Leur matériel vaut une fortune : drones, théodolites, scanners 3D. Ces outils demandent un suivi de maintenance que leurs logiciels métier ne gèrent pas toujours. J'ai donc demandé un carnet de matériel.

**Démo 3** : un pilotage commercial sur mesure. Un mini CRM pour suivre mes prospects, mes relances, mes mails.

Passons à ce qui m'a le plus appris : les deux démos où il fallait que l'outil fonctionne.

## Le discours dominant : "une phrase, une application"

Vous l'avez vu passer cent fois. Un prompt, une appli prête à l'emploi. Le vibe coding présenté comme la fin des développeurs et des éditeurs de logiciels.

Permettez-moi de rire.

Le terrain raconte autre chose. Je forme et j'accompagne des entreprises depuis 2024, plus de 110 à ce jour. Le schéma est toujours le même : la démo est bluffante, l'usage réel est un autre sujet.

[IMAGE : capture d'une vidéo virale "j'ai créé une app en 30 secondes"]

## Démo 2 : le carnet de matériel pour géomètres

Côté Claude, je dialogue et je demande de créer le fichier index. L'outil s'exécute et le fichier arrive. L'environnement est plus complexe que celui de ChatGPT. Je le dis franchement : c'est un outil professionnel, pas un jouet. Il faut accepter de nettoyer une ligne de code ici ou là avant d'afficher le résultat.

Côté ChatGPT, j'ai généré la même version du carnet. Et sur l'interface, je suis largement convaincu. Le parc de matériel s'affiche proprement, je peux ouvrir la fiche d'une station totale, tout est lisible. Sur le visuel, il marque des points. C'est vrai.

[IMAGE : capture de l'interface du carnet de matériel généré par ChatGPT]

Puis je passe aux choses sérieuses. Je planifie une maintenance sur la station totale : désignation, numéro de service, note pour le fournisseur. J'enregistre.

Rien. La maintenance n'apparaît pas dans la liste.

Je refais un test avec un scanner 3D. L'application me répond "matériel ajouté", mais la maintenance reste introuvable. Je signale ensuite un incident, un scanner tombé chez un client à Dijon. Là, ça passe : la date se remplit toute seule, l'enregistrement fonctionne.

**Bilan : une application magnifique, à moitié fonctionnelle.**

Et non, ce n'est pas un détail. Un carnet de maintenance qui ne retient pas les maintenances, c'est un carnet vide.

## Démo 3 : le pilotage commercial à 28 euros

C'est là que ça pique.

Je voulais un outil simple. Quand j'ai un nouveau prospect, je le saisis. Je vois si je dois le relancer, si je lui ai envoyé un mail, s'il m'a rappelé. Une vraie liste de prospection, celle que n'importe quel dirigeant de TPE tient sur un coin de tableur.

Petit détail de contexte : je n'avais plus de crédits Astra 6 à ce moment-là. J'ai donc construit celui-ci avec Fable 5. Et Fable 5, ça consomme. J'ai dépensé près de 28 euros sur cette session. Le budget se voit vite.

[IMAGE : capture du compteur de consommation à 28 euros]

Le résultat ? Je suis déçu, et je le dis sans détour. Très peu de fonctionnalités, voire aucune, qui marchent. Impossible d'ajouter un nouveau prospect. La fonction la plus basique du produit.

Ce n'est pas du premier coup. Point.

## Ce que le terrain montre (et que les démos cachent)

Trois enseignements, tirés de ce que je vois chez mes clients.

**Le "one shot" n'existe pas pour un outil métier.** Ni chez OpenAI, ni chez Anthropic. Le premier jet donne une maquette avec des boutons qui ne branchent sur rien. C'est normal. Le problème, c'est quand on vous laisse croire le contraire.

**Le vrai travail commence au deuxième prompt.** Le bon réflexe n'est pas de jeter l'outil. C'est de décrire précisément le bug : "quand je clique sur planifier une maintenance, l'application ne se met pas en route". Quelques minutes plus tard, la correction arrive. Le carnet de matériel, je suis convaincu qu'il serait pleinement opérationnel en quelques échanges. La compétence qui compte, c'est de savoir tester, décrire un défaut et itérer. Pas de rédiger le prompt parfait.

**Le modèle le plus puissant n'est pas toujours celui qu'il faut payer.** Sur une automatisation, je démarre avec Fable 5 pour poser la logique, puis je descends progressivement vers des modèles moins gourmands quand le système est stable. Brutal, mais libérateur : votre facture baisse et la qualité reste.

[IMAGE : schéma de la stratégie de descente de modèle — gros modèle pour la logique, petit modèle pour la production]

## Ce qu'il faut retenir

Vous êtes dirigeant d'une TPE, courtier, agent immobilier, expert-comptable ? Voici ce que je ferais à votre place, dès cette semaine.

**Testez sur un cas réel, pas sur une démo.** Prenez un fichier de votre activité, pas un exemple générique.

**Vérifiez chaque fonction, une par une.** Ajouter, modifier, enregistrer, retrouver. Si une seule casse, l'outil n'est pas prêt.

**Prévoyez l'itération dans votre budget temps.** Comptez plusieurs échanges, pas un seul.

**Surveillez la consommation.** Un gros modèle sur un long chantier peut coûter cher. Commencez fort, descendez ensuite.

**Choisissez selon l'usage.** L'interface de ChatGPT m'a séduit sur ce test. Claude m'a paru plus proche d'un outil de pro. Le meilleur modèle, c'est celui qui fait tourner votre cas.

C'est tout.

Aucun modèle ne remplacera le jour où vous devez trancher ce que l'outil doit faire, tester ce qu'il fait vraiment, et corriger ce qu'il rate.

## Passer de la démo à l'outil qui tourne

Chez The French Bot, on accompagne des entreprises depuis 2024, avec des formations sur mesure, adaptées à la personne et à l'équipe. Si vous voulez savoir quel modèle et quel usage collent à votre activité, parlons-en. 30 minutes, sans langue de bois : [Prendre rendez-vous](https://calendly.com/thefrenchbot-coaching/30min).

Et chaque semaine, je décrypte ce genre de tests dans ma newsletter. Sans spam, juste du concret : [S'inscrire à la newsletter](https://forms.gle/VFNEeBGGMBstm1py5).
