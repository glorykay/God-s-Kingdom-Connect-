/*
# Prevent pastor account reuse during coordinator joining

## Problem
A coordinator joining with the pastor's existing email could sign into the
pastor account and then claim a coordinator member row. That creates an
incorrect role association and can expose the wrong workspace identity.

## Security changes
1. Reject a join when the authenticated account owns the workspace.
2. Reject a join when the authenticated account is already the workspace pastor.
3. Return a clear instruction to use a separate coordinator email address.

## Data safety
- No rows are deleted.
- Existing pastor and coordinator memberships are unchanged.
- Valid coordinator accounts continue to claim only unclaimed member rows.
*/

CREATE OR REPLACE FUNCTION public.join_workspace_as_coordinator(
  p_join_code text,
  p_display_name text,
  p_email text
)
RETURNS TABLE (joined_workspace_id uuid, joined_display_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_workspace_id uuid;
  v_user_id uuid := auth.uid();
  v_member_workspace_id uuid;
  v_member_display_name text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT w.id INTO v_workspace_id
  FROM public.workspaces w
  WHERE w.join_code = upper(trim(p_join_code));

  IF v_workspace_id IS NULL THEN
    RAISE EXCEPTION 'Invalid join code';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = v_workspace_id AND w.owner_user_id = v_user_id
  ) OR EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = v_workspace_id
      AND wm.user_id = v_user_id
      AND wm.role = 'pastor'
  ) THEN
    RAISE EXCEPTION 'Use a different email address for the coordinator account';
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
  INTO v_member_workspace_id, v_member_display_name;

  IF v_member_workspace_id IS NULL THEN
    SELECT wm.workspace_id, wm.display_name
    INTO v_member_workspace_id, v_member_display_name
    FROM public.workspace_members wm
    WHERE wm.workspace_id = v_workspace_id
      AND wm.display_name = trim(p_display_name)
      AND wm.user_id = v_user_id;

    IF v_member_workspace_id IS NULL THEN
      RAISE EXCEPTION 'That team member name is already in use';
    END IF;
  END IF;

  joined_workspace_id := v_member_workspace_id;
  joined_display_name := v_member_display_name;
  RETURN NEXT;
END;
$$;
