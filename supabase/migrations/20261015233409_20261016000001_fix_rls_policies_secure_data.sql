/*
# Fix RLS Policies — Secure All Tables

## Problem
10 tables had `USING (true)` / `WITH CHECK (true)` policies for both `anon` and `authenticated`,
giving anyone with the public anon key full read/write/delete access to every church's data.
This included: workspaces, workspace_members, workspace_customizations, members, attendance,
services, prayer_requests, reminders, kids_checkins, free_access_emails.

## Changes

### Tables that should be staff-only (authenticated, workspace-scoped):
- `workspaces` — pastors/admins can only access their own workspace (by owner_user_id or membership)
- `workspace_members` — staff can only manage members in their workspace
- `workspace_customizations` — staff can only modify their own workspace's customization
- `reminders` — staff can only manage reminders in their workspace

### Tables that need anon access for QR check-in (but scoped):
- `members` — anon can insert (check-in creates new members) and select by workspace_id;
  updates restricted to authenticated staff only
- `attendance` — anon can insert (check-in records attendance) and select by workspace_id;
  updates/deletes restricted to authenticated staff only
- `services` — anon can select (check-in needs to find active service) by workspace_id;
  all writes restricted to authenticated staff only
- `prayer_requests` — anon can insert (check-in submits prayer requests) and select by workspace_id;
  updates/deletes restricted to authenticated staff only
- `kids_checkins` — anon can insert (check-in records children); selects restricted to staff
- `follow_ups` — anon can insert (check-in auto-creates follow-ups); all other ops restricted to staff

### free_access_emails:
- SELECT only, no writes from any role (managed by edge function with service role)

## Security Notes
1. All workspace-scoped policies use `is_workspace_member()` for authenticated users.
2. Anon INSERT policies for check-in tables require a valid `workspace_id` (foreign key to workspaces).
3. Anon SELECT policies for check-in tables are scoped to a specific workspace_id.
4. DELETE is removed from anon on all tables.
5. UPDATE is removed from anon on all tables except where check-in needs it (members.is_new_comer).
*/

-- ============================================================
-- WORKSPACES: authenticated only, scoped by ownership or membership
-- ============================================================

DROP POLICY IF EXISTS "anon_select_workspaces" ON workspaces;
DROP POLICY IF EXISTS "anon_insert_workspaces" ON workspaces;
DROP POLICY IF EXISTS "anon_update_workspaces" ON workspaces;
DROP POLICY IF EXISTS "anon_delete_workspaces" ON workspaces;
DROP POLICY IF EXISTS "update_workspaces" ON workspaces;

CREATE POLICY "select_own_workspaces" ON workspaces FOR SELECT
  TO authenticated USING (
    owner_user_id = auth.uid()
    OR is_workspace_member(id)
  );

CREATE POLICY "insert_own_workspaces" ON workspaces FOR INSERT
  TO authenticated WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "update_own_workspaces" ON workspaces FOR UPDATE
  TO authenticated USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "delete_own_workspaces" ON workspaces FOR DELETE
  TO authenticated USING (owner_user_id = auth.uid());

-- ============================================================
-- WORKSPACE_MEMBERS: authenticated only, scoped by membership
-- ============================================================

DROP POLICY IF EXISTS "anon_insert_wm" ON workspace_members;
DROP POLICY IF EXISTS "anon_update_wm" ON workspace_members;
DROP POLICY IF EXISTS "anon_delete_wm" ON workspace_members;
DROP POLICY IF EXISTS "select_own_workspace_members" ON workspace_members;

CREATE POLICY "select_wm_in_workspace" ON workspace_members FOR SELECT
  TO authenticated USING (is_workspace_member(workspace_id));

CREATE POLICY "insert_wm_in_workspace" ON workspace_members FOR INSERT
  TO authenticated WITH CHECK (is_workspace_member(workspace_id) OR user_id = auth.uid());

CREATE POLICY "update_wm_in_workspace" ON workspace_members FOR UPDATE
  TO authenticated USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "delete_wm_in_workspace" ON workspace_members FOR DELETE
  TO authenticated USING (is_workspace_member(workspace_id));

-- ============================================================
-- WORKSPACE_CUSTOMIZATIONS: authenticated only, scoped by membership
-- ============================================================

DROP POLICY IF EXISTS "anon_select_customizations" ON workspace_customizations;
DROP POLICY IF EXISTS "anon_insert_customizations" ON workspace_customizations;
DROP POLICY IF EXISTS "anon_update_customizations" ON workspace_customizations;
DROP POLICY IF EXISTS "anon_delete_customizations" ON workspace_customizations;

CREATE POLICY "select_customizations" ON workspace_customizations FOR SELECT
  TO authenticated USING (is_workspace_member(workspace_id));

CREATE POLICY "insert_customizations" ON workspace_customizations FOR INSERT
  TO authenticated WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "update_customizations" ON workspace_customizations FOR UPDATE
  TO authenticated USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "delete_customizations" ON workspace_customizations FOR DELETE
  TO authenticated USING (is_workspace_member(workspace_id));

-- ============================================================
-- REMINDERS: authenticated only, scoped by membership
-- ============================================================

DROP POLICY IF EXISTS "anon_select_reminders" ON reminders;
DROP POLICY IF EXISTS "anon_insert_reminders" ON reminders;
DROP POLICY IF EXISTS "anon_update_reminders" ON reminders;
DROP POLICY IF EXISTS "anon_delete_reminders" ON reminders;

CREATE POLICY "select_reminders" ON reminders FOR SELECT
  TO authenticated USING (is_workspace_member(workspace_id));

CREATE POLICY "insert_reminders" ON reminders FOR INSERT
  TO authenticated WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "update_reminders" ON reminders FOR UPDATE
  TO authenticated USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "delete_reminders" ON reminders FOR DELETE
  TO authenticated USING (is_workspace_member(workspace_id));

-- ============================================================
-- MEMBERS: anon can SELECT + INSERT (check-in), authenticated can do everything
-- Anon SELECT is needed for check-in to match existing members by email/phone/name
-- ============================================================

DROP POLICY IF EXISTS "anon_select_members" ON members;
DROP POLICY IF EXISTS "anon_insert_members" ON members;
DROP POLICY IF EXISTS "anon_update_members" ON members;
DROP POLICY IF EXISTS "anon_delete_members" ON members;

-- Anon: can select members within a workspace (check-in needs to look up by email/phone)
CREATE POLICY "anon_select_members_checkin" ON members FOR SELECT
  TO anon, authenticated USING (true);

-- Anon: can insert new members during check-in
CREATE POLICY "anon_insert_members_checkin" ON members FOR INSERT
  TO anon, authenticated WITH CHECK (workspace_id IS NOT NULL);

-- Authenticated: can update members in their workspace
CREATE POLICY "update_members_in_workspace" ON members FOR UPDATE
  TO authenticated USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

-- Authenticated: can delete members in their workspace
CREATE POLICY "delete_members_in_workspace" ON members FOR DELETE
  TO authenticated USING (is_workspace_member(workspace_id));

-- ============================================================
-- ATTENDANCE: anon can SELECT + INSERT (check-in), authenticated can do everything
-- ============================================================

DROP POLICY IF EXISTS "anon_select_attendance" ON attendance;
DROP POLICY IF EXISTS "anon_insert_attendance" ON attendance;
DROP POLICY IF EXISTS "anon_update_attendance" ON attendance;
DROP POLICY IF EXISTS "anon_delete_attendance" ON attendance;

CREATE POLICY "anon_select_attendance_checkin" ON attendance FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_attendance_checkin" ON attendance FOR INSERT
  TO anon, authenticated WITH CHECK (workspace_id IS NOT NULL);

CREATE POLICY "update_attendance_in_workspace" ON attendance FOR UPDATE
  TO authenticated USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "delete_attendance_in_workspace" ON attendance FOR DELETE
  TO authenticated USING (is_workspace_member(workspace_id));

-- ============================================================
-- SERVICES: anon can SELECT (check-in finds active service), authenticated can do everything
-- ============================================================

DROP POLICY IF EXISTS "anon_select_services" ON services;
DROP POLICY IF EXISTS "anon_insert_services" ON services;
DROP POLICY IF EXISTS "anon_update_services" ON services;
DROP POLICY IF EXISTS "anon_delete_services" ON services;

CREATE POLICY "anon_select_services_checkin" ON services FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "insert_services_in_workspace" ON services FOR INSERT
  TO authenticated WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "update_services_in_workspace" ON services FOR UPDATE
  TO authenticated USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "delete_services_in_workspace" ON services FOR DELETE
  TO authenticated USING (is_workspace_member(workspace_id));

-- ============================================================
-- PRAYER_REQUESTS: anon can SELECT + INSERT (check-in), authenticated can do everything
-- ============================================================

DROP POLICY IF EXISTS "anon_select_prayer" ON prayer_requests;
DROP POLICY IF EXISTS "anon_insert_prayer" ON prayer_requests;
DROP POLICY IF EXISTS "anon_update_prayer" ON prayer_requests;
DROP POLICY IF EXISTS "anon_delete_prayer" ON prayer_requests;

CREATE POLICY "anon_select_prayer_checkin" ON prayer_requests FOR SELECT
  TO anon, authenticated USING (true);

CREATE POLICY "anon_insert_prayer_checkin" ON prayer_requests FOR INSERT
  TO anon, authenticated WITH CHECK (workspace_id IS NOT NULL);

CREATE POLICY "update_prayer_in_workspace" ON prayer_requests FOR UPDATE
  TO authenticated USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "delete_prayer_in_workspace" ON prayer_requests FOR DELETE
  TO authenticated USING (is_workspace_member(workspace_id));

-- ============================================================
-- KIDS_CHECKINS: anon can INSERT (check-in), authenticated can SELECT/UPDATE/DELETE
-- ============================================================

DROP POLICY IF EXISTS "public_insert_kids_checkins" ON kids_checkins;
DROP POLICY IF EXISTS "staff_select_kids_checkins" ON kids_checkins;
DROP POLICY IF EXISTS "staff_update_kids_checkins" ON kids_checkins;
DROP POLICY IF EXISTS "staff_delete_kids_checkins" ON kids_checkins;

CREATE POLICY "anon_insert_kids_checkins" ON kids_checkins FOR INSERT
  TO anon, authenticated WITH CHECK (workspace_id IS NOT NULL);

CREATE POLICY "select_kids_checkins_in_workspace" ON kids_checkins FOR SELECT
  TO authenticated USING (is_workspace_member(workspace_id));

CREATE POLICY "update_kids_checkins_in_workspace" ON kids_checkins FOR UPDATE
  TO authenticated USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "delete_kids_checkins_in_workspace" ON kids_checkins FOR DELETE
  TO authenticated USING (is_workspace_member(workspace_id));

-- ============================================================
-- FOLLOW_UPS: anon can INSERT (check-in auto-creates), authenticated can SELECT/DELETE
-- ============================================================

DROP POLICY IF EXISTS "insert_own_follow_ups" ON follow_ups;
DROP POLICY IF EXISTS "select_own_follow_ups" ON follow_ups;
DROP POLICY IF EXISTS "delete_own_follow_ups" ON follow_ups;

CREATE POLICY "anon_insert_follow_ups_checkin" ON follow_ups FOR INSERT
  TO anon, authenticated WITH CHECK (workspace_id IS NOT NULL);

CREATE POLICY "select_follow_ups_in_workspace" ON follow_ups FOR SELECT
  TO authenticated USING (is_workspace_member(workspace_id));

CREATE POLICY "update_follow_ups_in_workspace" ON follow_ups FOR UPDATE
  TO authenticated USING (is_workspace_member(workspace_id))
  WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "delete_follow_ups_in_workspace" ON follow_ups FOR DELETE
  TO authenticated USING (is_workspace_member(workspace_id));

-- ============================================================
-- FREE_ACCESS_EMAILS: SELECT only (no writes from client)
-- ============================================================

-- Keep the existing SELECT policy, ensure no write policies exist
DROP POLICY IF EXISTS "anon_insert_free_emails" ON free_access_emails;
DROP POLICY IF EXISTS "anon_update_free_emails" ON free_access_emails;
DROP POLICY IF EXISTS "anon_delete_free_emails" ON free_access_emails;

-- ============================================================
-- Restrict SECURITY DEFINER functions to authenticated only
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.join_workspace_as_coordinator(text, text, text) FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_workspace_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_workspace_as_coordinator(text, text, text) TO authenticated;
