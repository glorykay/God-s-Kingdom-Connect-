import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useLanguage } from '@/context/LanguageContext';
import { PageId, WorkspaceMember } from '@/types';
import { languages, Language } from '@/i18n/translations';
import { supabase } from '@/lib/supabase';
import { subscribeUnreadChatCount } from '@/pages/Chat';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { useCustomization } from '@/context/CustomizationContext';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  ClipboardCheck,
  HandHeart,
  BarChart3,
  Moon,
  Sun,
  Church,
  QrCode,
  LogOut,
  Crown,
  BadgeCheck,
  MessageCircle,
  Globe,
  Check,
  UserCheck,
  Users as UsersIcon,
  UserCog,
  Trash2,
  Bell,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  open: boolean;
  onClose: () => void;
  onShowQR: () => void;
  onShowCheckInQR: () => void;
}

type NavItem = { id: PageId; labelKey: string; icon: typeof LayoutDashboard; roles: ('pastor' | 'coordinator' | 'member')[] };

const allNavItems: NavItem[] = [
  { id: 'dashboard', labelKey: 'sidebar.dashboard', icon: LayoutDashboard, roles: ['pastor'] },
  { id: 'members', labelKey: 'sidebar.members', icon: Users, roles: ['pastor', 'coordinator'] },
  { id: 'services', labelKey: 'sidebar.services', icon: CalendarDays, roles: ['pastor', 'coordinator'] },
  { id: 'attendance', labelKey: 'sidebar.attendance', icon: ClipboardCheck, roles: ['pastor', 'coordinator', 'member'] },
  { id: 'followup', labelKey: 'sidebar.followup', icon: UserCheck, roles: ['pastor', 'coordinator'] },
  { id: 'groups', labelKey: 'sidebar.groups', icon: UsersIcon, roles: ['pastor', 'coordinator'] },
  { id: 'prayer', labelKey: 'sidebar.prayer', icon: HandHeart, roles: ['pastor', 'member'] },
  { id: 'analytics', labelKey: 'sidebar.analytics', icon: BarChart3, roles: ['pastor', 'coordinator'] },
  { id: 'reminders', labelKey: 'sidebar.reminders', icon: Bell, roles: ['pastor', 'coordinator'] },
  { id: 'customize', labelKey: 'sidebar.customize', icon: Sparkles, roles: ['pastor', 'coordinator'] },
  { id: 'chat', labelKey: 'sidebar.chat', icon: MessageCircle, roles: ['pastor', 'coordinator'] },
];

export function Sidebar({ currentPage, onNavigate, open, onClose, onShowQR, onShowCheckInQR }: SidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const { workspace, role, displayName, hasFreeAccess, hasActiveSubscription, isTrialActive, leaveWorkspace, signOutPastor } = useWorkspace();
  const { lang, setLang, t } = useLanguage();
  const { customization } = useCustomization();
  const [langOpen, setLangOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const [teamMembers, setTeamMembers] = useState<WorkspaceMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [unreadChat, setUnreadChat] = useState(0);

  useEffect(() => {
    return subscribeUnreadChatCount(setUnreadChat);
  }, []);

  const loadTeamMembers = useCallback(async () => {
    if (!workspace) return;
    setTeamLoading(true);
    const { data } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('joined_at', { ascending: true });
    setTeamMembers((data as WorkspaceMember[]) ?? []);
    setTeamLoading(false);
  }, [workspace]);

  useEffect(() => {
    if (teamOpen) loadTeamMembers();
  }, [teamOpen, loadTeamMembers]);

  async function confirmRemoveMember() {
    if (!removeMemberId) return;
    await supabase.from('workspace_members').delete().eq('id', removeMemberId);
    setRemoveMemberId(null);
    loadTeamMembers();
  }

  const navItems = allNavItems.filter((item) => {
    if (!role || !item.roles.includes(role)) return false;
    if (item.id === 'prayer' && role === 'coordinator' && !customization?.prayer_shared_with_coordinators) return false;
    return true;
  });

  const sidebarStyle = customization?.sidebar_style ?? 'dark';
  const logoUrl = customization?.logo_url;
  const brandColor = customization?.primary_color ?? '#f59e0b';
  const accentColor = customization?.accent_color ?? '#3b82f6';

  const sidebarBg =
    sidebarStyle === 'light'
      ? 'bg-slate-100 text-slate-900 border-r border-slate-200'
      : sidebarStyle === 'gradient'
        ? 'text-white border-r border-white/10'
        : 'bg-slate-900 dark:bg-slate-950 text-white';

  const sidebarGradientStyle =
    sidebarStyle === 'gradient'
      ? { background: `linear-gradient(160deg, ${customization?.church_theme_color1 ?? '#0f172a'}, ${customization?.church_theme_color2 ?? '#1e293b'})` }
      : undefined;

  const isLightSidebar = sidebarStyle === 'light';
  const navTextBase = isLightSidebar ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-300 hover:text-white hover:bg-white/10';
  const borderClass = isLightSidebar ? 'border-slate-200' : 'border-white/10';
  const subTextClass = isLightSidebar ? 'text-slate-400' : 'text-slate-400';
  const userBadgeBg = isLightSidebar ? 'bg-slate-200' : 'bg-white/5';

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen w-64 z-40 flex flex-col
          ${sidebarBg}
          transition-transform duration-300
          ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={sidebarGradientStyle}
      >
        {/* Logo + Workspace */}
        <div className={`px-5 py-4 border-b ${borderClass}`}>
          <div className="flex items-center gap-3 mb-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Church logo" className="w-10 h-10 rounded-xl object-cover shadow-lg flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, ${brandColor}, ${accentColor})` }}>
                <Church size={22} className="text-white" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-sm leading-tight truncate">{workspace?.name ?? t('app.name').toUpperCase()}</h1>
              <p className={`text-[11px] ${subTextClass}`}>{t('app.churchManagement')}</p>
            </div>
          </div>

          {/* User badge */}
          <div className={`flex items-center gap-2 px-2.5 py-2 rounded-lg ${userBadgeBg}`}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0" style={{ background: `linear-gradient(135deg, ${brandColor}, ${accentColor})` }}>
              {displayName?.[0]?.toUpperCase() ?? '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium truncate">{displayName ?? t('common.unknown')}</p>
              <div className="flex items-center gap-1">
                {role === 'pastor' && <Crown size={10} style={{ color: brandColor }} />}
                <span className={`text-[10px] ${subTextClass} capitalize`}>{role}</span>
                {hasFreeAccess && (
                  <span className="ml-auto inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                    <BadgeCheck size={9} /> {t('common.free')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                  ${active
                    ? 'text-slate-900 shadow-lg'
                    : navTextBase
                  }`}
                style={active ? { backgroundColor: brandColor, boxShadow: `0 4px 12px ${brandColor}40` } : undefined}
              >
                <Icon size={19} />
                {t(item.labelKey)}
                {item.id === 'chat' && unreadChat > 0 && (
                  <span
                    className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white bg-rose-500 animate-pulse"
                  >
                    {unreadChat > 99 ? '99+' : unreadChat}
                  </span>
                )}
              </button>
            );
          })}

          {/* Pastor-only QR buttons */}
          {role === 'pastor' && (hasFreeAccess || isTrialActive || hasActiveSubscription) && (
            <>
              <button
                onClick={() => { onShowCheckInQR(); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 mt-2 border border-dashed ${isLightSidebar ? 'border-emerald-500/40 text-emerald-600 hover:bg-emerald-50' : 'border-emerald-500/30 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/10'}`}
              >
                <ClipboardCheck size={19} />
                {t('sidebar.memberCheckinQR')}
              </button>
              <button
                onClick={() => { onShowQR(); onClose(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 border border-dashed ${isLightSidebar ? 'border-amber-500/40 text-amber-600 hover:bg-amber-50' : 'border-amber-500/30 text-amber-300 hover:text-amber-200 hover:bg-amber-500/10'}`}
                style={{ borderColor: brandColor + '60', color: brandColor }}
              >
                <QrCode size={19} />
                {t('sidebar.shareTeamJoinQR')}
              </button>
              <button
                onClick={() => setTeamOpen(true)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${navTextBase}`}
              >
                <UserCog size={19} />
                {t('sidebar.manageTeam')}
              </button>
            </>
          )}
        </nav>

        {/* Bottom actions */}
        <div className={`px-3 py-4 border-t ${borderClass} space-y-1`}>
          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${navTextBase}`}
            >
              <Globe size={19} />
              {t('sidebar.language')}: {languages.find((l) => l.code === lang)?.label}
            </button>
            {langOpen && (
              <div className={`absolute bottom-full left-0 right-0 mb-1 rounded-xl border shadow-xl overflow-hidden ${isLightSidebar ? 'bg-white border-slate-200' : 'bg-slate-800 border-white/10'}`}>
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code as Language); setLangOpen(false); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
                      lang === l.code
                        ? isLightSidebar ? 'bg-slate-100 text-slate-900' : 'bg-amber-500/20 text-amber-300'
                        : isLightSidebar ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {l.label}
                    {lang === l.code && <Check size={14} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${navTextBase}`}
          >
            {theme === 'light' ? <Moon size={19} /> : <Sun size={19} />}
            {theme === 'light' ? t('sidebar.darkMode') : t('sidebar.lightMode')}
          </button>
          <button
            onClick={() => { if (role === 'pastor') { signOutPastor(); } else { leaveWorkspace(); } }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${isLightSidebar ? 'text-slate-600 hover:text-red-500 hover:bg-red-50' : 'text-slate-300 hover:text-red-400 hover:bg-red-500/10'}`}
          >
            <LogOut size={19} />
            {t('sidebar.leaveWorkspace')}
          </button>


        </div>
      </aside>

      {/* Manage Team Modal */}
      <Modal open={teamOpen} onClose={() => setTeamOpen(false)} title={t('sidebar.manageTeam')} size="md">
        {teamLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {teamMembers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">{t('sidebar.noCoordinators')}</p>
            ) : (
              teamMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/40"
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
                    m.role === 'pastor'
                      ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                      : 'bg-gradient-to-br from-slate-400 to-slate-600'
                  }`}>
                    {m.display_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.display_name}</p>
                    <div className="flex items-center gap-1.5">
                      {m.role === 'pastor' && <Crown size={10} className="text-amber-400" />}
                      <span className="text-[10px] text-slate-400">
                        {m.role === 'pastor' ? t('sidebar.pastorRole') : t('sidebar.coordinatorRole')}
                      </span>
                    </div>
                  </div>
                  {m.role !== 'pastor' && (
                    <button
                      onClick={() => setRemoveMemberId(m.id)}
                      className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      title={t('sidebar.removeCoordinator')}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!removeMemberId}
        onClose={() => setRemoveMemberId(null)}
        onConfirm={confirmRemoveMember}
        title={t('sidebar.removeCoordinatorTitle')}
        message={t('sidebar.removeCoordinatorConfirm')}
      />
    </>
  );
}
