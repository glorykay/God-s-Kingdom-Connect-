/*
# Expand dashboard templates to 20 options
*/
ALTER TABLE workspace_customizations DROP CONSTRAINT IF EXISTS workspace_customizations_dashboard_template_check;
ALTER TABLE workspace_customizations ADD CONSTRAINT workspace_customizations_dashboard_template_check
  CHECK (dashboard_template IN (
    'classic', 'compact', 'minimal',
    'modern', 'gradient', 'corporate',
    'bold', 'elegant', 'dark', 'glass',
    'neumorphic', 'card', 'magazine', 'widget', 'hero',
    'split', 'sidebar', 'tabs', 'banner', 'minimalist_pro'
  ));
