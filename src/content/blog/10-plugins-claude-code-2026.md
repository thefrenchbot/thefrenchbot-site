---
title: "10 plugins pour transformer Claude Code en arme de guerre (en 2026)"
description: "Claude Code sans plugins, c'est un couteau suisse dont il manque la moitié des lames. Voici les 10 dépôts GitHub qui changent tout — j'aurais aimé avoir cette liste quand j'ai commencé."
pubDate: 2026-05-10
author: "Julian Luneau"
tags: ["Claude Code", "Plugins", "GitHub", "Outils IA", "Automatisation"]
---

Un adolescent de 15 ans. Un après-midi. Et l'Agence nationale des titres sécurisés — la maison de vos passeports et cartes d'identité — cracquée comme une noix.

Vous développez des outils avec Claude Code. Vous pensez que c'est sécurisé parce que c'est Claude qui a écrit le code. Vous avez tort.

C'est exactement le problème avec Claude Code "vanilla" : puissant, oui — mais borgne. Sans les bons plugins, vous construisez sur du sable. Voici les 10 dépôts GitHub qui changent tout. J'aurais aimé avoir cette liste quand j'ai commencé.

[IMAGE : capture d'écran d'un terminal Claude Code avec plusieurs plugins actifs]

## Pourquoi Claude Code seul ne suffit pas

Soyons honnêtes.

Claude Code permet aujourd'hui à quelqu'un qui ne sait pas écrire une ligne de code de construire un site internet de A à Z. Je l'ai fait. Mon site est en ligne, il tourne, il convertit. C'est magique ce qu'on vit en 2026.

Mais voilà ce que personne ne vous dit : Claude Code sans plugins, c'est un couteau suisse dont il manque la moitié des lames. Il code, oui. Mais il ne remet pas en question son propre code, il ne scrape pas efficacement le web, il n'a pas de mémoire persistante, et ses designs ressemblent tous à des clones sortis du même moule.

Arf. Autant dire que vous construisez une Ferrari avec un moteur de Twingo.

La solution ? Des dépôts GitHub — comprenez : des dossiers d'instructions spécialisées — qu'on vient greffer directement dans Claude Code. Chacun ajoute une capacité que Claude n'a pas nativement. Et ensemble, ils forment un arsenal.

## 1. Codex — Le relecteur impitoyable

Le problème : Claude écrit votre code. Mais qui vérifie le code de Claude ?

Codex, c'est le plugin développé par OpenAI en réponse directe à la montée en puissance de Claude Code. Et franchement ? C'est une bonne chose pour vous.

Concrètement, Codex agit comme un développeur externalisé que vous mettez en concurrence avec Claude. Vous lui donnez votre code et lui demandez de le challenger : failles de sécurité, erreurs de logique, vulnérabilités. Il ne ménage pas. C'est exactement ce qu'il faut.

Pour l'installer : copiez la ligne de commande depuis le dépôt GitHub et collez-la dans votre terminal Claude Code. Trente secondes.

## 2. Obsidian — Votre second cerveau

Claude tombe parfois. Et quand il tombe, si toute votre chaîne de valeur repose sur lui, vous êtes à l'arrêt.

Obsidian, c'est la décentralisation de votre mémoire. Imaginez une pieuvre : votre projet au centre, et toutes les informations connectées autour — vos pages, vos données, vos processus. Obsidian stocke ça dans une base de données locale, accessible même quand Claude est en rade.

La logique est simple : ne mettez pas tous vos œufs dans le même panier. Et si vous utilisez le plugin GitHub d'Obsidian, vous avez en plus un historique versionné de toute votre base de connaissances.

Vous copiez les deux lignes d'installation dans votre terminal et Claude Code s'en occupe. Il lit les instructions et installe à votre place.

[IMAGE : interface Obsidian avec un graphe de connexions entre différentes notes]

## 3. Auto Research — L'autocritique permanente

Voici l'outil que tout le monde sous-estime.

Auto Research, ce n'est pas un assistant de recherche. C'est un challenger automatique. Il remet en question votre approche PENDANT que vous travaillez, sans que vous ayez à lui poser la question. Vous construisez une formation ? Il interroge la structure pédagogique. Vous développez un site ? Il questionne l'architecture.

On n'a pas toujours le bon angle de vue sur nos propres projets. Auto Research, lui, il s'en fiche de votre ego. Il pose les questions gênantes.

Installez-le. Vraiment.

## 4. Le plugin Design — Sortir du moule Claude

J'arrive à voir de mes propres yeux quels sites ont été faits avec Claude ou non.

Il y a un style "Claude" reconnaissable entre mille : propre, correct, mais standardisé. Si tout le monde utilise le même outil sans rien changer, tout le monde livre le même résultat. C'est la loi des grands nombres appliquée au design.

Ce plugin change la donne. Il a ingéré les interfaces des sites les plus aboutis du web — Airbnb, des SaaS de référence, des plateformes primées — et les a transformé en instructions de design que Claude peut suivre. Vous obtenez quelque chose qui ressemble à du Stitch (l'outil de prototypage de Google) : typographie cohérente, dégradés intentionnels, hiérarchie visuelle réelle.

Pour le télécharger, vous sélectionnez votre modèle d'IA (Claude, Mistral, etc.), vous copiez la ligne dédiée et vous l'intégrez dans Claude Code.

## 5. Firecrawl — Le scraper qui contourne les barrières

Claude peut faire des recherches sur le web. Mais les sites ont des captchas. Des honeypots. Des bloqueurs de bots.

Firecrawl contourne tout ça via ce qu'on appelle une CLI — une instruction ultra-personnalisée, bien plus puissante qu'un MCP classique. Là où le MCP donne un contexte général, la CLI donne un ordre précis : ouvre ce dossier, lance ce programme, récupère ces données.

Exemple concret : aller scraper nike.com pour analyser leur structure de contenu, leurs prix, leur hiérarchie de pages. Ou surveiller vos concurrents. Ou récupérer des données publiques en masse pour alimenter vos analyses.

Une ligne de commande à copier-coller. Puissant.

[IMAGE : exemple de terminal Firecrawl en action avec des données scrappées]

## 6. Playwright — Le pilote automatique de votre navigateur

Playwright prend le contrôle de votre ordinateur et automatise des actions web. Envoyer des messages LinkedIn, remplir des formulaires, naviguer entre des pages — tout ça en mode automatique.

Vous avez peut-être entendu parler de Claude in Chrome, l'extension qui intègre Claude directement dans votre navigateur. C'est réel, ça marche, et c'est bluffant de voir Claude naviguer à votre place. Mais voilà le problème : Claude Chrome se base sur des captures d'écran. Il "voit" votre écran comme un humain le verrait. C'est lent. C'est énergivore.

Playwright, lui, lit le code de la page. Il comprend l'architecture sous-jacente, pas l'apparence visuelle. Résultat : dix fois plus rapide, beaucoup plus fiable.

Pour les automatisations web à grande échelle, Playwright écrase Chrome dans tous les benchmarks.

## 7. Notebook LM — L'IA de Google en CLI

Notebook LM, vous connaissez. L'IA de Google qui transforme vos sources en infographies, podcasts, présentations.

Ce que vous ne saviez peut-être pas : on peut le piloter depuis Claude Code via une CLI. Pas une MCP (plus limitée) — une CLI directe, plus puissante.

Cas d'usage réel : je prépare un contenu sur la Corse pour un client. Je donne mes sources à Notebook LM via le plugin, il me génère un plan de 7 jours structuré avec des recommandations par secteur géographique. Tout ça dans mon workflow Claude Code, sans changer d'outil.

L'installation se fait depuis le fichier README du dépôt GitHub. Copiez, collez, lancez.

## 8. Les Skills — La haute couture de l'IA

On me demande souvent si ça vaut le coup de télécharger des packs de 50 skills tout faits. J'en vends moi-même sur LinkedIn — avec 359 commentaires sur mon dernier post, le marché existe clairement.

Mais soyons honnêtes : un skill générique, c'est un costume de prêt-à-porter. Correct, mais jamais parfait.

Un skill taillé pour votre cas d'usage, c'est de la haute couture. Claude devient spécialisé exactement comme vous travaillez, pas comme "la moyenne des utilisateurs".

Le Skill Creator — intégré nativement dans Claude Code car développé par Anthropic eux-mêmes — vous guide pour créer vos propres skills. Il vous challenge sur vos idées, questionne vos workflows, et produit des instructions précises. Appelez-le simplement en lui disant "Je veux créer une nouvelle skill" et il prend la main.

Téléchargez les packs de 50 comme inspiration. Mais personnalisez. Toujours.

[IMAGE : comparaison visuelle entre un skill générique et un skill personnalisé — résultats côte à côte]

## 9. RAG Anything — La mémoire d'entreprise

Obsidian est parfait pour les indépendants et les petites structures. Mais si vous gérez des milliers de documents, des bases de données clients massives, des archives d'entreprise...

RAG Anything est une autre catégorie.

Un RAG (Retrieval-Augmented Generation), c'est un système qui agrège vos données, les connecte entre elles, et les rend interrogeables. Vous donnez des documents, il construit un graphe de connaissances. Vous posez une question, il retrouve les informations pertinentes dans la masse.

Cas concret : vous avez une activité de formation professionnelle et une passion pour l'événementiel. RAG Anything peut connecter ces deux univers et vous suggérer des formations à créer à partir de vos projets personnels. Le cerveau collectif de votre entreprise, rendu accessible en quelques secondes.

Pour les PME avec volume de données : indispensable.

## 10. Google Workspace — L'intégration totale

J'ai gardé le meilleur pour la fin.

Si vous utilisez Google comme moi — Gmail, Calendar, Drive, Docs, Sheets — ce plugin vous donne accès à tout votre univers Google depuis Claude Code. Pas via une interface graphique. Directement, en code, avec une précision chirurgicale.

La liste des capacités est vertigineuse : créer des événements Calendar, supprimer des fichiers Drive, modifier des Google Docs, alimenter des Google Sheets, envoyer des emails Gmail... Le tout orchestré par Claude, piloté par vous.

Vous voulez un reporting automatique qui récupère vos données de ventes dans un Sheet, les analyse, et envoie un email récapitulatif chaque lundi matin ? C'est possible. Maintenant.

Pour l'installer : README du dépôt, copier la commande, coller dans le terminal. Deux minutes chrono.

## Ce qu'il faut retenir

Voilà ce que le terrain me montre, formation après formation : les gens utilisent Claude à 5 ou 10% de sa capacité. Ils font des prompts. Ils obtiennent des réponses. Et ils s'arrêtent là.

Ces 10 plugins, c'est la différence entre utiliser Claude comme un moteur de recherche amélioré et l'utiliser comme un véritable système de travail.

Actions concrètes à prendre cette semaine :

- **Commencez par Codex** si vous développez des outils — la sécurité de votre code n'est pas négociable
- **Installez Obsidian** si vous n'avez pas encore de base de connaissances persistante
- **Créez un skill** sur votre workflow le plus répétitif — n'attendez pas d'avoir "le temps"
- **Configurez Google Workspace** si vous êtes sur la suite Google — c'est le ROI le plus rapide de cette liste

Ce n'est pas l'IA qui va vous remplacer. C'est le concurrent qui utilise l'IA dans votre secteur qui va vous passer devant. Et lui, il installe déjà ces plugins.

---

Vous voulez aller plus loin sur Claude Code ? On a deux dates de formation en 2026 — le mercredi 20 mai et le mercredi 17 juin. 7h de live, du présentiel, du pratico-pratique. Commentez "formation" sur le post LinkedIn associé à cet article ou écrivez-moi directement à contact@thefrenchbot.com. Je vous envoie les détails.

Chaque semaine, je décrypte ce genre d'outils dans ma newsletter. Pas de spam, juste du concret : [inscription ici](https://forms.gle/VFNEeBGGMBstm1py5)
