---
title: "La fin du baby-sitting IA. Enfin."
description: "La commande /goal de Claude Code change la donne : l'IA travaille en boucle jusqu'à ce que la tâche soit vraiment terminée. Fini de surveiller comme un stagiaire."
pubDate: 2026-06-02
author: "Julian Luneau"
tags: ["Claude Code", "Agents IA", "Productivité", "Automatisation"]
---

Vous avez déjà demandé à Claude de faire une liste de 50 contacts, et récupéré... 20 noms avec un grand sourire ?

*"J'ai effectué cette tâche."*

Non. Tu as effectué la moitié. L'autre moitié, elle est restée dans ta tête en espérant que tu ne vérifies pas.

C'est ce que j'appelle le **baby-sitting IA** : cette obligation permanente de surveiller ce que fait l'intelligence artificielle comme si c'était un stagiaire en première semaine. Tu poses ta question, tu reviens, tu relis, tu corriges, tu relances. Et tu passes autant de temps à surveiller l'outil qu'à bosser toi-même.

Jusqu'à ce que quelqu'un chez Anthropic décide que c'était assez.

---

[IMAGE : capture d'écran de Claude Code avec la commande /goal visible, fond sombre terminal]

---

## `/goal` : deux lettres qui changent votre manière de travailler

La commande `/goal` dans Claude Code, c'est simple à expliquer. Tant que la tâche n'est pas finie — vraiment finie, pas "j'ai fait semblant de terminer" — l'IA continue.

Mais derrière ce principe simple, il y a une architecture qui mérite qu'on s'y arrête deux minutes.

Claude ne travaille plus seul. Il se scinde en **deux agents distincts** :

- **Un exécutant** — Sonnet ou Opus selon ce que vous configurez — qui fait le boulot.
- **Un évaluateur** — en général Haiku, le modèle le plus léger — qui vérifie si le boulot est vraiment fait.

L'évaluateur, c'est votre chef de chantier. Il ne pose pas les parpaings. Il tourne, il inspecte, et si c'est raté, il dit *"recommence"*. Et ça recommence.

Arf. Je sais ce que vous vous dites : *"Super, ça tourne en boucle et j'explose ma facture."*

Oui. Si vous bâclez votre prompt.

---

## Le vrai danger : la boucle infinie

Posez une requête floue — *"trouve-moi des formateurs IA"* — sans définir ce que "terminé" veut dire, et vous obtenez une machine à brûler des crédits.

L'évaluateur dit non.
L'exécutant recommence.
L'évaluateur dit non.
L'exécutant recommence.

Ad vitam aeternam. Jusqu'à ce que votre session soit à sec.

C'est pour ça que **la définition du "terminé" est non négociable**. Ce n'est pas une bonne pratique, c'est la condition de survie du workflow.

Pour mes propres cas d'usage — je vais y venir — je structure toujours ma requête avec quatre blocs :

1. **La mission claire** — ce qu'on cherche, précisément
2. **La sortie attendue** — format, nom des fichiers, emplacement
3. **La définition du terminé** — critères vérifiables (tel fichier existe, contient telles sections)
4. **Les garde-fous** — *"arrête après 20 itérations"*, *"ne modifie aucun fichier en dehors du dossier désigné"*

Ce dernier point est critique. Sans limite d'itérations, vous jouez à la roulette russe avec vos crédits. Et selon votre plan, une session peut représenter 5h de fenêtre hebdomadaire.

Autant ne pas la claquer en 40 minutes.

---

[IMAGE : schéma illustrant l'architecture agent exécutant / agent évaluateur avec boucle d'itération]

---

## Mon cas concret : qualifier des prospects pendant que je répondais à des clients

Je vais vous montrer ce que ça donne sur du terrain, parce que les exemples abstraits, c'est pratique pour les slides, pas pour la vie réelle.

J'avais une liste de prospects : des gens qui m'avaient contacté, qui s'étaient montrés intéressés par mes formations ou mes missions. Des noms, des boîtes, des secteurs. Je voulais savoir *vraiment* qui ils étaient avant de les relancer.

Ma requête à Claude Code, avec `/goal` :

> *Effectue une recherche approfondie sur chacun de ces prospects. Pour chaque personne, crée un fichier Markdown nommé selon son nom, structuré en quatre sections : présentation de l'entrepreneur ou de l'entreprise / outils technologiques actuellement utilisés / points de douleur probables liés à l'adoption de l'IA / angle d'approche personnalisé pour mes services.*
>
> *Sortie : un dossier "brief-prospect-thefrenchbot" dans mes téléchargements. La tâche est terminée quand chaque prospect du fichier source a son fichier Markdown avec ses quatre sections complètes. Limite : 20 itérations maximum.*

Résultat : pendant que je répondais à des messages, que je passais un appel, que je faisais autre chose — Claude travaillait.

Vous savez quoi ? En revenant à mon écran, j'avais trois fichiers complets. Guillaume, Roland, et deux autres. Avec leur historique professionnel, leurs outils détectés via LinkedIn, leurs points de friction probables avec l'IA, et un angle d'approche sur mesure pour les alpaguer.

Du travail que j'aurais mis une heure à faire manuellement — franchement, probablement plus. Fait pendant que j'existais ailleurs.

C'est ça, la vraie promesse des agents. Pas l'IA qui répond à vos questions. L'IA qui avance sur vos dossiers pendant que vous avancez sur autre chose.

---

## Ce que ça change vraiment pour vous

Arrêtons-nous une seconde. Parce que ce n'est pas juste un "outil pratique de plus". C'est un changement de posture.

Jusqu'ici, l'IA vous demandait votre attention permanente. Vous étiez le pilote, avec la main sur le manche à chaque instant. La moindre distraction et la tâche s'arrêtait à mi-chemin.

Avec les agents en boucle — et `/goal` en est l'expression la plus directe dans Claude — vous passez de pilote à chef de mission. Vous briefez. Vous validez le plan. Vous partez faire votre vie.

**L'IA s'exécute.**

Brutal, mais libérateur.

Ce n'est pas de la magie. C'est de l'organisation. Celui qui brief bien récupère du travail propre. Celui qui brief vaguement récupère une session brûlée et du temps perdu. La compétence ici, ce n'est pas de savoir coder — c'est de savoir décrire précisément ce qu'on veut, avec une condition de sortie mesurable.

Et ça, contrairement à Sonnet ou Opus, ça ne s'achète pas au crédit.

---

[IMAGE : capture du dossier téléchargements avec les fichiers .md générés, style finder macOS]

---

## Ce que j'observe sur le terrain

Je forme des dizaines d'indépendants et de dirigeants de TPE/PME chaque mois. Ce que je vois, c'est que la plupart utilisent encore l'IA comme un moteur de recherche évolué. Ils posent une question, ils lisent la réponse, ils passent à la suivante.

C'est utile. Mais c'est la surface.

Les agents qui travaillent en autonomie — que ce soit via `/goal`, via des workflows n8n, ou via Claude Code avec des compétences personnalisées — c'est le niveau au-dessus. Celui où l'IA fait avancer vos projets pendant que vous faites autre chose.

Vos concurrents commencent à comprendre ça. Certains l'ont déjà compris.

La fenêtre d'avantage compétitif n'est pas infinie. Elle ne l'a jamais été.

---

## Pour commencer sans se planter

Si vous voulez tester `/goal` sans douleur, voilà le minimum viable :

- Utilisez Claude Code (pas Claude.ai — c'est une fonctionnalité du terminal)
- Écrivez votre requête avec les quatre blocs que je vous ai donnés plus haut
- Fixez une limite d'itérations basse les premières fois (10-15 max)
- Commencez par une tâche courte avec un résultat très mesurable

Et si vous vous dites *"je comprends le principe mais je vois pas comment l'appliquer à mon activité"* — c'est exactement pour ça que j'ai créé les formations.

Le 17 juin et le 22 juillet 2026, on passe deux jours à mettre tout ça en place. Agents, automatisations, Claude dans vos outils quotidiens. Du concret, du terrain, zéro bullshit.

30 minutes pour voir si c'est fait pour vous, sans engagement : [reservez ici](https://calendly.com/thefrenchbot-coaching/30min)

Ou la newsletter chaque semaine si vous préférez avancer à votre rythme : [s'inscrire](https://forms.gle/VFNEeBGGMBstm1py5)

---

*Julian — The French Bot*
*contact@thefrenchbot.com | www.thefrenchbot.com*
