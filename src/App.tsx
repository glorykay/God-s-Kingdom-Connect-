import { useState, useEffect, useRef } from 'react';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider, useLanguage } from '@/context/LanguageContext';
import { WorkspaceProvider, useWorkspace } from '@/context/WorkspaceContext';
import { CustomizationProvider, useCustomization } from '@/context/CustomizationContext';
import { Sidebar } from '@/components/Sidebar';
import { QRCodeModal } from '@/components/QRCodeModal';
import { CheckInQRModal } from '@/components/CheckInQRModal';
import { Dashboard } from '@/pages/Dashboard';
import { Members } from '@/pages/Members';
import { Services } from '@/pages/Services';
import { AttendancePage } from '@/pages/Attendance';
import { PrayerRequests } from '@/pages/PrayerRequests';
import { Analytics } from '@/pages/Analytics';
import { Welcome } from '@/pages/Welcome';
import { MemberCheckIn } from '@/pages/MemberCheckIn';
import { PaywallScreen } from '@/pages/PaywallScreen';
import { Chat } from '@/pages/Chat';
import { FollowUps } from '@/pages/FollowUps';
import { SmallGroups } from '@/pages/SmallGroups';
import { Reminders } from '@/pages/Reminders';
import { Customize } from '@/pages/Customize';
import { AIAssistant } from '@/components/AIAssistant';
import { PageId, Workspace } from '@/types';
import { Menu } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function AppContent() {
  const { workspace, loading, canUseApp, role, leaveWorkspace, refreshWorkspace } = useWorkspace();
  const { customization } = useCustomization();
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [checkInQrOpen, setCheckInQrOpen] = useState(false);
  const [checkInWorkspace, setCheckInWorkspace] = useState<Workspace | null>(null);
  const [checkInMode, setCheckInMode] = useState(false);
  const roleInitialized = useRef(false);

  const { t } = useLanguage();
  const pageTitles: Record<PageId, string> = {
    dashboard: t('sidebar.dashboard'),
    members: t('sidebar.members'),
    services: t('sidebar.services'),
    attendance: t('sidebar.attendance'),
    followup: t('sidebar.followup'),
    groups: t('sidebar.groups'),
    prayer: t('sidebar.prayer'),
    analytics: t('sidebar.analytics'),
    chat: t('sidebar.chat'),
    reminders: t('sidebar.reminders'),
    customize: t('sidebar.customize'),
  };

  // Set default page based on role — coordinators start on Members, pastors on Dashboard
  useEffect(() => {
    if (role && !roleInitialized.current) {
      roleInitialized.current = true;
      if (role === 'coordinator') {
        setCurrentPage('members');
      }
    }
  }, [role]);

  // Redirect away from pages the current role can't access
  useEffect(() => {
    if (!role) return;
    const pastorOnlyPages: PageId[] = ['dashboard'];
    const coordinatorPages: PageId[] = ['members', 'services', 'attendance', 'followup', 'groups', 'analytics', 'chat', 'reminders', 'customize'];
    const memberPages: PageId[] = ['attendance', 'prayer'];

    if (role === 'coordinator') {
      if (pastorOnlyPages.includes(currentPage)) {
        setCurrentPage('members');
      } else if (currentPage === 'prayer' && !customization?.prayer_shared_with_coordinators) {
        setCurrentPage('members');
      }
    } else if (role === 'member' && !memberPages.includes(currentPage)) {
      setCurrentPage('attendance');
    }
  }, [role, currentPage, customization?.prayer_shared_with_coordinators]);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    const checkinCode = params.get('checkin');

    if (joinCode) {
      sessionStorage.setItem('glory-join-code', joinCode.toUpperCase());
      window.history.replaceState({}, '', window.location.pathname);
    }

    if (checkinCode) {
      // Look up church space by join_code and show check-in form
      supabase
        .from('workspaces')
        .select('*')
        .eq('join_code', checkinCode.toUpperCase())
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            setCheckInWorkspace(data as Workspace);
            setCheckInMode(true);
          }
          window.history.replaceState({}, '', window.location.pathname);
        });
    }

    const checkoutStatus = params.get('checkout');
    if (checkoutStatus === 'success' || checkoutStatus === 'cancelled') {
      // Refresh workspace data after Stripe checkout redirect
      refreshWorkspace();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Check-in mode: standalone member check-in form (no sidebar, no dashboard)
  if (checkInMode && checkInWorkspace) {
    return (
      <MemberCheckIn
        workspace={checkInWorkspace}
        onDone={() => { setCheckInMode(false); setCheckInWorkspace(null); }}
      />
    );
  }

  if (!workspace) {
    return <Welcome />;
  }

  // Paywall: if pastor's trial expired and no subscription, show paywall
  // Members/coordinators can still use the app even if pastor hasn't paid (they're limited by role)
  if (!canUseApp && role === 'pastor') {
    return <PaywallScreen onLeave={leaveWorkspace} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onShowQR={() => setQrOpen(true)}
        onShowCheckInQR={() => setCheckInQrOpen(true)}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <Menu size={22} />
          </button>
          <span className="font-bold text-slate-900 dark:text-white text-sm">{pageTitles[currentPage]}</span>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentPage === 'dashboard' && <Dashboard onNavigate={setCurrentPage} />}
          {currentPage === 'members' && <Members />}
          {currentPage === 'services' && <Services />}
          {currentPage === 'attendance' && <AttendancePage />}
          {currentPage === 'followup' && <FollowUps onNavigate={setCurrentPage} />}
          {currentPage === 'groups' && <SmallGroups />}
          {currentPage === 'prayer' && <PrayerRequests />}
          {currentPage === 'analytics' && <Analytics />}
          {currentPage === 'chat' && <Chat />}
          {currentPage === 'reminders' && <Reminders />}
          {currentPage === 'customize' && <Customize />}
        </main>
      </div>

      <QRCodeModal open={qrOpen} onClose={() => setQrOpen(false)} workspace={workspace} />
      <CheckInQRModal open={checkInQrOpen} onClose={() => setCheckInQrOpen(false)} workspace={workspace} />
      <AIAssistant />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <WorkspaceProvider>
          <CustomizationProvider>
            <AppContent />
          </CustomizationProvider>
        </WorkspaceProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
