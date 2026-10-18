import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Workspace, Service } from '@/types';
import { findActiveService } from '@/lib/serviceTime';
import { Church, Check, Loader2, HandHeart, BookOpen, Clock, X, Baby, Plus, Trash2 } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { todayLocalISO } from '@/lib/dateUtils';
import { getRandomVerse, getRandomWelcomeVerse } from '@/data/bibleVerses';

interface MemberCheckInProps {
  workspace: Workspace;
  onDone: () => void;
}

interface ChildCheckIn {
  first_name: string;
  last_name: string;
}

export function MemberCheckIn({ workspace, onDone }: MemberCheckInProps) {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: '',
    gender: '' as '' | 'male' | 'female',
    prayer_request: '',
    testimony: '',
  });
  const [children, setChildren] = useState<ChildCheckIn[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeService, setActiveService] = useState<Service | null>(null);
  const [checkingService, setCheckingService] = useState(true);
  const hadPrayerRequest = form.prayer_request.trim().length > 0;
  const verse = useMemo(() => getRandomVerse(), [success]);

  useEffect(() => {
    document.title = `Check In — ${workspace.name}`;
    supabase
      .from('services')
      .select('*')
      .eq('workspace_id', workspace.id)
      .order('service_date', { ascending: true })
      .then(({ data }) => {
        const services = (data ?? []) as Service[];
        setActiveService(findActiveService(services));
        setCheckingService(false);
      });
  }, [workspace.id, workspace.name]);

  async function handleSubmit() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError(t('checkin.errNameRequired'));
      return;
    }
    if (children.some((child) => !child.first_name.trim() || !child.last_name.trim())) {
      setError(t('checkin.childrenComplete'));
      return;
    }
    setSubmitting(true);
    setError('');

    const wid = workspace.id;

    const firstName = form.first_name.trim();
    const lastName = form.last_name.trim();
    const fullName = `${firstName} ${lastName}`;
    const email = form.email.trim();
    const phone = form.phone.trim();

    // Reuse a matching member so repeated QR check-ins build attendance history.
    let member = null;
    if (email) {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('workspace_id', wid)
        .eq('email', email)
        .maybeSingle();
      member = data;
    }
    if (!member && phone) {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('workspace_id', wid)
        .eq('phone', phone)
        .maybeSingle();
      member = data;
    }
    if (!member) {
      const { data } = await supabase
        .from('members')
        .select('*')
        .eq('workspace_id', wid)
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .maybeSingle();
      member = data;
    }

    if (!member) {
      const { data, error: memErr } = await supabase.from('members').insert({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        email: email || null,
        address: form.address.trim() || null,
        gender: form.gender || null,
        is_new_comer: true,
        workspace_id: wid,
      }).select().single();

      if (memErr || !data) {
        setError(t('checkin.errGeneric'));
        setSubmitting(false);
        return;
      }
      member = data;
    }

    // Link attendance to the currently active service (auto-detected by date/time).
    const serviceId = activeService?.id ?? null;

    if (!serviceId) {
      setError(t('checkin.noActiveService'));
      setSubmitting(false);
      return;
    }

    const { data: previousAttendance } = await supabase
      .from('attendance')
      .select('service_id')
      .eq('workspace_id', wid)
      .eq('member_id', member.id);
    const serviceIds = new Set((previousAttendance ?? []).map((attendance) => attendance.service_id));
    if (serviceId && serviceIds.has(serviceId)) {
      setError(t('checkin.alreadyCheckedIn'));
      setSubmitting(false);
      return;
    }
    if (serviceId) serviceIds.add(serviceId);
    const isNewcomer = serviceIds.size < 3;

    const { error: attendanceError } = await supabase.from('attendance').insert({
      service_id: serviceId,
      member_id: member.id,
      is_new_comer: isNewcomer,
      newcomer_name: isNewcomer ? fullName : null,
      testimony: form.testimony.trim() || null,
      prayer_request: form.prayer_request.trim() || null,
      workspace_id: wid,
    });

    if (attendanceError) {
      setError(t('checkin.errGeneric'));
      setSubmitting(false);
      return;
    }

    if (children.length > 0) {
      const { error: childrenError } = await supabase.from('kids_checkins').insert(
        children.map((child) => ({
          workspace_id: wid,
          service_id: serviceId,
          parent_member_id: member.id,
          first_name: child.first_name.trim(),
          last_name: child.last_name.trim(),
        }))
      );
      if (childrenError) {
        setError(t('checkin.errGeneric'));
        setSubmitting(false);
        return;
      }
    }

    if (!isNewcomer && member.is_new_comer) {
      await supabase.from('members').update({ is_new_comer: false }).eq('id', member.id);
    }

    // Auto-create a welcome follow-up for first-time visitors
    if (isNewcomer) {
      const welcomeVerse = getRandomWelcomeVerse();
      const welcomeNotes = `${t('followup.welcomeNote')}\n\n${t('followup.welcomeVerseLabel')}: "${welcomeVerse.text}" — ${welcomeVerse.reference}`;
      await supabase.from('follow_ups').insert({
        workspace_id: wid,
        member_id: member.id,
        newcomer_name: fullName,
        status: 'pending',
        method: 'call',
        notes: welcomeNotes,
        follow_up_date: new Date(todayLocalISO() + 'T12:00:00').toISOString(),
      });
    }

    // 3. Create prayer request if provided
    if (form.prayer_request.trim()) {
      await supabase.from('prayer_requests').insert({
        member_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
        request_text: form.prayer_request.trim(),
        status: 'pending',
        is_private: false,
        workspace_id: wid,
      });
    }

    setSubmitting(false);
    setSuccess(true);
  }

  function resetForm() {
    setForm({ first_name: '', last_name: '', phone: '', email: '', address: '', gender: '', prayer_request: '', testimony: '' });
    setChildren([]);
    setSuccess(false);
    onDone();
  }

  if (checkingService) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!activeService && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative w-full max-w-md text-center">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-slate-700 items-center justify-center mb-4">
            <X size={32} className="text-slate-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">{t('checkin.noServiceActive')}</h1>
          <p className="text-slate-400 text-sm mb-6">{t('checkin.noServiceActiveDesc')}</p>
          <button
            onClick={onDone}
            className="px-6 py-3 rounded-xl bg-slate-700 text-white font-medium text-sm hover:bg-slate-600 transition-colors"
          >
            {t('common.done')}
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex w-20 h-20 rounded-full bg-emerald-500 items-center justify-center mb-6 shadow-2xl shadow-emerald-500/30 animate-slideUp">
            <Check size={40} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">{t('checkin.checkinComplete')}</h1>
          <p className="text-slate-400 text-sm mb-6">
            {t('checkin.thankYou', { name: form.first_name, church: workspace.name })}
          </p>

          {hadPrayerRequest && (
            <div className="bg-white/5 dark:bg-white/5 rounded-2xl border border-amber-500/20 p-5 mb-6 text-left">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen size={16} className="text-amber-400" />
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">{t('checkin.verseForYou')}</p>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed italic mb-3">"{verse.text}"</p>
              <p className="text-xs font-semibold text-amber-400 text-right">— {verse.reference}</p>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-slate-400">{t('checkin.prayerAcknowledged')}</p>
              </div>
            </div>
          )}

          <button
            onClick={resetForm}
            className="px-6 py-3 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors"
          >
            {t('common.done')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 items-center justify-center shadow-2xl shadow-amber-500/20 mb-3">
            <Church size={28} className="text-slate-900" />
          </div>
          <h1 className="text-xl font-bold text-white">{workspace.name}</h1>
          <p className="text-slate-400 text-sm mt-1">{t('checkin.memberCheckin')}</p>
          {activeService && (
            <div className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-emerald-300">{activeService.name}</span>
              <span className="text-[10px] text-emerald-400/70 flex items-center gap-1">
                <Clock size={10} /> {activeService.service_time}{activeService.service_end_time ? `–${activeService.service_end_time}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('checkin.firstName')}</label>
              <input
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="form-input"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('checkin.lastName')}</label>
              <input
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="form-input"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('checkin.phoneNumber')}</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="form-input"
              placeholder="+1 234 567 890"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('checkin.emailAddress')}</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="form-input"
              placeholder="john@example.com"
              type="email"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('checkin.homeAddress')}</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="form-input"
              placeholder="123 Main St, City"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">{t('attendance.gender')}</label>
            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value as '' | 'male' | 'female' })}
              className="form-input"
            >
              <option value="">{t('attendance.selectGender')}</option>
              <option value="male">{t('attendance.male')}</option>
              <option value="female">{t('attendance.female')}</option>
            </select>
          </div>

          <div className="rounded-2xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/60 dark:bg-blue-500/10 p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Baby size={17} className="text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">{t('checkin.childrenTitle')}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{t('checkin.childrenOptional')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChildren([...children, { first_name: '', last_name: '' }])}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-500/30 px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:border-blue-400 transition-colors"
              >
                <Plus size={14} /> {t('checkin.addChild')}
              </button>
            </div>
            {children.map((child, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">{t('checkin.childFirstName')}</label>
                  <input
                    value={child.first_name}
                    onChange={(e) => setChildren(children.map((item, itemIndex) => itemIndex === index ? { ...item, first_name: e.target.value } : item))}
                    className="form-input"
                    placeholder="First name"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">{t('checkin.childLastName')}</label>
                  <input
                    value={child.last_name}
                    onChange={(e) => setChildren(children.map((item, itemIndex) => itemIndex === index ? { ...item, last_name: e.target.value } : item))}
                    className="form-input"
                    placeholder="Last name"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setChildren(children.filter((_, itemIndex) => itemIndex !== index))}
                  aria-label={t('checkin.removeChild')}
                  className="mb-0.5 rounded-lg p-2.5 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <BookOpen size={12} className="text-amber-500" />
              {t('checkin.testimony')}
            </label>
            <textarea
              value={form.testimony}
              onChange={(e) => setForm({ ...form, testimony: e.target.value })}
              className="form-input"
              rows={3}
              placeholder={t('checkin.testimonyPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 flex items-center gap-1">
              <HandHeart size={12} className="text-rose-500" />
              {t('checkin.prayerRequest')}
            </label>
            <textarea
              value={form.prayer_request}
              onChange={(e) => setForm({ ...form, prayer_request: e.target.value })}
              className="form-input"
              rows={3}
              placeholder={t('checkin.prayerPlaceholder')}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> {t('checkin.submitting')}
              </>
            ) : (
              t('checkin.submitCheckin')
            )}
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          {t('checkin.infoGoesTo')}
        </p>
      </div>
    </div>
  );
}
