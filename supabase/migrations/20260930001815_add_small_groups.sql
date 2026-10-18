/*
# Add Small Groups / Ministries

1. New Tables
- `small_groups` — represents a bible study group or ministry within a workspace.
  - id (uuid PK)
  - workspace_id (FK -> workspaces)
  - name (text, not null)
  - description (text)
  - leader (text — name of the group leader)
  - meeting_day (text — e.g. "Wednesday", "Sunday")
  - meeting_time (text — e.g. "7:00 PM")
  - location (text — where the group meets)
  - color (text — for UI color-coding, defaults to 'amber')
  - created_at (timestamptz)

- `group_members` — junction table linking members to small groups.
  - id (uuid PK)
  - group_id (FK -> small_groups, cascade delete)
  - member_id (FK -> members, cascade delete)
  - workspace_id (FK -> workspaces)
  - joined_at (timestamptz)
  - UNIQUE constraint on (group_id, member_id) to prevent duplicates.

2. Security
- RLS enabled on both tables.
- Owner-scoped CRUD via workspaces.owner_user_id check (same pattern as follow_ups).
- group_members policies also check workspace ownership through the group's workspace_id.

3. Indexes
- small_groups(workspace_id)
- group_members(group_id)
- group_members(member_id)
*/

CREATE TABLE IF NOT EXISTS small_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  leader text DEFAULT '',
  meeting_day text DEFAULT '',
  meeting_time text DEFAULT '',
  location text DEFAULT '',
  color text DEFAULT 'amber',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE small_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_small_groups" ON small_groups;
CREATE POLICY "select_own_small_groups" ON small_groups FOR SELECT
  TO authenticated USING (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  ));
DROP POLICY IF EXISTS "insert_own_small_groups" ON small_groups;
CREATE POLICY "insert_own_small_groups" ON small_groups FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  ));
DROP POLICY IF EXISTS "update_own_small_groups" ON small_groups;
CREATE POLICY "update_own_small_groups" ON small_groups FOR UPDATE
  TO authenticated USING (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  )) WITH CHECK (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  ));
DROP POLICY IF EXISTS "delete_own_small_groups" ON small_groups;
CREATE POLICY "delete_own_small_groups" ON small_groups FOR DELETE
  TO authenticated USING (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  ));

CREATE INDEX IF NOT EXISTS small_groups_workspace_idx ON small_groups(workspace_id);

CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES small_groups(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, member_id)
);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_group_members" ON group_members;
CREATE POLICY "select_own_group_members" ON group_members FOR SELECT
  TO authenticated USING (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  ));
DROP POLICY IF EXISTS "insert_own_group_members" ON group_members;
CREATE POLICY "insert_own_group_members" ON group_members FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  ));
DROP POLICY IF EXISTS "update_own_group_members" ON group_members;
CREATE POLICY "update_own_group_members" ON group_members FOR UPDATE
  TO authenticated USING (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  )) WITH CHECK (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  ));
DROP POLICY IF EXISTS "delete_own_group_members" ON group_members;
CREATE POLICY "delete_own_group_members" ON group_members FOR DELETE
  TO authenticated USING (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  ));

CREATE INDEX IF NOT EXISTS group_members_group_idx ON group_members(group_id);
CREATE INDEX IF NOT EXISTS group_members_member_idx ON group_members(member_id);
