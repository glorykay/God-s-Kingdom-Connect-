/*
# Add service_end_time column

1. Changes
- Adds `service_end_time` column to `services` table (text, nullable).
- This stores the expected end time (e.g. "12:00 PM") so the QR code
  check-in can automatically activate at service start and deactivate
  at service end.
2. Security
- No RLS policy changes. Existing policies remain unchanged.
*/

ALTER TABLE services ADD COLUMN IF NOT EXISTS service_end_time text;
