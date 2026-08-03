# Modèle de Base de Données & RLS 🗄️

Nous utilisons **PostgreSQL** hébergé sur Supabase, avec **Prisma** comme ORM.

## Multi-Tenant & RLS (Row Level Security)
Regional Express est une plateforme B2B SaaS. Les données ne doivent *jamais* fuiter d'une agence à une autre.
Pour garantir cela de façon absolue, la base de données exploite les politiques RLS de PostgreSQL :

- Chaque requête envoyée par le serveur backend inclut un jeton JWT contenant l'UUID de l'utilisateur.
- PostgreSQL lit ce jeton et applique un filtre de sécurité au niveau de la ligne (`row`).
- Si l'utilisateur n'est pas rattaché à l'`agencyId` de la ligne, la ligne n'est jamais retournée.

## Prisma Schema Principal (Extrait)

```prisma
model Agency {
  id         String      @id @default(uuid())
  nom        String
  operations Operation[]
  agents     User[]
}

model Operation {
  id          String   @id @default(uuid())
  montant     Float
  type        String   // DEPENSE, RECETTE
  statut      String   // EN_ATTENTE, VALIDEE
  agencyId    String
  agency      Agency   @relation(fields: [agencyId], references: [id])
}
```

## Migrations
Toute modification du schéma se fait via :
```bash
npx prisma migrate dev --name <nom_de_la_modification>
```
