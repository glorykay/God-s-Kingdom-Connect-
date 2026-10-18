/*
# Add Free Access Email Whitelist

1. New Tables
- `free_access_emails` — emails that get free unlimited access (bypass future Stripe payment)

2. Security
- RLS enabled, anon+authenticated can read (needed for client-side check).
- Only service role can insert/delete (managed by you, not by app users).

3. Seeded Emails
- glorykayembe02@gmail.com (owner)
- kath.kirubi.com (business partner)

4. Modified Tables
- `workspaces` — add `owner_email` column to track who created each workspace.
*/

CREATE TABLE IF NOT EXISTS free_access_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE free_access_emails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_free_emails" ON free_access_emails;
CREATE POLICY "anon_select_free_emails" ON free_access_emails
  FOR SELECT TO anon, authenticated USING (true);

-- Seed the two free-access emails
INSERT INTO free_access_emails (email, label) VALUES
  ('glorykayembe02@gmail.com', 'Owner'),
  ('kath.kirubi.com', 'Business Partner')
ON CONFLICT (email) DO NOTHING;

-- Add owner_email to workspaces
DO $$ BEGIN
  ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS owner_email text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;
