---
title: "Automatiser ses réponses emails avec Make : le guide pratico-pratique (et mes erreurs en direct)"
description: "Comment créer un scénario Make qui rédige vos réponses emails avec l'IA et les place en brouillon — étape par étape, erreurs incluses."
pubDate: 2026-06-20
author: "Julian Luneau"
tags: ["Automatisation", "Make", "Email", "IA", "Productivité"]
---

**50 mails non lus. Zéro réponse envoyée. Et une boîte de réception qui ressemble à un cimetière de bonnes intentions.**

Vous connaissez la chanson. On ouvre la boîte le matin, on se dit « je réponds à tout ce soir ». Le soir arrive, on a répondu à trois mails et le reste… dort encore. Pendant ce temps, un prospect s'impatiente, un partenaire relance, un client s'agace.

Chez The French Bot, on fait des questionnaires préformation. Avant chaque session, on prend le pouls des équipes : quelles tâches répétitives leur bouffent du temps sans créer de valeur. Et vous savez ce qui revient systématiquement, quel que soit le secteur ?

Les mails.

Pas la prospection. Pas les factures. Les mails de réponse basiques qui traînent en bas de la pile.

Alors j'ai décidé de vous montrer comment automatiser ça. Concrètement. Et comme je suis honnête avec vous, vous allez aussi voir mes plantages en direct. Parce que oui, même quand on fait ça tous les jours, ça ne marche pas du premier coup.

[IMAGE : Infographie Make vs n8n — deux logos côte à côte avec flèche vers Gmail/Outlook]

---

## Pourquoi Make et pas n8n ?

Soyons raccord tout de suite : **n8n est meilleur que Make.** Plus puissant, plus flexible, moins cher à l'usage. Si vous maîtrisez n8n, restez dessus. Point final.

Mais voilà le problème : n8n a une courbe d'apprentissage. Et quand je forme des dirigeants de TPE qui n'ont jamais touché un outil d'automatisation, leur demander de démarrer sur n8n, c'est comme leur filer un semi-remorque pour apprendre à conduire.

Make, c'est la boîte automatique. Moins de puissance sous le capot, mais vous roulez en 15 minutes. La connexion entre vos outils et le scénario se fait en quelques clics, sans configuration serveur, sans ligne de code.

Alors oui, Make est plus cher que n8n en termes de crédits. Oui, les limites du plan gratuit arrivent vite. Mais comme porte d'entrée sur l'automatisation, c'est le bon choix pour quelqu'un qui part de zéro.

Vous pourrez toujours migrer vers n8n plus tard. L'important, c'est de commencer.

---

## Le principe : 3 modules, 1 brouillon, zéro risque

Le schéma est d'une simplicité déconcertante. Trois étapes :

1. **Gmail (ou Outlook) scanne votre boîte de réception** — il détecte les mails non traités.
2. **L'IA rédige une réponse** — via l'API OpenAI, un modèle comme GPT-4o mini analyse le mail reçu et génère une réponse adaptée.
3. **Un brouillon est créé dans votre boîte** — pas d'envoi automatique. Vous relisez, vous validez, vous envoyez.

Attendez. Relisez ce troisième point.

**Un brouillon.** Pas un envoi.

On automatise tout en gardant l'humain dans la boucle. Faut arrêter avec les fantasmes de robots qui envoient des mails en fermant les yeux. On crée un brouillon, on vérifie que la réponse est correcte, et ensuite on envoie. Si 50 % du boulot est déjà fait, c'est énorme. Vous passez de « rédiger une réponse à partir de rien » à « valider un texte déjà écrit ». La différence en temps ? Colossale.

[IMAGE : Capture d'écran du scénario Make avec les 3 modules connectés : Gmail Watch → OpenAI → Gmail Create Draft]

---

## La mise en place, étape par étape

### Module 1 : Brancher sa boîte mail

Sur Make, vous créez un nouveau scénario et vous choisissez Gmail (ou Outlook, ça marche pareil). Le déclencheur, c'est **Watch Emails** — autrement dit, Make scanne votre boîte à intervalle régulier.

Quelques réglages importants :

- **Filtre simple** plutôt que filtre Gmail natif — ça vous permet de capter tous les mails, même ceux d'adresses externes connectées à votre Gmail.
- **Dossier : Inbox** — votre boîte de réception principale.
- **Critère : tous les messages** — ou uniquement les non lus si vous préférez affiner.
- **Limite : 10 messages** par exécution. C'est le plafond par défaut, et c'est suffisant pour commencer.

La connexion à votre boîte mail est guidée pas à pas par Make. C'est là que l'outil brille : vous suivez les instructions, vous autorisez l'accès, c'est fait. Sur n8n, cette même étape demande plus de configuration. Pas insurmontable, mais moins fluide.

### Module 2 : L'IA qui rédige la réponse

On ajoute un module OpenAI — concrètement, ChatGPT via l'API. Vous choisissez « Generate a Response ».

Arf. Premier piège ici : quand vous connectez OpenAI à Make, **vous utilisez l'API, pas votre abonnement ChatGPT Plus**. Ce sont deux choses différentes. Vous devez créditer votre compte API séparément — 10 €, 20 €, selon votre usage.

Pour le modèle, mon conseil : prenez **GPT-4o mini**. Pourquoi ? Parce que les réponses sont de bonne qualité et que ça consomme très peu de crédits. Vous n'avez pas besoin de la Rolls pour rédiger un accusé de réception ou proposer un créneau de rendez-vous.

Ensuite, le **prompt**. C'est le cœur du système. Voici ce que j'ai mis :

> *Tu es l'assistant email de Julian Luneau, fondateur de The French Bot, formation IA pour TPE/PME. Tu reçois un mail et tu rédiges une réponse directe, sans poser de questions. Le ton est chaleureux, direct, professionnel. Si pertinent, tu proposes un rendez-vous via ce lien : [lien Calendly].*

C'est basique. Et c'est volontaire.

Parce que vous pouvez aller beaucoup plus loin : segmenter par type de mail (service client, facturation, demande de formation), adapter le ton selon l'expéditeur, injecter des informations produit spécifiques. Mais commencez simple. Faites tourner la machine. Complexifiez ensuite.

Dans les variables du prompt, on injecte :
- **From** — l'adresse de l'expéditeur
- **Subject** — l'objet du mail
- **Body** — le contenu du message

L'IA voit tout le contexte et rédige en conséquence.

[IMAGE : Capture du prompt dans le module OpenAI sur Make]

### Module 3 : Créer le brouillon

Dernier module : **Gmail — Create a Draft**. Pas « Send an Email ». Je le répète parce que la nuance est capitale.

On configure :
- **To** : l'adresse email de l'expéditeur (from email du premier module)
- **Subject** : l'objet du mail original
- **Body** : le texte généré par OpenAI

Et c'est là que ça s'est corsé pour moi en direct.

---

## Mes plantages (et ce que vous devez en retenir)

Vous savez quoi ? La première fois que j'ai lancé le scénario, il m'a créé une dizaine de brouillons. Tous vides. Pas un mot dedans. Juste le nom du destinataire.

Aïe.

Le problème ? Le module OpenAI ne s'était pas enregistré correctement. Le prompt n'avait pas été sauvegardé. Résultat : l'IA n'avait rien à travailler, donc elle ne produisait rien. Et Make créait quand même les brouillons — vides.

J'ai dû rouvrir le module du milieu, recoller le prompt, sauvegarder proprement, et relancer. Deuxième tentative : cette fois, les brouillons contenaient de vraies réponses.

Exemple concret d'une réponse générée :

> *« Merci pour votre message. Je serai ravi d'échanger avec vous. Vous pouvez réserver un créneau pour un appel via ce lien : [Calendly]. À très bientôt, Julian. »*

C'est propre. C'est rapide. Et surtout, c'est un brouillon — je relis avant d'envoyer.

La leçon ? **Testez chaque module individuellement avant de tout connecter.** Lancez le module Gmail seul pour vérifier qu'il capte bien les mails. Lancez le module OpenAI seul pour vérifier que le prompt produit des résultats. Puis connectez le tout. Ça vous évitera de générer 10 brouillons fantômes comme moi.

---

## Ce que ça change concrètement pour vous

Faites le calcul. Si vous recevez 30 mails par jour qui nécessitent une réponse, et que chaque réponse vous prend 3 minutes : c'est **1h30 par jour**. 7h30 par semaine. Plus de 30 heures par mois passées à taper des réponses, dont la moitié sont des variations du même message.

Avec ce système, vous passez de « rédiger » à « valider ». Le temps par mail tombe à 30 secondes — le temps de relire le brouillon et de cliquer sur Envoyer.

Brutal, mais libérateur.

Et ce n'est que la version basique. Vous pouvez aller plus loin :

- **Segmenter les réponses** par type de mail (commercial, SAV, administratif) avec des prompts différents pour chaque catégorie.
- **Ajouter des conditions** : si le mail contient « facture », router vers un prompt spécifique. Si le mail vient d'un client existant, personnaliser le ton.
- **Déclencher des actions complémentaires** : créer un événement calendrier, mettre à jour un CRM, envoyer une notification Slack.

C'est là que n8n reprend l'avantage, d'ailleurs. Pour des workflows complexes avec plusieurs branches conditionnelles, n8n est nettement plus adapté. Make commence à montrer ses limites quand on empile les modules.

---

## Ce qu'il faut retenir

L'automatisation des emails, ce n'est pas remplacer l'humain. C'est lui redonner du temps pour les tâches qui comptent vraiment — celles où votre cerveau, votre empathie, votre expertise font la différence.

Trois choses à garder en tête :

**Commencez par les brouillons, jamais par l'envoi direct.** On ne lâche pas un robot sur sa boîte mail sans filet. Le brouillon, c'est votre garde-fou.

**Choisissez l'outil selon votre niveau.** Make pour démarrer, n8n pour scaler. Pas l'inverse.

**Investissez dans le prompt.** Un bon prompt, c'est 80 % du résultat. Un prompt générique donnera des réponses génériques. Prenez le temps de décrire votre ton, votre contexte, vos cas d'usage.

Aujourd'hui, si vous ne travaillez pas avec l'intelligence artificielle, c'est comme si vous entriez dans une entreprise en disant « moi, j'utilise pas l'ordinateur ». Vous voyez le problème.

[IMAGE : Capture des brouillons générés dans Gmail avec les réponses IA]

---

**Vous voulez mettre ça en place dans votre boîte ?** On le fait ensemble. 30 minutes, sans langue de bois, on cartographie vos besoins et on pose les bases. [Réservez votre créneau ici.](https://calendly.com/thefrenchbot-coaching/30min)

Et si vous voulez recevoir ce genre de contenu chaque semaine — sans spam, juste du concret — [inscrivez-vous à la newsletter.](https://forms.gle/VFNEeBGGMBstm1py5)

---

*Julian Luneau — The French Bot*
*Formation IA pour TPE/PME • Prochaines sessions : 22 juillet et 12 août 2026*
*contact@thefrenchbot.com • www.thefrenchbot.com*
