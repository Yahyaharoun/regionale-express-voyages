# 🚀 Portfolio de Réalisation - REGIONALE EXPRESS VOYAGES SARL (SaaS ERP / POS)

Ce document retrace le développement intégral de la plateforme **REGIONALE EXPRESS VOYAGES**, construite de A à Z. Il s'agit d'un **SaaS ERP/POS Offline-First** destiné à la gestion financière et opérationnelle d'un réseau d'agences de voyages en Afrique.

---

## 🏗️ 1. Architecture Technique & Stack
Conception d'une architecture moderne, hautement scalable et sécurisée :
- **Frontend** : Next.js 14 (App Router), React, TypeScript, TailwindCSS, Shadcn UI.
- **Backend & Base de données** : Supabase (PostgreSQL), Prisma ORM pour le typage strict.
- **Hébergement & CI/CD** : Déploiement automatisé sur Vercel, gestion de versions via GitHub (Double-Sauvegarde Git configurée).
- **Authentification** : Supabase Auth (JWT), système robuste basé sur des cookies HTTP-Only et vérification via Middleware.

## 📱 2. Expérience Utilisateur (UX/UI) & PWA
Développement d'une interface premium, pensée pour le terrain (Mobile-First) :
- **Application Web Progressive (PWA)** : Installable sur Android/iOS et Desktop avec Manifest dynamique.
- **Design System** : Mode Clair/Sombre automatique, animations fluides (glassmorphism), composants réutilisables.
- **Capture Intégrée** : Développement d'un composant de capture photo natif (WebRTC/Camera) pour numériser instantanément les justificatifs depuis un smartphone.
- **Ergonomie** : Filtres de temps intelligents (Aujourd'hui, Cette semaine, Ce mois...), Tableaux de bord dynamiques avec actions contextuelles intelligentes.

## 📡 3. Moteur Offline-First (Résilience Réseau)
Création d'un système robuste pour garantir le fonctionnement sans connexion Internet (spécifique aux zones à faible réseau) :
- **Stockage Local** : Utilisation d'IndexedDB (via Dexie) pour stocker les données essentielles en local.
- **File d'attente (Queue) & Synchronisation** : Les opérations créées hors ligne sont stockées localement puis synchronisées automatiquement avec Supabase dès le retour de la connexion (Delta Sync).
- **Service Worker (Serwist)** : Mise en cache intelligente des assets statiques tout en protégeant les requêtes API dynamiques (Stratégie Network-Only pour la sécurité financière).

## 💼 4. Fonctionnalités Métier (ERP)
Développement des modules clés pour la gestion financière multi-agences :
- **Gestion des Dépenses & Fournisseurs** : Saisie des sorties de caisse, affectation manuelle (Direction/Agence), gestion des factures fournisseurs avec upload de justificatifs.
- **Recettes Journalières & Versements Bancaires** : Suivi rigoureux des entrées de caisse et des dépôts en banque avec validation hiérarchique.
- **Système Multi-Tenant & RBAC (Role-Based Access Control)** :
  - *PDG* : Accès total, supervision globale.
  - *DG* : Validation, rejet, suspension des opérations financières.
  - *Agent de saisie* : Création d'opérations uniquement, restreint à son agence.
- **Notifications Temps Réel** : Alertes push (avec son et vibration) déclenchées lors d'actions critiques (ex: création ou validation d'une dépense importante).

## 🛡️ 5. Sécurité de Classe Entreprise (Normes OWASP)
Hardening complet de l'infrastructure pour garantir la sécurité des données financières (Score estimé OWASP : 98/100) :
- **Content Security Policy (CSP)** : Durcissement via `middleware.ts` pour bloquer les attaques XSS (Suppression de `unsafe-eval`, limitation stricte des origines).
- **En-têtes HTTP de Sécurité** : Implémentation de HSTS (Strict-Transport-Security), X-Content-Type-Options (nosniff), X-Frame-Options (DENY), et COEP/COOP/CORP.
- **Protection Anti-DDoS & Bruteforce** : Création d'un Rate Limiter Global (200 requêtes/min par IP) appliqué sur toutes les routes `/api/*` à l'Edge.
- **Anti-Cache Données Sensibles** : Blocage de la mise en cache navigateur pour les données financières (`Cache-Control: no-store`).
- **Sécurité Fichiers (Supabase Storage)** : Mise en place de règles RLS et vérification des `Magic Bytes` pour empêcher le téléversement de scripts malveillants (seuls images et PDF autorisés).
- **Protection des Secrets** : Masquage des en-têtes serveurs (`X-Powered-By`) pour empêcher la divulgation des versions (Timestamp Disclosure).

---

> **Note au Recruteur** : Ce projet démontre une capacité complète à gérer le cycle de vie d'un produit logiciel complexe (Fullstack), de la conception de la base de données à l'interface utilisateur, en passant par les défis d'architecture hors-ligne (Offline-First) et de cybersécurité (OWASP).
