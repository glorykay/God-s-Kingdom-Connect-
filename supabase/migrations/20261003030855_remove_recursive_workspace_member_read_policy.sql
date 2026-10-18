/*
# Remove the recursive workspace member read policy

## Problem
An older `anon_select_wm` policy still allowed unrestricted reads on
`workspace_members`. Alongside the authenticated membership policy, it could
re-enter workspace member policy evaluation and cause infinite recursion.

## Security changes
1. Remove the unrestricted workspace member SELECT policy.
2. Keep workspace member reads limited to authenticated users whose account
   belongs to the same workspace through `is_workspace_member`.
3. Keep existing insert, update, and delete behavior unchanged so the current
   account-joining flow can link a coordinator to a workspace.

## Data safety
- No rows or columns are deleted.
- Team chat remains restricted to authenticated workspace members.
*/

DROP POLICY IF EXISTS "anon_select_wm" ON workspace_members;
