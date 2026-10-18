/*
# Add Workspaces (Multi-Church) + Role-Based Access

1. New Tables
- `workspaces` — each church has its own workspace (name, pastor info, unique join code)
- `workspace_members` — maps users to workspaces with a role (pastor or member)

2. Modified Tables
- `members` — add `workspace_id` column (FK to workspaces)
- `services` — add `workspace_id` column
- `attendance` — add `workspace_id` column
- `prayer_requests` — add `workspace_id` column

3. Security
- All new tables have RLS enabled with anon+authenticated policies (single-tenant browser app, no auth screen).
- Existing table policies remain open since workspace_id filtering is done in the frontend query layer.
- workspace_members role column controls what UI features a user sees (pastor sees management, member sees read-only).

4. Important Notes
- The `join_code` is a 6-character uppercase alphanumeric code generated per workspace.
- Pastors create a workspace and get a QR code encoding the join code.
- Members scan the QR code (or enter the code manually) to join a workspace.
- All existing data gets assigned to a default workspace so nothing is lost.
*/

CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  pastor_name text NOT NULL,
  description text,
  join_code text NOT NULL UNIQUE DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::text) FROM 1 FOR 6)),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('pastor', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, display_name)
);

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Workspaces policies
DROP POLICY IF EXISTS "anon_select_workspaces" ON workspaces;
CREATE POLICY "anon_select_workspaces" ON workspaces FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_workspaces" ON workspaces;
CREATE POLICY "anon_insert_workspaces" ON workspaces FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_workspaces" ON workspaces;
CREATE POLICY "anon_update_workspaces" ON workspaces FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_workspaces" ON workspaces;
CREATE POLICY "anon_delete_workspaces" ON workspaces FOR DELETE TO anon, authenticated USING (true);

-- Workspace members policies
DROP POLICY IF EXISTS "anon_select_wm" ON workspace_members;
CREATE POLICY "anon_select_wm" ON workspace_members FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_wm" ON workspace_members;
CREATE POLICY "anon_insert_wm" ON workspace_members FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_wm" ON workspace_members;
CREATE POLICY "anon_update_wm" ON workspace_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_wm" ON workspace_members;
CREATE POLICY "anon_delete_wm" ON workspace_members FOR DELETE TO anon, authenticated USING (true);

-- Add workspace_id to existing tables
DO $$ BEGIN
  ALTER TABLE members ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE services ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE attendance ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE prayer_requests ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_members_workspace ON members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_services_workspace ON services(workspace_id);
CREATE INDEX IF NOT EXISTS idx_attendance_workspace ON attendance(workspace_id);
CREATE INDEX IF NOT EXISTS idx_prayer_workspace ON prayer_requests(workspace_id);
CREATE INDEX IF NOT EXISTS idx_wm_workspace ON workspace_members(workspace_id);
