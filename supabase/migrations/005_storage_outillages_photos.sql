-- =============================================================================
-- Bucket outillages-photos : lecture + upload depuis le dashboard web (clé anon)
-- Coller tout ce fichier dans Supabase → SQL Editor → Run
-- =============================================================================

-- 1. Bucket public (création ou mise à jour)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'outillages-photos',
  'outillages-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']::text[];

-- 2. Politiques sur storage.objects (RLS activé par défaut)
--    Utiliser TO public = anon + authenticated

DROP POLICY IF EXISTS "Public read outillages photos" ON storage.objects;
CREATE POLICY "Public read outillages photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'outillages-photos');

DROP POLICY IF EXISTS "Public insert outillages photos" ON storage.objects;
CREATE POLICY "Public insert outillages photos"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'outillages-photos');

DROP POLICY IF EXISTS "Public update outillages photos" ON storage.objects;
CREATE POLICY "Public update outillages photos"
  ON storage.objects FOR UPDATE
  TO public
  USING (bucket_id = 'outillages-photos')
  WITH CHECK (bucket_id = 'outillages-photos');

DROP POLICY IF EXISTS "Public delete outillages photos" ON storage.objects;
CREATE POLICY "Public delete outillages photos"
  ON storage.objects FOR DELETE
  TO public
  USING (bucket_id = 'outillages-photos');

-- Anciennes politiques (nommage précédent) — nettoyage
DROP POLICY IF EXISTS "Anon insert outillages photos" ON storage.objects;
DROP POLICY IF EXISTS "Anon update outillages photos" ON storage.objects;
DROP POLICY IF EXISTS "Anon delete outillages photos" ON storage.objects;

-- 3. Vérification (doit retourner 4 lignes : SELECT, INSERT, UPDATE, DELETE)
SELECT policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%outillages photos%';
