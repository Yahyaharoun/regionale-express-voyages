# Déploiement

## Vercel
1. Lier le dépôt GitHub à Vercel.
2. Configurer les variables d'environnement (.env.example).
3. Compiler le projet (
pm run build).

## Supabase
1. Lancer les migrations Prisma (
px prisma generate puis 
px prisma db push ou migrate deploy).
2. Configurer les policies RLS.
