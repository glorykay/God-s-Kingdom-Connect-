import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';
import { useCustomization } from '@/context/CustomizationContext';
import { Member, Service, PrayerRequest, Attendance, FollowUp, PageId } from '@/types';
import { TrialBanner } from '@/components/TrialBanner';
import * as XLSX from 'xlsx-js-style';
import {
  Users,
  CalendarDays,
  ClipboardCheck,
  HandHeart,
  TrendingUp,
  ArrowRight,
  Clock,
  MapPin,
  Download,
  Printer,
  FileSpreadsheet,
  Flame,
  AlertTriangle,
  UserCheck,
  Phone,
  Mail,
  Home,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { parseLocalDate, todayLocalISO, todayLocalMidnight, todayLocalStartISOString, tomorrowLocalStartISOString } from '@/lib/dateUtils';
import { dedupeAttendance } from '@/lib/attendanceUtils';

interface DashboardProps {
  onNavigate: (page: PageId) => void;
}

interface KPI {
  label: string;
  value: number;
  icon: typeof Users;
  color: string;
  bgColor: string;
  page: PageId;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { workspace } = useWorkspace();
  const { customization } = useCustomization();
  const { t } = useLanguage();
  const wid = workspace?.id ?? '';
  const [stats, setStats] = useState({
    members: 0,
    services: 0,
    todayAttendance: 0,
    pendingPrayer: 0,
  });
  const [recentMembers, setRecentMembers] = useState<Member[]>([]);
  const [upcomingServices, setUpcomingServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allAttendance, setAllAttendance] = useState<Attendance[]>([]);
  const [todayAttendanceList, setTodayAttendanceList] = useState<Attendance[]>([]);
  const [allPrayers, setAllPrayers] = useState<PrayerRequest[]>([]);
  const [exporting, setExporting] = useState(false);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [reachingOutIds, setReachingOutIds] = useState<Set<string>>(new Set());
  const [reachedOutIds, setReachedOutIds] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (wid) loadDashboard();

    const channel = supabase
      .channel('dashboard-attendance-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance', filter: `workspace_id=eq.${wid}` },
        () => loadDashboard()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wid]);

  async function loadDashboard() {
    const [membersRes, servicesRes, attendanceRes, prayerRes, allAttRes, fuRes] = await Promise.all([
      supabase.from('members').select('*').eq('workspace_id', wid).order('created_at', { ascending: false }),
      supabase.from('services').select('*').eq('workspace_id', wid).order('service_date', { ascending: true }),
      supabase.from('attendance').select('*').eq('workspace_id', wid).gte('timestamp', todayLocalStartISOString()).lt('timestamp', tomorrowLocalStartISOString()),
      supabase.from('prayer_requests').select('*').eq('workspace_id', wid).eq('status', 'pending'),
      supabase.from('attendance').select('*').eq('workspace_id', wid).order('timestamp', { ascending: false }),
      supabase.from('follow_ups').select('*').eq('workspace_id', wid).eq('status', 'pending'),
    ]);

    const todayRecords = dedupeAttendance(attendanceRes.data ?? []);

    setStats({
      members: membersRes.data?.length ?? 0,
      services: servicesRes.data?.length ?? 0,
      todayAttendance: todayRecords.length,
      pendingPrayer: prayerRes.data?.length ?? 0,
    });
    setRecentMembers((membersRes.data ?? []).slice(0, 5));
    setAllMembers(membersRes.data ?? []);
    setAllAttendance(allAttRes.data ?? []);
    setTodayAttendanceList(todayRecords);
    setAllServices(servicesRes.data ?? []);
    setAllPrayers(prayerRes.data ?? []);
    setFollowUps(fuRes.data ?? []);
    setUpcomingServices((servicesRes.data ?? []).filter(s => parseLocalDate(s.service_date) >= todayLocalMidnight()).slice(0, 4));
    setLoading(false);
  }

  const template = customization?.dashboard_template ?? 'classic';
  const cardLayout = customization?.card_layout ?? 'grid';
  const brandColor = customization?.primary_color ?? '#f59e0b';
  const accentColor = customization?.accent_color ?? '#3b82f6';
  const logoUrl = customization?.logo_url;

  const isGradientTpl = template === 'gradient' || template === 'hero' || template === 'banner';
  const isDarkTpl = isGradientTpl || template === 'dark' || template === 'bold';
  const headingTextClass = isDarkTpl ? 'text-white' : 'text-slate-900 dark:text-white';
  const subTextClass = isDarkTpl ? 'text-white/60' : 'text-slate-400';
  const nameTextClass = isDarkTpl ? 'text-white' : 'text-slate-900 dark:text-white';
  const linkClass = isDarkTpl ? 'text-white/80 hover:text-white' : 'text-amber-600 dark:text-amber-400';
  const gradientColors = [
    `linear-gradient(135deg, ${brandColor}, ${accentColor})`,
    `linear-gradient(135deg, ${accentColor}, ${brandColor})`,
    `linear-gradient(135deg, ${brandColor}dd, ${accentColor}dd)`,
    `linear-gradient(135deg, ${accentColor}dd, ${brandColor}dd)`,
  ];

  // Template-specific styling for KPI cards
  const tplStyles: Record<string, { kpiGrid: string; kpiCard: string; kpiIcon: string; kpiValue: string; sectionGrid: string; sectionCard: string; headerWrap: string }> = {
    classic:        { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'bg-white dark:bg-slate-800 p-5 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-6', sectionCard: 'bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5', headerWrap: '' },
    compact:        { kpiGrid: 'grid grid-cols-2 sm:grid-cols-4 gap-2', kpiCard: 'bg-white dark:bg-slate-800 p-3 border border-slate-200 dark:border-slate-700 hover:border-slate-300', kpiIcon: 'w-9 h-9', kpiValue: 'text-2xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-3', sectionCard: 'bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4', headerWrap: '' },
    minimal:        { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6', kpiCard: 'bg-transparent p-4 border border-transparent hover:border-slate-200 dark:hover:border-slate-700', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-8', sectionCard: 'bg-transparent rounded-2xl p-5', headerWrap: '' },
    modern:         { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'bg-white dark:bg-slate-800 p-5 border-0 rounded-2xl shadow-md hover:shadow-xl', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-5', sectionCard: 'bg-white dark:bg-slate-800 rounded-2xl shadow-md p-5', headerWrap: '' },
    gradient:       { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'p-5 border-0 rounded-2xl text-white', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-5', sectionCard: 'rounded-2xl p-5 text-white border-0', headerWrap: '' },
    corporate:      { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'bg-slate-50 dark:bg-slate-800 p-5 rounded-xl border-l-4 hover:shadow-md', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-5', sectionCard: 'bg-slate-50 dark:bg-slate-800 rounded-xl border-l-4 p-5', headerWrap: '' },
    bold:           { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'bg-slate-900 dark:bg-black p-5 rounded-2xl border-2 border-amber-500 text-white', kpiIcon: 'w-12 h-12', kpiValue: 'text-4xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-5', sectionCard: 'bg-slate-900 dark:bg-black rounded-2xl border-2 border-amber-500/50 p-5 text-white', headerWrap: '' },
    elegant:        { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5', kpiCard: 'bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700', kpiIcon: 'w-14 h-14', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-6', sectionCard: 'bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 p-6', headerWrap: '' },
    dark:           { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'bg-slate-800 p-5 rounded-2xl border border-slate-700 text-white', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-5', sectionCard: 'bg-slate-800 rounded-2xl border border-slate-700 p-5 text-white', headerWrap: '' },
    glass:          { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'bg-white/60 dark:bg-slate-800/40 backdrop-blur-md p-5 rounded-2xl border border-white/40 dark:border-white/10', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-5', sectionCard: 'bg-white/60 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/40 dark:border-white/10 p-5', headerWrap: '' },
    neumorphic:     { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'bg-slate-100 dark:bg-slate-700 p-5 rounded-2xl shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)] hover:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1)]', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-5', sectionCard: 'bg-slate-100 dark:bg-slate-700 rounded-2xl shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1)] p-5', headerWrap: '' },
    card:           { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-lg hover:shadow-2xl border border-slate-100 dark:border-slate-700', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-5', sectionCard: 'bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-5 border border-slate-100 dark:border-slate-700', headerWrap: '' },
    magazine:       { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'bg-white dark:bg-slate-800 p-5 rounded-2xl border-t-4 border-rose-500', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-5', sectionCard: 'bg-white dark:bg-slate-800 rounded-2xl border-t-4 border-rose-500 p-5', headerWrap: '' },
    widget:         { kpiGrid: 'grid grid-cols-2 sm:grid-cols-4 gap-3', kpiCard: 'bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-600', kpiIcon: 'w-10 h-10', kpiValue: 'text-2xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-4', sectionCard: 'bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 p-4', headerWrap: '' },
    hero:           { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'p-5 rounded-2xl text-white border-0', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-5', sectionCard: 'rounded-2xl p-5 text-white border-0', headerWrap: '' },
    split:          { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'bg-white dark:bg-slate-800 p-5 rounded-2xl border-r-4 border-blue-500', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-5', sectionCard: 'bg-white dark:bg-slate-800 rounded-2xl border-r-4 border-blue-500 p-5', headerWrap: '' },
    sidebar:        { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'bg-white dark:bg-slate-800 p-5 rounded-2xl border-l-4 border-emerald-500', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-5', sectionCard: 'bg-white dark:bg-slate-800 rounded-2xl border-l-4 border-emerald-500 p-5', headerWrap: '' },
    tabs:           { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'bg-white dark:bg-slate-800 p-5 rounded-2xl border-b-4 border-amber-500', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-5', sectionCard: 'bg-white dark:bg-slate-800 rounded-2xl border-b-4 border-amber-500 p-5', headerWrap: '' },
    banner:         { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4', kpiCard: 'p-5 rounded-2xl text-white border-0', kpiIcon: 'w-12 h-12', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-5', sectionCard: 'rounded-2xl p-5 text-white border-0', headerWrap: '' },
    minimalist_pro: { kpiGrid: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6', kpiCard: 'bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-100 dark:border-slate-700', kpiIcon: 'w-11 h-11', kpiValue: 'text-3xl', sectionGrid: 'grid grid-cols-1 lg:grid-cols-2 gap-6', sectionCard: 'bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 p-5', headerWrap: '' },
  };

  const ts = tplStyles[template] ?? tplStyles.classic;

  const kpis: KPI[] = [
    { label: t('dashboard.totalMembers'), value: stats.members, icon: Users, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-500/10', page: 'members' },
    { label: t('dashboard.services'), value: stats.services, icon: CalendarDays, color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-50 dark:bg-amber-500/10', page: 'services' },
    { label: t('dashboard.todaysAttendance'), value: stats.todayAttendance, icon: ClipboardCheck, color: 'text-emerald-600 dark:text-emerald-400', bgColor: 'bg-emerald-50 dark:bg-emerald-500/10', page: 'attendance' },
    { label: t('dashboard.pendingPrayers'), value: stats.pendingPrayer, icon: HandHeart, color: 'text-rose-600 dark:text-rose-400', bgColor: 'bg-rose-50 dark:bg-rose-500/10', page: 'prayer' },
  ];

  function exportExcel() {
    setExporting(true);

    const wb = XLSX.utils.book_new();
    const churchName = workspace?.name ?? "God's Kingdom Connect";
    const reportDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    const headerStyle: XLSX.CellObject['s'] = {
      font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 12, name: 'Calibri' },
      fill: { fgColor: { rgb: 'F59E0B' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: 'D97706' } },
        bottom: { style: 'thin', color: { rgb: 'D97706' } },
        left: { style: 'thin', color: { rgb: 'D97706' } },
        right: { style: 'thin', color: { rgb: 'D97706' } },
      },
    };

    const titleStyle: XLSX.CellObject['s'] = {
      font: { bold: true, sz: 18, color: { rgb: '1E293B' }, name: 'Calibri' },
      alignment: { horizontal: 'center' },
    };

    const subtitleStyle: XLSX.CellObject['s'] = {
      font: { italic: true, sz: 11, color: { rgb: '64748B' }, name: 'Calibri' },
      alignment: { horizontal: 'center' },
    };

    const sectionStyle: XLSX.CellObject['s'] = {
      font: { bold: true, sz: 13, color: { rgb: 'F59E0B' }, name: 'Calibri' },
      alignment: { horizontal: 'center' },
    };

    const dataStyle: XLSX.CellObject['s'] = {
      font: { sz: 11, name: 'Calibri' },
      border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
    };

    const altRowStyle: XLSX.CellObject['s'] = {
      font: { sz: 11, name: 'Calibri' },
      fill: { fgColor: { rgb: 'F8FAFC' } },
      border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
    };

    const greenStyle: XLSX.CellObject['s'] = {
      font: { bold: true, sz: 11, color: { rgb: '059669' }, name: 'Calibri' },
      alignment: { horizontal: 'center' },
      border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
    };

    const grayStyle: XLSX.CellObject['s'] = {
      font: { sz: 11, color: { rgb: '94A3B8' }, name: 'Calibri' },
      alignment: { horizontal: 'center' },
      border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
    };

    const amberStyle: XLSX.CellObject['s'] = {
      font: { bold: true, sz: 11, color: { rgb: 'D97706' }, name: 'Calibri' },
      alignment: { horizontal: 'center' },
      border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
    };

    const blueStyle: XLSX.CellObject['s'] = {
      font: { bold: true, sz: 11, color: { rgb: '2563EB' }, name: 'Calibri' },
      alignment: { horizontal: 'center' },
      border: { bottom: { style: 'thin', color: { rgb: 'E2E8F0' } } },
    };

    function styleRows(ws: XLSX.WorkSheet, startRow: number, rowCount: number, colCount: number) {
      for (let i = 0; i < rowCount; i++) {
        for (let c = 0; c < colCount; c++) {
          const ref = XLSX.utils.encode_cell({ r: startRow + i, c });
          if (ws[ref]) ws[ref].s = i % 2 === 1 ? { ...altRowStyle } : { ...dataStyle };
        }
      }
    }

    function styleHeaders(ws: XLSX.WorkSheet, row: number, colCount: number) {
      for (let c = 0; c < colCount; c++) {
        const ref = XLSX.utils.encode_cell({ r: row, c });
        if (ws[ref]) ws[ref].s = headerStyle;
      }
    }

    function addTitleBlock(ws: XLSX.WorkSheet, sectionLabel: string, mergeCols: number) {
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: mergeCols } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: mergeCols } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: mergeCols } },
      ];
      ws['A1'].s = titleStyle;
      ws['A2'].s = sectionStyle;
      ws['A3'].s = subtitleStyle;
    }

    const watermarkStyle: XLSX.CellObject['s'] = {
      font: { bold: true, sz: 80, color: { rgb: 'CBD5E1' }, name: 'Calibri' },
      alignment: { horizontal: 'center', vertical: 'center', textRotation: 45 },
    };

    function addWatermark(ws: XLSX.WorkSheet, lastDataRow: number, colCount: number, name: string) {
      const watermarkRow = lastDataRow + 2;
      const watermarkSpan = Math.max(colCount - 1, 6);
      XLSX.utils.sheet_add_aoa(ws, [[name]], { origin: { r: watermarkRow, c: 0 } });
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({
        s: { r: watermarkRow, c: 0 },
        e: { r: watermarkRow + 30, c: watermarkSpan },
      });
      const ref = XLSX.utils.encode_cell({ r: watermarkRow, c: 0 });
      if (ws[ref]) ws[ref].s = watermarkStyle;
    }

    // --- Sheet 1: Members ---
    const memberHeaders = ['First Name', 'Last Name', 'Gender', 'Email', 'Phone', 'Address', 'New Comer', 'Joined Date'];
    const wsMembers = XLSX.utils.aoa_to_sheet([
      [churchName],
      ['Member Directory'],
      [`Generated: ${reportDate}`],
      [],
      memberHeaders,
      ...allMembers.map((m) => [
        m.first_name, m.last_name,
        m.gender === 'male' ? 'Male' : m.gender === 'female' ? 'Female' : '',
        m.email ?? '', m.phone ?? '',
        m.address ?? '', m.is_new_comer ? 'Yes' : 'No',
        new Date(m.joined_date).toLocaleDateString(),
      ]),
    ]);
    addTitleBlock(wsMembers, 'Member Directory', 7);
    wsMembers['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 10 }, { wch: 30 }, { wch: 16 }, { wch: 28 }, { wch: 12 }, { wch: 14 }];
    styleHeaders(wsMembers, 4, 8);
    allMembers.forEach((m, idx) => {
      const row = 5 + idx;
      const isAlt = idx % 2 === 1;
      const ref = XLSX.utils.encode_cell({ r: row, c: 6 });
      if (wsMembers[ref]) {
        const base = m.is_new_comer ? { ...greenStyle } : { ...grayStyle };
        if (isAlt) base.fill = { fgColor: { rgb: 'F8FAFC' } };
        wsMembers[ref].s = base;
      }
    });
    styleRows(wsMembers, 5, allMembers.length, 8);
    allMembers.forEach((m, idx) => {
      const row = 5 + idx;
      const ref = XLSX.utils.encode_cell({ r: row, c: 6 });
      if (wsMembers[ref]) {
        const isAlt = idx % 2 === 1;
        const base = m.is_new_comer ? { ...greenStyle } : { ...grayStyle };
        if (isAlt) base.fill = { fgColor: { rgb: 'F8FAFC' } };
        wsMembers[ref].s = base;
      }
    });
    XLSX.utils.book_append_sheet(wb, wsMembers, 'Members');

    addWatermark(wsMembers, 5 + allMembers.length, 8, churchName);

    // --- Sheet 2: Attendance ---
    const attHeaders = ['Name', 'New Comer', 'Check-in Time'];
    const wsAtt = XLSX.utils.aoa_to_sheet([
      [churchName],
      ['Attendance Log'],
      [`Generated: ${reportDate}`],
      [],
      attHeaders,
      ...todayAttendanceList.map((a) => [
        a.is_new_comer ? (a.newcomer_name ?? 'New Comer') : (() => {
          const member = allMembers.find((m) => m.id === a.member_id);
          return member ? `${member.first_name} ${member.last_name}` : 'Member';
        })(),
        a.is_new_comer ? 'Yes' : 'No',
        new Date(a.timestamp).toLocaleString(),
      ]),
    ]);
    addTitleBlock(wsAtt, 'Attendance Log', 2);
    wsAtt['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 24 }];
    styleHeaders(wsAtt, 4, 3);
    todayAttendanceList.forEach((a, idx) => {
      const row = 5 + idx;
      const isAlt = idx % 2 === 1;
      const ref = XLSX.utils.encode_cell({ r: row, c: 1 });
      if (wsAtt[ref]) {
        const base = a.is_new_comer ? { ...greenStyle } : { ...grayStyle };
        if (isAlt) base.fill = { fgColor: { rgb: 'F8FAFC' } };
        wsAtt[ref].s = base;
      }
    });
    styleRows(wsAtt, 5, todayAttendanceList.length, 3);
    todayAttendanceList.forEach((a, idx) => {
      const row = 5 + idx;
      const isAlt = idx % 2 === 1;
      const ref = XLSX.utils.encode_cell({ r: row, c: 1 });
      if (wsAtt[ref]) {
        const base = a.is_new_comer ? { ...greenStyle } : { ...grayStyle };
        if (isAlt) base.fill = { fgColor: { rgb: 'F8FAFC' } };
        wsAtt[ref].s = base;
      }
    });
    XLSX.utils.book_append_sheet(wb, wsAtt, 'Attendance');

    addWatermark(wsAtt, 5 + todayAttendanceList.length, 3, churchName);

    // --- Sheet 3: Prayer Requests ---
    const prayerHeaders = ['Name', 'Request', 'Status', 'Date'];
    const wsPrayer = XLSX.utils.aoa_to_sheet([
      [churchName],
      ['Prayer Requests'],
      [`Generated: ${reportDate}`],
      [],
      prayerHeaders,
      ...allPrayers.map((p) => [
        p.member_name, p.request_text, p.status,
        new Date(p.created_at).toLocaleDateString(),
      ]),
    ]);
    addTitleBlock(wsPrayer, 'Prayer Requests', 3);
    wsPrayer['!cols'] = [{ wch: 22 }, { wch: 50 }, { wch: 14 }, { wch: 14 }];
    styleHeaders(wsPrayer, 4, 4);
    allPrayers.forEach((p, idx) => {
      const row = 5 + idx;
      const isAlt = idx % 2 === 1;
      const ref = XLSX.utils.encode_cell({ r: row, c: 2 });
      if (wsPrayer[ref]) {
        let base: XLSX.CellObject['s'];
        if (p.status === 'pending') base = { ...amberStyle };
        else if (p.status === 'answered') base = { ...blueStyle };
        else base = { ...greenStyle };
        if (isAlt) base.fill = { fgColor: { rgb: 'F8FAFC' } };
        wsPrayer[ref].s = base;
      }
    });
    styleRows(wsPrayer, 5, allPrayers.length, 4);
    allPrayers.forEach((p, idx) => {
      const row = 5 + idx;
      const isAlt = idx % 2 === 1;
      const ref = XLSX.utils.encode_cell({ r: row, c: 2 });
      if (wsPrayer[ref]) {
        let base: XLSX.CellObject['s'];
        if (p.status === 'pending') base = { ...amberStyle };
        else if (p.status === 'answered') base = { ...blueStyle };
        else base = { ...greenStyle };
        if (isAlt) base.fill = { fgColor: { rgb: 'F8FAFC' } };
        wsPrayer[ref].s = base;
      }
    });
    XLSX.utils.book_append_sheet(wb, wsPrayer, 'Prayer Requests');

    addWatermark(wsPrayer, 5 + allPrayers.length, 4, churchName);

    // --- Sheet 4: Summary ---
    const wsSummary = XLSX.utils.aoa_to_sheet([
      [churchName],
      ['Dashboard Summary'],
      [`Generated: ${reportDate}`],
      [],
      ['Metric', 'Value'],
      ['Total Members', stats.members],
      ['Total Services', stats.services],
      ["Today's Attendance", stats.todayAttendance],
      ['Pending Prayer Requests', stats.pendingPrayer],
    ]);
    addTitleBlock(wsSummary, 'Dashboard Summary', 1);
    wsSummary['!cols'] = [{ wch: 28 }, { wch: 18 }];
    styleHeaders(wsSummary, 4, 2);
    for (let r = 5; r < 9; r++) {
      const isAlt = (r - 5) % 2 === 1;
      const aRef = XLSX.utils.encode_cell({ r, c: 0 });
      const bRef = XLSX.utils.encode_cell({ r, c: 1 });
      if (wsSummary[aRef]) wsSummary[aRef].s = isAlt
        ? { ...altRowStyle, font: { bold: true, sz: 11, name: 'Calibri' } }
        : { ...dataStyle, font: { bold: true, sz: 11, name: 'Calibri' } };
      if (wsSummary[bRef]) wsSummary[bRef].s = isAlt
        ? { ...altRowStyle, font: { bold: true, sz: 14, color: { rgb: 'F59E0B' }, name: 'Calibri' }, alignment: { horizontal: 'center' } }
        : { ...dataStyle, font: { bold: true, sz: 14, color: { rgb: 'F59E0B' }, name: 'Calibri' }, alignment: { horizontal: 'center' } };
    }
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    addWatermark(wsSummary, 8, 2, churchName);

    const fileName = `${churchName.toLowerCase().replace(/\s+/g, '-')}-report-${todayLocalISO()}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setExporting(false);
  }

  function printSheet() {
    const printWin = window.open('', '_blank');
    if (!printWin) return;

    const esc = (s: string | null | undefined) => String(s ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const rows = allMembers.map((m) => `
      <tr>
        <td>${esc(m.first_name)}</td>
        <td>${esc(m.last_name)}</td>
        <td>${m.gender === 'male' ? 'Male' : m.gender === 'female' ? 'Female' : ''}</td>
        <td>${esc(m.email)}</td>
        <td>${esc(m.phone)}</td>
        <td>${esc(m.address)}</td>
        <td>${m.is_new_comer ? 'Yes' : 'No'}</td>
        <td>${new Date(m.joined_date).toLocaleDateString()}</td>
      </tr>`).join('');

    printWin.document.write(`
      <html>
      <head>
        <title>${esc(workspace?.name)} — Member Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          p { color: #666; font-size: 12px; margin-bottom: 16px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th { background: #f59e0b; color: white; padding: 8px 10px; text-align: left; }
          td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
          tr:nth-child(even) { background: #f9fafb; }
        </style>
      </head>
      <body>
        <h1>${esc(workspace?.name)}</h1>
        <p>Member Report — ${new Date().toLocaleDateString()}</p>
        <table>
          <thead>
            <tr>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Gender</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Address</th>
              <th>New Comer</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <script>window.onload = () => window.print()</script>
      </body>
      </html>
    `);
    printWin.document.close();
  }

  // Compute attendance gaps and streaks
  const attendanceGaps = (() => {
    if (allMembers.length === 0 || allServices.length === 0) return [];
    const now = new Date();
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    return allMembers
      .filter((m) => !m.is_new_comer || new Date(m.joined_date) < twoWeeksAgo)
      .map((m) => {
        const memberAttendance = allAttendance.filter((a) => a.member_id === m.id);
 const lastAttended = memberAttendance.length > 0 ? new Date(memberAttendance[0].timestamp) : null;
        const daysSinceLast = lastAttended
          ? Math.floor((now.getTime() - lastAttended.getTime()) / (1000 * 60 * 60 * 24))
          : null;
        return { member: m, lastAttended, daysSinceLast };
      })
      .filter((item) => item.daysSinceLast === null || item.daysSinceLast >= 14)
      .sort((a, b) => (b.daysSinceLast ?? 9999) - (a.daysSinceLast ?? 9999))
      .slice(0, 5);
  })();

  const attendanceStreaks = (() => {
    if (allMembers.length === 0 || allServices.length === 0) return [];
    const now = new Date();
    const sortedServices = [...allServices].sort((a, b) => parseLocalDate(b.service_date).getTime() - parseLocalDate(a.service_date).getTime());
    return allMembers
      .map((m) => {
        const memberAttendance = allAttendance.filter((a) => a.member_id === m.id);
        const attDates = new Set(memberAttendance.map((a) => new Date(a.timestamp).toLocaleDateString('en-CA')));
        let streak = 0;
        for (const s of sortedServices) {
          const sDate = parseLocalDate(s.service_date);
          if (sDate > now) continue;
          const serviceDateStr = sDate.toDateString();
          const dayAfter = new Date(sDate);
          dayAfter.setDate(dayAfter.getDate() + 1);
          const dayAfterStr = dayAfter.toDateString();
          if (attDates.has(serviceDateStr) || attDates.has(dayAfterStr)) {
            streak++;
          } else {
            break;
          }
        }
        return { member: m, streak };
      })
      .filter((item) => item.streak >= 2)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 5);
  })();

  function hasPendingFollowUp(memberId: string): boolean {
    return followUps.some((f) => f.member_id === memberId && f.status === 'pending');
  }

  async function quickReachOut(member: Member, daysSinceLast: number | null) {
    if (reachingOutIds.has(member.id) || hasPendingFollowUp(member.id)) return;
    setReachingOutIds((prev) => new Set(prev).add(member.id));
    const weeks = daysSinceLast ? Math.floor(daysSinceLast / 7) : 0;
    const payload = {
      workspace_id: wid,
      member_id: member.id,
      newcomer_name: `${member.first_name} ${member.last_name}`,
      status: 'pending' as const,
      method: 'call' as const,
      notes: t('followup.absentNote', { weeks: weeks > 0 ? weeks : 2 }),
      follow_up_date: new Date(todayLocalISO() + 'T12:00:00').toISOString(),
    };
    const { error } = await supabase.from('follow_ups').insert(payload);
    setReachingOutIds((prev) => {
      const next = new Set(prev);
      next.delete(member.id);
      return next;
    });
    if (!error) {
      setReachedOutIds((prev) => new Set(prev).add(member.id));
      setFollowUps((prev) => [...prev, { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as FollowUp]);
      setToast(t('gaps.followUpCreated', { name: `${member.first_name} ${member.last_name}` }));
      setTimeout(() => setToast(null), 3000);
    }
  }

  function gapLabel(daysSinceLast: number | null): string {
    if (daysSinceLast === null) return t('gaps.neverAttended');
    if (daysSinceLast >= 60) return t('gaps.monthsAway', { count: Math.floor(daysSinceLast / 30) });
    if (daysSinceLast >= 14) return t('gaps.weeksAway', { count: Math.floor(daysSinceLast / 7) });
    return t('gaps.daysAway', { count: daysSinceLast });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TrialBanner />

      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {logoUrl && (
              <img src={logoUrl} alt="Church logo" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('dashboard.welcome')} {workspace?.name}</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('dashboard.welcomeSub')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportExcel}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-medium text-sm hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-600/20"
            >
              <FileSpreadsheet size={18} /> {exporting ? t('dashboard.exporting') : t('dashboard.exportExcel')}
            </button>
            <button
              onClick={printSheet}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              <Printer size={18} /> {t('dashboard.print')}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className={cardLayout === 'list' ? 'grid grid-cols-1 gap-3' : ts.kpiGrid}>
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <button
              key={kpi.label}
              onClick={() => onNavigate(kpi.page)}
              className={`group rounded-2xl hover:shadow-lg transition-all text-left ${ts.kpiCard}`}
              style={isGradientTpl ? { background: gradientColors[idx % gradientColors.length] } : template === 'corporate' ? { borderLeftColor: brandColor } : template === 'bold' ? { borderColor: brandColor } : template === 'tabs' ? { borderBottomColor: brandColor } : undefined}
            >
              <div className="flex items-start justify-between">
                <div className={`${ts.kpiIcon} rounded-xl ${kpi.bgColor} flex items-center justify-center`}>
                  <Icon size={ts.kpiIcon === 'w-9 h-9' ? 18 : ts.kpiIcon === 'w-14 h-14' ? 26 : 22} className={kpi.color} />
                </div>
                <ArrowRight size={18} className={`${isGradientTpl ? 'text-white/60 group-hover:text-white group-hover:translate-x-1' : 'text-slate-300 dark:text-slate-600 group-hover:text-slate-500 group-hover:translate-x-1'} transition-all`} />
              </div>
              <p className={`${ts.kpiValue} font-bold mt-3 ${isGradientTpl ? 'text-white' : 'text-slate-900 dark:text-white'}`}>{kpi.value}</p>
              <p className={`text-sm mt-0.5 ${isGradientTpl ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>{kpi.label}</p>
            </button>
          );
        })}
      </div>

      {/* Today's Attendance List */}
      <div className={`${ts.sectionCard}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck size={18} className="text-emerald-500" />
            <h2 className={`font-bold ${headingTextClass}`}>{t('dashboard.todaysAttendance')}</h2>
            {todayAttendanceList.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                {todayAttendanceList.length}
              </span>
            )}
          </div>
          <button onClick={() => onNavigate('attendance')} className={`text-sm font-medium hover:underline ${linkClass}`}>
            {t('dashboard.viewAll')}
          </button>
        </div>
        {todayAttendanceList.length === 0 ? (
          <p className={`text-sm text-center py-8 ${subTextClass}`}>{t('dashboard.noAttendanceToday')}</p>
        ) : (
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {todayAttendanceList.map((a) => {
              const svc = allServices.find((s) => s.id === a.service_id);
              const memberName = a.is_new_comer
                ? a.newcomer_name || t('attendance.newComerBadge')
                : (() => {
                    const m = allMembers.find((m) => m.id === a.member_id);
                    return m ? `${m.first_name} ${m.last_name}` : t('common.member');
                  })();
              return (
                <div key={a.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {a.is_new_comer ? 'NC' : <UserCheck size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${nameTextClass}`}>{memberName}</p>
                    <p className={`text-[11px] ${subTextClass}`}>
                      {svc?.name ?? t('attendance.unknownService')} • {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  {a.is_new_comer && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 flex-shrink-0">
                      {t('common.new')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={cardLayout === 'list' ? 'grid grid-cols-1 gap-4' : ts.sectionGrid}>
        {/* Recent Members */}
        <div className={`${ts.sectionCard}`} style={isGradientTpl ? { background: gradientColors[0] } : undefined}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-bold ${headingTextClass}`}>{t('dashboard.recentMembers')}</h2>
            <button onClick={() => onNavigate('members')} className={`text-sm font-medium hover:underline ${linkClass}`}>
              {t('dashboard.viewAll')}
            </button>
          </div>
          {recentMembers.length === 0 ? (
            <p className={`text-sm text-center py-8 ${subTextClass}`}>{t('dashboard.noMembers')}</p>
          ) : (
            <div className="space-y-3">
              {recentMembers.map((m) => (
                <div key={m.id} className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-sm">
                    {m.first_name[0]}{m.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${nameTextClass}`}>{m.first_name} {m.last_name}</p>
                    <p className={`text-xs ${subTextClass}`}>{m.email || m.phone || t('common.noContact')}</p>
                  </div>
                  {m.is_new_comer && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                      {t('common.new')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Services */}
        <div className={`${ts.sectionCard}`} style={isGradientTpl ? { background: gradientColors[1] } : undefined}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-bold ${headingTextClass}`}>{t('dashboard.upcomingServices')}</h2>
            <button onClick={() => onNavigate('services')} className={`text-sm font-medium hover:underline ${linkClass}`}>
              {t('dashboard.viewAll')}
            </button>
          </div>
          {upcomingServices.length === 0 ? (
            <p className={`text-sm text-center py-8 ${subTextClass}`}>{t('dashboard.noUpcoming')}</p>
          ) : (
            <div className="space-y-3">
              {upcomingServices.map((s) => (
                <div key={s.id} className="flex items-start gap-3 py-2">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase">
                      {parseLocalDate(s.service_date).toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-base font-bold text-amber-700 dark:text-amber-300">
                      {parseLocalDate(s.service_date).getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${nameTextClass}`}>{s.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className={`text-xs flex items-center gap-1 ${subTextClass}`}>
                        <Clock size={12} /> {s.service_time}
                      </span>
                    </div>
                    {s.speaker && <p className={`text-xs mt-0.5 ${subTextClass}`}>{s.speaker}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Attendance Gaps & Streaks */}
      <div className={cardLayout === 'list' ? 'grid grid-cols-1 gap-4' : ts.sectionGrid}>
        {/* Attendance Gaps */}
        <div className={`${ts.sectionCard}`} style={isGradientTpl ? { background: gradientColors[2] } : undefined}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h2 className={`font-bold ${headingTextClass}`}>{t('gaps.title')}</h2>
          </div>
          <p className={`text-xs mb-4 ${subTextClass}`}>{t('gaps.subtitle')}</p>
          {attendanceGaps.length === 0 ? (
            <p className={`text-sm text-center py-8 ${subTextClass}`}>{t('gaps.noGaps')}</p>
          ) : (
            <div className="space-y-3">
              {attendanceGaps.map(({ member, lastAttended, daysSinceLast }) => {
                const alreadyHasFollowUp = hasPendingFollowUp(member.id);
                const justReachedOut = reachedOutIds.has(member.id);
                const isReachingOut = reachingOutIds.has(member.id);
                const showContact = !isDarkTpl && (member.email || member.phone || member.address);
                return (
                  <div key={member.id} className="py-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                        {member.first_name[0]}{member.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${nameTextClass}`}>{member.first_name} {member.last_name}</p>
                        <p className={`text-xs ${subTextClass}`}>
                          {t('gaps.lastSeen')}: {lastAttended ? lastAttended.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : t('gaps.neverAttended')}
                        </p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                        daysSinceLast === null
                          ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                          : (daysSinceLast ?? 0) >= 30
                            ? 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                      }`}>
                        {gapLabel(daysSinceLast)}
                      </span>
                    </div>
                    {showContact && (
                      <div className="flex flex-wrap gap-3 mt-1.5 ml-[52px] text-[10px] text-slate-400">
                        {member.email && <span className="flex items-center gap-1"><Mail size={10} /> {member.email}</span>}
                        {member.phone && <span className="flex items-center gap-1"><Phone size={10} /> {member.phone}</span>}
                        {member.address && <span className="flex items-center gap-1"><Home size={10} /> {member.address}</span>}
                      </div>
                    )}
                    <div className="mt-2">
                      {justReachedOut || alreadyHasFollowUp ? (
                        <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg ${isDarkTpl ? 'bg-white/10 text-white/80' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'}`}>
                          <CheckCircle2 size={13} />
                          {t('gaps.alreadyHasFollowUp')}
                        </span>
                      ) : (
                        <button
                          onClick={() => quickReachOut(member, daysSinceLast)}
                          disabled={isReachingOut}
                          className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${isDarkTpl ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20'}`}
                        >
                          {isReachingOut ? (
                            <span className="w-3 h-3 border-1.5 border-current border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Plus size={13} />
                          )}
                          {t('gaps.reachOut')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attendance Streaks */}
        <div className={`${ts.sectionCard}`} style={isGradientTpl ? { background: gradientColors[3] } : undefined}>
          <div className="flex items-center gap-2 mb-4">
            <Flame size={18} className="text-orange-500" />
            <h2 className={`font-bold ${headingTextClass}`}>{t('gaps.streakTitle')}</h2>
          </div>
          {attendanceStreaks.length === 0 ? (
            <p className={`text-sm text-center py-8 ${subTextClass}`}>{t('gaps.noStreaks')}</p>
          ) : (
            <div className="space-y-3">
              {attendanceStreaks.map(({ member, streak }) => (
                <div key={member.id} className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                    {member.first_name[0]}{member.last_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${nameTextClass}`}>{member.first_name} {member.last_name}</p>
                    <p className={`text-xs ${subTextClass}`}>{t('gaps.activeStreak')}</p>
                  </div>
                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 flex items-center gap-1 flex-shrink-0">
                    <Flame size={10} />
                    {t('gaps.streakWeeks', { count: streak })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-sm font-medium shadow-2xl animate-[slideUp_0.2s_ease-out]">
          <CheckCircle2 size={18} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  );
}
