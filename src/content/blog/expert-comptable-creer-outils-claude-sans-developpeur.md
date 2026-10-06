---
title: "Expert-comptable : créer vos propres outils avec Claude (sans développeur)"
description: "Simulateurs, calculateurs, mini-apps : comment les cabinets d'expertise comptable fabriquent leurs propres outils avec Claude, sans coder ni faire appel à un prestataire."
pubDate: 2026-10-06
author: "Julian Luneau"
tags: ["Expert-comptable", "Claude", "Outils IA", "Formation"]
---

60 cabinets d'expertise comptable accompagnés. Et pas un seul qui travaille comme le voisin.

C'est le premier truc que le terrain m'a appris. Le deuxième ? La plupart des experts-comptables utilisent encore l'IA comme un moteur de recherche amélioré. Une question, une réponse, on ferme l'onglet.

Arf.

Vous passez à côté de l'essentiel : Claude peut construire vos propres outils. Des simulateurs, des calculateurs, des mini-applications que vous partagez à vos clients ou à vos équipes. Sans développeur. Sans devis à cinq chiffres.

## Ce que tout le monde vous vend, et ce que je vois

Le discours dominant ? L'IA va « révolutionner la profession ». On vous promet la Wi-Fi.

Sur le terrain, c'est plus terre à terre. Et beaucoup plus rentable. Les cabinets qui gagnent du temps ne sont pas ceux qui ont lu le plus d'articles sur ChatGPT. Ce sont ceux qui ont identifié une tâche répétitive précise, et qui ont fabriqué l'outil qui la règle.

Je vais vous montrer deux exemples concrets, créés en quelques échanges avec Claude. Puis un troisième, construit avec un cabinet client, qui change franchement la donne.

## Cas n°1 : un simulateur d'impôt sur le revenu, du premier coup

Le besoin est simple. Vos clients dirigeants veulent savoir, vite, combien d'impôt ils vont payer en 2026 sur leurs revenus 2025.

Oui, le site des impôts propose déjà un simulateur. Je sais. Mais l'intérêt n'est pas là. L'intérêt, c'est de vous montrer que ce genre d'outil, vous pouvez le fabriquer en interne, à votre image, et le mettre entre les mains de vos clients.

### Le prompt qui fait toute la différence

Tout se joue dans la consigne. Voici la logique que j'ai donnée à Claude :

1. **Un rôle.** « Je suis expert-comptable. Je veux créer un simulateur pédagogique de l'impôt sur le revenu 2026, applicable aux revenus 2025. »
2. **Des consignes strictes, avant de coder.** Recherche et vérifie les règles fiscales applicables dans le BOFiP. Indique-moi les sources utilisées.
3. **Un garde-fou explicite.** « Ne suppose aucune règle fiscale que tu n'aurais pas vérifiée. »

Voyez la mécanique. On ne demande pas un outil. On cadre un travail, comme on briefe un collaborateur junior : qui tu es, ce que tu dois faire, ce que tu n'as pas le droit d'inventer.

J'ai lancé une première requête, affiné dans un second temps. Résultat : un simulateur qui calcule automatiquement l'impôt avant réductions et crédits d'impôt. Fonctionnel du premier coup. Pas de seconde version, pas de bricolage.

Je l'ai testé sur mes propres revenus. Ça tombe juste.

J'adore.

**Le réflexe à garder** : un outil fiscal généré par IA se vérifie toujours sur un ou deux cas réels avant d'être partagé. Claude vous cite ses sources, à vous de les contrôler. Votre signature reste votre signature.

## Cas n°2 : le démembrement de propriété, barème fiscal contre valeur économique

Deuxième exemple, un cran au-dessus. Un outil qui compare, pour un bien démembré, la valeur fiscale de l'usufruit et de la nue-propriété avec leur valeur économique.

Concrètement, l'outil permet de :

- saisir la valeur du bien en pleine propriété, et la modifier à la volée (500 000 €, 560 000 €, peu importe) ;
- appliquer le barème fiscal selon l'âge de l'usufruitier ;
- visualiser immédiatement l'écart entre valeur fiscale et valeur économique de l'usufruit.

Le genre d'outil que vous ouvrez en rendez-vous, devant le client, pour rendre tangible une notion que personne ne comprend du premier coup.

### Le détail qui change tout : il ressemble à votre cabinet

Attendez, il y a mieux. Claude a respecté de lui-même la charte graphique de The French Bot. Fond noir, dégradé bleu électrique et violet, l'ambiance un peu cyberpunk de la marque. Sans que je le redemande.

Pourquoi ? Parce que j'ai paramétré une instruction permanente dans mon Claude : respecter la charte graphique de ma société. Une fois pour toutes.

Traduction pour votre cabinet : vos couleurs, votre logo, votre ton, sur chaque outil que vous fabriquez. Vous ne partagez pas un gadget générique. Vous partagez un outil signé de votre cabinet.

C'est énorme pour l'image perçue.

Et ces outils se partagent en un lien. Au client, à un collaborateur, à toute l'équipe.

## Au-delà du simulateur : une à deux journées gagnées par semaine

Soyons honnêtes. Un simulateur d'impôt, c'est sympa. Ça impressionne en rendez-vous. Mais ce n'est pas ça qui transforme la rentabilité d'un cabinet.

Ce qui la transforme, ce sont les outils branchés sur vos tâches lourdes et répétitives.

Exemple réel. Nous avons accompagné un cabinet d'expertise comptable sur la création d'un outil spécialisé dans la facturation et la TVA. Résultat : une à deux journées gagnées par semaine. Pas par an. Par semaine.

Faites le calcul. Une journée par semaine, c'est plus de 40 jours par an. L'équivalent de deux mois de travail rendus à l'équipe. En pleine période de tension sur les recrutements, ce n'est pas un détail.

Pour des outils simples, Claude suffit, directement dans la conversation. Pour des outils plus costauds, connectés à vos données et à vos process, on passe par des fonctionnalités plus techniques comme Claude Code. Je ne rentre pas dans le détail ici : c'est le genre de configuration qu'on monte ensemble, en formation.

La vraie question n'est donc pas « l'IA peut-elle créer des outils ? ». Elle le peut. La vraie question, c'est : quel outil vous ferait gagner le plus de temps, à vous ?

Et ça, aucun tutoriel YouTube ne peut y répondre à votre place.

## Pourquoi on commence toujours par un audit

C'est là que la plupart des formations IA se plantent. Elles arrivent avec le même programme pour tout le monde. Les mêmes exemples génériques, la même rédaction de mail, le même résumé de PDF.

Et non.

Sur 60 cabinets, j'ai vu 60 façons de travailler. Des outils de production différents, des process différents, des clientèles différentes. Former tout le monde de la même manière, c'est garantir que la moitié de la salle ne mettra jamais rien en pratique.

Alors avant chaque formation, on audite. Concrètement, on cartographie vos tâches du quotidien : ce qui prend du temps, ce qui se répète, ce qui irrite les équipes.

Ensuite, on construit une formation basée uniquement sur vos cas d'usage. J'insiste sur le mot. Pas 80 % de théorie et 20 % de pratique. Du pratico-pratique, appliqué à vos dossiers.

Les formations généralistes, on les a balayées. Chez The French Bot, on n'en veut pas.

Brutal, mais libérateur.

## Ce qu'il faut retenir (et faire cette semaine)

Pas de grande théorie. Quatre actions.

1. **Listez trois tâches répétitives de votre cabinet.** Celles qui reviennent chaque semaine et que personne n'aime faire.
2. **Choisissez la plus simple et briefez Claude comme un collaborateur** : un rôle, des consignes, des sources à vérifier, des garde-fous.
3. **Paramétrez une instruction permanente avec votre charte graphique.** Chaque outil sortira à vos couleurs.
4. **Testez sur un cas réel avant de partager.** Toujours. L'IA accélère, elle ne signe pas à votre place.

Vous voulez les prompts exacts utilisés pour ces deux outils ? [Je les partage](https://forms.gle/VFNEeBGGMBstm1py5).

Et si vous voulez savoir quel outil ferait gagner une journée par semaine à votre cabinet, parlons-en. 30 minutes, je vous pose un maximum de questions, et on voit concrètement comment travailler ensemble : [réserver un créneau](https://calendly.com/thefrenchbot-coaching/30min).

Pas prêt pour un appel ? Chaque semaine, je décortique ce genre de cas d'usage dans ma [newsletter](https://forms.gle/VFNEeBGGMBstm1py5). Sans spam, juste du concret.
