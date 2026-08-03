# Architecture Technique (High-Level) 📐

L'architecture de Regional Express est conçue pour être robuste, rapide et résiliente, s'appuyant sur des technologies SaaS de nouvelle génération.

## Diagramme d'Architecture

```mermaid
graph TD;
    Client[Client Browser / PWA] -->|Offline Sync| Dexie[IndexedDB Locale];
    Dexie -->|Delta Sync / Retour Réseau| NextJS[Next.js 15 Edge Network];
    Client -->|Online HTTP Requests| NextJS;
    
    subgraph Vercel Cloud
        NextJS --> |Server Actions / Zod Validation| Controllers[Logique Métier];
        Controllers --> |Prisma ORM| PrismaCache[Prisma Accelerate];
    end
    
    subgraph Supabase
        PrismaCache --> PostgreSQL[PostgreSQL DB];
        NextJS --> |Auth JWT| SupabaseAuth[Supabase Auth];
        PostgreSQL --> |RLS Policies| PostgreSQL;
    end
    
    NextJS -.-> Sentry[Sentry Monitoring];
```

## Choix Technologiques
1. **Framework** : Next.js 15 (App Router) permettant d'unifier Frontend et Backend.
2. **Offline-First** : IndexedDB (Dexie) utilisé comme cache transactionnel (Delta Sync).
3. **ORM** : Prisma, pour le typage end-to-end strict avec TypeScript.
4. **Authentification & DB** : Supabase. Fournit un PostgreSQL géré avec le concept de Row Level Security (RLS) pour sécuriser le multi-tenant.
5. **Observabilité** : Sentry capte les erreurs et transactions de performance.
