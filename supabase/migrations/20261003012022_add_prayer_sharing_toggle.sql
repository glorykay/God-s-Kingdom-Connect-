/*
# Add prayer sharing toggle to workspace customizations

1. Modified Tables
- `workspace_customizations`
  - Added `prayer_shared_with_coordinators` (boolean, default false)
    When false, only the pastor can see the Prayer Requests page.
    When true, coordinators also see it in the sidebar and can access it.
2. Security
- No RLS policy changes. The column is read/written through the existing
  workspace_customizations policies already in place.
3. Important Notes
- Default is false so coordinators do NOT see prayer requests unless the
  pastor explicitly opts in via the Customize page.
*/

ALTER TABLE workspace_customizations
ADD COLUMN IF NOT EXISTS prayer_shared_with_coordinators boolean NOT NULL DEFAULT false;
