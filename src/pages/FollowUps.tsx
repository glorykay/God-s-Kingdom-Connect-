import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Member, FollowUp, Attendance, PageId } from '@/types';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { useLanguage } from '@/context/LanguageContext';
import { MemberDetailDrawer } from '@/components/MemberDetailDrawer';
import { todayLocalISO, parseLocalDate } from '@/lib/dateUtils';
import {
  UserPlus,
  Phone,
  MessageSquare,
  Mail,
  Home,
  Users,
  Clock,
  CheckCircle2,
  PhoneCall,
  Trash2,
  Pencil,
  Calendar,
  AlertCircle,
  Plus,
} from 'lucide-react';

type FollowUpStatus = 'pending' | 'contacted' | 'visited' | 'completed';

interface FollowUpsProps {
  onNavigate: (page: PageId) => void;
}

const methodIcons: Record<string, typeof Phone> = {
  call: PhoneCall,
  text: MessageSquare,
  email: Mail,
  visit: Home,
  in_person: Users,
};

export function FollowUps({ onNavigate }: FollowUpsProps) {
  const { workspace } = useWorkspace();
  const { t } = useLanguage();
  const wid = workspace?.id ?? '';
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [newcomers, setNewcomers] = useState<Member[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | FollowUpStatus>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    member_id: '',
    status: 'pending' as FollowUpStatus,
    method: 'call' as string,
    notes: '',
    follow_up_date: todayLocalISO(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [drawerMember, setDrawerMember] = useState<Member | null>(null);

  useEffect(() => { if (wid) loadData(); }, [wid]);

  async function loadData() {
    setLoading(true);
    const [fuRes, memRes, attRes] = await Promise.all([
      supabase.from('follow_ups').select('*').eq('workspace_id', wid).order('follow_up_date', { ascending: true }),
      supabase.from('members').select('*').eq('workspace_id', wid).order('first_name'),
      supabase.from('attendance').select('*').eq('workspace_id', wid).order('timestamp', { ascending: false }),
    ]);
    setFollowUps(fuRes.data ?? []);
    setAllMembers(memRes.data ?? []);
    setNewcomers((memRes.data ?? []).filter((m) => m.is_new_comer));
    setAttendance(attRes.data ?? []);
    setLoading(false);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({
      member_id: '',
      status: 'pending',
      method: 'call',
      notes: '',
      follow_up_date: todayLocalISO(),
    });
    setError('');
    setModalOpen(true);
  }

  function openEdit(fu: FollowUp) {
    setEditing(fu);
    setForm({
      member_id: fu.member_id ?? '',
      status: fu.status,
      method: fu.method ?? 'call',
      notes: fu.notes,
      follow_up_date: fu.follow_up_date.split('T')[0],
    });
    setError('');
    setModalOpen(true);
  }

  async function save() {
    if (!form.member_id) {
      setError(t('followup.errMemberRequired'));
      return;
    }
    setSaving(true);
    setError('');
    const selectedMember = allMembers.find((m) => m.id === form.member_id);
    const payload = {
      workspace_id: wid,
      member_id: form.member_id,
      newcomer_name: selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name}` : null,
      status: form.status,
      method: form.method,
      notes: form.notes.trim(),
      follow_up_date: new Date(form.follow_up_date + 'T12:00:00').toISOString(),
    };
    if (editing) {
      await supabase.from('follow_ups').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('follow_ups').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function updateStatus(id: string, status: FollowUpStatus) {
    await supabase.from('follow_ups').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    loadData();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await supabase.from('follow_ups').delete().eq('id', deleteId);
    setDeleteId(null);
    loadData();
  }

  function memberName(fu: FollowUp): string {
    if (fu.member_id) {
      const m = allMembers.find((m) => m.id === fu.member_id);
      if (m) return `${m.first_name} ${m.last_name}`;
    }
    return fu.newcomer_name ?? t('followup.newcomer');
  }

  function memberLastAttendance(memberId: string | null): string | null {
    if (!memberId) return null;
    const att = attendance.filter((a) => a.member_id === memberId);
    if (att.length === 0) return null;
    return att[0].timestamp;
  }

  function daysFromNow(dateStr: string): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const date = parseLocalDate(dateStr.split('T')[0]);
    date.setHours(0, 0, 0, 0);
    return Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  function dueLabel(dateStr: string): { text: string; overdue: boolean } {
    const days = daysFromNow(dateStr);
    if (days < 0) return { text: t('followup.daysAgo', { count: Math.abs(days) }), overdue: true };
    if (days === 0) return { text: t('followup.dueToday'), overdue: false };
    return { text: t('followup.inDays', { count: days }), overdue: false };
  }

  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
  const THREE_WEEKS_MS = 21 * 24 * 60 * 60 * 1000;

  const recentNewcomerIds = new Set(
    newcomers
      .filter((m) => Date.now() - new Date(m.joined_date).getTime() < TWO_WEEKS_MS)
      .map((m) => m.id)
  );
  const absentMembers = allMembers
    .filter((m) => !m.is_new_comer)
    .map((m) => {
      const memberAtt = attendance.filter((a) => a.member_id === m.id);
 const lastTs = memberAtt.length > 0 ? memberAtt[0].timestamp : null;
      const lastDate = lastTs ? new Date(lastTs) : new Date(m.joined_date);
      const weeksAway = Math.floor((Date.now() - lastDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return { member: m, lastDate, weeksAway };
    })
    .filter((entry) => Date.now() - entry.lastDate.getTime() >= THREE_WEEKS_MS)
    .sort((a, b) => b.weeksAway - a.weeksAway);

  const filtered = (filter === 'all' ? followUps : followUps.filter((f) => f.status === filter))
    .filter((f) => !f.member_id || allMembers.find((m) => m.id === f.member_id)?.is_new_comer === false || recentNewcomerIds.has(f.member_id));
  const pendingCount = followUps.filter((f) => f.status === 'pending').length;
  const contactedCount = followUps.filter((f) => f.status === 'contacted').length;
  const completedCount = followUps.filter((f) => f.status === 'completed').length;

  const filterTabs: { id: 'all' | FollowUpStatus; label: string }[] = [
    { id: 'all', label: t('followup.all') },
    { id: 'pending', label: t('followup.pending') },
    { id: 'contacted', label: t('followup.contacted') },
    { id: 'visited', label: t('followup.visited') },
    { id: 'completed', label: t('followup.completed') },
  ];

  const statusColors: Record<FollowUpStatus, string> = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
    visited: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
    completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('followup.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('followup.subtitle')}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus size={18} /> {t('followup.addFollowUp')}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Clock size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">{pendingCount}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('followup.pendingCount', { count: pendingCount })}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <PhoneCall size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">{contactedCount}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('followup.contactedCount', { count: contactedCount })}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">{completedCount}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('followup.completedCount', { count: completedCount })}</p>
        </div>
      </div>

      {/* Newcomers without follow-ups — quick add */}
      {newcomers.filter((m) => recentNewcomerIds.has(m.id)).length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <UserPlus size={18} className="text-amber-500" />
            <h2 className="font-bold text-slate-900 dark:text-white text-sm">{t('followup.newcomer')}</h2>
          </div>
          {newcomers.filter((m) => recentNewcomerIds.has(m.id) && !followUps.some((f) => f.member_id === m.id)).length === 0 ? (
            <p className="text-sm text-slate-400 py-2">{t('followup.noFollowups')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {newcomers
                .filter((m) => recentNewcomerIds.has(m.id) && !followUps.some((f) => f.member_id === m.id))
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setEditing(null);
                      setForm({
                        member_id: m.id,
                        status: 'pending',
                        method: 'call',
                        notes: '',
                        follow_up_date: todayLocalISO(),
                      });
                      setError('');
                      setModalOpen(true);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-medium hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors"
                  >
                    <Plus size={14} />
                    {m.first_name} {m.last_name}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Absent Members — 3+ weeks without attendance */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={18} className="text-red-500" />
          <h2 className="font-bold text-slate-900 dark:text-white text-sm">{t('followup.absentMembers')}</h2>
          {absentMembers.length > 0 && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400">
              {absentMembers.length}
            </span>
          )}
        </div>
        {absentMembers.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">{t('followup.noAbsentMembers')}</p>
        ) : (
          <div className="space-y-3">
            {absentMembers.map(({ member: m, lastDate, weeksAway }) => (
              <div key={m.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-500/10">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {m.first_name[0]}{m.last_name[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {m.first_name} {m.last_name}
                    </p>
                    <p className="text-[11px] text-red-500 font-medium">
                      {t('followup.weeksAway', { count: weeksAway })}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 text-[11px] text-slate-500 dark:text-slate-400 sm:ml-auto">
                  {m.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={12} /> {m.email}
                    </span>
                  )}
                  {m.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={12} /> {m.phone}
                    </span>
                  )}
                  {m.address && (
                    <span className="flex items-center gap-1">
                      <Home size={12} /> {m.address}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setEditing(null);
                    setForm({
                      member_id: m.id,
                      status: 'pending',
                      method: 'call',
                      notes: t('followup.absentNote', { weeks: weeksAway }),
                      follow_up_date: todayLocalISO(),
                    });
                    setError('');
                    setModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors flex-shrink-0"
                >
                  <Plus size={14} /> {t('followup.reachOut')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-700/50 w-fit">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
              filter === tab.id
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Follow-up Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 mt-3">
            {filter === 'all' ? t('followup.noFollowups') : t('followup.noFollowupsFiltered', { filter: t(`followup.${filter}`) })}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((fu) => {
            const due = dueLabel(fu.follow_up_date);
            const lastAtt = memberLastAttendance(fu.member_id);
            const MethodIcon = methodIcons[fu.method ?? 'call'] ?? PhoneCall;
            return (
              <div
                key={fu.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {memberName(fu).split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {fu.member_id ? (
                          <button onClick={() => {
                            const m = allMembers.find((m) => m.id === fu.member_id);
                            if (m) setDrawerMember(m);
                          }} className="hover:text-amber-600 dark:hover:text-amber-400 hover:underline text-left">
                            {memberName(fu)}
                          </button>
                        ) : (
                          memberName(fu)
                        )}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[fu.status]}`}>
                          {t(`followup.${fu.status}`)}
                        </span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <MethodIcon size={11} /> {t(`followup.method${fu.method?.charAt(0).toUpperCase()}${fu.method?.slice(1)}`)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(fu)}
                      className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteId(fu.id)}
                      className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {fu.notes && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 bg-slate-50 dark:bg-slate-700/40 rounded-lg p-3">
                    {fu.notes}
                  </p>
                )}

                <div className="mt-3 space-y-1.5">
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Calendar size={12} className={due.overdue ? 'text-red-500' : 'text-slate-400'} />
                    <span className={due.overdue ? 'text-red-500 font-medium' : ''}>
                      {due.overdue && t('followup.overdue') + ' · '}{due.text}
                    </span>
                  </p>
                  {lastAtt && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Clock size={12} /> {t('followup.lastAttendance')}: {new Date(lastAtt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                  )}
                  {!lastAtt && fu.member_id && (
                    <p className="text-xs text-slate-400 flex items-center gap-2">
                      <Clock size={12} /> {t('followup.neverAttended')}
                    </p>
                  )}
                </div>

                {/* Quick status buttons */}
                {fu.status !== 'completed' && (
                  <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    {fu.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(fu.id, 'contacted')}
                        className="flex-1 py-2 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                      >
                        {t('followup.markContacted')}
                      </button>
                    )}
                    {(fu.status === 'pending' || fu.status === 'contacted') && (
                      <button
                        onClick={() => updateStatus(fu.id, 'visited')}
                        className="flex-1 py-2 rounded-lg text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors"
                      >
                        {t('followup.markVisited')}
                      </button>
                    )}
                    <button
                      onClick={() => updateStatus(fu.id, 'completed')}
                      className="flex-1 py-2 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    >
                      {t('followup.markCompleted')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('followup.editFollowUp') : t('followup.addFollowUp')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('followup.selectMember')}</label>
            <select
              value={form.member_id}
              onChange={(e) => setForm({ ...form, member_id: e.target.value })}
              className="form-input"
            >
              <option value="">—</option>
              {allMembers.map((m) => (
                <option key={m.id} value={m.id}>{m.first_name} {m.last_name}{m.is_new_comer ? ' (Newcomer)' : ''}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('followup.status')}</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as FollowUpStatus })}
                className="form-input"
              >
                <option value="pending">{t('followup.pending')}</option>
                <option value="contacted">{t('followup.contacted')}</option>
                <option value="visited">{t('followup.visited')}</option>
                <option value="completed">{t('followup.completed')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('followup.method')}</label>
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="form-input"
              >
                <option value="call">{t('followup.methodCall')}</option>
                <option value="text">{t('followup.methodText')}</option>
                <option value="email">{t('followup.methodEmail')}</option>
                <option value="visit">{t('followup.methodVisit')}</option>
                <option value="in_person">{t('followup.methodInPerson')}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('followup.date')}</label>
            <input
              type="date"
              value={form.follow_up_date}
              onChange={(e) => setForm({ ...form, follow_up_date: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('followup.notes')}</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="form-input"
              rows={3}
              placeholder="..."
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              {t('common.cancel')}
            </button>
            <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors">
              {saving ? t('common.saving') : editing ? t('common.save') : t('followup.addFollowUp')}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t('followup.deleteFollowUp')}
        message={t('followup.deleteConfirm')}
      />

      <MemberDetailDrawer member={drawerMember} onClose={() => setDrawerMember(null)} />
    </div>
  );
}
