-- Création du Bucket 'justificatifs' s'il n'existe pas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('justificatifs', 'justificatifs', false)
ON CONFLICT (id) DO NOTHING;


-- --------------------------------------------------------
-- POLITIQUES STORAGE 'justificatifs'
-- --------------------------------------------------------

-- 1. AGENT : Peut uploader uniquement dans le dossier de son agence
DROP POLICY IF EXISTS "Agents can upload receipts to their agency folder" ON storage.objects;
CREATE POLICY "Agents can upload receipts to their agency folder" ON storage.objects
    FOR INSERT 
    TO authenticated
    WITH CHECK (
        bucket_id = 'justificatifs' AND
        (storage.foldername(name))[1] = (auth.jwt() ->> 'agencyId')::text AND
        (storage.extension(name) = 'jpg' OR storage.extension(name) = 'jpeg' OR storage.extension(name) = 'png' OR storage.extension(name) = 'webp' OR storage.extension(name) = 'pdf')
    );

-- 2. AGENT : Peut lire les reçus de son agence
DROP POLICY IF EXISTS "Agents can view their agency receipts" ON storage.objects;
CREATE POLICY "Agents can view their agency receipts" ON storage.objects
    FOR SELECT 
    TO authenticated
    USING (
        bucket_id = 'justificatifs' AND
        (storage.foldername(name))[1] = (auth.jwt() ->> 'agencyId')::text
    );

-- 3. DG : Peut lire les reçus de son agence
DROP POLICY IF EXISTS "DG can view their agency receipts" ON storage.objects;
CREATE POLICY "DG can view their agency receipts" ON storage.objects
    FOR SELECT 
    TO authenticated
    USING (
        bucket_id = 'justificatifs' AND
        (auth.jwt() ->> 'role') = 'DG' AND
        (storage.foldername(name))[1] = (auth.jwt() ->> 'agencyId')::text
    );

-- 4. PDG : Peut lire TOUS les reçus
DROP POLICY IF EXISTS "PDG can view all receipts" ON storage.objects;
CREATE POLICY "PDG can view all receipts" ON storage.objects
    FOR SELECT 
    TO authenticated
    USING (
        bucket_id = 'justificatifs' AND
        (auth.jwt() ->> 'role') = 'PDG'
    );
