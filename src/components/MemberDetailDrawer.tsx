import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Member, Attendance, FollowUp, PrayerRequest, Service, SmallGroup, GroupMember } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import {
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ClipboardCheck,
  PhoneCall,
  MessageSquare,
  Mail as MailIcon,
  Home,
  Users,
  Heart,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
  Camera,
  Loader2,
} from 'lucide-react';

interface MemberDetailDrawerProps {
  member: Member | null;
  onClose: () => void;
}

const methodIcons: Record<string, typeof Phone> = {
  call: PhoneCall,
  text: MessageSquare,
  email: MailIcon,
  visit: Home,
  in_person: Users,
};

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
  contacted: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  visited: 'bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400',
};

export function MemberDetailDrawer({ member, onClose }: MemberDetailDrawerProps) {
  const { t } = useLanguage();
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [groups, setGroups] = useState<SmallGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(member?.photo_url ?? null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!member) return;
    setLoading(true);
    const wid = member.workspace_id;
    Promise.all([
      supabase.from('attendance').select('*').eq('member_id', member.id).order('timestamp', { ascending: false }),
      supabase.from('follow_ups').select('*').eq('member_id', member.id).order('created_at', { ascending: false }),
      supabase.from('prayer_requests').select('*').eq('workspace_id', wid).ilike('member_name', `${member.first_name} ${member.last_name}`).order('created_at', { ascending: false }),
      supabase.from('services').select('*').eq('workspace_id', wid).order('service_date', { ascending: false }),
    ]).then(([attRes, fuRes, prRes, svcRes]) => {
      setAttendance(attRes.data ?? []);
      setFollowUps(fuRes.data ?? []);
      setPrayerRequests(prRes.data ?? []);
      setServices(svcRes.data ?? []);
      setLoading(false);
    });

    if (wid) {
      supabase
        .from('group_members')
        .select('*, small_groups(*)')
        .eq('member_id', member.id)
        .then(({ data }) => {
          const gs = (data ?? []).map((d: GroupMember & { small_groups: SmallGroup | null }) => d.small_groups).filter((g): g is SmallGroup => g !== null);
          setGroups(gs);
        });
    }
  }, [member]);

  useEffect(() => {
    setPhotoUrl(member?.photo_url ?? null);
  }, [member?.photo_url]);

  if (!member) return null;

  const attendanceCount = attendance.length;
  const newcomerCount = attendance.filter((a) => a.is_new_comer).length;
  const pendingFollowUps = followUps.filter((f) => f.status !== 'completed').length;
  const fullName = `${member.first_name} ${member.last_name}`;

  function serviceName(id: string): string {
    return services.find((s) => s.id === id)?.name ?? t('common.unknown');
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !member?.workspace_id) return;
    if (file.size > 5 * 1024 * 1024) return;
    setUploadingPhoto(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${member.workspace_id}/${member.id}/${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from('member-photos')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });
      if (uploadErr) throw new Error(uploadErr.message);
      const { data: urlData } = supabase.storage.from('member-photos').getPublicUrl(fileName);
      const { error: updateErr } = await supabase
        .from('members')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', member.id);
      if (updateErr) throw new Error(updateErr.message);
      setPhotoUrl(urlData.publicUrl);
    } catch {
      // silently fail
    }
    setUploadingPhoto(false);
    e.target.value = '';
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-50 dark:bg-slate-900 z-50 overflow-y-auto shadow-2xl animate-slideInRight">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-5 py-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-bold text-lg flex-shrink-0 overflow-hidden group/photo">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  `${member.first_name[0]}${member.last_name[0]}`
                )}
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 size={18} className="animate-spin text-white" />
                  </div>
                )}
                {!uploadingPhoto && (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity"
                    title="Upload photo"
                  >
                    <Camera size={18} className="text-white" />
                  </button>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{fullName}</h2>
                {member.is_new_comer && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                    {t('common.new')}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 space-y-5">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="w-7 h-7 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {!loading && (
            <>
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{attendanceCount}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('drawer.checkins')}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{pendingFollowUps}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('drawer.openFollowUps')}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{groups.length}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('drawer.groups')}</p>
                </div>
              </div>

              {/* Contact Info */}
              <Section title={t('drawer.contactInfo')}>
                <div className="space-y-2.5">
                  {member.email && (
                    <InfoRow icon={Mail} text={member.email} />
                  )}
                  {member.phone && (
                    <InfoRow icon={Phone} text={member.phone} />
                  )}
                  {member.address && (
                    <InfoRow icon={MapPin} text={member.address} />
                  )}
                  <InfoRow icon={Calendar} text={`${t('drawer.joined')} ${new Date(member.joined_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`} />
                </div>
                {!member.email && !member.phone && !member.address && (
                  <p className="text-sm text-slate-400">{t('drawer.noContactInfo')}</p>
                )}
              </Section>

              {/* Attendance History */}
              <Section title={t('drawer.attendanceHistory')} icon={ClipboardCheck}>
                {attendance.length === 0 ? (
                  <p className="text-sm text-slate-400">{t('drawer.noAttendance')}</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {attendance.slice(0, 10).map((a) => (
                      <div key={a.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${a.is_new_comer ? 'bg-emerald-100 dark:bg-emerald-500/15' : 'bg-blue-100 dark:bg-blue-500/15'}`}>
                          {a.is_new_comer ? (
                            <Users size={14} className="text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <CheckCircle2 size={14} className="text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{serviceName(a.service_id)}</p>
                          <p className="text-[10px] text-slate-400">
                            {new Date(a.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {a.testimony && (
                          <span className="flex items-center gap-1 text-[9px] text-blue-500" title={a.testimony}>
                            <BookOpen size={10} />
                          </span>
                        )}
                        {a.prayer_request && (
                          <span className="flex items-center gap-1 text-[9px] text-rose-500" title={a.prayer_request}>
                            <Heart size={10} />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Follow-ups */}
              <Section title={t('drawer.followUps')} icon={PhoneCall}>
                {followUps.length === 0 ? (
                  <p className="text-sm text-slate-400">{t('drawer.noFollowUps')}</p>
                ) : (
                  <div className="space-y-2">
                    {followUps.slice(0, 5).map((fu) => {
                      const MethodIcon = methodIcons[fu.method ?? 'call'] ?? PhoneCall;
                      return (
                        <div key={fu.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[fu.status] ?? statusColors.pending}`}>
                                {t(`followup.${fu.status}`)}
                              </span>
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <MethodIcon size={10} /> {t(`followup.method${fu.method?.charAt(0).toUpperCase()}${fu.method?.slice(1)}`)}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Calendar size={10} /> {new Date(fu.follow_up_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                          {fu.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{fu.notes}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </Section>

              {/* Prayer Requests */}
              <Section title={t('drawer.prayerRequests')} icon={Heart}>
                {prayerRequests.length === 0 ? (
                  <p className="text-sm text-slate-400">{t('drawer.noPrayerRequests')}</p>
                ) : (
                  <div className="space-y-2">
                    {prayerRequests.slice(0, 5).map((pr) => (
                      <div key={pr.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            pr.status === 'answered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' :
                            pr.status === 'prayed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
                          }`}>
                            {t(`prayer.${pr.status}`)}
                          </span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock size={10} /> {new Date(pr.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{pr.request_text}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Section>

              {/* Small Groups */}
              <Section title={t('drawer.smallGroups')} icon={Users}>
                {groups.length === 0 ? (
                  <p className="text-sm text-slate-400">{t('drawer.noGroups')}</p>
                ) : (
                  <div className="space-y-2">
                    {groups.map((g) => (
                      <div key={g.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-700/40">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: g.color + '30' }}>
                          <Users size={14} style={{ color: g.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-white truncate">{g.name}</p>
                          <p className="text-[10px] text-slate-400">{g.meeting_day} · {g.meeting_time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon?: typeof ClipboardCheck; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon size={15} className="text-amber-500" />}
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ icon: Icon, text }: { icon: typeof Mail; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={14} className="text-slate-400 flex-shrink-0" />
      <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{text}</p>
    </div>
  );
}
