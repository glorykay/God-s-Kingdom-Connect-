/*
# Add gender column to members table

1. Modified Tables
- `members`
  - Adds `gender` column (text, nullable) — values: 'male' or 'female'
  - Existing rows will have NULL gender (no data loss)
2. Security
- No RLS changes — existing policies remain intact
3. Notes
- Gender is optional; existing members and future check-ins work without it
- Frontend will show Male/Female selection during check-in and newcomer registration
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'members' AND column_name = 'gender'
  ) THEN
    ALTER TABLE members ADD COLUMN gender text CHECK (gender IN ('male', 'female') OR gender IS NULL);
  END IF;
END $$;
