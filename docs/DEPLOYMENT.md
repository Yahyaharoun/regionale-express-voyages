# Déploiement & DevOps 🚀

Le projet utilise des pipelines CI/CD stricts (GitHub Actions) garantissant que du code non testé ou vulnérable ne soit jamais publié.

## Vercel Edge Network
L'application est déployée de manière Serverless sur Vercel :
1. Le code Next.js profite du cache Global (Edge Network).
2. Sécurisation via `.vercel.json` (CSP Headers).
3. Build automatisé à chaque `git push` sur `main`.

## CI/CD (GitHub Actions)
Deux Workflows majeurs pilotent le déploiement (`.github/workflows/`) :
- **`ci.yml`** : Exécuté sur chaque Pull Request. Lance `vitest` (Tests unitaires) et `playwright` (Tests E2E). Bloque le merge si un test échoue ou si le coverage descend sous 90%.
- **`deploy.yml`** : Construit l'image Docker multi-stage optimisée (`Dockerfile`) et déclenche la mise en production si la branche est `main`.

## Disaster Recovery
Un script `scripts/db-restore.sh` est disponible pour restaurer instantanément la base de données de production à partir d'un snapshot en cas d'incident critique (perte de données majeure).

## Conteneurisation (Self-Hosting)
Un fichier `docker-compose.yml` et un `Dockerfile` (mode `standalone` Next.js) sont inclus si un déploiement On-Premise est un jour exigé par le client.
