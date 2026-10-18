/*
# Fix coordinator join function output ambiguity

## Problem
The coordinator join function used output names that matched table column names.
PostgreSQL could not determine whether `workspace_id` referred to the function
result or a table column, so the account-linking operation stopped before chat
access was granted.

## Changes
1. Use private local variables for the claimed member row.
2. Return the same workspace and display name values without ambiguous column
   references.
3. Preserve the existing authenticated-only authorization and claim behavior.

## Data safety
- No tables, rows, or columns are deleted.
- Existing linked members remain protected from takeover.
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

  workspace_id := v_member_workspace_id;
  display_name := v_member_display_name;
  RETURN NEXT;
END;
$$;
