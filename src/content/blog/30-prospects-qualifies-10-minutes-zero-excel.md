---
title: "30 prospects qualifiés en 10 minutes, zéro Excel ouvert à la main"
description: "Comment j'ai généré 30 prospects qualifiés pour un cabinet comptable avec Claude et Apify en 10 minutes — scraping, mails personnalisés, brouillons Gmail. Méthode complète."
pubDate: 2026-08-26
author: "Julian Luneau"
tags: ["IA", "Prospection", "Claude", "Experts-comptables", "Automatisation"]
---

30 prospects qualifiés. 10 minutes. Zéro Excel ouvert à la main.

Non, ce n'est pas du marketing. C'est ce que je fais en démo devant des experts-comptables qui, pour la plupart, attendent encore le bouche-à-oreille pour remplir leur portefeuille clients.

## Le problème : vous êtes assis sur une recommandation qui s'essouffle

Soyons honnêtes deux secondes. La majorité des cabinets d'expertise comptable vivent sur un modèle vieux comme le métier : un client content en parle à un autre, et le portefeuille grossit tout seul. Ça a marché pendant des décennies. Le souci, c'est que ce modèle ne se pilote pas. Vous ne décidez pas combien de nouveaux clients arrivent ce trimestre. Vous subissez.

Et pendant ce temps, la concurrence ne dort pas. Des cabinets structurent leur prospection avec des outils qui, il y a deux ans, n'existaient tout simplement pas sous cette forme.

**Voilà le vrai sujet : la barrière technique pour prospecter en masse vient de sauter.** Ce qui demandait une équipe commerciale ou des heures de saisie Excel se fait maintenant en dictant une phrase à une IA.

## Ce que j'ai fait, concrètement, avec un client fictif "cabinet d'expertise comptable"

Prenons un cas réel de mission : un cabinet veut plus de pharmacies dans son portefeuille. Bon client, marge correcte, gestion comptable récurrente. Le genre de cible qu'on identifie facilement mais qu'on ne démarche jamais faute de temps.

J'ouvre Claude. Je lui donne un connecteur — Apify, un outil de scraping qui va chercher l'information à ma place sur Google Maps, LinkedIn, et d'autres sources publiques. Puis je lui donne un ordre simple, à l'oral :

*"Trouve 15 pharmacies dans un rayon de 10 km autour de Dijon. Pour chacune : nom, adresse, ville, site internet."*

Autorisation donnée au connecteur, et en quelques minutes, Claude sort un tableau propre. Nom de la pharmacie, coordonnées, lien Google Maps direct, note et nombre d'avis. La Pharmacie de la Colombière ? 4,7 étoiles, 52 avis. Cette information, je ne suis pas allé la chercher — Claude l'a fait tout seul.

**En parallèle, deuxième conversation, deuxième canal : LinkedIn.** Je demande cette fois 15 profils de dirigeants de pharmacie en Bourgogne — et j'insiste sur un point : je veux des titulaires, pas des salariés. On vise le décideur, pas l'interlocuteur qui ne signera jamais.

Deux canaux différents. Une seule méthode. C'est ça, le multitasking version IA : plusieurs conversations qui tournent en parallèle pendant que vous faites autre chose.

## L'étape que 90% des gens sautent — et qui fait toute la différence

Avoir une liste de 30 prospects, c'est bien. Ça ne vend rien.

La suite, c'est de transformer cette liste en mails personnalisés. Pas des templates génériques envoyés en masse — un mail qui prend en compte le nombre de salariés de la pharmacie, son chiffre d'affaires, sa situation réelle.

Je demande à Claude : *"Crée un mail personnalisé pour chaque pharmacie. Regarde leurs effectifs, adapte le discours, propose un rendez-vous visio de 30 minutes via mon calendrier."*

Et là, quelque chose d'intéressant se passe. Claude va vérifier des informations complémentaires — chiffre d'affaires, effectifs — sur des bases publiques comme Pappers, pour chaque pharmacie, une par une. Il croise les données avant de rédiger.

**Je dois avouer que ce qui m'a le plus marqué, c'est un détail.** À un moment, Claude s'arrête et me demande : "Julian, quelle signature je mets ? Tu n'es pas expert-comptable, j'ai vu qu'un cabinet — CPG Associés — apparaissait dans les données. Je mets leur nom en signature, ou je mets un simple call-to-action ?"

Il avait détecté l'incohérence. Ce n'est pas de la magie, c'est du croisement de données bien fait. Mais avouez que ça change la donne sur ce qu'on peut déléguer à un outil.

## L'erreur que j'ai faite (et que vous ferez aussi la première fois)

Force est de constater que j'ai été mauvais sur un point : je n'avais pas précisé que je voulais les mails directement en brouillons dans ma messagerie. Résultat, Claude a fait ce qui était logique de son point de vue — il a généré un document Word avec l'objet, le corps du mail et la signature pour chaque pharmacie. Propre, mais pas exploitable en un clic.

**La leçon : un prompt précis vous fait gagner un tour complet.** Dites exactement où vous voulez que le résultat atterrisse. "Génère les mails directement en brouillons dans Gmail" plutôt que "rédige-moi des mails". La nuance change tout.

Une fois corrigé, connecteur Gmail activé, autorisation donnée, et les 15 brouillons apparaissent dans ma boîte mail. Objet, corps, signature. Prêts à être relus.

## Non, vous ne devez pas envoyer sans relire. Jamais.

Soyons clairs sur ce point parce que c'est là que beaucoup dérapent : **l'humain reste dans la boucle.** Systématiquement.

On parle ici de 80 à 90% des tâches automatisées — la recherche, le tri, la rédaction, la mise en forme. Mais la vérification finale avant envoi, en particulier en prospection, ne se délègue pas. Un mail imparfait envoyé à un prospect coûte plus cher qu'un mail qui prend deux minutes de plus à être relu.

C'est tout. Pas de raccourci là-dessus.

## Ce que ça change une fois que c'est configuré une bonne fois pour toutes

Voilà le vrai gain, et il n'est pas ponctuel : une fois le système en place, vous pouvez l'automatiser dans le temps. Chaque mercredi, 15 mails de prospection préparés automatiquement dans vos brouillons, pendant que vous êtes en rendez-vous client. Vous n'avez plus qu'à relire et envoyer.

Vous n'avez rien fait. Et pourtant, 15 nouvelles opportunités attendent votre validation.

**C'est énorme**, et c'est précisément le genre de routine qu'on installe pendant nos formations Claude — pas pour vous montrer un tour de magie une fois, mais pour que ça tourne toutes les semaines sans vous.

## Ce qu'il faut retenir

1. **La prospection manuelle n'est plus une fatalité.** Le scraping via Apify, connecté à Claude, remplace des heures de recherche Google Maps ou LinkedIn.
2. **Un prompt précis évite un aller-retour inutile.** Dites où doit atterrir le résultat, pas seulement ce que vous voulez.
3. **La personnalisation reste l'arme principale.** Un mail générique ne convertit pas. Un mail qui montre que vous connaissez le prospect, si.
4. **L'humain valide, toujours.** L'IA prépare, vous décidez.
5. **Le vrai gain arrive à l'automatisation récurrente**, pas au coup d'essai.

Les cabinets qui commencent à structurer ça aujourd'hui vont prendre des parts de marché sur ceux qui attendent encore que le téléphone sonne. C'est aussi simple que ça.

Si vous voulez qu'on configure ce système pour votre cabinet — connecteurs, automatisations, et la méthode pour ne pas se planter sur le premier prompt — 30 minutes suffisent pour voir si on peut avancer ensemble. [Prenez rendez-vous ici](https://calendly.com/thefrenchbot-coaching/30min).
