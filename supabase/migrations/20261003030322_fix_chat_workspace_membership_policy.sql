/*
# Fix chat membership policy recursion

## Problem
The workspace member SELECT policy checked membership by querying
`workspace_members` from inside a policy on `workspace_members`. PostgreSQL
therefore detected infinite policy recursion, breaking both participant loading
and chat message access.

## Security changes
1. Add `is_workspace_member(uuid)` as a SECURITY DEFINER helper that checks
   the authenticated user's membership without re-entering the table's RLS
   policy. The function uses a fixed search_path and is callable only by
   authenticated users.
2. Rebuild workspace member SELECT access around that helper.
3. Rebuild chat message SELECT and INSERT access around that helper.

## Data safety
- No tables, rows, or columns are deleted or changed.
- Existing authenticated workspace members keep the same access.
- Anonymous users remain unable to access team chat data.
*/

CREATE OR REPLACE FUNCTION public.is_workspace_member(p_workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE workspace_members.workspace_id = p_workspace_id
      AND workspace_members.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_workspace_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated;

DROP POLICY IF EXISTS "select_own_workspace_members" ON workspace_members;
CREATE POLICY "select_own_workspace_members"
ON workspace_members FOR SELECT
TO authenticated
USING (public.is_workspace_member(workspace_members.workspace_id));

DROP POLICY IF EXISTS "select_chat_messages" ON chat_messages;
CREATE POLICY "select_chat_messages"
ON chat_messages FOR SELECT
TO authenticated
USING (public.is_workspace_member(chat_messages.workspace_id));

DROP POLICY IF EXISTS "insert_chat_messages" ON chat_messages;
CREATE POLICY "insert_chat_messages"
ON chat_messages FOR INSERT
TO authenticated
WITH CHECK (public.is_workspace_member(chat_messages.workspace_id));
