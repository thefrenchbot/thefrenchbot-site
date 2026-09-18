# Carnet de Vie Matériel — prototype géomètres-experts

Prototype autonome (un seul fichier HTML, zéro dépendance, zéro serveur) de suivi du matériel d'un cabinet de géomètres-experts.

**Ouvrir** : double-clic sur `index.html`. Les données sont sauvegardées dans le navigateur (localStorage). Bouton « Exporter » pour CSV / JSON, import JSON et retour aux données de démo.

## Écrans

1. **Tableau de bord** — échéances en retard, incidents ouverts, jours d'immobilisation, disponibilité, traçabilité.
2. **Parc matériel** — inventaire (station totale, GNSS, niveau, scanner 3D, drones, détecteur de réseaux, accessoires, véhicules, EPI, licences), fiche détaillée par équipement : échéances, batteries, documents, historique.
3. **Maintenance** — échéances calculées (dernière intervention + intervalle), bouton « Fait » qui recalcule, bouton « Demande SAV » qui prépare le message.
4. **Incidents** — déclaration, gravité, actions, clôture obligatoire avec résolution, coût et jours d'immobilisation.
5. **Contrôle avant départ** — sélection du matériel embarqué, checklist par catégorie, blocages automatiques (SAV, échéance dépassée, incident haute gravité), verdict GO / NO-GO tracé.

## Dépôt de documents

Le formulaire « + Document » extrait localement date, montant, n° de série, garantie / validité, immobilisation depuis le texte collé, et crée ou recale l'échéance correspondante. En production ce rôle est tenu par Claude sur le PDF ou la photo déposés.
