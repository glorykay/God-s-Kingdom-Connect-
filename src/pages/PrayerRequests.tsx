import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';
import { PrayerRequest } from '@/types';
import { Modal, ConfirmDialog } from '@/components/Modal';
import {
  HandHeart,
  Plus,
  Clock,
  Trash2,
  CheckCircle2,
  Heart,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

type StatusFilter = 'all' | 'pending' | 'prayed' | 'answered';

export function PrayerRequests() {
  const { workspace } = useWorkspace();
  const { t } = useLanguage();
  const wid = workspace?.id ?? '';
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [form, setForm] = useState({ member_name: '', request_text: '', is_private: false });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => { if (wid) loadRequests(); }, [wid]);

  async function loadRequests() {
    setLoading(true);
    const { data } = await supabase.from('prayer_requests').select('*').eq('workspace_id', wid).order('created_at', { ascending: false });
    setRequests(data ?? []);
    setLoading(false);
  }

  async function save() {
    if (!form.member_name.trim() || !form.request_text.trim()) return;
    setSaving(true);
    await supabase.from('prayer_requests').insert({
      member_name: form.member_name.trim(),
      request_text: form.request_text.trim(),
      is_private: form.is_private,
      workspace_id: wid,
    });
    setSaving(false);
    setModalOpen(false);
    setForm({ member_name: '', request_text: '', is_private: false });
    loadRequests();
  }

  async function updateStatus(id: string, status: PrayerRequest['status']) {
    const prevStatus = requests.find((r) => r.id === id)?.status;
    await supabase.from('prayer_requests').update({ status }).eq('id', id);
    loadRequests();
    if (status === 'prayed' && prevStatus !== 'prayed') {
      setToast(t('prayer.prayedNotification'));
      setTimeout(() => setToast(''), 4000);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await supabase.from('prayer_requests').delete().eq('id', deleteId);
    setDeleteId(null);
    loadRequests();
  }

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    prayed: requests.filter((r) => r.status === 'prayed').length,
    answered: requests.filter((r) => r.status === 'answered').length,
  };

  const statusConfig = {
    pending: { label: t('prayer.pendingLabel'), color: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400', icon: Clock },
    prayed: { label: t('prayer.prayedLabel'), color: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400', icon: Heart },
    answered: { label: t('prayer.answeredLabel'), color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400', icon: CheckCircle2 },
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('prayer.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('prayer.total', { count: requests.length })}</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus size={18} /> {t('prayer.submitPrayer')}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'prayed', 'answered'] as StatusFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-amber-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-amber-400'
            }`}
          >
            {t('prayer.' + f)} ({counts[f]})
          </button>
        ))}
      </div>

      {/* Prayer list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <HandHeart size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 mt-3">{filter !== 'all' ? t('prayer.noRequestsFiltered', { filter }) : t('prayer.noRequests')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((r) => {
            const cfg = statusConfig[r.status];
            const StatusIcon = cfg.icon;
            return (
              <div
                key={r.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white">
                      <HandHeart size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.member_name}</p>
                      <p className="text-[11px] text-slate-400">{new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${cfg.color}`}>
                    <StatusIcon size={11} /> {cfg.label}
                  </span>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{r.request_text}</p>

                {r.is_private && (
                  <p className="text-[10px] text-slate-400 mt-2 italic">{t('prayer.privateRequest')}</p>
                )}

                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  {r.status !== 'prayed' && (
                    <button
                      onClick={() => updateStatus(r.id, 'prayed')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                    >
                      <Heart size={13} /> {t('prayer.markPrayed')}
                    </button>
                  )}
                  {r.status !== 'answered' && (
                    <button
                      onClick={() => updateStatus(r.id, 'answered')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                    >
                      <CheckCircle2 size={13} /> {t('prayer.markAnswered')}
                    </button>
                  )}
                  <button
                    onClick={() => setDeleteId(r.id)}
                    className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Submit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={t('prayer.submitPrayer')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('prayer.yourName')}</label>
            <input value={form.member_name} onChange={(e) => setForm({ ...form, member_name: e.target.value })}
              className="form-input" placeholder="John Doe" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('prayer.prayerRequest')}</label>
            <textarea value={form.request_text} onChange={(e) => setForm({ ...form, request_text: e.target.value })}
              className="form-input" rows={4} placeholder="Please pray for..." />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_private} onChange={(e) => setForm({ ...form, is_private: e.target.checked })}
              className="w-4 h-4 rounded accent-amber-500" />
            <span className="text-sm text-slate-700 dark:text-slate-300">{t('prayer.keepPrivate')}</span>
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              {t('common.cancel')}
            </button>
            <button onClick={save} disabled={saving || !form.member_name.trim() || !form.request_text.trim()}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors flex items-center gap-2">
              {saving && <Loader2 size={15} className="animate-spin" />}
              {saving ? t('prayer.submitting') : t('common.submit')}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t('prayer.deleteTitle')}
        message={t('prayer.deleteConfirm')}
      />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-600 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-slideUp max-w-sm">
          {toast}
        </div>
      )}
    </div>
  );
}
