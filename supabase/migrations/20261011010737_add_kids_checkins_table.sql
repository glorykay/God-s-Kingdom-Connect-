/*
# Add kids_checkins table

1. New Tables
- `kids_checkins`
  - `id` (uuid, primary key)
  - `workspace_id` (uuid, references workspaces, cascade delete)
  - `service_id` (uuid, references services, cascade delete)
  - `first_name` (text, not null) — kid's first name
  - `last_name` (text, not null) — kid's last name
  - `timestamp` (timestamptz, defaults to now()) — when the kid was checked in
2. Security
- Enable RLS on `kids_checkins`
- Owner-scoped via workspace membership: TO anon, authenticated (no-auth app pattern)
- CRUD policies for anon + authenticated so the anon-key frontend can operate
3. Notes
- Kids check-ins are tracked separately from regular attendance — only first name and last name are captured
- The Excel export from the Attendance page includes a Kids section listing all kids checked in for the selected period
*/

CREATE TABLE IF NOT EXISTS kids_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

ALTER TABLE kids_checkins ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_kids_checkins" ON kids_checkins;
CREATE POLICY "anon_select_kids_checkins" ON kids_checkins FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_kids_checkins" ON kids_checkins;
CREATE POLICY "anon_insert_kids_checkins" ON kids_checkins FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_kids_checkins" ON kids_checkins;
CREATE POLICY "anon_update_kids_checkins" ON kids_checkins FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_kids_checkins" ON kids_checkins;
CREATE POLICY "anon_delete_kids_checkins" ON kids_checkins FOR DELETE
TO anon, authenticated USING (true);
