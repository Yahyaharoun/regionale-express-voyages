# API & Server Actions 🔌

Dans Regional Express, nous n'utilisons **pas** d'API REST classique (dossier `pages/api`). L'intégralité de la logique Backend est traitée par les **React Server Actions**.

Cela offre plusieurs avantages :
1. Typage stict End-to-End (TypeScript).
2. Protection native contre les requêtes CSRF (implémentée par Next.js).
3. Exécution transparente côté serveur.

## Flux Standard d'une Action Serveur

Toutes les Server Actions doivent respecter ce flux de validation :
1. **Authentification** : `await supabase.auth.getUser()`. Si échoue -> Rejet (Anti-IDOR).
2. **Validation Zod** : L'Input est parsé par un schéma strict. Si échoue -> Rejet (Anti-Injection).
3. **Exécution Base de Données** : Interaction avec `PrismaRepository`.
4. **Revalidation** : `revalidatePath('/dashboard')` pour rafraîchir l'interface client de manière optimiste.

## Exemple de Réponse Typée

```typescript
type ActionResponse<T> = {
  success?: boolean;
  data?: T;
  error?: string;
}
```
