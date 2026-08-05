# Historique du Développement - REGIONALE EXPRESS VOYAGES SARL ERP

## Phase 1 : Initialisation et Architecture de Base
- Création du projet avec Next.js 14 (App Router), Tailwind CSS et shadcn/ui.
- Définition du schéma de base de données (Prisma + Supabase PostgreSQL) avec les entités : Utilisateurs, Agences, Opérations (Recettes, Dépenses, Versements), Catégories, Banques, etc.
- Mise en place du système d'authentification par cookies sécurisés.

## Phase 2 : Gestion des Rôles (RBAC) et Sécurité
- Définition stricte des rôles : PDG (Accès total), DG (Exploitation), AGENT (Saisie uniquement).
- Sécurisation des routes et Server Actions via vérification du rôle côté serveur.
- Restriction des formulaires : les agents ne peuvent pas modifier leur rôle, leur agence, ni approuver/rejeter les opérations.
- Implémentation du système "Soft Delete" (Suppression logique via `isDeleted`) pour éviter la perte de données (Agences, Banques, Catégories) et prévenir les bugs de contraintes de clés étrangères.

## Phase 3 : Développement des Fonctionnalités Clés
- **Tableau de Bord :** Indicateurs en temps réel (Recettes, Dépenses, Versements, Solde théorique).
- **Opérations :** Création des formulaires pour la saisie des Recettes, Dépenses, Versements bancaires et Paiements fournisseurs.
- **Workflow de Validation :** Tout ajout effectué par un Agent nécessite l'approbation du PDG ou du DG avant d'être comptabilisé dans le Net en Caisse.
- **Ajout des Types de Recettes :** Classification des recettes en "Classique" et "VIP" pour une meilleure granularité.

## Phase 4 : Transformation en PWA (Progressive Web App) et Offline-First
- Configuration du Manifest et du Service Worker (PWA).
- Installation et configuration de `Dexie.js` pour créer une base de données locale (IndexedDB).
- **File d'attente (SyncQueue) :** Les opérations saisies sans connexion internet sont stockées localement. Dès que le réseau est de retour, le système les synchronise automatiquement en arrière-plan vers Supabase.
- Indicateurs visuels du statut de synchronisation.

## Phase 5 : Notifications Push et Assistant IA
- Intégration de Firebase Cloud Messaging (FCM) pour envoyer des notifications (Nouvelle dépense, validation, etc.).
- Ajout d'un système de diagnostic de notifications Push (spécifique pour iOS/Safari) avec un bouton de "Réparation" (réinitialisation du Service Worker).
- Intégration d'un assistant virtuel IA local ("Chatbot") capable d'interroger la base de données en temps réel :
  - Calcule le Net en Caisse.
  - Vérifie les objectifs bancaires.
  - Fournit l'historique des validations.
  - Prend en compte les recettes Classiques et VIP.

## Phase 6 : Déploiement et Finitions
- Déploiement automatisé sur Vercel.
- Optimisation de l'interface utilisateur pour un usage "Mobile-First" (adapté aux téléphones des agents de saisie).
- Audits et logs (tracés de toutes les connexions et actions effectuées sur la plateforme).
