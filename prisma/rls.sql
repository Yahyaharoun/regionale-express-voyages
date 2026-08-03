-- Activer le Row Level Security (RLS) sur les tables clés
ALTER TABLE "Operation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Agency" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bank" ENABLE ROW LEVEL SECURITY;

-- Créer un rôle applicatif par défaut si nécessaire
-- Note: Avec Prisma, on se connecte généralement en tant que "postgres" (superuser) 
-- qui bypasse le RLS par défaut. Pour que RLS fonctionne, il faut que la connexion 
-- utilise un rôle non-superuser ou forcer le RLS.
ALTER TABLE "Operation" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Agency" FORCE ROW LEVEL SECURITY;
ALTER TABLE "Bank" FORCE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;

-- --------------------------------------------------------
-- POLITIQUES POUR 'Operation'
-- --------------------------------------------------------
DROP POLICY IF EXISTS "PDG_ALL_OPERATIONS" ON "Operation";
CREATE POLICY "PDG_ALL_OPERATIONS" ON "Operation"
    AS PERMISSIVE FOR ALL
    USING (current_setting('app.current_user_role', true) = 'PDG');

DROP POLICY IF EXISTS "DG_AGENCY_OPERATIONS" ON "Operation";
CREATE POLICY "DG_AGENCY_OPERATIONS" ON "Operation"
    AS PERMISSIVE FOR ALL
    USING (
        current_setting('app.current_user_role', true) = 'DG'
        AND "agencyId"::text = current_setting('app.current_user_agency', true)
    );

DROP POLICY IF EXISTS "AGENT_AGENCY_OPERATIONS" ON "Operation";
CREATE POLICY "AGENT_AGENCY_OPERATIONS" ON "Operation"
    AS PERMISSIVE FOR SELECT
    USING (
        current_setting('app.current_user_role', true) = 'AGENT' 
        AND "agencyId"::text = current_setting('app.current_user_agency', true)
    );

DROP POLICY IF EXISTS "AGENT_INSERT_OPERATIONS" ON "Operation";
CREATE POLICY "AGENT_INSERT_OPERATIONS" ON "Operation"
    AS PERMISSIVE FOR INSERT
    WITH CHECK (
        current_setting('app.current_user_role', true) = 'AGENT' 
        AND "agencyId"::text = current_setting('app.current_user_agency', true)
    );

DROP POLICY IF EXISTS "AGENT_UPDATE_OPERATIONS" ON "Operation";
CREATE POLICY "AGENT_UPDATE_OPERATIONS" ON "Operation"
    AS PERMISSIVE FOR UPDATE
    USING (
        current_setting('app.current_user_role', true) = 'AGENT' 
        AND "agentId"::text = current_setting('app.current_user_id', true)
        AND statut IN ('BROUILLON', 'REJETEE')
    );

-- --------------------------------------------------------
-- POLITIQUES POUR 'Agency'
-- --------------------------------------------------------
DROP POLICY IF EXISTS "PDG_ALL_AGENCIES" ON "Agency";
CREATE POLICY "PDG_ALL_AGENCIES" ON "Agency"
    AS PERMISSIVE FOR ALL
    USING (current_setting('app.current_user_role', true) = 'PDG');

DROP POLICY IF EXISTS "READONLY_AGENCIES" ON "Agency";
CREATE POLICY "READONLY_AGENCIES" ON "Agency"
    AS PERMISSIVE FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('DG', 'AGENT')
        AND "isActive" = true
    );

-- --------------------------------------------------------
-- POLITIQUES POUR 'Bank'
-- --------------------------------------------------------
DROP POLICY IF EXISTS "PDG_ALL_BANKS" ON "Bank";
CREATE POLICY "PDG_ALL_BANKS" ON "Bank"
    AS PERMISSIVE FOR ALL
    USING (current_setting('app.current_user_role', true) = 'PDG');

DROP POLICY IF EXISTS "READONLY_BANKS" ON "Bank";
CREATE POLICY "READONLY_BANKS" ON "Bank"
    AS PERMISSIVE FOR SELECT
    USING (
        current_setting('app.current_user_role', true) IN ('DG', 'AGENT')
        AND "isActive" = true
    );

-- --------------------------------------------------------
-- POLITIQUES POUR 'User'
-- --------------------------------------------------------
DROP POLICY IF EXISTS "PDG_ALL_USERS" ON "User";
CREATE POLICY "PDG_ALL_USERS" ON "User"
    AS PERMISSIVE FOR ALL
    USING (current_setting('app.current_user_role', true) = 'PDG');

DROP POLICY IF EXISTS "DG_AGENCY_USERS" ON "User";
CREATE POLICY "DG_AGENCY_USERS" ON "User"
    AS PERMISSIVE FOR SELECT
    USING (
        current_setting('app.current_user_role', true) = 'DG'
        AND "agencyId"::text = current_setting('app.current_user_agency', true)
    );

DROP POLICY IF EXISTS "SELF_USER" ON "User";
CREATE POLICY "SELF_USER" ON "User"
    AS PERMISSIVE FOR SELECT
    USING ("id"::text = current_setting('app.current_user_id', true));

-- --------------------------------------------------------
-- POLITIQUES POUR 'AuditLog'
-- --------------------------------------------------------
DROP POLICY IF EXISTS "PDG_ALL_AUDIT" ON "AuditLog";
CREATE POLICY "PDG_ALL_AUDIT" ON "AuditLog"
    AS PERMISSIVE FOR SELECT
    USING (current_setting('app.current_user_role', true) = 'PDG');

DROP POLICY IF EXISTS "INSERT_AUDIT" ON "AuditLog";
CREATE POLICY "INSERT_AUDIT" ON "AuditLog"
    AS PERMISSIVE FOR INSERT
    WITH CHECK (
        current_setting('app.current_user_id', true) IS NOT NULL
    );

