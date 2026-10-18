-- Fix 1: Allow 'coordinator' role in workspace_members
-- The original CHECK only allowed 'pastor' and 'member', but the app inserts 'coordinator'
ALTER TABLE workspace_members DROP CONSTRAINT IF EXISTS workspace_members_role_check;
ALTER TABLE workspace_members ADD CONSTRAINT workspace_members_role_check
  CHECK (role IN ('pastor', 'member', 'coordinator'));

-- Fix 2: Allow NULL service_id in attendance
-- The check-in form inserts attendance without a service when none exist yet
ALTER TABLE attendance ALTER COLUMN service_id DROP NOT NULL;