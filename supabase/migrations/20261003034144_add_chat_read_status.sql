/*
# Add persistent team chat read status

## New table
- `chat_read_status`
  - `workspace_id` — the workspace whose chat was viewed
  - `user_id` — the authenticated team member
  - `last_read_at` — the latest message timestamp the member has viewed
  - composite primary key on workspace and user

## Behavior
Each team member gets an independent read marker. Opening the chat marks the
currently loaded conversation as read, and the marker is updated after new
messages arrive.

## Security
1. Row-level security is enabled.
2. Only authenticated members of the workspace can read or create status.
3. Members can update or delete only their own status row.
4. The owner is filled from `auth.uid()` by default.
*/

CREATE TABLE IF NOT EXISTS public.chat_read_status (
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

ALTER TABLE public.chat_read_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_chat_read_status" ON public.chat_read_status;
CREATE POLICY "select_own_chat_read_status"
ON public.chat_read_status FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "insert_own_chat_read_status" ON public.chat_read_status;
CREATE POLICY "insert_own_chat_read_status"
ON public.chat_read_status FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "update_own_chat_read_status" ON public.chat_read_status;
CREATE POLICY "update_own_chat_read_status"
ON public.chat_read_status FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_workspace_member(workspace_id))
WITH CHECK (auth.uid() = user_id AND public.is_workspace_member(workspace_id));

DROP POLICY IF EXISTS "delete_own_chat_read_status" ON public.chat_read_status;
CREATE POLICY "delete_own_chat_read_status"
ON public.chat_read_status FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_workspace_member(workspace_id));
