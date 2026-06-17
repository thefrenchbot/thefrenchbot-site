---
title: "Claude + Apify : j'ai automatisé ma prospection B2B en 5 minutes (et envoyé 3 mails personnalisés sans ouvrir Gmail)"
description: "10 cabinets scrapés, 3 mails personnalisés rédigés et envoyés sans quitter Claude. Voici comment automatiser toute votre prospection B2B avec Apify, Gmail et un CRM connecté."
pubDate: 2026-06-16
author: "Julian Luneau"
tags: ["prospection", "apify", "claude", "automatisation", "b2b", "gmail", "crm", "tpe-pme"]
---

10 cabinets d'avocats scrapés. 3 mails personnalisés rédigés. 1 envoyé directement depuis le chat. Temps total : moins de 5 minutes.

Non, ce n'est pas du marketing. C'est ce que j'ai fait en direct devant ma caméra, et je vais vous montrer comment.

## Le problème avec la prospection B2B classique

Soyons honnêtes : la prospection, c'est le moment que tout le monde déteste. Vous ouvrez Google Maps, vous notez les noms à la main, vous basculez sur LinkedIn pour trouver l'email, vous rédigez un mail générique que vous envoyez à 50 personnes en copier-collant juste le nom du cabinet.

Résultat : un taux de réponse minable et des heures perdues sur des tâches zéro valeur ajoutée.

Il y a un outil que les pros du scraping connaissent bien : **Apify**. Un scrapeur ultra-puissant qui va chercher des données sur Google Maps, LinkedIn, ou n'importe quel site web. Le problème ? Il fallait jusqu'ici jongler entre l'interface Apify, un tableau Excel, et votre outil d'emailing. Trois outils, trois copier-coller, zéro intelligence entre les étapes.

**Et si une seule interface pouvait scraper, analyser, rédiger ET envoyer ?**

C'est exactement ce que permet de connecter Claude à Apify. Pas une recherche basique dans un chatbot. Une vraie chaîne de production automatisée.

[IMAGE : capture d'écran de l'interface Claude avec connecteurs Apify, HubSpot, Gmail visibles]

## Comment ça marche concrètement

### Étape 1 : le scraping piloté depuis Claude

Fini l'aller-retour entre l'interface Apify et votre tableur. Vous écrivez votre demande en langage naturel, directement dans Claude :

*"Je veux prospecter des cabinets d'avocats autour de Dijon. Utilise Apify pour trouver une liste de cabinets : nom de l'entreprise, ville, adresse, site web."*

Claude se connecte au connecteur Apify, lance la requête sur Google Maps, et revient avec un tableau structuré : nom, ville, site web, téléphone, **note Google**. Dix cabinets en quelques secondes, données propres, prêtes à exploiter.

**Petit conseil technique** : utilisez l'application Claude sur ordinateur plutôt que le navigateur. L'app est nettement plus stable pour ce genre de workflow connecté à plusieurs outils.

### Étape 2 : l'analyse business, pas juste l'extraction

C'est ici que ça devient intéressant. La plupart des gens s'arrêtent à l'extraction de données. Erreur.

J'ai demandé à Claude : *"Analyse cette liste comme un expert en prospection B2B. Je propose des formations sur l'intelligence artificielle. Fais-moi un score de pertinence."*

Résultat : un cabinet sort à 9/10 — "cabinet structuré avec volume de clients élevés", donc cible idéale pour de l'automatisation de mails. Un autre ressort pour sa multiplicité de dossiers et ses tâches répétitives.

**C'est ça la vraie valeur.** Pas la liste. Le tri intelligent qui vous dit où concentrer votre énergie.

[IMAGE : tableau de scoring des prospects avec justifications]

### Étape 3 : la rédaction de mails personnalisés, en masse

Une fois le top 3 identifié, une seule consigne : *"Fais-moi un mail pour ces trois cabinets. Clair, concis, direct."*

Claude rédige trois mails distincts, chacun ancré dans le contexte réel du cabinet (droit du travail, synthèse de dossiers, volume de clients). Pas de mail générique balancé à l'aveugle.

### Étape 4 : l'envoi sans quitter l'interface

Et voilà le détail qui change tout : **Claude est directement connecté à Gmail**. Pas besoin de copier-coller dans votre boîte mail. Vous validez, vous renseignez l'adresse, le mail part. Lien Calendly inclus pour que le prospect réserve directement un créneau.

Trois mails envoyés. Trois prises de rendez-vous potentielles. Zéro tableau Excel ouvert.

## Ce que personne ne vous dit sur les connecteurs

On parle beaucoup d'IA générative, peu de connecteurs. Et c'est une erreur.

Aujourd'hui, j'ai HubSpot, Google Drive, Calendar, Calendly et Apify connectés directement à Claude. Concrètement, quand je termine un appel visio avec un client, **le nom et le numéro partent automatiquement dans mon CRM**. Je n'ouvre jamais HubSpot pour ça.

J'ai même construit mon propre dashboard de pilotage par-dessus HubSpot — parce que l'interface native, je la trouve franchement indigeste. 19 deals en cours, 200 contacts, 50% de taux de closing, 26 tâches dont 11 en retard. Tout ça en lecture directe, mis à jour en live.

**2026, c'est l'année où vous arrêtez de subir les interfaces de vos outils et où vous créez la vôtre, par-dessus, avec l'IA.**

## Scénario lent vs scénario rapide

**Le scénario lent** : vous continuez à scraper à la main, copier-coller dans Excel, rédiger des mails génériques un par un. Vous contactez 10 prospects par semaine si vous êtes motivé.

**Le scénario rapide** : vous pilotez tout depuis une seule interface conversationnelle. Scraping, scoring, rédaction, envoi, CRM. Vous contactez 50 prospects qualifiés dans le même temps, avec un message qui tient compte de leur contexte réel.

Le deuxième scénario n'est pas réservé aux grandes boîtes avec un service marketing. Il est accessible à un indépendant, là, maintenant, avec les bons outils connectés.

## Ce qu'il faut retenir

- Apify scrape, Claude analyse et agit. Ne vous arrêtez jamais à l'extraction brute de données.
- Le scoring de prospects par IA n'est pas un gadget : c'est ce qui vous évite de perdre du temps sur les mauvaises cibles.
- Connecter Gmail et votre CRM à Claude élimine la friction entre "j'ai une idée" et "c'est fait".
- Testez ça avec 10 prospects avant de scaler à 100. Le but n'est pas le volume, c'est la pertinence.

Les concurrents qui prennent ce virage maintenant ne vous attendront pas dans 6 mois. C'est brutal, mais c'est la réalité du marché actuel.

Si vous voulez voir ça tourner en direct sur votre activité plutôt que de l'imaginer, j'ai deux dates de formation : le 17 juin et le 22 juillet. 30 minutes pour en discuter, sans langue de bois : [Calendly](https://calendly.com/thefrenchbot-coaching/30min)

Chaque semaine, je décrypte ce genre de workflow dans ma newsletter. Sans spam, juste du concret : [Newsletter](https://forms.gle/VFNEeBGGMBstm1py5)
