/*
# Add chat_reactions table

1. New Tables
- `chat_reactions`
  - `id` (uuid, primary key)
  - `message_id` (uuid, FK to chat_messages, ON DELETE CASCADE)
  - `workspace_id` (uuid, FK to workspaces, ON DELETE CASCADE)
  - `user_id` (uuid, FK to auth.users, ON DELETE CASCADE)
  - `emoji` (text, not null — the emoji character)
  - `created_at` (timestamptz, default now())
  - Unique constraint on (message_id, user_id, emoji) to prevent duplicate reactions

2. Security
- Enable RLS on `chat_reactions`.
- Workspace membership check via workspace_members table for all CRUD operations.
- Only authenticated users who are members of the workspace can read/insert/delete reactions.
- Added index on message_id for fast lookups.

3. Notes
- Reactions are scoped per workspace and per message.
- A user can react with multiple different emojis on the same message.
- Deleting a chat message cascades to delete its reactions.
*/

CREATE TABLE IF NOT EXISTS chat_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);

CREATE INDEX IF NOT EXISTS idx_chat_reactions_message_id ON chat_reactions(message_id);

ALTER TABLE chat_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_chat_reactions" ON chat_reactions;
CREATE POLICY "select_chat_reactions"
ON chat_reactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = chat_reactions.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "insert_chat_reactions" ON chat_reactions;
CREATE POLICY "insert_chat_reactions"
ON chat_reactions FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = chat_reactions.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "delete_chat_reactions" ON chat_reactions;
CREATE POLICY "delete_chat_reactions"
ON chat_reactions FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_members.workspace_id = chat_reactions.workspace_id
    AND workspace_members.user_id = auth.uid()
  )
);
