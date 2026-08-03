export type ChangelogEntry = {
  version: string;
  date: string;
  title: string;
  changes: string[];
};

export const CHANGELOG_DATA: ChangelogEntry[] = [
  {
    version: "1.0.0",
    date: "03 Août 2026",
    title: "Version Enterprise Finale",
    changes: [
      "Lancement officiel de l'ERP REGIONALE EXPRESS VOYAGES SARL.",
      "Intégration du fonctionnement complet Offline-First avec Dexie.js.",
      "Nouveau module des Recettes Journalières.",
      "Ajout des détails complets (fournisseurs, lignes) dans le processus de validation pour le DG et PDG.",
      "Mise à jour complète de l'intelligence artificielle REGIONALE IA."
    ]
  },
  {
    version: "0.9.5-beta",
    date: "25 Juillet 2026",
    title: "Amélioration des Dépenses et Fournisseurs",
    changes: [
      "Ajout de la gestion des fournisseurs et dettes.",
      "Tableau détaillé des articles achetés (produit, quantité, prix unitaire) lors des dépenses.",
      "Amélioration des performances du Dashboard PDG."
    ]
  },
  {
    version: "0.9.0-beta",
    date: "15 Juillet 2026",
    title: "Version Bêta Initiale",
    changes: [
      "Première version du tableau de bord.",
      "Mise en place de l'authentification sécurisée et du RBAC.",
      "Création des modules de Versements Bancaires et Dépenses."
    ]
  }
];
