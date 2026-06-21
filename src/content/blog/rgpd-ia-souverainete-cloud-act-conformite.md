---
title: "RGPD et IA : la souveraineté totale n'existe pas (et ce n'est pas une raison pour rien faire)"
description: "DPA, Cloud Act, forfaits pro : tout ce que vous devez savoir pour utiliser ChatGPT, Claude ou Copilot en entreprise sans risquer l'amende. Les 7 réflexes conformité et la vérité sur la souveraineté."
pubDate: 2026-06-21
author: "Julian Luneau"
tags: ["RGPD", "IA", "Conformité", "Cloud Act", "Entreprise"]
---

20 dollars par mois. C'est le prix d'un abonnement ChatGPT ou Claude. C'est aussi le prix de l'illusion que vous êtes en règle.

Parce que non. Payer un outil ne vous rend pas conforme au RGPD. Et choisir un outil "souverain" ne vous protège pas du gouvernement américain.

On me pose la question dix fois par semaine en formation : "Julian, je peux utiliser ChatGPT au boulot sans me faire taper sur les doigts ?" La réponse courte : ça dépend de votre forfait, de votre contrat et de ce que vous lui balancez dedans. La réponse longue, c'est cet article.

On a creusé le sujet. Les prérequis pour être conforme, les chiffres, les pièges, et la vérité qui dérange sur la souveraineté. Accrochez-vous.

## Le RGPD n'interdit pas l'IA. Il vous demande de faire vos devoirs.

C'est le premier malentendu à tuer.

Le RGPD ne dit pas "interdit d'utiliser l'IA". Il dit : documentez, limitez, sécurisez, et signez un contrat. Ce contrat porte un nom barbare — un **DPA**, pour *Data Processing Agreement*. En français, un accord de sous-traitance entre vous et l'éditeur de l'outil. Anthropic pour Claude, OpenAI pour ChatGPT.

Voilà. C'est un contrat de confiance. Vous l'avez ou vous ne l'avez pas.

Donc être RGPD, ce n'est pas cocher "Claude" ou "ChatGPT" dans une liste. C'est comprendre un cadre et l'appliquer proprement. Sept réflexes, et je vous les déroule.

**1. Identifiez vos données.** Où se trouvent les infos clients dans vos documents ? Vous ne pouvez pas protéger ce que vous n'avez pas cartographié.

**2. Limitez les entrées.** Vous pouvez retirer une info sensible avant de l'envoyer ? Faites-le. Anonymisez. Tous ces outils sont américains, et on va voir dans deux minutes pourquoi ça change tout.

**3. Prenez une offre professionnelle.** C'est non négociable. Les forfaits particuliers ne vous mettront jamais en conformité. J'y reviens en détail plus bas.

**4. Signez le DPA.** Le fameux contrat de sous-traitance. Sans lui, pas de conformité.

**5. Vérifiez l'entraînement.** Vos données nourrissent-elles le modèle ? Sur les plans pro, en général, non. Mais "en général" ne suffit pas — il faut vérifier.

**6. Documentez.** Tout. Vos usages, vos process. Le RGPD adore la paperasse, autant lui en donner.

**7. Formez vos équipes.** Ce n'est même plus une option : l'**AI Act** européen l'impose. Un collaborateur qui ne sait pas ce qu'il peut envoyer dans une IA, c'est une amende qui marche dans le couloir.

Sept cases. Cochez-les, vous êtes tranquille. Sautez-en une, vous êtes exposé.

## Le piège des forfaits : pourquoi le "20 dollars" est un mirage

Là, je vais être très concret, parce que c'est là que 80 % des dirigeants se plantent.

Le plan grand public ne vous rend PAS conforme. Pour signer un DPA, il faut passer sur du professionnel. Et chaque éditeur a ses contraintes — c'est là que ça coince.

**ChatGPT.** Le premier vrai niveau pro, c'est le plan Business à 20 dollars par utilisateur. Mais attention : minimum deux licences. Donc deux fois 20. Le plan gratuit ? Il entraîne les modèles. Le plan Plus ? Par défaut il les entraîne aussi — il faut aller décocher la case manuellement dans les réglages. Beaucoup l'ignorent et balancent du client dedans sans le savoir. Aïe.

**Claude.** Même tarif d'entrée. Bonne surprise : même sur le plan gratuit, vous pouvez refuser qu'Anthropic entraîne ses modèles avec vos données. C'est rare, c'est appréciable. Mais pour être réellement conforme et signer un DPA, il faut monter sur le plan Team — et là, minimum cinq licences. Cinq. Pour des équipes de 5 à 150 personnes.

Vous êtes indépendant, seul dans votre boîte ? Vous voyez le problème. Cinq licences quand on est tout seul, c'est absurde. (Il existe des astuces pour contourner ça proprement — on les voit en formation, je ne vais pas tout déballer ici.)

**Copilot.** Microsoft a fait l'inverse : pas de version grand public, du business direct, dès 15,60 € en offre TPE/PME. Sur le papier, le plus simple.

Mon avis franc et tranché sur Copilot ? **C'est moins performant.** Largement. Microsoft martèle qu'il est "le meilleur pour les pros". Dans la réalité, ça mouline. Si vous n'avez pas le choix parce que vous êtes verrouillé dans l'écosystème Office, allez-y, c'est une première mise en bouche. Mais ne le choisissez pas par défaut en pensant être mieux protégé parce que c'est Microsoft.

Parce que ça, c'est faux. Entièrement faux. Et voici pourquoi.

## Le Cloud Act : la vérité que personne ne veut entendre

Spoiler : la souveraineté totale ? N'existe pas. Pas avec ces outils.

En 2018, Trump signe le **Cloud Act**. En version courte : toute entreprise soumise au droit américain peut être sommée de livrer les données qu'elle héberge. Et "soumise au droit américain", ça veut dire toute boîte US — peu importe où sont ses serveurs.

Vos data centers sont en France ? On s'en fiche. Si l'éditeur est américain, l'administration américaine peut aller chercher les données. Sous couvert de terrorisme, de sécurité nationale, de "cadre légal flexible"… et croyez-moi, du côté américain, le cadre devient très flexible quand ça les arrange.

Alors, vous faites confiance à Trump pour ne pas plier vos données ? Moi, j'ai un doute. On n'a jamais une confiance totale en nos alliés d'outre-Atlantique. Ce n'est pas de la paranoïa, c'est de la lucidité.

Maintenant, le truc que beaucoup oublient dans le débat. Le Cloud Act ne concerne pas QUE l'IA.

Outlook. Gmail. WhatsApp. SharePoint. Toutes ces apps que vous utilisez sans y penser ? Américaines. Sous Cloud Act. Même **Pennylane**, que des milliers d'experts-comptables utilisent tous les jours — serveurs aux États-Unis, donc sous Cloud Act. C'est mort.

Donc soyons honnêtes : taper sur l'IA pour cette raison en continuant d'envoyer ses mails via Outlook, c'est un peu hypocrite. Ou de l'ignorance. Vous êtes déjà dépendant, partout, depuis des années.

Brutal, mais il fallait le dire.

## Alors on fait quoi ? On arrête tout ? Non.

Ce n'est pas parce que la souveraineté parfaite n'existe pas qu'il faut jeter l'éponge. C'est exactement l'inverse.

Le bon réflexe, ce n'est pas de fuir l'outil. C'est de maîtriser ce que vous mettez dedans. On automatise, mais on garde l'humain dans la boucle — et l'humain, c'est vous qui décidez ce qui sort de chez vous.

**Les données qu'on n'envoie JAMAIS sans analyse.** Santé, religion, opinions politiques, biométrie. C'est niet. Données ultra-sensibles, sanctions lourdes à la clé. Vous travaillez en RH ? On n'envoie pas un dossier salarié brut dans une IA. Jamais.

**Les données clients.** Quand vous pouvez les retirer ou les anonymiser, faites-le. Il existe des outils pour ça. Le réflexe doit devenir automatique : avant d'envoyer, je nettoie.

Et je vous préviens : la Commission européenne va faire des exemples. Les premiers qui se feront taper, ça va piquer. Ne soyez pas dans la liste.

Pour les métiers à très haut risque — santé, juridique, RH — la marche est encore plus haute. La santé impose un hébergeur certifié **HDS** (données de santé). Les avocats ont le secret professionnel. Là, on sort du cadre des 80 % d'entreprises classiques. Si c'est votre cas, ne bricolez pas : faites-vous accompagner.

## Mon take : pour les pros, c'est Claude

Je ne suis pas payé pour le dire. Mais aujourd'hui, pour un usage professionnel — chiffres, analyse, métiers de l'expertise — **Claude, c'est le ChatGPT des professionnels.**

Anthropic, ce n'est pas un petit outil bricolé dans un garage. On parle d'une boîte valorisée à 1000 milliards de dollars, aussi puissante et aussi régulée que ChatGPT. L'argument "c'est petit donc pas sécurisé" ne tient pas.

ChatGPT reste excellent pour le visuel, la génération d'images, le brainstorming. Copilot vous dépanne si vous êtes coincé dans Office. Mais pour le cœur du travail pro, mon choix est tranché.

Cela dit — le bon outil ne dépend pas du prix. Il dépend de ce que VOUS faites au quotidien. Un expert-comptable, un courtier et un RH n'ont pas les mêmes besoins ni les mêmes contraintes.

## Ce qu'il faut retenir

Pas de conclusion vague, on reste pratico-pratique.

- Le RGPD n'interdit pas l'IA. Il impose un cadre : documenter, limiter, sécuriser, signer un DPA.
- Le forfait grand public ne vous met jamais en conformité. Il faut du professionnel — et chaque éditeur a son piège (2 licences mini chez OpenAI, 5 chez Claude).
- La souveraineté totale n'existe pas. Le Cloud Act plane sur Claude, ChatGPT, mais aussi Outlook, Gmail et Pennylane. Vous êtes déjà dedans.
- Ce n'est pas une raison pour fuir. C'est une raison pour contrôler ce que vous envoyez.
- Santé, religion, politique, biométrie : niet sans analyse. Données clients : anonymisez.
- L'AI Act vous oblige à former vos équipes. Ce n'est plus une option.

La conformité, ce n'est pas un outil qu'on achète. C'est une discipline qu'on installe.

## On en parle ?

C'est exactement ce qu'on traite en formation : le bon abonnement, le bon contrat, les bons usages — et les astuces pour rester conforme même quand vous êtes seul ou en petite équipe. On voit aussi comment brancher tout ça dans Office, Excel, PowerPoint, sans se tirer une balle dans le pied.

Prochaines sessions : **22 juillet** et **12 août**. En groupe, dans vos locaux (Paris, Lyon, Dijon) ou en visio live.

On fait aussi des **audits d'entreprise** : on cartographie vos besoins, on regarde vraiment comment vous bossez, et on vous sort une roadmap sur 6 à 12 mois. Pas du conseil abstrait. Du sur-mesure.

Et avant tout ça, 30 minutes à mes côtés pour débroussailler votre situation, sans langue de bois : [https://calendly.com/thefrenchbot-coaching/30min](https://calendly.com/thefrenchbot-coaching/30min)

Chaque semaine, je décrypte ce genre de sujet dans ma newsletter. Sans spam, juste du concret : [https://forms.gle/VFNEeBGGMBstm1py5](https://forms.gle/VFNEeBGGMBstm1py5)
