/*
# Chat System for Pastors and Coordinators

1. Modified Tables
- `workspace_members` — add `user_id` (uuid, references auth.users) and `email` (text) columns so coordinators can have auth accounts linked to their workspace membership. Both nullable so existing members are unaffected.

2. New Tables
- `chat_messages` — stores chat messages between pastors and coordinators within a workspace.
  - `id` (uuid, primary key)
  - `workspace_id` (uuid, references workspaces)
  - `sender_id` (uuid, references auth.users) — the authenticated user who sent the message
  - `sender_name` (text) — display name of sender (denormalized for convenience)
  - `sender_role` (text) — 'pastor' or 'coordinator'
  - `message_text` (text, nullable) — the text content (nullable when a message is file-only)
  - `file_url` (text, nullable) — public URL of an uploaded file in storage
  - `file_name` (text, nullable) — original filename for display
  - `file_size` (bigint, nullable) — file size in bytes for display
  - `created_at` (timestamptz, default now())

3. Storage
- Create bucket `chat-files` for file sharing between pastors and coordinators.
- Policies: authenticated users can upload/read files in chat-files bucket.

4. Security
- Enable RLS on `chat_messages`.
- SELECT: authenticated users who are members of the workspace (checked via workspace_members.user_id = auth.uid() AND same workspace_id).
- INSERT: authenticated users who are members of that workspace.
- UPDATE/DELETE: only the message sender (auth.uid() = sender_id).
- workspace_members: add SELECT policy for authenticated users to see members of their own workspace (needed for chat to look up participants).

5. Notes
- Coordinators sign up with email + password + join code. Their auth account is created and linked to workspace_members via user_id.
- Pastors already have auth accounts from the existing signUpPastor flow. Their workspace_members row is updated with user_id on next login (or we handle it in the app).
- Chat messages are realtime-subscribed by workspace_id.
*/
-- Add user_id and email to workspace_members
DO $$ BEGIN
  ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE workspace_members ADD COLUMN IF NOT EXISTS email text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name text NOT NULL,
  sender_role text NOT NULL DEFAULT 'coordinator',
  message_text text,
  file_url text,
  file_name text,
  file_size bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_workspace_created ON chat_messages(workspace_id, created_at);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);

-- RLS Policies for chat_messages
-- SELECT: workspace members can read messages in their workspace
DROP POLICY IF EXISTS "select_chat_messages" ON chat_messages;
CREATE POLICY "select_chat_messages"
ON chat_messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.workspace_id = chat_messages.workspace_id
  )
);

-- INSERT: workspace members can send messages to their workspace
DROP POLICY IF EXISTS "insert_chat_messages" ON chat_messages;
CREATE POLICY "insert_chat_messages"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.user_id = auth.uid()
    AND wm.workspace_id = chat_messages.workspace_id
  )
);

-- UPDATE: only the sender can edit their message
DROP POLICY IF EXISTS "update_chat_messages" ON chat_messages;
CREATE POLICY "update_chat_messages"
ON chat_messages FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

-- DELETE: only the sender can delete their message
DROP POLICY IF EXISTS "delete_chat_messages" ON chat_messages;
CREATE POLICY "delete_chat_messages"
ON chat_messages FOR DELETE
TO authenticated
USING (auth.uid() = sender_id);

-- Allow authenticated users to see members of their own workspace
-- (needed for chat to list participants)
DROP POLICY IF EXISTS "select_own_workspace_members" ON workspace_members;
CREATE POLICY "select_own_workspace_members"
ON workspace_members FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM workspace_members wm2
    WHERE wm2.user_id = auth.uid()
    AND wm2.workspace_id = workspace_members.workspace_id
  )
);

-- Create storage bucket for chat files
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-files', 'chat-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for chat-files bucket
DROP POLICY IF EXISTS "chat_files_upload" ON storage.objects;
CREATE POLICY "chat_files_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-files');

DROP POLICY IF EXISTS "chat_files_read" ON storage.objects;
CREATE POLICY "chat_files_read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-files');

DROP POLICY IF EXISTS "chat_files_delete" ON storage.objects;
CREATE POLICY "chat_files_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-files' AND owner = auth.uid());
