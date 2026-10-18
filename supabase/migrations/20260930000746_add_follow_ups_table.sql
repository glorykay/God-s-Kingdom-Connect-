CREATE TABLE follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE CASCADE,
  newcomer_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'contacted', 'visited', 'completed')),
  method text CHECK (method IN ('call', 'text', 'email', 'visit', 'in_person')),
  notes text DEFAULT '',
  follow_up_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_follow_ups" ON follow_ups FOR SELECT
  TO authenticated USING (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  ));
CREATE POLICY "insert_own_follow_ups" ON follow_ups FOR INSERT
  TO authenticated WITH CHECK (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  ));
CREATE POLICY "update_own_follow_ups" ON follow_ups FOR UPDATE
  TO authenticated USING (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  )) WITH CHECK (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  ));
CREATE POLICY "delete_own_follow_ups" ON follow_ups FOR DELETE
  TO authenticated USING (auth.uid() IN (
    SELECT owner_user_id FROM workspaces WHERE id = workspace_id
  ));

CREATE INDEX follow_ups_workspace_idx ON follow_ups(workspace_id);
CREATE INDEX follow_ups_member_idx ON follow_ups(member_id);
CREATE INDEX follow_ups_status_idx ON follow_ups(status);
