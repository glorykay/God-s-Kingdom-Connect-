/*
# Add Reminders Table

1. New Tables
- `reminders` — scheduled SMS/email reminders for services and follow-ups
  - `id` (uuid, PK)
  - `workspace_id` (uuid, FK to workspaces, CASCADE)
  - `service_id` (uuid, FK to services, SET NULL — optional link to a service)
  - `title` (text, not null) — short label for the reminder
  - `message` (text, not null) — the reminder body text
  - `channel` (text, not null) — 'email' or 'sms' or 'both'
  - `send_at` (timestamptz, not null) — when the reminder should be sent
  - `status` (text, not null, default 'scheduled') — 'scheduled', 'sent', 'cancelled'
  - `sent_at` (timestamptz, nullable) — timestamp when actually sent
  - `created_at` (timestamptz, default now())

2. Security
- RLS enabled on `reminders`.
- Single-tenant pattern matching existing tables: anon + authenticated CRUD.
- All data is intentionally shared within the church workspace.

3. Indexes
- Index on `workspace_id` for workspace-scoped queries.
- Index on `status` for filtering scheduled vs sent.
- Index on `send_at` for the edge function to find due reminders.
*/

CREATE TABLE IF NOT EXISTS reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  title text NOT NULL,
  message text NOT NULL,
  channel text NOT NULL DEFAULT 'email' CHECK (channel IN ('email', 'sms', 'both')),
  send_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'sent', 'cancelled')),
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reminders" ON reminders;
CREATE POLICY "anon_select_reminders" ON reminders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_reminders" ON reminders;
CREATE POLICY "anon_insert_reminders" ON reminders FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_reminders" ON reminders;
CREATE POLICY "anon_update_reminders" ON reminders FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_reminders" ON reminders;
CREATE POLICY "anon_delete_reminders" ON reminders FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_reminders_workspace_id ON reminders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_reminders_status ON reminders(status);
CREATE INDEX IF NOT EXISTS idx_reminders_send_at ON reminders(send_at);
