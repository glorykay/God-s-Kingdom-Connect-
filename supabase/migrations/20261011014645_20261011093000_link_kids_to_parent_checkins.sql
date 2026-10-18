/*
# Link children to parent check-ins

1. Modified Tables
- `kids_checkins`
  - Add `parent_member_id` (uuid, nullable) to connect each child to the parent member record.
  - Keep existing child names and service association unchanged.

2. Security
- Preserve public insert access so parents can submit children from the check-in form.
- Restrict child check-in reads, updates, and deletes to authenticated church staff sessions.

3. Important Notes
- Existing child check-ins remain valid because the new parent link is nullable.
- No existing rows or columns are deleted or changed.
*/

ALTER TABLE kids_checkins
  ADD COLUMN IF NOT EXISTS parent_member_id uuid REFERENCES members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_kids_checkins_workspace_service
  ON kids_checkins(workspace_id, service_id);

CREATE INDEX IF NOT EXISTS idx_kids_checkins_parent_member
  ON kids_checkins(parent_member_id);

ALTER TABLE kids_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kids_checkins" ON kids_checkins;
CREATE POLICY "staff_select_kids_checkins" ON kids_checkins FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_kids_checkins" ON kids_checkins;
CREATE POLICY "public_insert_kids_checkins" ON kids_checkins FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_kids_checkins" ON kids_checkins;
DROP POLICY IF EXISTS "anon_delete_kids_checkins" ON kids_checkins;

DROP POLICY IF EXISTS "staff_update_kids_checkins" ON kids_checkins;
CREATE POLICY "staff_update_kids_checkins" ON kids_checkins FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "staff_delete_kids_checkins" ON kids_checkins;
CREATE POLICY "staff_delete_kids_checkins" ON kids_checkins FOR DELETE
TO authenticated USING (true);
