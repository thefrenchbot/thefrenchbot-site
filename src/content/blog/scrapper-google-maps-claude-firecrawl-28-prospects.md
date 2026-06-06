---
title: "Scrapper Google Maps avec Claude et Firecrawl : 28 prospects en 3 minutes"
description: "28 structures d'aide aux seniors extraites de Google Maps en 3 minutes avec Claude et Firecrawl. Noms, adresses, téléphones, emails — sans logiciel à 200 €. Voici comment exploiter les boring businesses."
pubDate: 2026-06-06
author: "Julian Luneau"
tags: ["scraping", "firecrawl", "claude", "prospection", "boring-business", "google-maps", "automatisation"]
---

**3 minutes.** C'est le temps qu'il m'a fallu pour extraire 28 structures d'aide aux seniors sur Dijon, avec noms, adresses, téléphones et emails. Pas de logiciel à 200 € par mois. Pas de stagiaire qui copie-colle pendant deux jours. Juste Claude, un connecteur, et une idée claire.

Attendez. Je vous explique.

---

## Les "boring businesses" : ceux que personne ne regarde vont tout rafler

On parle beaucoup des métiers menacés par l'IA. Les consultants, les rédacteurs, les comptables — les fameux cols blancs. Et c'est vrai : ces métiers vont muter, certains vont disparaître.

Mais pendant que tout le monde panique sur les jobs de bureau, personne ne regarde ce qui se passe de l'autre côté.

Les métiers du réel. La conciergerie, la facturation de PME, l'aide aux seniors, la climatisation, les artisans, les bornes électriques. Des secteurs que personne ne trouve sexy. Que personne ne veut racheter. Que personne ne met dans un pitch deck.

On appelle ça les **boring businesses**. Les business ennuyeux.

Et non. Ennuyeux ne veut pas dire condamné. C'est même exactement l'inverse.

[IMAGE : Illustration ou infographie listant 8-10 boring businesses avec icônes simples — conciergerie, aide aux seniors, clim, artisan, bornes électriques, etc.]

Ces business ont trois caractéristiques que les startups IA n'auront jamais : ils nécessitent une présence physique, ils servent une demande qui ne va pas baisser, et ils sont tellement peu digitalisés que le moindre outil intelligent devient un avantage compétitif massif.

Brutal, mais libérateur.

---

## Aide aux seniors : la cible que j'ai verrouillée

La population française vieillit. Ce n'est pas une opinion, c'est de la démographie. Et cette population vieillissante va avoir besoin d'aide. Courses, accompagnement numérique, soutien administratif, maintien à domicile.

Faites le calcul. Des milliers de structures locales, souvent gérées par des dirigeants proches de la retraite, avec peu ou pas de présence en ligne, et une clientèle captive en croissance.

Mon take personnel : il y a un double jeu ici. Soit vous **proposez des services** à ces structures (un site web, de l'automatisation, du marketing local). Soit vous en **rachetez une**. Dans les deux cas, la première étape est la même : identifier qui existe, où, et comment les contacter.

C'est là que ça devient intéressant.

---

## Firecrawl + Claude : le duo qui aspire Google Maps

**Firecrawl**, c'est un outil de scrapping. En clair : il va fouiller des pages web — ici, des fiches Google Maps — et en extraire les informations structurées. Noms, adresses, numéros de téléphone, emails, sites internet.

Le truc, c'est que Firecrawl tout seul, c'est un tuyau. Il faut un cerveau derrière pour lui dire quoi chercher, comment trier, et comment présenter les résultats. Ce cerveau, c'est Claude.

J'ai connecté Firecrawl à Claude via un **connecteur MCP local**. Concrètement, dans mes outils Claude, j'ai mes connecteurs classiques — Airtable, Gmail, Google Drive, HubSpot — et j'ai aussi des connecteurs que j'ai développés moi-même : Penny Lane pour la facturation, NotebookLM, et Firecrawl.

Ça veut dire que Claude peut directement interroger Firecrawl sans que je quitte la conversation.

[IMAGE : Capture d'écran (floutée si besoin) de l'interface Claude montrant la liste des connecteurs MCP, avec Firecrawl visible dans les outils locaux]

---

## La démo : un prompt, des agents, 28 résultats

Voici exactement ce que j'ai fait.

J'ouvre un nouveau chat Claude. Je colle ce prompt :

> "Recherche toutes les structures de Dijon et alentours qui proposent des aides aux seniors : aide aux courses, assistante numérique, soutien administratif, accompagnement à domicile."

Claude me demande l'autorisation d'utiliser Firecrawl. J'accepte. Et là, il déploie ses **sub-agents** — plusieurs agents qui cherchent en parallèle sur différentes sources pendant qu'un agent orchestrateur compile les résultats.

Vous savez quoi ? J'aurais pu lui dire de ne pas me demander l'autorisation. Mais j'aime être dans la boucle. Human in the loop, comme on dit. C'est d'ailleurs ce qu'on enseigne en formation : l'IA fait le gros du travail, vous gardez le contrôle.

Trois minutes plus tard, Claude me génère un **tableau HTML aux couleurs de ma charte graphique** — fond sombre, dégradé violet-rose, tout propre — avec 28 structures référencées. Nom, adresse, téléphone, email, site web.

C'est énorme.

[IMAGE : Capture du tableau HTML généré par Claude avec les 28 structures, charte graphique TFB visible — données sensibles floutées]

---

## Ce que vous pouvez faire avec ces données (et que personne ne fait)

Avoir une liste, c'est bien. L'exploiter, c'est mieux. Voici trois pistes concrètes.

**Piste 1 — La prospection de services.** Parmi ces 28 structures, deux n'avaient pas de site internet. À l'heure où créer un site prend quelques heures avec Claude Code, c'est une opportunité de démarchage immédiate. Vous leur proposez un site, une présence en ligne, de l'automatisation de leurs tâches administratives.

**Piste 2 — Le rachat ciblé.** Croisez ces données avec l'âge du dirigeant. Un patron proche de la retraite, une structure rentable avec une clientèle fidèle, pas de repreneur en vue ? C'est un boring business prêt à changer de mains. Et vous, vous arrivez avec des outils IA pour l'optimiser.

**Piste 3 — L'audit commercial.** Vous êtes consultant, courtier, assureur ? Cette liste, c'est votre base de prospection locale. En trois minutes, vous avez ce qu'un commercial met deux jours à constituer manuellement.

Arf. Et dire que certains paient encore des bases de données à 500 € par mois.

---

## Ce que ça change pour vous, concrètement

Je ne vais pas vous faire le discours "l'IA va tout révolutionner". Vous l'avez assez entendu.

Ce que je vais vous dire, c'est que **la personne qui maîtrise ces outils va écraser sa concurrence locale**. Pas parce qu'elle est plus intelligente. Parce qu'elle va plus vite. Parce qu'elle trouve les prospects avant les autres. Parce qu'elle propose des services que les autres ne savent même pas fournir.

Un abonnement Claude à 20 € par mois. Un connecteur Firecrawl. Un prompt bien formulé. Et vous avez un système de prospection que des agences facturent des milliers d'euros.

Soyons raccord : l'outil ne fait pas tout. Il faut savoir le configurer, le connecter, le piloter. C'est exactement ce qu'on fait en formation.

---

## Passez à l'action

Deux dates de formation Claude arrivent :

- **Mercredi 17 juin** — il reste deux places
- **Mardi 22 juillet**

Scrapping, création de sites, automatisation des emails, Claude dans Excel, présentations, applications sur mesure — on couvre tout. Et surtout, on configure VOTRE environnement avec VOS outils.

Vous voulez voir ce que Claude peut faire pour votre business ? 30 minutes, sans langue de bois.

👉 [Prendre rendez-vous sur Calendly](https://calendly.com/thefrenchbot-coaching/30min)

Ou écrivez-moi directement : **contact@thefrenchbot.com**

Chaque semaine, je partage ce genre de cas concrets dans ma newsletter. Pas de spam, juste du pratico-pratique.

👉 [S'inscrire à la newsletter](https://forms.gle/VFNEeBGGMBstm1py5)

---

*Julian Luneau — The French Bot*
*On automatise tout en gardant l'humain dans la boucle.*