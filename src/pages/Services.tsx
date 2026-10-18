import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Service, Attendance } from '@/types';
import { Modal, ConfirmDialog } from '@/components/Modal';
import {
  Plus,
  CalendarDays,
  Clock,
  Mic2,
  Trash2,
  ChevronRight,
  ClipboardCheck,
  Users,
  ChevronLeft,
  Grid3x3,
  List,
  Repeat,
  MessageCircle,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { getServiceStatus } from '@/lib/serviceTime';
import { parseLocalDate, todayLocalISO, todayLocalMidnight } from '@/lib/dateUtils';

export function Services() {
  const { workspace, role, displayName } = useWorkspace();
  const { t } = useLanguage();
  const wid = workspace?.id ?? '';
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [detailService, setDetailService] = useState<Service | null>(null);
  const [detailAttendance, setDetailAttendance] = useState<Attendance[]>([]);
  const [attendanceCount, setAttendanceCount] = useState<Record<string, number>>({});
  const [form, setForm] = useState({
    name: '',
    description: '',
    service_date: todayLocalISO(),
    service_time: '10:00 AM',
    service_end_time: '12:00 PM',
    speaker: '',
  });
  const [repeatEnabled, setRepeatEnabled] = useState(false);
  const [repeatWeeks, setRepeatWeeks] = useState(4);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [postingSummary, setPostingSummary] = useState(false);
  const [summaryToast, setSummaryToast] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calMonth, setCalMonth] = useState(new Date());

  useEffect(() => { if (wid) loadServices(); }, [wid]);

  async function loadServices() {
    setLoading(true);
    const { data } = await supabase.from('services').select('*').eq('workspace_id', wid).order('service_date', { ascending: true });
    setServices(data ?? []);

    // Load attendance counts
    const { data: attData } = await supabase.from('attendance').select('service_id').eq('workspace_id', wid);
    const counts: Record<string, number> = {};
    (attData ?? []).forEach((a) => {
      counts[a.service_id] = (counts[a.service_id] ?? 0) + 1;
    });
    setAttendanceCount(counts);
    setLoading(false);
  }

  async function openDetail(s: Service) {
    setDetailService(s);
    const { data } = await supabase.from('attendance').select('*').eq('service_id', s.id).eq('workspace_id', wid).order('timestamp', { ascending: false });
    setDetailAttendance(data ?? []);
  }

  async function save() {
    if (!form.name.trim() || !form.service_date.trim() || !form.service_time.trim()) {
      setError(t('services.errRequired'));
      return;
    }
    setSaving(true);
    setError('');

    const baseParts = form.service_date.split('-').map(Number);
    const weeks = repeatEnabled ? Math.min(Math.max(repeatWeeks, 1), 12) : 1;
    const rows = Array.from({ length: weeks }, (_, i) => {
      const d = new Date(baseParts[0], baseParts[1] - 1, baseParts[2] + i * 7);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return {
        name: form.name.trim(),
        description: form.description.trim() || null,
        service_date: `${yyyy}-${mm}-${dd}`,
        service_time: form.service_time.trim(),
        service_end_time: form.service_end_time.trim() || null,
        speaker: form.speaker.trim() || null,
        workspace_id: wid,
      };
    });
    await supabase.from('services').insert(rows);

    setSaving(false);
    setModalOpen(false);
    setRepeatEnabled(false);
    setRepeatWeeks(4);
    setForm({ name: '', description: '', service_date: todayLocalISO(), service_time: '10:00 AM', service_end_time: '12:00 PM', speaker: '' });
    loadServices();
  }

  async function postAttendanceSummary() {
    if (!detailService) return;
    setPostingSummary(true);
    try {
      const { data: allMembers } = await supabase
        .from('members')
        .select('*')
        .eq('workspace_id', wid)
        .order('first_name');

      const checkedInIds = new Set(detailAttendance.map((a) => a.member_id).filter(Boolean));
      const presentMembers = (allMembers ?? []).filter((m) => checkedInIds.has(m.id));
      const absentMembers = (allMembers ?? []).filter((m) => !m.is_new_comer && !checkedInIds.has(m.id));
      const newComers = detailAttendance.filter((a) => a.is_new_comer);
      const serviceDate = parseLocalDate(detailService.service_date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

      const lines: string[] = [
        `📊 Attendance Summary — ${detailService.name} (${serviceDate})`,
        ``,
        `✅ Checked in: ${detailAttendance.length}`,
        `👥 Members present: ${presentMembers.length}`,
        `🎉 New comers: ${newComers.length}`,
        `❌ Absent: ${absentMembers.length} of ${(allMembers ?? []).filter((m) => !m.is_new_comer).length} members`,
      ];

      if (newComers.length > 0) {
        lines.push(``, `New comers:`);
        newComers.forEach((n) => lines.push(`  • ${n.newcomer_name ?? 'Unknown'}`));
      }

      if (absentMembers.length > 0 && absentMembers.length <= 30) {
        lines.push(``, `Members who did not attend:`);
        absentMembers.forEach((m) => lines.push(`  • ${m.first_name} ${m.last_name}`));
      }

      lines.push(``, `_${displayName ?? 'Pastor'}_`);

      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('chat_messages').insert({
        workspace_id: wid,
        sender_id: user?.id ?? null,
        sender_name: displayName ?? 'Pastor',
        sender_role: role ?? 'pastor',
        message_text: lines.join('\n'),
      });

      setSummaryToast(t('services.summaryPosted'));
      setTimeout(() => setSummaryToast(''), 4000);
    } catch {
      setSummaryToast(t('services.summaryError'));
      setTimeout(() => setSummaryToast(''), 4000);
    }
    setPostingSummary(false);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await supabase.from('services').delete().eq('id', deleteId);
    setDeleteId(null);
    loadServices();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const calYear = calMonth.getFullYear();
  const calMonthIdx = calMonth.getMonth();
  const firstDay = new Date(calYear, calMonthIdx, 1).getDay();
  const daysInMonth = new Date(calYear, calMonthIdx + 1, 0).getDate();

  const servicesThisMonth = services.filter((s) => {
    const d = parseLocalDate(s.service_date);
    return d.getFullYear() === calYear && d.getMonth() === calMonthIdx;
  });

  const servicesByDay: Record<number, Service[]> = {};
  servicesThisMonth.forEach((s) => {
    const day = parseLocalDate(s.service_date).getDate();
    if (!servicesByDay[day]) servicesByDay[day] = [];
    servicesByDay[day].push(s);
  });

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === calYear && today.getMonth() === calMonthIdx && today.getDate() === day;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('services.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('services.total', { count: services.length })}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-700/50">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'list' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <List size={14} /> {t('calendar.viewList')}
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'calendar' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Grid3x3 size={14} /> {t('calendar.viewCalendar')}
            </button>
          </div>
          <button
            onClick={() => { setModalOpen(true); setError(''); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Plus size={18} /> {t('services.createService')}
          </button>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-16">
          <CalendarDays size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 mt-3">{t('services.noServices')}</p>
        </div>
      ) : viewMode === 'calendar' ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">{monthNames[calMonthIdx]} {calYear}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCalMonth(new Date(calYear, calMonthIdx - 1, 1))}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setCalMonth(new Date())}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {t('calendar.today')}
              </button>
              <button
                onClick={() => setCalMonth(new Date(calYear, calMonthIdx + 1, 1))}
                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-slate-400 uppercase py-2">
                {d}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const dayServices = servicesByDay[day] ?? [];
              const isPast = new Date(calYear, calMonthIdx, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg border p-1 flex flex-col items-center transition-all ${
                    isToday(day)
                      ? 'border-amber-400 bg-amber-50 dark:bg-amber-500/10'
                      : isPast
                        ? 'border-slate-100 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-700/20'
                        : 'border-slate-100 dark:border-slate-700/50'
                  }`}
                >
                  <span className={`text-xs font-medium ${isToday(day) ? 'text-amber-600 dark:text-amber-400' : isPast ? 'text-slate-300 dark:text-slate-600' : 'text-slate-600 dark:text-slate-300'}`}>
                    {day}
                  </span>
                  {dayServices.length > 0 && (
                    <div className="flex-1 flex flex-col gap-0.5 mt-0.5 w-full overflow-hidden">
                      {dayServices.slice(0, 2).map((s) => (
                        <button
                          key={s.id}
                          onClick={() => openDetail(s)}
                          className="text-[9px] leading-tight px-1 py-0.5 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 truncate hover:bg-amber-200 dark:hover:bg-amber-500/30 transition-colors"
                        >
                          {s.name}
                        </button>
                      ))}
                      {dayServices.length > 2 && (
                        <span className="text-[9px] text-slate-400 px-1">+{dayServices.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {servicesThisMonth.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6 mt-2">{t('calendar.noServicesMonth')}</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => {
            const isPast = parseLocalDate(s.service_date) < todayLocalMidnight();
            const status = getServiceStatus(s);
            return (
              <div
                key={s.id}
                className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-[9px] font-medium text-white/90 uppercase">
                        {parseLocalDate(s.service_date).toLocaleDateString(undefined, { month: 'short' })}
                      </span>
                      <span className="text-base font-bold text-white">
                        {parseLocalDate(s.service_date).getDate()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{s.name}</h3>
                      {status === 'active' && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {t('services.activeNow')}
                        </span>
                      )}
                      {isPast && status !== 'active' && (
                        <span className="text-[10px] font-medium text-slate-400">{t('services.completed')}</span>
                      )}
                      {status === 'upcoming' && (
                        <span className="text-[10px] font-medium text-blue-500">{t('services.upcoming')}</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteId(s.id)}
                    className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {s.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{s.description}</p>
                )}

                <div className="mt-3 space-y-1.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Clock size={13} /> {s.service_time}{s.service_end_time ? ` – ${s.service_end_time}` : ''}
                  </p>
                  {s.speaker && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Mic2 size={13} /> {s.speaker}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Users size={13} /> {t('services.attended', { count: attendanceCount[s.id] ?? 0 })}
                  </p>
                </div>

                <button
                  onClick={() => openDetail(s)}
                  className="w-full flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm font-medium text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {t('services.viewDetails')}
                  <ChevronRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Service Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('services.createService')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('services.serviceName')}</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="form-input" placeholder="Sunday Worship" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('services.description')}</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="form-input" rows={3} placeholder="Weekly celebration service..." />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('services.date')}</label>
              <input type="date" value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })}
                className="form-input" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('services.time')}</label>
              <input value={form.service_time} onChange={(e) => setForm({ ...form, service_time: e.target.value })}
                className="form-input" placeholder="10:00 AM" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('services.endTime')}</label>
              <input value={form.service_end_time} onChange={(e) => setForm({ ...form, service_end_time: e.target.value })}
                className="form-input" placeholder="12:00 PM" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('services.speaker')}</label>
            <input value={form.speaker} onChange={(e) => setForm({ ...form, speaker: e.target.value })}
              className="form-input" placeholder="Pastor John Daniels" />
          </div>

          {/* Repeat weekly option */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={repeatEnabled}
                onChange={(e) => setRepeatEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
              />
              <Repeat size={15} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('services.repeatWeekly')}</span>
            </label>
            {repeatEnabled && (
              <div className="pl-6 space-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">{t('services.repeatHint')}</p>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={repeatWeeks}
                    onChange={(e) => setRepeatWeeks(parseInt(e.target.value, 10))}
                    className="flex-1 accent-amber-500"
                  />
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400 min-w-[3rem] text-right">
                    {repeatWeeks} {t('services.weeks')}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {t('services.repeatSummary', { count: repeatWeeks, day: new Date(form.service_date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long' }) })}
                </p>
              </div>
            )}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              {t('common.cancel')}
            </button>
            <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors">
              {saving ? t('common.creating') : repeatEnabled ? t('services.createCount', { count: repeatWeeks }) : t('services.createServiceBtn')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Service Detail Modal */}
      <Modal open={!!detailService} onClose={() => setDetailService(null)} title={detailService?.name ?? ''} size="lg">
        {detailService && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <p className="text-[10px] uppercase font-medium text-slate-400">{t('services.date').replace(' *', '')}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                  {parseLocalDate(detailService.service_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <p className="text-[10px] uppercase font-medium text-slate-400">{t('services.time').replace(' *', '')}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{detailService.service_time}</p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3">
                <p className="text-[10px] uppercase font-medium text-slate-400">{t('services.speaker')}</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">{detailService.speaker || t('common.tbd')}</p>
              </div>
            </div>

            {detailService.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300">{detailService.description}</p>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <ClipboardCheck size={16} className="text-amber-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{t('services.attendanceCount', { count: detailAttendance.length })}</h3>
              </div>
              {detailAttendance.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">{t('services.noAttendance')}</p>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {detailAttendance.map((a) => (
                    <div key={a.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {a.is_new_comer ? a.newcomer_name || t('attendance.newComerBadge') : t('services.memberCheckin')}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(a.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {a.is_new_comer && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                          {t('common.new')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {detailAttendance.length > 0 && (
              <button
                onClick={postAttendanceSummary}
                disabled={postingSummary}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white font-medium text-sm hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-lg shadow-emerald-500/20"
              >
                <MessageCircle size={16} />
                {postingSummary ? t('services.postingSummary') : t('services.postSummary')}
              </button>
            )}
          </div>
        )}
      </Modal>

      {summaryToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-slideUp">
          {summaryToast}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t('services.deleteService')}
        message={t('services.deleteConfirm')}
      />
    </div>
  );
}
