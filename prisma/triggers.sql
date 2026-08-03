-- Fonction : Empêcher la modification des opérations VALIDEE (Sauf Annulation)
CREATE OR REPLACE FUNCTION prevent_validated_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Si l'ancien statut était VALIDEE
    IF OLD.statut = 'VALIDEE' THEN
        -- Si on essaie de modifier autre chose que le statut (ex: passer à ANNULEE)
        IF NEW.montant <> OLD.montant OR NEW."agencyId" <> OLD."agencyId" OR NEW."bankId" <> OLD."bankId" THEN
            RAISE EXCEPTION 'Opération validée non modifiable. Seule l''annulation est permise.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger à la table Operation
DROP TRIGGER IF EXISTS trigger_prevent_validated_update ON "Operation";
CREATE TRIGGER trigger_prevent_validated_update
BEFORE UPDATE ON "Operation"
FOR EACH ROW
EXECUTE FUNCTION prevent_validated_update();


-- Fonction : Piste d'audit automatique
CREATE OR REPLACE FUNCTION log_audit_action()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
    current_user_role TEXT;
BEGIN
    -- Récupération de l'utilisateur courant via les variables locales de transaction
    -- Si non défini, on fallback sur null ou un user système
    BEGIN
        current_user_id := current_setting('app.current_user_id')::UUID;
        current_user_role := current_setting('app.current_user_role');
    EXCEPTION WHEN OTHERS THEN
        current_user_id := '00000000-0000-0000-0000-000000000000'::UUID; -- SYSTEM
        current_user_role := 'SYSTEM';
    END;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO "AuditLog"("id", "userId", "role", "action", "tableName", "recordId", "newData", "createdAt")
        VALUES (gen_random_uuid(), current_user_id, current_user_role, 'INSERT', TG_TABLE_NAME, NEW.id, row_to_json(NEW), now());
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO "AuditLog"("id", "userId", "role", "action", "tableName", "recordId", "oldData", "newData", "createdAt")
        VALUES (gen_random_uuid(), current_user_id, current_user_role, 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW), now());
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO "AuditLog"("id", "userId", "role", "action", "tableName", "recordId", "oldData", "createdAt")
        VALUES (gen_random_uuid(), current_user_id, current_user_role, 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD), now());
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Attacher le trigger d'audit aux tables sensibles
DROP TRIGGER IF EXISTS trigger_audit_operation ON "Operation";
CREATE TRIGGER trigger_audit_operation AFTER INSERT OR UPDATE OR DELETE ON "Operation" FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS trigger_audit_user ON "User";
CREATE TRIGGER trigger_audit_user AFTER INSERT OR UPDATE OR DELETE ON "User" FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS trigger_audit_agency ON "Agency";
CREATE TRIGGER trigger_audit_agency AFTER INSERT OR UPDATE OR DELETE ON "Agency" FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS trigger_audit_bank ON "Bank";
CREATE TRIGGER trigger_audit_bank AFTER INSERT OR UPDATE OR DELETE ON "Bank" FOR EACH ROW EXECUTE FUNCTION log_audit_action();

DROP TRIGGER IF EXISTS trigger_audit_category ON "Category";
CREATE TRIGGER trigger_audit_category AFTER INSERT OR UPDATE OR DELETE ON "Category" FOR EACH ROW EXECUTE FUNCTION log_audit_action();

