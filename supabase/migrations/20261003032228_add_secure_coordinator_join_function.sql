/*
# Securely link coordinator accounts during team joining

## Problem
A coordinator account could be created successfully, but the browser then
tried to insert a second `workspace_members` row with the same name. The
existing row could not be read before authentication, so the insert failed on
the unique workspace/name constraint and the new account was not linked.

## New database function
- `join_workspace_as_coordinator` — authenticated coordinators provide the
  workspace join code, display name, and email. The function atomically links
  an existing unclaimed coordinator row or creates one, then returns the
  workspace identity needed by the app.

## Security
1. The function derives the coordinator identity from `auth.uid()`.
2. It validates the join code on the server.
3. It can claim only an unclaimed member row; it cannot take over a member
   already linked to another account.
4. The function uses a fixed search path and is callable only by authenticated
   users. Anonymous users cannot call it.

## Data safety
- Existing member rows are preserved.
- Existing linked members cannot be overwritten by another account.
- The operation is atomic at the unique workspace/name constraint.
*/

CREATE OR REPLACE FUNCTION public.join_workspace_as_coordinator(
  p_join_code text,
  p_display_name text,
  p_email text
)
RETURNS TABLE (workspace_id uuid, display_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id uuid;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT id INTO v_workspace_id
  FROM public.workspaces
  WHERE join_code = upper(trim(p_join_code));

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Invalid join code';
  END IF;

  INSERT INTO public.workspace_members (
    workspace_id,
    display_name,
    role,
    user_id,
    email
  )
  VALUES (
    v_workspace_id,
    trim(p_display_name),
    'coordinator',
    v_user_id,
    lower(trim(p_email))
  )
  ON CONFLICT (workspace_id, display_name)
  DO UPDATE SET
    user_id = EXCLUDED.user_id,
    email = EXCLUDED.email
  WHERE public.workspace_members.user_id IS NULL
  RETURNING public.workspace_members.workspace_id, public.workspace_members.display_name
  INTO workspace_id, display_name;

  IF workspace_id IS NULL THEN
    SELECT wm.workspace_id, wm.display_name
    INTO workspace_id, display_name
    FROM public.workspace_members wm
    WHERE wm.workspace_id = v_workspace_id
      AND wm.display_name = trim(p_display_name)
      AND wm.user_id = v_user_id;

    IF workspace_id IS NULL THEN
      RAISE EXCEPTION 'That team member name is already in use';
    END IF;
  END IF;

  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.join_workspace_as_coordinator(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.join_workspace_as_coordinator(text, text, text) TO authenticated;
