# Guide de Développement 🛠️

Prise en main du projet pour tout nouveau développeur rejoignant l'équipe Regional Express.

## Prérequis
- Node.js (v20+ obligatoire)
- Base de données PostgreSQL locale ou instance Supabase.
- Fichier `.env` (Copiez le `.env.example`).

## Démarrage Local
1. Installez les dépendances :
```bash
npm install
```
2. Synchronisez la base de données :
```bash
npx prisma db push
```
3. Lancez le serveur de développement :
```bash
npm run dev
```

## Stratégie de Tests (QA)
La couverture de code doit obligatoirement rester **> 90%**.
- Lancer les tests unitaires / intégration (Vitest) :
```bash
npm run test
npm run test:coverage
```
- Lancer les tests End-to-End E2E et UI (Playwright) :
```bash
npx playwright install
npm run test:e2e:ui
```

> [!WARNING]
> Avant de soumettre une PR, assurez-vous que `npm run build` et `npm run test` passent à 100%. Aucune exception ne sera tolérée.
