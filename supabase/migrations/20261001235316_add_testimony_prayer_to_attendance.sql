/*
# Add testimony and prayer_request columns to attendance table

1. Changes
- Adds `testimony` (text, nullable) to `attendance` — optional testimony shared during check-in.
- Adds `prayer_request` (text, nullable) to `attendance` — optional prayer request shared during check-in.
- Both fields are optional; existing rows remain valid with NULL values.

2. Security
- No RLS policy changes. The attendance table already has RLS enabled with
  anon + authenticated CRUD policies (single-tenant, shared data model).
*/

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS testimony text;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS prayer_request text;
