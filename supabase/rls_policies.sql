-- ============================================================
-- RLS POLICIES — REGIONAL EXPRESS VOYAGE
-- À exécuter dans le SQL Editor de Supabase (une seule fois)
-- ============================================================
-- IMPORTANT: Ces politiques s'appliquent quand Supabase
-- est utilisé DIRECTEMENT (ex: Supabase client-side, Edge Functions).
-- Les Server Actions via Prisma+SERVICE_ROLE_KEY bypassent le RLS.
-- Ces politiques constituent le filet de sécurité en cas de bug applicatif.
-- ============================================================

-- 1. Activer le RLS sur toutes les tables critiques
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Agency" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Operation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bank" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BankObjective" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SystemSettings" ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER: Fonction pour récupérer l'agencyId de l'utilisateur courant
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_user_agency_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agency_id UUID;
BEGIN
  SELECT "agencyId" INTO agency_id
  FROM "User"
  WHERE id = auth.uid()::text;
  RETURN agency_id;
END;
$$;

-- Fonction pour récupérer le rôle de l'utilisateur courant
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM "User"
  WHERE id = auth.uid()::text;
  RETURN user_role;
END;
$$;

-- ============================================================
-- TABLE: User
-- ============================================================

-- Un utilisateur peut lire son propre profil
DROP POLICY IF EXISTS "Users can read own profile" ON "User";
CREATE POLICY "Users can read own profile" ON "User"
  FOR SELECT USING (id = auth.uid()::text);

-- DG peut lire les utilisateurs de son agence
DROP POLICY IF EXISTS "DG can read agency users" ON "User";
CREATE POLICY "DG can read agency users" ON "User"
  FOR SELECT USING (
    get_current_user_role() = 'DG'
    AND "agencyId" = get_current_user_agency_id()
  );

-- PDG peut lire tous les utilisateurs
DROP POLICY IF EXISTS "PDG can read all users" ON "User";
CREATE POLICY "PDG can read all users" ON "User"
  FOR SELECT USING (get_current_user_role() = 'PDG');

-- ============================================================
-- TABLE: Agency
-- ============================================================

-- Agents et DG voient uniquement leur agence
DROP POLICY IF EXISTS "Users can read own agency" ON "Agency";
CREATE POLICY "Users can read own agency" ON "Agency"
  FOR SELECT USING (id = get_current_user_agency_id());

-- PDG voit toutes les agences
DROP POLICY IF EXISTS "PDG can read all agencies" ON "Agency";
CREATE POLICY "PDG can read all agencies" ON "Agency"
  FOR SELECT USING (get_current_user_role() = 'PDG');

-- Seul le PDG peut créer/modifier des agences
DROP POLICY IF EXISTS "PDG can create agencies" ON "Agency";
CREATE POLICY "PDG can create agencies" ON "Agency"
  FOR INSERT WITH CHECK (get_current_user_role() = 'PDG');

DROP POLICY IF EXISTS "PDG can update agencies" ON "Agency";
CREATE POLICY "PDG can update agencies" ON "Agency"
  FOR UPDATE USING (get_current_user_role() = 'PDG');

-- ============================================================
-- TABLE: Operation
-- ============================================================

-- Agent: voit uniquement les opérations de son agence
DROP POLICY IF EXISTS "Agents can read own agency operations" ON "Operation";
CREATE POLICY "Agents can read own agency operations" ON "Operation"
  FOR SELECT USING (
    "agencyId" = get_current_user_agency_id()
    AND get_current_user_role() = ANY(ARRAY['AGENT', 'DG'])
  );

-- PDG voit toutes les opérations
DROP POLICY IF EXISTS "PDG can read all operations" ON "Operation";
CREATE POLICY "PDG can read all operations" ON "Operation"
  FOR SELECT USING (get_current_user_role() = 'PDG');

-- Agent peut créer une opération pour son agence uniquement
DROP POLICY IF EXISTS "Agents can create operations for own agency" ON "Operation";
CREATE POLICY "Agents can create operations for own agency" ON "Operation"
  FOR INSERT WITH CHECK (
    "agencyId" = get_current_user_agency_id()
    AND get_current_user_role() = ANY(ARRAY['AGENT', 'DG'])
  );

-- DG et PDG peuvent valider/rejeter (UPDATE statut)
DROP POLICY IF EXISTS "DG-PDG can update operation status" ON "Operation";
CREATE POLICY "DG-PDG can update operation status" ON "Operation"
  FOR UPDATE USING (
    get_current_user_role() = ANY(ARRAY['DG', 'PDG'])
    AND (
      get_current_user_role() = 'PDG'
      OR "agencyId" = get_current_user_agency_id()  -- DG: agence uniquement
    )
  );

-- ============================================================
-- TABLE: AuditLog
-- ============================================================

-- DG voit les logs de son agence (via les opérations)
DROP POLICY IF EXISTS "DG can read agency audit logs" ON "AuditLog";
CREATE POLICY "DG can read agency audit logs" ON "AuditLog"
  FOR SELECT USING (
    "userId" IN (
      SELECT id FROM "User"
      WHERE "agencyId" = get_current_user_agency_id()
    )
    AND get_current_user_role() = 'DG'
  );

-- PDG voit tous les logs
DROP POLICY IF EXISTS "PDG can read all audit logs" ON "AuditLog";
CREATE POLICY "PDG can read all audit logs" ON "AuditLog"
  FOR SELECT USING (get_current_user_role() = 'PDG');

-- Aucun utilisateur ne peut modifier les logs d'audit (INSERT only via système)
DROP POLICY IF EXISTS "No user can delete audit logs" ON "AuditLog";
CREATE POLICY "No user can delete audit logs" ON "AuditLog"
  FOR DELETE USING (false);

-- ============================================================
-- TABLE: SystemSettings (lecture seule pour tous)
-- ============================================================

DROP POLICY IF EXISTS "All authenticated users can read settings" ON "SystemSettings";
CREATE POLICY "All authenticated users can read settings" ON "SystemSettings"
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "PDG can update settings" ON "SystemSettings";
CREATE POLICY "PDG can update settings" ON "SystemSettings"
  FOR UPDATE USING (get_current_user_role() = 'PDG');

-- ============================================================
-- TABLE: Category (lecture seule pour tous)
-- ============================================================

DROP POLICY IF EXISTS "All authenticated users can read categories" ON "Category";
CREATE POLICY "All authenticated users can read categories" ON "Category"
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- TABLE: Bank
-- ============================================================

DROP POLICY IF EXISTS "All authenticated users can read banks" ON "Bank";
CREATE POLICY "All authenticated users can read banks" ON "Bank"
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "PDG can manage banks" ON "Bank";
CREATE POLICY "PDG can manage banks" ON "Bank"
  FOR ALL USING (get_current_user_role() = 'PDG');
