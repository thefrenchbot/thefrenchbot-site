---
title: "J'ai créé un agent commercial avec un plugin Claude. Voici ce que personne ne vous dit sur cet outil."
description: "14 skills empilées dans un seul plugin, c'est la mort assurée. Retour d'expérience sur la construction d'un agent commercial avec Claude — pièges, méthode et leçons concrètes pour TPE et PME."
pubDate: 2026-09-01
author: "Julian Luneau"
tags: ["Claude", "Skills", "Plugin", "Prospection", "Formation IA"]
---

**14 skills empilées dans un seul outil. Résultat : la mort assurée.** C'est Claude lui-même qui me l'a dit, en pleine démo, devant mes clients.

Et c'est exactement pour ça que cet article existe.

## Le problème que tout le monde ignore avec les skills

Depuis des mois, je forme des dirigeants de TPE et de PME à créer des skills. Une skill, c'est une recette qu'on donne une fois à Claude — ma façon de faire une newsletter, mon plan pour une lettre de mission, mon script d'appel type. Je lui donne la recette, il l'exécute à l'infini. Fini de retaper le même prompt quinze fois par semaine.

Sauf que voilà le truc que personne n'anticipe : une skill toute seule, c'est un outil isolé. Elle sait faire une chose. Une seule. Et le vrai travail d'un dirigeant, lui, n'est jamais isolé. Prospecter un client, ça veut dire consulter sa boîte mail, vérifier son calendrier, chercher des infos sur le web, croiser des contacts LinkedIn, rédiger un message, puis suivre dans le temps. Six actions. Six skills différentes, potentiellement.

Alors on fait quoi ? On les enchaîne à la main, une par une, en perdant un temps fou ? Non. On les regroupe dans un plugin.

## Le plugin, ou comment arrêter de réexpliquer votre métier tous les matins

Un plugin, c'est un agrégateur. Il prend plusieurs skills, plusieurs connecteurs — votre messagerie, votre calendrier, un outil de scraping — et il les chaîne dans un vrai workflow. Un processus complet, avec un début, des étapes, une fin.

Prenez un expert-comptable qui rédige des lettres de mission. Il donne son gabarit à Claude, ses exemples types, et hop : c'est intégré dans le plugin. La logique est simple et elle mérite d'être répétée, parce qu'elle change tout : vous enseignez votre métier une fois, l'IA comprend, elle agit, et elle répète à l'infini.

C'est là que je voulais aller plus loin. Pas une skill de plus. Un système entier.

Alors j'ai décidé de construire, en direct, un plugin agent commercial.

## L'agent commercial : donner une cible, obtenir un client

L'idée de départ était simple sur le papier. Je donne une offre, une cible, un persona type. Le plugin fait le reste : il trouve le bon prospect, détecte qui peut faire l'introduction, prépare le script d'appel.

Le système que j'ai voulu bâtir tient en six étapes.

**Clarifier le persona.** Qui je vise ? Des dirigeants, des cadres supérieurs. Pour ça, j'ai branché un connecteur de scraping — un outil qui va parcourir des sites, récupérer des informations publiques, et me redonner une base exploitable.

**Qualifier.** Est-ce que ce cadre correspond vraiment à mon offre ? Est-ce que je m'adresse à la bonne personne dans l'entreprise ? C'est le moment où on filtre le bruit.

**Choisir le canal.** Appel, LinkedIn, mail ? Ça dépend entièrement de la personne en face. Pas de recette universelle ici — c'est du cas par cas.

**Apprendre des refus.** Et ça, c'est le vrai métier d'entrepreneur. Aller voir des gens, proposer sa solution, se prendre des murs. La question n'est pas d'éviter le refus — c'est d'apprendre à revenir plus fort après.

**Créer la confiance.** Dès le premier message, envoyer les bons signaux. Voir s'il existe des relations LinkedIn communes avec le prospect. Parce qu'une recommandation, ça vaut de l'or — "on a un entourage commun" désamorce 80% de la méfiance initiale.

**Suivre dans le temps.** Une fiche d'action par prospect. Parce que le problème n'est jamais de décrocher le téléphone une fois. C'est de ne pas oublier de relancer deux semaines plus tard.

Voilà l'architecture. Maintenant, la partie intéressante : ce qui s'est passé quand j'ai vraiment demandé à Claude de le construire.

## Pourquoi j'ai laissé l'IA me contredire

Première chose que j'ai faite avant même de lancer la construction : j'ai donné à Claude le pouvoir de me challenger. Explicitement. Je lui ai dit : pose-moi des questions, remets en question mes choix, ne me valide pas juste parce que je te le demande.

Et non, ce n'est pas de la politesse gratuite. C'est un garde-fou indispensable.

Une IA a une tendance naturelle à vous flatter, à vous dresser dans le sens du poil. Si vous ne lui donnez pas explicitement la permission de vous contredire, elle vous dira que votre idée est géniale même quand elle est bancale. Résultat : vous perdez votre esprit critique, votre matière grise s'atrophie, et vous n'avancez plus. Vous stagnez en pensant progresser.

La preuve, ça n'a pas traîné. Claude m'a tout de suite tiqué sur le connecteur de scraping couplé à LinkedIn. Son argument : c'est mal cadré juridiquement, vous vendez ça à des clients déjà paranoïaques sur la conformité, et le jour où le compte LinkedIn d'un client se fait suspendre à cause de votre plugin, c'est votre réputation qui morfle.

Objection recevable. Je l'ai quand même validée — parce que dans mon cas, c'est un outil interne, pas un produit que je revends tel quel. Mais l'objection méritait d'être posée. Et c'est passé à côté : quatorze skills en version 1, c'est la mort assurée. Beaucoup trop de complexité d'un coup. Un système ingérable dès le premier jour.

Ça, c'est un point que je vois revenir sans arrêt chez mes clients formés. On veut tout automatiser d'un coup, la totale, le grand soir de la productivité. Résultat : un monstre ingérable qu'on abandonne au bout de trois semaines. Mieux vaut trois skills qui tournent parfaitement qu'une usine à gaz qui plante.

## Le vrai piège : l'IA ne comprend pas toujours ce que vous voulez du premier coup

Voilà où ça devient intéressant. Ma première requête n'a pas donné le résultat attendu. Claude m'a construit... une démo. Un document de présentation, le genre de support qu'on montrerait à un client pour vendre le concept.

Sauf que ce n'était pas du tout ma demande. Je voulais un outil de travail interne, pas une plaquette commerciale.

Alors je lui ai dit non, clairement. Pas de démo. Un vrai plugin, opérationnel, intégré dans mon environnement de travail quotidien.

Et c'est là que je veux insister sur un point central. Ne prenez jamais le premier résultat d'une IA comme parole d'évangile. Le premier jet est rarement le bon jet. Ce qui fait la différence entre quelqu'un qui utilise vraiment l'IA et quelqu'un qui se contente de la subir, c'est l'œil critique. C'est la capacité à dire "non, ce n'est pas ça" et à recadrer immédiatement.

Une fois la correction faite, le résultat a radicalement changé. Le plugin préparait réellement l'appel téléphonique : recherche sur le prospect, cartographie des relations communes, un score de pertinence de l'offre par rapport au client, et une évaluation du canal de contact le plus pertinent.

C'est ça, un plugin bien construit. Pas un gadget qu'on montre en démo. Un outil qu'on utilise tous les jours, sans y penser.

## Ce que ça change concrètement pour une TPE ou une PME

Vous êtes courtier en crédit à Dijon, agent immobilier à Lyon, consultant RH à Bordeaux ? Ce que je viens de décrire n'est pas un gadget de tech bro. C'est un changement de méthode.

Aujourd'hui, dans une entreprise, si vous dites "je n'utilise pas Internet", on vous regarde de travers. On vous dit que c'est du délire, qu'on ne peut pas faire tourner une boîte sans. Bon Dieu, dans six à huit mois, ce sera exactement le même constat pour l'intelligence artificielle.

Et attention, le piège n'est pas d'ignorer l'outil. Le piège, c'est de l'utiliser mal. Si vous envoyez des requêtes basiques à Claude, vous obtenez des résultats basiques. Vos concurrents qui montent en compétence, qui construisent de vrais systèmes plutôt que des prompts jetables, vont vous distancer. Pas dans cinq ans. Cette année.

## Ce qu'il faut retenir

Ne construisez pas quatorze skills d'un coup. Commencez petit, avec un vrai processus métier que vous répétez chaque semaine.

Donnez explicitement à l'IA la permission de vous contredire. Sans ça, elle vous dira toujours que c'est parfait — même quand ça ne l'est pas.

Ne validez jamais le premier résultat sans le challenger. Le premier jet sert à cadrer, pas à livrer.

Distinguez bien une skill (une recette isolée) d'un plugin (un système complet de workflow). Un plugin sans skills claires derrière, c'est du vent.

Et surtout : commencez par cartographier votre process réel avant de toucher à l'outil. C'est exactement ce qu'on fait en amont de chaque formation — un audit de votre journée type, de vos devis, de vos échanges clients, avant de connecter le moindre outil.

Si vous voulez qu'on regarde ensemble comment un plugin comme celui-ci s'applique à votre métier, 30 minutes suffisent, sans langue de bois. [Calendly](https://calendly.com/thefrenchbot-coaching/30min)

Chaque semaine, je décrypte ce genre de cas concret dans ma newsletter. [Je m'inscris](https://forms.gle/VFNEeBGGMBstm1py5)
