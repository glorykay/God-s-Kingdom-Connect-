import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Member } from '@/types';
import { Modal, ConfirmDialog } from '@/components/Modal';
import {
  Search,
  Plus,
  Mail,
  Phone,
  MapPin,
  Pencil,
  Trash2,
  User,
  Calendar,
  Camera,
  Loader2,
  X,
} from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { MemberDetailDrawer } from '@/components/MemberDetailDrawer';

export function Members() {
  const { workspace, role } = useWorkspace();
  const { t } = useLanguage();
  const wid = workspace?.id ?? '';
  const canManage = role === 'pastor' || role === 'coordinator';
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    photo_url: '',
    gender: '' as '' | 'male' | 'female',
    is_new_comer: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [drawerMember, setDrawerMember] = useState<Member | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (wid) loadMembers(); }, [wid]);

  async function loadMembers() {
    setLoading(true);
    const { data } = await supabase.from('members').select('*').eq('workspace_id', wid).order('created_at', { ascending: false });
    setMembers(data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ first_name: '', last_name: '', email: '', phone: '', address: '', photo_url: '', gender: '', is_new_comer: false });
    setError('');
    setModalOpen(true);
  }

  function openEdit(m: Member) {
    setEditing(m);
    setForm({
      first_name: m.first_name,
      last_name: m.last_name,
      email: m.email ?? '',
      phone: m.phone ?? '',
      address: m.address ?? '',
      photo_url: m.photo_url ?? '',
      gender: (m.gender ?? '') as '' | 'male' | 'female',
      is_new_comer: m.is_new_comer,
    });
    setError('');
    setModalOpen(true);
  }

  async function save() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError(t('members.errNameRequired'));
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      address: form.address.trim() || null,
      photo_url: form.photo_url.trim() || null,
      gender: form.gender || null,
      is_new_comer: form.is_new_comer,
      workspace_id: wid,
    };

    if (editing) {
      await supabase.from('members').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('members').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    loadMembers();
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !wid) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(t('chat.errFileSize'));
      e.target.value = '';
      return;
    }
    setUploadingPhoto(true);
    setError('');
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${wid}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('member-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadErr) throw new Error(uploadErr.message);
      const { data: urlData } = supabase.storage.from('member-photos').getPublicUrl(fileName);
      setForm((prev) => ({ ...prev, photo_url: urlData.publicUrl }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    }
    setUploadingPhoto(false);
    e.target.value = '';
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await supabase.from('members').delete().eq('id', deleteId);
    setDeleteId(null);
    loadMembers();
  }

  const filtered = members.filter((m) => {
    const q = search.toLowerCase();
    return `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
      (m.email ?? '').toLowerCase().includes(q) ||
      (m.phone ?? '').includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('members.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('members.total', { count: members.length })}</p>
        </div>
        {canManage && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
          >
            <Plus size={18} /> {t('members.addMember')}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder={t('members.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
        />
      </div>

      {/* Members grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <User size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 mt-3">{t('members.noMembers')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <div
              key={m.id}
              onClick={() => setDrawerMember(m)}
              className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:shadow-lg transition-all cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    `${m.first_name[0]}${m.last_name[0]}`
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-slate-900 dark:text-white truncate">{m.first_name} {m.last_name}</h3>
                    {m.is_new_comer && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                        {t('common.new')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <Calendar size={11} /> Joined {new Date(m.joined_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                {m.email && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 truncate">
                    <Mail size={13} className="flex-shrink-0" /> {m.email}
                  </p>
                )}
                {m.phone && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Phone size={13} className="flex-shrink-0" /> {m.phone}
                  </p>
                )}
                {m.address && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 truncate">
                    <MapPin size={13} className="flex-shrink-0" /> {m.address}
                  </p>
                )}
              </div>
              {canManage && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <button
                    onClick={() => openEdit(m)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <Pencil size={14} /> {t('common.edit')}
                  </button>
                  <button
                    onClick={() => setDeleteId(m.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 size={14} /> {t('common.delete')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('members.editMember') : t('members.addNewMember')}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('members.firstName')}>
              <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="form-input" placeholder="John" />
            </Field>
            <Field label={t('members.lastName')}>
              <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="form-input" placeholder="Doe" />
            </Field>
          </div>
          <Field label={t('welcome.email').replace(' *', '')}>
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="form-input" placeholder="john@example.com" type="email" />
          </Field>
          <Field label={t('members.phone')}>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="form-input" placeholder="+1 234 567 890" />
          </Field>
          <Field label={t('members.homeAddress')}>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="form-input" placeholder="123 Main St, City" />
          </Field>
          <Field label={t('attendance.gender')}>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as '' | 'male' | 'female' })} className="form-input">
              <option value="">{t('attendance.selectGender')}</option>
              <option value="male">{t('attendance.male')}</option>
              <option value="female">{t('attendance.female')}</option>
            </select>
          </Field>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('members.photoUrl')}</label>
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden">
                {form.photo_url ? (
                  <img src={form.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <Camera size={22} className="text-white/70" />
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 size={18} className="animate-spin text-white" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                >
                  <Camera size={14} /> {form.photo_url ? t('common.edit') : t('members.uploadPhoto')}
                </button>
                {form.photo_url && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, photo_url: '' })}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-medium text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                  >
                    <X size={12} /> {t('common.remove')}
                  </button>
                )}
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_new_comer} onChange={(e) => setForm({ ...form, is_new_comer: e.target.checked })}
              className="w-4 h-4 rounded accent-amber-500" />
            <span className="text-sm text-slate-700 dark:text-slate-300">{t('members.newComer')}</span>
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              {t('common.cancel')}
            </button>
            <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors">
              {saving ? t('common.saving') : editing ? t('members.update') : t('members.addMember')}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t('members.deleteMember')}
        message={t('members.deleteConfirm')}
      />

      <MemberDetailDrawer member={drawerMember} onClose={() => setDrawerMember(null)} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
