/*
# Create church-logos storage bucket

1. Storage
- Create a public bucket `church-logos` for uploading church logo images.
2. Security
- Allow anon + authenticated to upload, read, and delete logo files (no-auth app pattern).
*/
INSERT INTO storage.buckets (id, name, public)
VALUES ('church-logos', 'church-logos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_logos" ON storage.objects;
CREATE POLICY "anon_read_logos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'church-logos');

DROP POLICY IF EXISTS "anon_insert_logos" ON storage.objects;
CREATE POLICY "anon_insert_logos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'church-logos');

DROP POLICY IF EXISTS "anon_update_logos" ON storage.objects;
CREATE POLICY "anon_update_logos"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'church-logos')
WITH CHECK (bucket_id = 'church-logos');

DROP POLICY IF EXISTS "anon_delete_logos" ON storage.objects;
CREATE POLICY "anon_delete_logos"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'church-logos');
