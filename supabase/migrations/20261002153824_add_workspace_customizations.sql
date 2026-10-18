/*
# Add Workspace Customizations Table

1. New Tables
- `workspace_customizations` — per-workspace branding and UI preferences
  - `id` (uuid, PK)
  - `workspace_id` (uuid, FK to workspaces, UNIQUE, CASCADE)
  - `logo_url` (text, nullable) — uploaded church logo URL
  - `primary_color` (text, default '#f59e0b') — main brand color
  - `accent_color` (text, default '#3b82f6') — secondary accent
  - `bg_color` (text, default '#f8fafc') — app background color
  - `font_family` (text, default 'Inter') — chosen font family
  - `sidebar_style` (text, default 'dark') — 'dark' | 'light' | 'gradient'
  - `dashboard_template` (text, default 'classic') — 'classic' | 'compact' | 'minimal'
  - `card_layout` (text, default 'grid') — 'grid' | 'list'
  - `theme_mode` (text, default 'system') — 'system' | 'light' | 'dark' | 'church'
  - `church_theme_name` (text, nullable) — optional custom theme name
  - `church_theme_color1` (text, nullable) — custom gradient start
  - `church_theme_color2` (text, nullable) — custom gradient end
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- RLS enabled.
- Single-tenant pattern: anon + authenticated CRUD.
*/

CREATE TABLE IF NOT EXISTS workspace_customizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  logo_url text,
  primary_color text NOT NULL DEFAULT '#f59e0b',
  accent_color text NOT NULL DEFAULT '#3b82f6',
  bg_color text NOT NULL DEFAULT '#f8fafc',
  font_family text NOT NULL DEFAULT 'Inter',
  sidebar_style text NOT NULL DEFAULT 'dark' CHECK (sidebar_style IN ('dark', 'light', 'gradient')),
  dashboard_template text NOT NULL DEFAULT 'classic' CHECK (dashboard_template IN ('classic', 'compact', 'minimal')),
  card_layout text NOT NULL DEFAULT 'grid' CHECK (card_layout IN ('grid', 'list')),
  theme_mode text NOT NULL DEFAULT 'system' CHECK (theme_mode IN ('system', 'light', 'dark', 'church')),
  church_theme_name text,
  church_theme_color1 text,
  church_theme_color2 text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE workspace_customizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_customizations" ON workspace_customizations;
CREATE POLICY "anon_select_customizations" ON workspace_customizations FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_customizations" ON workspace_customizations;
CREATE POLICY "anon_insert_customizations" ON workspace_customizations FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_customizations" ON workspace_customizations;
CREATE POLICY "anon_update_customizations" ON workspace_customizations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_customizations" ON workspace_customizations;
CREATE POLICY "anon_delete_customizations" ON workspace_customizations FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_customizations_workspace_id ON workspace_customizations(workspace_id);
