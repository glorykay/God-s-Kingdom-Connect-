import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Member, SmallGroup, GroupMember } from '@/types';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { useLanguage } from '@/context/LanguageContext';
import {
  Plus,
  Users,
  Pencil,
  Trash2,
  Calendar,
  Clock,
  MapPin,
  User,
  Search,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

const colorOptions = [
  { value: 'amber', label: 'Amber', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-200 dark:border-amber-500/20' },
  { value: 'blue', label: 'Blue', dot: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10', border: 'border-blue-200 dark:border-blue-500/20' },
  { value: 'emerald', label: 'Green', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20' },
  { value: 'rose', label: 'Rose', dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-200 dark:border-rose-500/20' },
  { value: 'purple', label: 'Purple', dot: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10', border: 'border-purple-200 dark:border-purple-500/20' },
  { value: 'cyan', label: 'Cyan', dot: 'bg-cyan-500', text: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10', border: 'border-cyan-200 dark:border-cyan-500/20' },
];

function getColor(value: string) {
  return colorOptions.find((c) => c.value === value) ?? colorOptions[0];
}

export function SmallGroups() {
  const { workspace } = useWorkspace();
  const { t } = useLanguage();
  const wid = workspace?.id ?? '';
  const [groups, setGroups] = useState<SmallGroup[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SmallGroup | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rosterGroup, setRosterGroup] = useState<SmallGroup | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAdd, setQuickAdd] = useState({ first_name: '', last_name: '', phone: '', email: '' });
  const [quickAddError, setQuickAddError] = useState('');
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    leader: '',
    meeting_day: '',
    meeting_time: '',
    location: '',
    color: 'amber',
  });

  useEffect(() => { if (wid) loadData(); }, [wid]);

  async function loadData() {
    setLoading(true);
    const [grpRes, memRes, gmRes] = await Promise.all([
      supabase.from('small_groups').select('*').eq('workspace_id', wid).order('created_at', { ascending: false }),
      supabase.from('members').select('*').eq('workspace_id', wid).order('first_name'),
      supabase.from('group_members').select('*').eq('workspace_id', wid),
    ]);
    setGroups(grpRes.data ?? []);
    setMembers(memRes.data ?? []);
    setGroupMembers(gmRes.data ?? []);
    setLoading(false);
  }

  function openAdd() {
    setEditing(null);
    setForm({ name: '', description: '', leader: '', meeting_day: '', meeting_time: '', location: '', color: 'amber' });
    setError('');
    setModalOpen(true);
  }

  function openEdit(g: SmallGroup) {
    setEditing(g);
    setForm({
      name: g.name,
      description: g.description,
      leader: g.leader,
      meeting_day: g.meeting_day,
      meeting_time: g.meeting_time,
      location: g.location,
      color: g.color,
    });
    setError('');
    setModalOpen(true);
  }

  async function save() {
    if (!form.name.trim()) {
      setError(t('groups.errNameRequired'));
      return;
    }
    setSaving(true);
    setError('');
    const payload = {
      workspace_id: wid,
      name: form.name.trim(),
      description: form.description.trim(),
      leader: form.leader.trim(),
      meeting_day: form.meeting_day.trim(),
      meeting_time: form.meeting_time.trim(),
      location: form.location.trim(),
      color: form.color,
    };
    if (editing) {
      await supabase.from('small_groups').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('small_groups').insert(payload);
    }
    setSaving(false);
    setModalOpen(false);
    loadData();
  }

  async function confirmDelete() {
    if (!deleteId) return;
    await supabase.from('small_groups').delete().eq('id', deleteId);
    setDeleteId(null);
    loadData();
  }

  async function addMemberToGroup(memberId: string) {
    if (!rosterGroup) return;
    await supabase.from('group_members').insert({
      group_id: rosterGroup.id,
      member_id: memberId,
      workspace_id: wid,
    });
    loadData();
  }

  async function quickAddMember() {
    if (!quickAdd.first_name.trim() || !quickAdd.last_name.trim()) {
      setQuickAddError(t('members.errNameRequired'));
      return;
    }
    setQuickAddSaving(true);
    setQuickAddError('');
    const { data: newMember, error: memErr } = await supabase.from('members').insert({
      first_name: quickAdd.first_name.trim(),
      last_name: quickAdd.last_name.trim(),
      phone: quickAdd.phone.trim() || null,
      email: quickAdd.email.trim() || null,
      is_new_comer: true,
      workspace_id: wid,
    }).select().single();

    if (memErr || !newMember) {
      setQuickAddError(t('checkin.errGeneric'));
      setQuickAddSaving(false);
      return;
    }

    if (rosterGroup) {
      await supabase.from('group_members').insert({
        group_id: rosterGroup.id,
        member_id: newMember.id,
        workspace_id: wid,
      });
    }

    setQuickAddSaving(false);
    setShowQuickAdd(false);
    setQuickAdd({ first_name: '', last_name: '', phone: '', email: '' });
    loadData();
  }

  async function removeMemberFromGroup(gmId: string) {
    await supabase.from('group_members').delete().eq('id', gmId);
    loadData();
  }

  function membersInGroup(groupId: string): Member[] {
    const gmIds = groupMembers.filter((gm) => gm.group_id === groupId).map((gm) => gm.member_id);
    return members.filter((m) => gmIds.includes(m.id));
  }

  function membersNotInGroup(groupId: string): Member[] {
    const inGroup = groupMembers.filter((gm) => gm.group_id === groupId).map((gm) => gm.member_id);
    const q = memberSearch.toLowerCase();
    return members
      .filter((m) => !inGroup.includes(m.id))
      .filter((m) => `${m.first_name} ${m.last_name}`.toLowerCase().includes(q));
  }

  const filteredMembersInRoster = rosterGroup
    ? groupMembers.filter((gm) => gm.group_id === rosterGroup.id)
    : [];

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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('groups.title')}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('groups.subtitle')}</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/20"
        >
          <Plus size={18} /> {t('groups.createGroup')}
        </button>
      </div>

      {/* Group Cards */}
      {groups.length === 0 ? (
        <div className="text-center py-16">
          <Users size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400 mt-3">{t('groups.noGroups')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((g) => {
            const color = getColor(g.color);
            const inGroup = membersInGroup(g.id);
            return (
              <div
                key={g.id}
                className={`bg-white dark:bg-slate-800 rounded-2xl border ${color.border} p-5 hover:shadow-lg transition-all`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${color.bg} ${color.text} flex items-center justify-center flex-shrink-0`}>
                      <Users size={22} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white truncate">{g.name}</h3>
                      {g.leader && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <User size={11} /> {g.leader}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEdit(g)}
                      className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteId(g.id)}
                      className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Description */}
                {g.description && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 line-clamp-2">{g.description}</p>
                )}

                {/* Meeting Info */}
                <div className="mt-4 space-y-2">
                  {(g.meeting_day || g.meeting_time) && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <Calendar size={12} className={color.text} />
                      {g.meeting_day && <span>{t('groups.meetsOn')} {g.meeting_day}</span>}
                      {g.meeting_day && g.meeting_time && <span>{t('groups.at')}</span>}
                      {g.meeting_time && <span className="flex items-center gap-1"><Clock size={12} /> {g.meeting_time}</span>}
                    </p>
                  )}
                  {g.location && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <MapPin size={12} className={color.text} /> {g.location}
                    </p>
                  )}
                </div>

                {/* Members preview + view roster */}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        {t('groups.memberCount', { count: inGroup.length })}
                      </span>
                    </div>
                    <button
                      onClick={() => { setRosterGroup(g); setMemberSearch(''); }}
                      className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-0.5 transition-colors"
                    >
                      {t('groups.viewRoster')} <ChevronRight size={14} />
                    </button>
                  </div>
                  {inGroup.length > 0 && (
                    <div className="flex -space-x-2 mt-2">
                      {inGroup.slice(0, 5).map((m) => (
                        <div
                          key={m.id}
                          className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-[10px] font-semibold border-2 border-white dark:border-slate-800"
                          title={`${m.first_name} ${m.last_name}`}
                        >
                          {m.first_name[0]}{m.last_name[0]}
                        </div>
                      ))}
                      {inGroup.length > 5 && (
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-semibold text-slate-500 dark:text-slate-300 border-2 border-white dark:border-slate-800">
                          +{inGroup.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('groups.editGroup') : t('groups.createGroup')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('groups.groupName')}</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="form-input"
              placeholder="..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('groups.description')}</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="form-input"
              rows={2}
              placeholder="..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('groups.leader')}</label>
            <input
              value={form.leader}
              onChange={(e) => setForm({ ...form, leader: e.target.value })}
              className="form-input"
              placeholder="..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('groups.meetingDay')}</label>
              <input
                value={form.meeting_day}
                onChange={(e) => setForm({ ...form, meeting_day: e.target.value })}
                className="form-input"
                placeholder="Wednesday"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('groups.meetingTime')}</label>
              <input
                value={form.meeting_time}
                onChange={(e) => setForm({ ...form, meeting_time: e.target.value })}
                className="form-input"
                placeholder="7:00 PM"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('groups.location')}</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className="form-input"
              placeholder="..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('groups.color')}</label>
            <div className="flex gap-2">
              {colorOptions.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setForm({ ...form, color: c.value })}
                  className={`w-8 h-8 rounded-full ${c.dot} transition-all ${
                    form.color === c.value ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-slate-400 scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
              {t('common.cancel')}
            </button>
            <button onClick={save} disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors">
              {saving ? t('common.saving') : editing ? t('common.save') : t('groups.createGroup')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Roster Modal */}
      <Modal
        open={!!rosterGroup}
        onClose={() => setRosterGroup(null)}
        title={rosterGroup ? rosterGroup.name : ''}
        size="lg"
      >
        {rosterGroup && (
          <div className="space-y-5">
            {/* Current members */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
                {t('groups.members')} ({filteredMembersInRoster.length})
              </h3>
              {filteredMembersInRoster.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">{t('groups.noMembersInGroup')}</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {filteredMembersInRoster.map((gm) => {
                    const m = members.find((m) => m.id === gm.member_id);
                    if (!m) return null;
                    return (
                      <div key={gm.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700/40">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {m.first_name[0]}{m.last_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.first_name} {m.last_name}</p>
                          {m.phone && <p className="text-xs text-slate-400">{m.phone}</p>}
                        </div>
                        <button
                          onClick={() => removeMemberFromGroup(gm.id)}
                          className="p-1.5 rounded-lg text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Add members */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t('groups.addMember')}</h3>
                <button
                  onClick={() => { setShowQuickAdd(!showQuickAdd); setQuickAddError(''); }}
                  className="flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
                >
                  <Plus size={14} /> {t('members.addNewMember')}
                </button>
              </div>

              {showQuickAdd && (
                <div className="mb-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('members.firstName')}</label>
                      <input
                        value={quickAdd.first_name}
                        onChange={(e) => setQuickAdd({ ...quickAdd, first_name: e.target.value })}
                        className="form-input"
                        placeholder="John"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('members.lastName')}</label>
                      <input
                        value={quickAdd.last_name}
                        onChange={(e) => setQuickAdd({ ...quickAdd, last_name: e.target.value })}
                        className="form-input"
                        placeholder="Doe"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('members.phone')}</label>
                      <input
                        value={quickAdd.phone}
                        onChange={(e) => setQuickAdd({ ...quickAdd, phone: e.target.value })}
                        className="form-input"
                        placeholder="+1 234 567 890"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('checkin.emailAddress')}</label>
                      <input
                        value={quickAdd.email}
                        onChange={(e) => setQuickAdd({ ...quickAdd, email: e.target.value })}
                        className="form-input"
                        placeholder="john@example.com"
                        type="email"
                      />
                    </div>
                  </div>
                  {quickAddError && <p className="text-sm text-red-500">{quickAddError}</p>}
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => { setShowQuickAdd(false); setQuickAddError(''); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={quickAddMember}
                      disabled={quickAddSaving}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors"
                    >
                      {quickAddSaving ? t('common.saving') : t('common.save')}
                    </button>
                  </div>
                </div>
              )}

              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder={t('groups.searchMember')}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {membersNotInGroup(rosterGroup.id).length === 0 ? (
                  <p className="text-sm text-slate-400 py-4 text-center">
                    {memberSearch ? t('attendance.noMembersFound') : t('groups.noMembers')}
                  </p>
                ) : (
                  membersNotInGroup(rosterGroup.id).map((m) => (
                    <button
                      key={m.id}
                      onClick={() => addMemberToGroup(m.id)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-colors text-left"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {m.first_name[0]}{m.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{m.first_name} {m.last_name}</p>
                        {m.phone && <p className="text-xs text-slate-400">{m.phone}</p>}
                      </div>
                      <Plus size={16} className="text-amber-500 flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title={t('groups.deleteGroup')}
        message={t('groups.deleteConfirm')}
      />
    </div>
  );
}
