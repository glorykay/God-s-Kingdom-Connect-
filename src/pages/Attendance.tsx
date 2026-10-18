import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Service, Member, Attendance, KidsCheckin } from '@/types';
import { Modal } from '@/components/Modal';
import { BarChart } from '@/components/Charts';
import * as XLSX from 'xlsx-js-style';
import {
  ClipboardCheck,
  UserPlus,
  Check,
  Calendar,
  TrendingUp,
  Search,
  Heart,
  BookOpen,
  Download,
  Baby,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { parseLocalDate, todayLocalISO } from '@/lib/dateUtils';
import { getRandomWelcomeVerse } from '@/data/bibleVerses';
import { MemberDetailDrawer } from '@/components/MemberDetailDrawer';

type Period = 'all' | 'today' | 'week' | 'month' | 'year' | 'custom';

export function AttendancePage() {
  const { workspace, role } = useWorkspace();
  const { t } = useLanguage();
  const wid = workspace?.id ?? '';
  const canManage = role === 'pastor' || role === 'coordinator';
  const [services, setServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [allAttendance, setAllAttendance] = useState<Attendance[]>([]);
  const [kidsCheckins, setKidsCheckins] = useState<KidsCheckin[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('all');
  const [customDate, setCustomDate] = useState<string>(todayLocalISO());
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [newcomerOpen, setNewcomerOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string>('');
  const [memberSearch, setMemberSearch] = useState('');
  const [newcomerName, setNewcomerName] = useState('');
  const [newcomerContact, setNewcomerContact] = useState('');
  const [newcomerGender, setNewcomerGender] = useState<'male' | 'female' | ''>('');
  const [memberTestimony, setMemberTestimony] = useState('');
  const [memberPrayerRequest, setMemberPrayerRequest] = useState('');
  const [newcomerTestimony, setNewcomerTestimony] = useState('');
  const [newcomerPrayerRequest, setNewcomerPrayerRequest] = useState('');
  const [toast, setToast] = useState('');
  const [drawerMember, setDrawerMember] = useState<Member | null>(null);

  useEffect(() => {
    if (!wid) return;
    loadData();

    const channel = supabase
      .channel('attendance-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'attendance', filter: `workspace_id=eq.${wid}` },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'attendance', filter: `workspace_id=eq.${wid}` },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kids_checkins', filter: `workspace_id=eq.${wid}` },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'kids_checkins', filter: `workspace_id=eq.${wid}` },
        () => loadData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [wid]);

  async function loadData() {
    setLoading(true);
    const [svcRes, memRes, attRes, kidsRes] = await Promise.all([
      supabase.from('services').select('*').eq('workspace_id', wid).order('service_date', { ascending: true }),
      supabase.from('members').select('*').eq('workspace_id', wid).order('first_name'),
      supabase.from('attendance').select('*').eq('workspace_id', wid).order('timestamp', { ascending: false }),
      supabase.from('kids_checkins').select('*').eq('workspace_id', wid).order('timestamp', { ascending: false }),
    ]);
    setServices(svcRes.data ?? []);
    setMembers(memRes.data ?? []);
    setAllAttendance(attRes.data ?? []);
    setKidsCheckins(kidsRes.data ?? []);
    setSelectedService(svcRes.data?.[0]?.id ?? '');
    setLoading(false);
  }

  async function checkInMember(memberId: string) {
    if (!selectedService) return;
    if (allAttendance.some((attendance) => attendance.member_id === memberId && attendance.service_id === selectedService)) {
      showToast(t('checkin.alreadyCheckedIn'));
      return;
    }
    const previousServiceIds = new Set(
      allAttendance
        .filter((attendance) => attendance.member_id === memberId)
        .map((attendance) => attendance.service_id)
    );
    const { error } = await supabase.from('attendance').insert({
      service_id: selectedService,
      member_id: memberId,
      is_new_comer: false,
      workspace_id: wid,
      testimony: memberTestimony.trim() || null,
      prayer_request: memberPrayerRequest.trim() || null,
    });
    if (!error) {
      previousServiceIds.add(selectedService);
      if (previousServiceIds.size >= 3) {
        await supabase.from('members').update({ is_new_comer: false }).eq('id', memberId);
      }
      showToast(t('attendance.checkinSuccess'));
      setCheckinOpen(false);
      setMemberTestimony('');
      setMemberPrayerRequest('');
      loadData();
    }
  }

  async function submitNewcomer() {
    if (!newcomerName.trim() || !selectedService) return;
    if (allAttendance.some((attendance) =>
      attendance.service_id === selectedService &&
      attendance.newcomer_name?.trim().toLowerCase() === newcomerName.trim().toLowerCase()
    )) {
      showToast(t('checkin.alreadyCheckedIn'));
      return;
    }

    const [firstName, ...rest] = newcomerName.trim().split(' ');
    const lastName = rest.join(' ') || '';
    const { data: newMember } = await supabase.from('members').insert({
      first_name: firstName,
      last_name: lastName,
      phone: newcomerContact.trim() || null,
      gender: newcomerGender || null,
      is_new_comer: true,
      workspace_id: wid,
    }).select().single();

    await supabase.from('attendance').insert({
      service_id: selectedService,
      member_id: newMember?.id ?? null,
      is_new_comer: true,
      newcomer_name: newcomerName.trim(),
      workspace_id: wid,
      testimony: newcomerTestimony.trim() || null,
      prayer_request: newcomerPrayerRequest.trim() || null,
    });

    if (newMember) {
      const verse = getRandomWelcomeVerse();
      const welcomeNotes = `${t('followup.welcomeNote')}\n\n${t('followup.welcomeVerseLabel')}: "${verse.text}" — ${verse.reference}`;
      await supabase.from('follow_ups').insert({
        workspace_id: wid,
        member_id: newMember.id,
        newcomer_name: newcomerName.trim(),
        status: 'pending',
        method: 'call',
        notes: welcomeNotes,
        follow_up_date: new Date(todayLocalISO() + 'T12:00:00').toISOString(),
      });
    }

    showToast(t('attendance.newComerRegistered'));
    setNewcomerOpen(false);
    setNewcomerName('');
    setNewcomerContact('');
    setNewcomerGender('');
    setNewcomerTestimony('');
    setNewcomerPrayerRequest('');
    loadData();
  }

  function exportServiceAttendance() {
    const churchName = workspace?.name ?? 'Church';
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
    const redStyle: XLSX.CellObject['s'] = {
      font: { bold: true, sz: 11, color: { rgb: 'DC2626' }, name: 'Calibri' },
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

    const workbook = XLSX.utils.book_new();
    const periodLabel = period === 'today'
      ? t('attendance.tabToday')
      : period === 'week'
        ? t('attendance.tabWeek')
        : period === 'month'
          ? t('attendance.tabMonth')
          : period === 'year'
            ? t('attendance.tabYear')
            : period === 'custom'
              ? customDate
              : t('attendance.tabAll');
    const servicesWithAttendance = periodAttendance.length > 0 ? [{
      id: 'selected-period',
      name: periodLabel,
      description: null,
      service_date: todayLocalISO(),
      service_time: '',
      service_end_time: null,
      speaker: null,
      created_at: '',
      workspace_id: wid,
    }] : [];

    const colCount = 8;

    servicesWithAttendance.forEach((service) => {
      const serviceAtt = periodAttendance;
      const serviceDate = periodLabel;

      const ws = XLSX.utils.aoa_to_sheet([
        [churchName],
        [`${periodLabel} Attendance`],
        [`Generated: ${reportDate}`],
        [],
        ['Service', service.name, 'Date', serviceDate, 'Speaker', service.speaker ?? '—', ''],
        ['Time', `${service.service_time}${service.service_end_time ? ` – ${service.service_end_time}` : ''}`, '', '', '', '', ''],
        [],
        ['Name', 'Gender', 'Email', 'Phone', 'Check-in Time', 'New Comer', 'Testimony', 'Prayer Request'],
        ...serviceAtt.map((a) => {
          const member = members.find((m) => m.id === a.member_id);
          const gender = member?.gender === 'male' ? t('attendance.male') : member?.gender === 'female' ? t('attendance.female') : a.is_new_comer ? '' : '';
          return [
            a.is_new_comer ? (a.newcomer_name ?? 'New Comer') : member ? `${member.first_name} ${member.last_name}` : 'Member',
            gender,
            member?.email ?? '',
            member?.phone ?? '',
            new Date(a.timestamp).toLocaleString(),
            a.is_new_comer ? 'Yes' : 'No',
            a.testimony ?? '',
            a.prayer_request ?? '',
          ];
        }),
      ]);

      addTitleBlock(ws, 'Attendance Report', colCount - 1);
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push(
        { s: { r: 4, c: 1 }, e: { r: 4, c: 3 } },
        { s: { r: 4, c: 5 }, e: { r: 4, c: 6 } },
        { s: { r: 5, c: 1 }, e: { r: 5, c: 6 } },
      );
      ws['!cols'] = [
        { wch: 24 }, { wch: 10 }, { wch: 28 }, { wch: 16 }, { wch: 22 },
        { wch: 12 }, { wch: 30 }, { wch: 30 },
      ];
      styleHeaders(ws, 7, colCount);
      styleRows(ws, 8, serviceAtt.length, colCount);
      serviceAtt.forEach((a, idx) => {
        const row = 8 + idx;
        const ref = XLSX.utils.encode_cell({ r: row, c: 5 });
        if (ws[ref]) {
          const isAlt = idx % 2 === 1;
          const base = a.is_new_comer ? { ...greenStyle } : { ...grayStyle };
          if (isAlt) base.fill = { fgColor: { rgb: 'F8FAFC' } };
          ws[ref].s = base;
        }
      });

      // Attendance summary at bottom
      const presentMemberIds = new Set(serviceAtt.filter((a) => a.member_id).map((a) => a.member_id));
      const absentMembersList = members.filter((m) => !presentMemberIds.has(m.id));
      const summaryLabelRow = 8 + serviceAtt.length + 1;
      const summaryRows: (string | number)[][] = [
        ['Summary', ''],
        ['Total Check-ins', serviceAtt.length],
        ['New Comers', serviceAtt.filter((a) => a.is_new_comer).length],
        ['Members Present', serviceAtt.filter((a) => !a.is_new_comer).length],
        ['Total Members', members.length],
        ['Absent', absentMembersList.length],
      ];
      XLSX.utils.sheet_add_aoa(ws, summaryRows, { origin: summaryLabelRow });
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: summaryLabelRow, c: 0 }, e: { r: summaryLabelRow, c: 1 } });
      const summaryLabelRef = XLSX.utils.encode_cell({ r: summaryLabelRow, c: 0 });
      if (ws[summaryLabelRef]) ws[summaryLabelRef].s = sectionStyle;
      for (let i = 1; i < summaryRows.length; i++) {
        const r = summaryLabelRow + i;
        const aRef = XLSX.utils.encode_cell({ r, c: 0 });
        const bRef = XLSX.utils.encode_cell({ r, c: 1 });
        if (ws[aRef]) ws[aRef].s = { ...dataStyle, font: { bold: true, sz: 11, name: 'Calibri' } };
        if (ws[bRef]) {
          const isAbsent = i === summaryRows.length - 1;
          ws[bRef].s = isAbsent
            ? { ...redStyle, font: { bold: true, sz: 14, color: { rgb: 'DC2626' }, name: 'Calibri' } }
            : { ...dataStyle, font: { bold: true, sz: 14, color: { rgb: 'F59E0B' }, name: 'Calibri' }, alignment: { horizontal: 'center' } };
        }
      }

      // Absent member names
      const absentHeaderRow = summaryLabelRow + summaryRows.length + 1;
      const absentRows: (string | number)[][] = [
        ['Members Absent', ''],
        ...absentMembersList.map((m) => [`${m.first_name} ${m.last_name}`, m.phone ?? '']),
      ];
      XLSX.utils.sheet_add_aoa(ws, absentRows, { origin: absentHeaderRow });
      if (!ws['!merges']) ws['!merges'] = [];
      ws['!merges'].push({ s: { r: absentHeaderRow, c: 0 }, e: { r: absentHeaderRow, c: 1 } });
      const absentHeaderRef = XLSX.utils.encode_cell({ r: absentHeaderRow, c: 0 });
      if (ws[absentHeaderRef]) ws[absentHeaderRef].s = sectionStyle;
      for (let i = 1; i < absentRows.length; i++) {
        const r = absentHeaderRow + i;
        const aRef = XLSX.utils.encode_cell({ r, c: 0 });
        const bRef = XLSX.utils.encode_cell({ r, c: 1 });
        if (ws[aRef]) ws[aRef].s = { ...dataStyle, font: { sz: 11, color: { rgb: 'DC2626' }, name: 'Calibri' } };
        if (ws[bRef]) ws[bRef].s = { ...dataStyle, font: { sz: 11, color: { rgb: '94A3B8' }, name: 'Calibri' } };
      }

      addWatermark(ws, absentHeaderRow + absentRows.length, colCount, churchName);

      const sheetName = `${periodLabel} ${todayLocalISO()}`.replace(/[\\/?*:[\]]/g, '').slice(0, 31) || 'Attendance';
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    });

    if (servicesWithAttendance.length > 0) {
      XLSX.writeFile(workbook, `${churchName.toLowerCase().replace(/\s+/g, '-')}-attendance-${period === 'custom' ? customDate : todayLocalISO()}.xlsx`);
      showToast(t('dashboard.exportExcel'));
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }

  const filteredMembers = members.filter((m) => {
    const q = memberSearch.toLowerCase();
    return `${m.first_name} ${m.last_name}`.toLowerCase().includes(q);
  });

  // Compute date ranges for each period
  const { periodStart, periodEnd } = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    if (period === 'custom') {
      const [y, m, d] = customDate.split('-').map(Number);
      return { periodStart: new Date(y, m - 1, d, 0, 0, 0, 0), periodEnd: new Date(y, m - 1, d, 23, 59, 59, 999) };
    }
    if (period === 'all' || period === 'today') {
      if (period === 'all') {
        return { periodStart: new Date(0), periodEnd: end };
      }
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return { periodStart: start, periodEnd: end };
    }
    if (period === 'week') {
      const start = new Date(now);
      const day = start.getDay();
      start.setDate(start.getDate() - day);
      start.setHours(0, 0, 0, 0);
      return { periodStart: start, periodEnd: end };
    }
    if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { periodStart: start, periodEnd: end };
    }
    // year
    const start = new Date(now.getFullYear(), 0, 1);
    return { periodStart: start, periodEnd: end };
  }, [period, customDate]);

  // Filter attendance for the selected period and service
  const periodAttendance = useMemo(() => {
    return allAttendance.filter((a) => {
      const ts = new Date(a.timestamp);
      const inPeriod = ts >= periodStart && ts <= periodEnd;
      const inService = serviceFilter === 'all' || a.service_id === serviceFilter;
      return inPeriod && inService;
    });
  }, [allAttendance, periodStart, periodEnd, serviceFilter]);

  const periodCount = periodAttendance.length;
  const periodNewcomers = periodAttendance.filter((a) => a.is_new_comer).length;
  const presentMemberIds = new Set(periodAttendance.filter((a) => a.member_id).map((a) => a.member_id));
  const absentMembers = members.filter((m) => !presentMemberIds.has(m.id));

  const periodKidsCheckins = useMemo(() => kidsCheckins.filter((kid) => {
    const timestamp = new Date(kid.timestamp);
    return timestamp >= periodStart && timestamp <= periodEnd && (serviceFilter === 'all' || kid.service_id === serviceFilter);
  }), [kidsCheckins, periodStart, periodEnd, serviceFilter]);

  // Build chart data based on period
  const chartData = useMemo(() => {
    if (periodAttendance.length === 0) return [];

    if (period === 'all') {
      // Group by month across all data
      const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const buckets: Record<number, number> = {};
      for (let m = 0; m < 12; m++) buckets[m] = 0;
      periodAttendance.forEach((a) => {
        const m = new Date(a.timestamp).getMonth();
        buckets[m]++;
      });
      // Only show months that have data
      const activeMonths = monthLabels.map((label, m) => ({ label, value: buckets[m] })).filter((d) => d.value > 0);
      return activeMonths.length > 0 ? activeMonths : [];
    }

    if (period === 'today' || period === 'custom') {
      // Group by hour
      const buckets: Record<number, number> = {};
      for (let h = 0; h < 24; h++) buckets[h] = 0;
      periodAttendance.forEach((a) => {
        const h = new Date(a.timestamp).getHours();
        buckets[h]++;
      });
      // Show only hours with activity, from first to last
      const activeHours = Object.entries(buckets)
        .filter(([, v]) => v > 0)
        .map(([h]) => parseInt(h));
      if (activeHours.length === 0) return [];
      const minH = Math.min(...activeHours);
      const maxH = Math.max(...activeHours);
      const result: { label: string; value: number }[] = [];
      for (let h = minH; h <= maxH; h++) {
        result.push({ label: `${h}:00`, value: buckets[h] });
      }
      return result;
    }

    if (period === 'week') {
      // Group by day of week
      const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const buckets: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      periodAttendance.forEach((a) => {
        const d = new Date(a.timestamp).getDay();
        buckets[d]++;
      });
      // Start from the week's start day
      const startDay = periodStart.getDay();
      const ordered: { label: string; value: number }[] = [];
      for (let i = 0; i < 7; i++) {
        const dayIdx = (startDay + i) % 7;
        ordered.push({ label: dayLabels[dayIdx], value: buckets[dayIdx] });
      }
      return ordered;
    }

    if (period === 'month') {
      // Group by week of month
      const weeksInMonth = Math.ceil(new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0).getDate() / 7);
      const buckets: Record<number, number> = {};
      for (let w = 0; w < weeksInMonth; w++) buckets[w] = 0;
      periodAttendance.forEach((a) => {
        const day = new Date(a.timestamp).getDate();
        const weekIdx = Math.min(Math.floor((day - 1) / 7), weeksInMonth - 1);
        buckets[weekIdx]++;
      });
      return Array.from({ length: weeksInMonth }, (_, i) => ({
        label: `W${i + 1}`,
        value: buckets[i],
      }));
    }

    // year — group by month
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buckets: Record<number, number> = {};
    for (let m = 0; m < 12; m++) buckets[m] = 0;
    periodAttendance.forEach((a) => {
      const m = new Date(a.timestamp).getMonth();
      buckets[m]++;
    });
    return monthLabels.map((label, m) => ({ label, value: buckets[m] }));
  }, [periodAttendance, period, periodStart]);

  const tabs: { id: Period; label: string }[] = [
    { id: 'all', label: t('attendance.tabAll') },
    { id: 'today', label: t('attendance.tabToday') },
    { id: 'week', label: t('attendance.tabWeek') },
    { id: 'month', label: t('attendance.tabMonth') },
    { id: 'year', label: t('attendance.tabYear') },
    { id: 'custom', label: t('attendance.tabCustom') },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('attendance.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('attendance.subtitle')}</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <ClipboardCheck size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">{periodCount}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('attendance.checkinsCount', { count: periodCount })}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <TrendingUp size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">{members.length}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('attendance.membersCount', { count: members.length })}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <UserPlus size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">{periodNewcomers}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('attendance.newComersCount', { count: periodNewcomers })}</p>
        </div>
      </div>

      {/* Actions */}
      {canManage && (
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setCheckinOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
          >
            <ClipboardCheck size={18} /> {t('attendance.submitAttendance')}
          </button>
          <button
            onClick={() => setNewcomerOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm border border-slate-200 dark:border-slate-700 hover:border-amber-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
          >
            <UserPlus size={18} /> {t('attendance.submitNewComer')}
          </button>
        </div>
      )}

      {/* Period Tabs + Trend Chart */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="font-bold text-slate-900 dark:text-white">{t('attendance.trendTitle')}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-700/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setPeriod(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    period === tab.id
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {period === 'custom' && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              />
            )}
          </div>
        </div>

        {chartData.length === 0 || periodCount === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t('attendance.noCheckinsPeriod')}</p>
        ) : (
          <BarChart data={chartData} color="#f59e0b" height={240} />
        )}
      </div>

      {/* Service Filter + Attendance list for selected period */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-amber-500" />
            <h2 className="font-bold text-slate-900 dark:text-white">
              {period === 'custom'
                ? `${t('attendance.tabCustom')} — ${parseLocalDate(customDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`
                : tabs.find((tab) => tab.id === period)?.label}
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            {canManage && (
              <button
                onClick={exportServiceAttendance}
                disabled={periodAttendance.length === 0}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                <Download size={14} /> {t('dashboard.exportExcel')}
              </button>
            )}
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="form-input max-w-xs"
            >
            <option value="all">{t('attendance.tabAll')} — {services.length} {t('sidebar.services')}</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {parseLocalDate(s.service_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</option>
              ))}
            </select>
          </div>
        </div>
        {periodAttendance.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t('attendance.noCheckinsPeriod')}</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {periodAttendance.map((a) => {
              const svc = services.find((s) => s.id === a.service_id);
              const memberName = a.is_new_comer
                ? a.newcomer_name || t('attendance.newComerBadge')
                : (() => {
                    const m = members.find((m) => m.id === a.member_id);
                    return m ? `${m.first_name} ${m.last_name}` : t('common.member');
                  })();
              const memberRecord = a.member_id ? members.find((m) => m.id === a.member_id) ?? null : null;
              return (
                <div key={a.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-xs font-semibold">
                    {a.is_new_comer ? 'NC' : <Check size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {memberRecord ? (
                        <button onClick={() => setDrawerMember(memberRecord)} className="hover:text-amber-600 dark:hover:text-amber-400 hover:underline text-left">
                          {memberName}
                        </button>
                      ) : (
                        memberName
                      )}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {svc?.name ?? t('attendance.unknownService')} • {new Date(a.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} • {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {(a.testimony || a.prayer_request) && (
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {a.testimony && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                            <BookOpen size={10} /> {t('attendance.testimony')}
                          </span>
                        )}
                        {a.prayer_request && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                            <Heart size={10} /> {t('attendance.prayerRequest')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {a.is_new_comer && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400 flex-shrink-0">
                      {t('attendance.newComerBadge')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Children checked in by parents */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Baby size={18} className="text-blue-500" />
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">
            {t('attendance.childrenCheckedIn')} ({periodKidsCheckins.length})
          </h2>
        </div>
        {periodKidsCheckins.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">{t('attendance.noChildrenCheckedIn')}</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {periodKidsCheckins.map((kid) => {
              const parent = members.find((member) => member.id === kid.parent_member_id);
              const service = services.find((item) => item.id === kid.service_id);
              return (
                <div key={kid.id} className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                  <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center text-white"><Baby size={16} /></div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{kid.first_name} {kid.last_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {t('attendance.withParent')}: {parent ? `${parent.first_name} ${parent.last_name}` : t('attendance.unknownParent')} · {service?.name ?? t('attendance.unknownService')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Absent Members */}
      {absentMembers.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus size={18} className="text-red-500" />
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">
              {t('attendance.absentMembers')} ({absentMembers.length})
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {absentMembers.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium"
              >
                {m.first_name} {m.last_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Check-in Modal */}
      <Modal open={checkinOpen} onClose={() => setCheckinOpen(false)} title={t('attendance.checkInMember')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('attendance.selectService')}</label>
            <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="form-input">
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {parseLocalDate(s.service_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={memberSearch}
              onChange={(e) => setMemberSearch(e.target.value)}
              placeholder={t('attendance.searchMember')}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-2">
            {filteredMembers.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">{t('attendance.noMembersFound')}</p>
            ) : (
              filteredMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => checkInMember(m.id)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors text-left"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-semibold">
                    {m.first_name[0]}{m.last_name[0]}
                  </div>
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{m.first_name} {m.last_name}</span>
                </button>
              ))
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('attendance.testimonyOptional')}</label>
            <textarea
              value={memberTestimony}
              onChange={(e) => setMemberTestimony(e.target.value)}
              rows={2}
              className="form-input resize-none"
              placeholder={t('attendance.testimonyPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('attendance.prayerRequestOptional')}</label>
            <textarea
              value={memberPrayerRequest}
              onChange={(e) => setMemberPrayerRequest(e.target.value)}
              rows={2}
              className="form-input resize-none"
              placeholder={t('attendance.prayerPlaceholder')}
            />
          </div>
        </div>
      </Modal>

      {/* New Comer Modal */}
      <Modal open={newcomerOpen} onClose={() => setNewcomerOpen(false)} title={t('attendance.registerNewComer')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('attendance.selectService')}</label>
            <select value={selectedService} onChange={(e) => setSelectedService(e.target.value)} className="form-input">
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {parseLocalDate(s.service_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('attendance.fullName')}</label>
            <input value={newcomerName} onChange={(e) => setNewcomerName(e.target.value)}
              className="form-input" placeholder="Jane Smith" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('attendance.gender')}</label>
            <select value={newcomerGender} onChange={(e) => setNewcomerGender(e.target.value as 'male' | 'female' | '')} className="form-input">
              <option value="">{t('attendance.selectGender')}</option>
              <option value="male">{t('attendance.male')}</option>
              <option value="female">{t('attendance.female')}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('attendance.phoneEmail')}</label>
            <input value={newcomerContact} onChange={(e) => setNewcomerContact(e.target.value)}
              className="form-input" placeholder="+1 234 567 890" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('attendance.testimonyOptional')}</label>
            <textarea
              value={newcomerTestimony}
              onChange={(e) => setNewcomerTestimony(e.target.value)}
              rows={2}
              className="form-input resize-none"
              placeholder={t('attendance.testimonyPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('attendance.prayerRequestOptional')}</label>
            <textarea
              value={newcomerPrayerRequest}
              onChange={(e) => setNewcomerPrayerRequest(e.target.value)}
              rows={2}
              className="form-input resize-none"
              placeholder={t('attendance.prayerPlaceholder')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setNewcomerOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              {t('common.cancel')}
            </button>
            <button onClick={submitNewcomer} disabled={!newcomerName.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors">
              {t('common.register')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-slideUp">
          {toast}
        </div>
      )}

      <MemberDetailDrawer member={drawerMember} onClose={() => setDrawerMember(null)} />
    </div>
  );
}
