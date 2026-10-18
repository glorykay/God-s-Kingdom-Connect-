/*
# Link Pastor Auth to Workspaces

1. Modified Tables
- `workspaces` — add `owner_user_id` column (uuid, references auth.users) to link a pastor's Supabase Auth account to their workspace.

2. Security
- No new tables. Existing workspaces RLS policies still apply (anon+authenticated).
- The new column is nullable so existing workspaces are not affected.

3. Notes
- When a pastor signs up via Supabase Auth, we create a workspace and set owner_user_id to their auth uid.
- On login, we look up the workspace by owner_user_id to restore their session.
*/

DO $$ BEGIN
  ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Index for fast lookup on login
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_user_id ON workspaces(owner_user_id);
