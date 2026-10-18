/*
# Add Subscription & Trial Tracking to Workspaces

1. Modified Tables
- `workspaces` — add columns to track the 7-day free trial and subscription status:
  - `trial_start` (timestamptz) — when the trial began (set on workspace creation)
  - `trial_end` (timestamptz) — when the trial expires (trial_start + 7 days)
  - `subscription_status` (text) — one of: 'trial', 'active', 'past_due', 'canceled', 'expired'
  - `stripe_customer_id` (text) — Stripe customer reference (null until they pay)
  - `stripe_subscription_id` (text) — Stripe subscription reference (null until they pay)
  - `subscription_end` (timestamptz) — when the current billing period ends

2. Security
- No new tables. Existing workspaces RLS policies still apply (anon+authenticated can read/create).
- Added UPDATE policy for workspaces so the app can update subscription status (needed for trial tracking).

3. Notes
- trial_start and trial_end default to now() and now()+7 days so any existing workspaces get a retroactive trial.
- subscription_status defaults to 'trial'.
*/

DO $$ BEGIN
  ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS trial_start timestamptz NOT NULL DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS trial_end timestamptz NOT NULL DEFAULT now() + interval '7 days';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS subscription_status text NOT NULL DEFAULT 'trial';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS stripe_customer_id text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS subscription_end timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- Add UPDATE policy for workspaces (so the app can update subscription fields)
DROP POLICY IF EXISTS "update_workspaces" ON workspaces;
CREATE POLICY "update_workspaces" ON workspaces
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
