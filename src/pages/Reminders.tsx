import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Reminder, Service, Member } from '@/types';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { useLanguage } from '@/context/LanguageContext';
import {
  Bell,
  Plus,
  Mail,
  Phone,
  Send,
  Trash2,
  Pencil,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  CalendarClock,
  Info,
} from 'lucide-react';

type Channel = 'email' | 'sms' | 'both';

export function Reminders() {
  const { workspace } = useWorkspace();
  const { t } = useLanguage();
  const wid = workspace?.id ?? '';
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: '',
    message: '',
    channel: 'email' as Channel,
    send_at: '',
    service_id: '',
  });

  useEffect(() => { if (wid) loadData(); }, [wid]);

  async function loadData() {
    setLoading(true);
    const [remRes, svcRes, memRes] = await Promise.all([
      supabase.from('reminders').select('*').eq('workspace_id', wid).order('send_at', { ascending: false }),
      supabase.from('services').select('*').eq('workspace_id', wid).order('service_date', { ascending: true }),
      supabase.from('members').select('*').eq('workspace_id', wid),
    ]);
    setReminders((remRes.data as Reminder[]) ?? []);
    setServices((svcRes.data as Service[]) ?? []);
    setMembers((memRes.data as Member[]) ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setForm({
      title: '',
      message: '',
      channel: 'email',
      send_at: now.toISOString().slice(0, 16),
      service_id: '',
    });
    setError('');
    setModalOpen(true);
  }

  function openEdit(r: Reminder) {
    setEditing(r);
    const dt = new Date(r.send_at);
    dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset());
    setForm({
      title: r.title,
      message: r.message,
      channel: r.channel,
      send_at: dt.toISOString().slice(0, 16),
      service_id: r.service_id ?? '',
    });
    setError('');
    setModalOpen(true);
  }

  async function save() {
    if (!form.title.trim() || !form.message.trim() || !form.send_at) {
      setError(t('reminders.errFields'));
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      workspace_id: wid,
      service_id: form.service_id || null,
      title: form.title.trim(),
      message: form.message.trim(),
      channel: form.channel,
      send_at: new Date(form.send_at).toISOString(),
      status: 'scheduled',
    };
    if (editing) {
      await supabase.from('reminders').update({
        service_id: payload.service_id,
        title: payload.title,
        message: payload.message,
        channel: payload.channel,
        send_at: payload.send_at,
      }).eq('id', editing.id);
    } else {
      await supabase.from('reminders').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await supabase.from('reminders').delete().eq('id', deleteId);
    setDeleteId(null);
    loadData();
  }

  async function confirmCancel() {
    if (!cancelId) return;
    await supabase.from('reminders').update({ status: 'cancelled' }).eq('id', cancelId);
    setCancelId(null);
    loadData();
  }

  async function sendNow(id: string) {
    setSendingId(id);
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-reminder`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reminder_id: id }),
    });
    if (res.ok) {
      await supabase.from('reminders').update({ status: 'sent', sent_at: new Date().toISOString() }).eq('id', id);
      loadData();
    }
    setSendingId(null);
  }

  function emailRecipientCount(): number {
    return members.filter((m) => m.email).length;
  }
  function smsRecipientCount(): number {
    return members.filter((m) => m.phone).length;
  }
  function recipientCount(channel: Channel): number {
    if (channel === 'email') return emailRecipientCount();
    if (channel === 'sms') return smsRecipientCount();
    return emailRecipientCount() + smsRecipientCount();
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function isOverdue(r: Reminder): boolean {
    return r.status === 'scheduled' && new Date(r.send_at).getTime() < Date.now();
  }

  const statusColors: Record<string, string> = {
    scheduled: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
    sent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
    cancelled: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400',
  };

  const statusIcons: Record<string, typeof Clock> = {
    scheduled: Clock,
    sent: CheckCircle2,
    cancelled: XCircle,
  };

  const channelIcons: Record<Channel, typeof Mail> = {
    email: Mail,
    sms: Phone,
    both: Send,
  };

  const scheduledCount = reminders.filter((r) => r.status === 'scheduled').length;
  const sentCount = reminders.filter((r) => r.status === 'sent').length;

  const now = Date.now();
  const upcoming = reminders.filter((r) => r.status === 'scheduled' && new Date(r.send_at).getTime() >= now);
  const past = reminders.filter((r) => r.status !== 'scheduled' || new Date(r.send_at).getTime() < now);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('reminders.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('reminders.subtitle')}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus size={18} /> {t('reminders.schedule')}
        </button>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20 p-4">
        <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-blue-700 dark:text-blue-300">{t('reminders.infoNote')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
            <Bell size={20} className="text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">{scheduledCount}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('reminders.scheduled')}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">{sentCount}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('reminders.sent')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-700/50 w-fit">
        <button
          onClick={() => setTab('upcoming')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            tab === 'upcoming'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {t('reminders.upcoming')} ({upcoming.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            tab === 'past'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          {t('reminders.past')} ({past.length})
        </button>
      </div>

      {/* Reminder Cards */}
      {tab === 'upcoming' && upcoming.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 mt-3">{t('reminders.noUpcoming')}</p>
        </div>
      ) : tab === 'past' && past.length === 0 ? (
        <div className="text-center py-16">
          <AlertCircle size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 mt-3">{t('reminders.noPast')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(tab === 'upcoming' ? upcoming : past).map((r) => {
            const StatusIcon = statusIcons[r.status] ?? Clock;
            const ChannelIcon = channelIcons[r.channel];
            const svc = services.find((s) => s.id === r.service_id);
            const overdue = isOverdue(r);
            return (
              <div
                key={r.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border p-5 transition-all ${
                  overdue
                    ? 'border-rose-300 dark:border-rose-500/40'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">{r.title}</h3>
                      {overdue && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400 flex-shrink-0">
                          {t('reminders.overdue')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{r.message}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full flex-shrink-0 ${statusColors[r.status]}`}>
                    <StatusIcon size={10} className="inline mr-1" />
                    {t(`reminders.${r.status}`)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mb-3">
                  <span className="flex items-center gap-1">
                    <CalendarClock size={13} />
                    {formatDate(r.send_at)}
                  </span>
                  <span className="flex items-center gap-1">
                    <ChannelIcon size={13} />
                    {r.channel === 'both' ? t('reminders.both') : r.channel === 'email' ? t('reminders.email') : t('reminders.sms')}
                  </span>
                  {svc && (
                    <span className="text-amber-600 dark:text-amber-400">
                      {svc.name}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-400 mb-3">
                  {t('reminders.sendTo')}: {t('reminders.recipients', { count: recipientCount(r.channel) })}
                </div>

                {/* Actions */}
                {r.status === 'scheduled' && (
                  <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => sendNow(r.id)}
                      disabled={sendingId === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                    >
                      {sendingId === r.id ? (
                        <><div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /> {t('reminders.sendingNow')}</>
                      ) : (
                        <><Send size={13} /> {t('reminders.sendNow')}</>
                      )}
                    </button>
                    <button
                      onClick={() => openEdit(r)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 dark:text-slate-400 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Pencil size={13} /> {t('common.edit')}
                    </button>
                    <button
                      onClick={() => setCancelId(r.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-amber-600 dark:text-amber-400 text-xs font-medium hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors"
                    >
                      <XCircle size={13} /> {t('reminders.cancelReminder')}
                    </button>
                    <button
                      onClick={() => setDeleteId(r.id)}
                      className="ml-auto p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                {r.status !== 'scheduled' && (
                  <div className="flex items-center justify-end pt-3 border-t border-slate-100 dark:border-slate-700">
                    <button
                      onClick={() => setDeleteId(r.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-medium transition-colors"
                    >
                      <Trash2 size={13} /> {t('common.delete')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('reminders.editReminder') : t('reminders.scheduleNew')} size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('reminders.reminderTitle')}</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="form-input"
              placeholder={t('reminders.reminderTitlePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('reminders.message')}</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="form-input"
              rows={3}
              placeholder={t('reminders.messagePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('reminders.channel')}</label>
            <div className="flex gap-2">
              {(['email', 'sms', 'both'] as Channel[]).map((ch) => {
                const Icon = channelIcons[ch];
                return (
                  <button
                    key={ch}
                    onClick={() => setForm({ ...form, channel: ch })}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      form.channel === ch
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Icon size={16} />
                    {ch === 'both' ? t('reminders.both') : ch === 'email' ? t('reminders.email') : t('reminders.sms')}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">
              {t('reminders.recipients', { count: recipientCount(form.channel) })}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('reminders.sendAt')}</label>
            <input
              type="datetime-local"
              value={form.send_at}
              onChange={(e) => setForm({ ...form, send_at: e.target.value })}
              className="form-input"
            />
          </div>
          {services.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('reminders.linkService')}</label>
              <select
                value={form.service_id}
                onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                className="form-input"
              >
                <option value="">{t('reminders.noService')}</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.service_date}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={save}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors"
            >
              {saving ? t('reminders.scheduling') : editing ? t('reminders.updateBtn') : t('reminders.scheduleBtn')}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t('reminders.deleteReminder')}
        message={t('reminders.deleteConfirm')}
      />
      <ConfirmDialog
        open={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={confirmCancel}
        title={t('reminders.cancelReminder')}
        message={t('reminders.cancelConfirm')}
      />
    </div>
  );
}
