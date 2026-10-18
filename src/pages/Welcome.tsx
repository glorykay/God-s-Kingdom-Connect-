import { useState, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Church, Plus, LogIn, ArrowRight, Sparkles, Mail, BadgeCheck, Lock } from 'lucide-react';
import { PastorLoginPage } from '@/pages/PastorLoginPage';
import { useLanguage } from '@/context/LanguageContext';

export function Welcome() {
  const { signUpPastor, signUpCoordinator } = useWorkspace();
  const { t } = useLanguage();
  const [mode, setMode] = useState<'choice' | 'create' | 'join' | 'login'>('choice');
  const [name, setName] = useState('');
  const [pastorName, setPastorName] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCode = sessionStorage.getItem('glory-join-code');
    if (savedCode) {
      setJoinCode(savedCode);
      setMode('join');
      sessionStorage.removeItem('glory-join-code');
    }
  }, []);

  async function handleCreate() {
    if (!name.trim() || !pastorName.trim()) {
      setError(t('welcome.errNameChurch'));
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError(t('welcome.errEmail'));
      return;
    }
    if (password.length < 6) {
      setError(t('login.errPasswordLength'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUpPastor(email, password, name, pastorName);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('welcome.errNameChurch'));
      setLoading(false);
    }
  }

  async function handleJoin() {
    if (!joinCode.trim() || !displayName.trim() || !email.trim() || !password.trim()) {
      setError(t('welcome.errJoin'));
      return;
    }
    if (password.length < 6) {
      setError(t('login.errPasswordLength'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUpCoordinator(email, password, joinCode, displayName);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('welcome.errInvalidCode'));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 items-center justify-center shadow-2xl shadow-amber-500/20 mb-4">
            <Church size={32} className="text-slate-900" />
          </div>
          <h1 className="text-3xl font-bold text-white">{t('app.name')}</h1>
          <p className="text-slate-400 mt-1.5 text-sm">{t('app.tagline')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8">
          {mode === 'choice' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{t('welcome.getStarted')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('welcome.getStartedDesc')}</p>
              </div>

              <button
                onClick={() => { setMode('create'); setError(''); }}
                className="w-full group flex items-center gap-4 p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-amber-50 dark:from-amber-500/10 dark:to-amber-500/10 border border-amber-200 dark:border-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/40 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <Plus size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{t('welcome.createWorkspace')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('welcome.createWorkspaceDesc')}</p>
                </div>
                <ArrowRight size={20} className="text-amber-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => { setMode('join'); setError(''); }}
                className="w-full group flex items-center gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500/40 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500 flex items-center justify-center flex-shrink-0">
                  <LogIn size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{t('welcome.joinTeam')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('welcome.joinTeamDesc')}</p>
                </div>
                <ArrowRight size={20} className="text-blue-500 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => { setMode('login'); setError(''); }}
                className="w-full group flex items-center gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500/40 transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center flex-shrink-0">
                  <Lock size={24} className="text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900 dark:text-white">{t('welcome.pastorLogin')}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t('welcome.pastorLoginDesc')}</p>
                </div>
                <ArrowRight size={20} className="text-emerald-500 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}

          {mode === 'login' && (
            <PastorLoginPage />
          )}

          {mode === 'create' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={18} className="text-amber-500" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('welcome.createChurchWorkspace')}</h2>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('welcome.churchName')}</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="form-input" placeholder="e.g. God's Kingdom Connect Church" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('welcome.yourNamePastor')}</label>
                <input value={pastorName} onChange={(e) => setPastorName(e.target.value)}
                  className="form-input" placeholder="e.g. Pastor John Daniels" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('welcome.email')}</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                    className="form-input pl-9" placeholder="you@example.com" />
                </div>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <BadgeCheck size={12} className="text-amber-500" />
                  {t('welcome.whitelisted')}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('welcome.description')}</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  className="form-input" rows={2} placeholder="A brief description of your church..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('login.password')}</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password"
                  className="form-input" placeholder={t('login.passwordSignup')} autoComplete="new-password" />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setMode('choice')} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  {t('common.back')}
                </button>
                <button onClick={handleCreate} disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors">
                  {loading ? t('welcome.creating') : t('welcome.createWorkspaceBtn')}
                </button>
              </div>
            </div>
          )}

          {mode === 'join' && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('welcome.joinYourTeam')}</h2>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('welcome.joinCode')}</label>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="form-input text-center text-lg tracking-[0.3em] font-bold uppercase"
                  placeholder="ABC123"
                  maxLength={6}
                />
                <p className="text-xs text-slate-400 mt-1.5">{t('welcome.joinCodeHint')}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('welcome.yourName')}</label>
                <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                  className="form-input" placeholder="e.g. Jane Smith" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('login.email')}</label>
                <input value={email} onChange={(e) => setEmail(e.target.value)} type="email"
                  className="form-input" placeholder="you@example.com" autoComplete="email" />
                <p className="text-xs text-slate-400 mt-1.5">Use the admin’s own email, not the pastor’s account email.</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('login.password')}</label>
                <input value={password} onChange={(e) => setPassword(e.target.value)} type="password"
                  className="form-input" placeholder={t('login.passwordSignup')} autoComplete="new-password" />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setMode('choice')} className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  {t('common.back')}
                </button>
                <button onClick={handleJoin} disabled={loading}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 transition-colors">
                  {loading ? t('welcome.joining') : t('welcome.joinWorkspaceBtn')}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          {t('welcome.qrHint')}
        </p>


      </div>
    </div>
  );
}
