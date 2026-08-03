# Workflow d'Approbation et de RLS

## Processus métier

1. **Création d'une opération** (Dépense/Versement) :
   - Un `AGENT` se connecte depuis son agence.
   - L'Agent crée une opération. L'opération a le statut `EN_ATTENTE`.
   - Seul l'agent qui l'a créée peut la modifier si elle est `BROUILLON` ou `REJETEE`.
   - L'agent ne peut créer d'opérations que pour son agence, assuré par Row Level Security (RLS) dans `prisma/rls.sql`.

2. **Validation** :
   - Un Directeur Général (`DG`) ou le PDG se connecte.
   - Il voit les opérations `EN_ATTENTE`.
   - Il peut les `VALIDER` ou les `REJETER`.
   - Le système trace l'ID du validateur dans `validateurId`.

3. **Sécurité et Permissions (RLS)** :
   - `PDG` : Accès complet à toutes les tables (LECTURE/ÉCRITURE).
   - `DG` : Accès global en LECTURE sur les agences, banques et utilisateurs, validation autorisée.
   - `AGENT` : Accès en lecture seul aux opérations de SON agence, et droit d'insertion sur son agence.

## Implémentation technique

- Le `rls.sql` applique ces politiques en base de données.
- Chaque requête Prisma Server Action utilise `$executeRaw('SELECT set_config(...)')` avec l'ID, rôle et agence de l'utilisateur.
- Toutes les mutations sont encapsulées dans un `$transaction` Prisma pour garantir l'atomicité et la persistance du contexte `current_setting`.
