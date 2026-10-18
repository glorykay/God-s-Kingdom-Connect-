/*
# Backfill workspace_members.user_id for pastors

## Problem
When a pastor signed up, the workspace_members row was created without
setting `user_id`. The chat_messages INSERT policy checks
`workspace_members.user_id = auth.uid()`, so chat messages failed with
"new row violates row-level security policy".

## Fix
1. Backfill existing pastor workspace_members rows that have NULL user_id
   by joining to workspaces.owner_user_id.
2. The frontend signUpPastor function has also been fixed to set user_id
   on insert, so new signups won't have this problem.

## Notes
- Only updates rows where user_id IS NULL, so existing linked rows are untouched.
- Only applies to pastor rows (coordinators already set user_id on signup).
*/

UPDATE workspace_members wm
SET user_id = w.owner_user_id
FROM workspaces w
WHERE wm.workspace_id = w.id
  AND wm.role = 'pastor'
  AND wm.user_id IS NULL
  AND w.owner_user_id IS NOT NULL;
