/*
# God's Kingdom Connect Church Management System - Core Schema

1. New Tables
- `members` — church members with contact info, address, photo, join date
- `services` — church services (Sunday Worship, Bible Study, Youth Fellowship, etc.)
- `attendance` — attendance records linking members to services, with newcomer flag
- `prayer_requests` — prayer requests with status tracking (pending, prayed, answered)

2. Security
- All tables have RLS enabled.
- Single-tenant (no auth) — policies allow anon + authenticated CRUD on all tables.
- All data is intentionally shared/public within the church org.

3. Relationships
- attendance.service_id → services.id (CASCADE)
- attendance.member_id → members.id (SET NULL when member deleted)
*/

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  address text,
  photo_url text,
  is_new_comer boolean NOT NULL DEFAULT false,
  joined_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  service_date date NOT NULL,
  service_time text NOT NULL,
  speaker text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  member_id uuid REFERENCES members(id) ON DELETE SET NULL,
  is_new_comer boolean NOT NULL DEFAULT false,
  newcomer_name text,
  timestamp timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_name text NOT NULL,
  request_text text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'prayed', 'answered')),
  is_private boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;

-- Members policies
DROP POLICY IF EXISTS "anon_select_members" ON members;
CREATE POLICY "anon_select_members" ON members FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_members" ON members;
CREATE POLICY "anon_insert_members" ON members FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_members" ON members;
CREATE POLICY "anon_update_members" ON members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_members" ON members;
CREATE POLICY "anon_delete_members" ON members FOR DELETE TO anon, authenticated USING (true);

-- Services policies
DROP POLICY IF EXISTS "anon_select_services" ON services;
CREATE POLICY "anon_select_services" ON services FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_services" ON services;
CREATE POLICY "anon_insert_services" ON services FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_services" ON services;
CREATE POLICY "anon_update_services" ON services FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_services" ON services;
CREATE POLICY "anon_delete_services" ON services FOR DELETE TO anon, authenticated USING (true);

-- Attendance policies
DROP POLICY IF EXISTS "anon_select_attendance" ON attendance;
CREATE POLICY "anon_select_attendance" ON attendance FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_attendance" ON attendance;
CREATE POLICY "anon_insert_attendance" ON attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_attendance" ON attendance;
CREATE POLICY "anon_update_attendance" ON attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_attendance" ON attendance;
CREATE POLICY "anon_delete_attendance" ON attendance FOR DELETE TO anon, authenticated USING (true);

-- Prayer requests policies
DROP POLICY IF EXISTS "anon_select_prayer" ON prayer_requests;
CREATE POLICY "anon_select_prayer" ON prayer_requests FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_prayer" ON prayer_requests;
CREATE POLICY "anon_insert_prayer" ON prayer_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_prayer" ON prayer_requests;
CREATE POLICY "anon_update_prayer" ON prayer_requests FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_prayer" ON prayer_requests;
CREATE POLICY "anon_delete_prayer" ON prayer_requests FOR DELETE TO anon, authenticated USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_service_id ON attendance(service_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_timestamp ON attendance(timestamp);
CREATE INDEX IF NOT EXISTS idx_services_date ON services(service_date);
CREATE INDEX IF NOT EXISTS idx_prayer_status ON prayer_requests(status);

-- Seed sample services
INSERT INTO services (name, description, service_date, service_time, speaker) VALUES
  ('Sunday Worship', 'Weekly Sunday celebration service with worship and message', CURRENT_DATE, '10:00 AM', 'Pastor John Daniels')
ON CONFLICT DO NOTHING;

INSERT INTO services (name, description, service_date, service_time, speaker) VALUES
  ('Wednesday Bible Study', 'Mid-week Bible study and prayer meeting', CURRENT_DATE + INTERVAL '3 days', '7:00 PM', 'Pastor Sarah Mitchell')
ON CONFLICT DO NOTHING;

INSERT INTO services (name, description, service_date, service_time, speaker) VALUES
  ('Youth Fellowship Night', 'Friday youth gathering with games, worship, and devotional', CURRENT_DATE + INTERVAL '5 days', '6:30 PM', 'Minister David Okoye')
ON CONFLICT DO NOTHING;
