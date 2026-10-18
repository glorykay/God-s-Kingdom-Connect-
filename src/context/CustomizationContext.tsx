import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { WorkspaceCustomization, SidebarStyle, DashboardTemplate, CardLayout, ThemeMode } from '@/types';

interface CustomizationContextValue {
  customization: WorkspaceCustomization | null;
  loading: boolean;
  refresh: () => Promise<void>;
  save: (updates: Partial<WorkspaceCustomization>) => Promise<void>;
}

const DEFAULTS: Omit<WorkspaceCustomization, 'id' | 'workspace_id' | 'created_at' | 'updated_at'> = {
  logo_url: null,
  primary_color: '#f59e0b',
  accent_color: '#3b82f6',
  bg_color: '#f8fafc',
  font_family: 'Inter',
  sidebar_style: 'dark',
  dashboard_template: 'classic',
  card_layout: 'grid',
  theme_mode: 'system',
  church_theme_name: null,
  church_theme_color1: null,
  church_theme_color2: null,
  prayer_shared_with_coordinators: false,
};

const FONT_MAP: Record<string, string> = {
  Inter: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Poppins: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Roboto: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Lato: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  'Playfair Display': "'Playfair Display', Georgia, serif",
  Montserrat: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  'Source Sans Pro': "'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Nunito: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const CustomizationContext = createContext<CustomizationContextValue | undefined>(undefined);

export function CustomizationProvider({ children }: { children: ReactNode }) {
  const [customization, setCustomization] = useState<WorkspaceCustomization | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  const loadCustomization = useCallback(async (wid: string) => {
    const { data } = await supabase
      .from('workspace_customizations')
      .select('*')
      .eq('workspace_id', wid)
      .maybeSingle();

    if (data) {
      setCustomization(data as WorkspaceCustomization);
    } else {
      const { data: created } = await supabase
        .from('workspace_customizations')
        .insert({ workspace_id: wid, ...DEFAULTS })
        .select()
        .single();
      if (created) setCustomization(created as WorkspaceCustomization);
    }
    setLoading(false);
  }, []);

  const refresh = useCallback(async () => {
    if (workspaceId) await loadCustomization(workspaceId);
  }, [workspaceId, loadCustomization]);

  const save = useCallback(async (updates: Partial<WorkspaceCustomization>) => {
    if (!customization) return;
    const merged = { ...customization, ...updates, updated_at: new Date().toISOString() };
    setCustomization(merged);
    await supabase
      .from('workspace_customizations')
      .update(updates)
      .eq('workspace_id', customization.workspace_id);
  }, [customization]);

  // Detect workspace from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('glory-workspace-session');
    if (stored) {
      try {
        const session = JSON.parse(stored) as { workspaceId: string };
        setWorkspaceId(session.workspaceId);
        loadCustomization(session.workspaceId);
      } catch {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }

    // Listen for workspace changes
    const interval = setInterval(() => {
      const s = localStorage.getItem('glory-workspace-session');
      if (s) {
        try {
          const parsed = JSON.parse(s) as { workspaceId: string };
          if (parsed.workspaceId !== workspaceId) {
            setWorkspaceId(parsed.workspaceId);
            loadCustomization(parsed.workspaceId);
          }
        } catch { /* ignore */ }
      } else if (workspaceId) {
        setWorkspaceId(null);
        setCustomization(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [workspaceId, loadCustomization]);

  // Apply CSS variables whenever customization changes
  useEffect(() => {
    const root = document.documentElement;
    const c = customization;

    if (!c) {
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--brand-accent');
      root.style.removeProperty('--brand-bg');
      root.style.removeProperty('--font-family');
      return;
    }

    root.style.setProperty('--brand-primary', c.primary_color);
    root.style.setProperty('--brand-accent', c.accent_color);
    root.style.setProperty('--brand-bg', c.bg_color);
    root.style.setProperty('--font-family', FONT_MAP[c.font_family] ?? FONT_MAP.Inter);
  }, [customization]);

  return (
    <CustomizationContext.Provider value={{ customization, loading, refresh, save }}>
      {children}
    </CustomizationContext.Provider>
  );
}

export function useCustomization() {
  const ctx = useContext(CustomizationContext);
  if (!ctx) throw new Error('useCustomization must be used within CustomizationProvider');
  return ctx;
}

export const FONT_OPTIONS = Object.keys(FONT_MAP);
export type { SidebarStyle, DashboardTemplate, CardLayout, ThemeMode };
