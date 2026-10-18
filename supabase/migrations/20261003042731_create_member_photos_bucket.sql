/*
# Create member-photos storage bucket

1. Storage
- Create a public bucket `member-photos` for uploading member profile photos.
2. Security
- Allow anon + authenticated to upload, read, update, and delete member photos.
- This follows the same pattern as the existing church-logos bucket (no-auth app pattern).
3. Notes
- Photos are stored as public URLs in the members.photo_url column.
- Files are organized by workspace_id/member_id for namespacing.
*/
INSERT INTO storage.buckets (id, name, public)
VALUES ('member-photos', 'member-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_member_photos" ON storage.objects;
CREATE POLICY "anon_read_member_photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'member-photos');

DROP POLICY IF EXISTS "anon_insert_member_photos" ON storage.objects;
CREATE POLICY "anon_insert_member_photos"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'member-photos');

DROP POLICY IF EXISTS "anon_update_member_photos" ON storage.objects;
CREATE POLICY "anon_update_member_photos"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'member-photos')
WITH CHECK (bucket_id = 'member-photos');

DROP POLICY IF EXISTS "anon_delete_member_photos" ON storage.objects;
CREATE POLICY "anon_delete_member_photos"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'member-photos');
