# Architecture Technique – REGIONALE EXPRESS VOYAGES SARL ERP

## 1. Stack Technique
- **Frontend** : Next.js 14+ (App Router), React 18, Tailwind CSS, Lucide Icons, Shadcn UI
- **Backend & API** : Next.js API Routes (Serverless)
- **Base de données** : Supabase PostgreSQL (avec Prisma ORM)
- **Mode Offline** : Dexie.js (IndexedDB) pour le Offline-First
- **Notifications** : Firebase Cloud Messaging (FCM)
- **Déploiement** : Vercel (Frontend & Serverless Functions)

## 2. Infrastructure et Réseau
L'application est conçue pour fonctionner avec des réseaux instables (Offline-First).
Les données sont stockées localement via Dexie.js et synchronisées avec Supabase PostgreSQL dès que la connexion est rétablie via une file d'attente locale (Sync Queue).

## 3. Sécurité (Role Based Access Control - RBAC)
- **PDG** : Super Administrateur (Toutes permissions)
- **DG** : Administrateur (Lecture/Validation, pas de suppression)
- **Agent de saisie** : Créateur (Saisie uniquement, aucune validation)
