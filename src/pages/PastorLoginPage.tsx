import { useState } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Church, Mail, Lock, User, Building2, Loader2, AlertCircle, Eye, EyeOff, KeyRound, Smartphone, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function PastorLoginPage() {
  const { signUpPastor, signInPastor, signUpCoordinator, signInCoordinator, enrollPhoneAndChallenge, verifyMfaCode } = useWorkspace();
  const { t } = useLanguage();
  const [accountType, setAccountType] = useState<'pastor' | 'coordinator'>('pastor');
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [churchName, setChurchName] = useState('');
  const [pastorName, setPastorName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState<'password' | 'phone' | 'code'>('password');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [smsNotConfigured, setSmsNotConfigured] = useState(false);

  const SMS_ERROR_PATTERNS = [
    'sms',
    'twilio',
    'vonage',
    'phone provider',
    'phone_provider_disabled',
    'mfa_phone',
    'no sms',
    'sms provider',
    'mfa_factor_not_found',
  ];

  function isSmsConfigError(msg: string): boolean {
    const lower = msg.toLowerCase();
    return SMS_ERROR_PATTERNS.some((p) => lower.includes(p));
  }

  function resetFields() {
    setEmail('');
    setPassword('');
    setChurchName('');
    setPastorName('');
    setDisplayName('');
    setJoinCode('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (mfaStep === 'phone') {
      if (!phone.trim()) {
        setError(t('login.phoneRequired'));
        return;
      }
      setLoading(true);
      setSmsNotConfigured(false);
      try {
        const challenge = await enrollPhoneAndChallenge(phone);
        setFactorId(challenge.factorId ?? '');
        setChallengeId(challenge.challengeId ?? '');
        setMfaStep('code');
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('login.mfaError');
        if (isSmsConfigError(msg)) {
          setSmsNotConfigured(true);
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mfaStep === 'code') {
      if (!/^\\d{6}$/.test(verificationCode.trim())) {
        setError(t('login.codeRequired'));
        return;
      }
      setLoading(true);
      setSmsNotConfigured(false);
      try {
        await verifyMfaCode(challengeId, factorId, verificationCode);
      } catch (err) {
        const msg = err instanceof Error ? err.message : t('login.mfaError');
        if (isSmsConfigError(msg)) {
          setSmsNotConfigured(true);
        } else {
          setError(msg);
        }
        setLoading(false);
      }
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError(t('login.errEmailPassword'));
      return;
    }

    if (mode === 'signup') {
      if (accountType === 'pastor') {
        if (!churchName.trim() || !pastorName.trim()) {
          setError(t('login.errChurchName'));
          return;
        }
      } else {
        if (!joinCode.trim() || !displayName.trim()) {
          setError(t('login.errJoinCode'));
          return;
        }
      }
      if (password.length < 6) {
        setError(t('login.errPasswordLength'));
        return;
      }
    }

    setLoading(true);
    setSmsNotConfigured(false);
    try {
      if (mode === 'signup') {
        if (accountType === 'pastor') {
          await signUpPastor(email, password, churchName, pastorName);
        } else {
          await signUpCoordinator(email, password, joinCode, displayName);
        }
      } else {
        if (accountType === 'pastor') {
          const challenge = await signInPastor(email, password);
          if (challenge?.needsPhone) {
            setMfaStep('phone');
          } else if (challenge) {
            setFactorId(challenge.factorId ?? '');
            setChallengeId(challenge.challengeId ?? '');
            setMfaStep('code');
          }
        } else {
          const challenge = await signInCoordinator(email, password);
          if (challenge?.needsPhone) {
            setMfaStep('phone');
          } else if (challenge) {
            setFactorId(challenge.factorId ?? '');
            setChallengeId(challenge.challengeId ?? '');
            setMfaStep('code');
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      const lower = msg.toLowerCase();
      if (isSmsConfigError(msg)) {
        setSmsNotConfigured(true);
      } else if (lower.includes('already registered') || lower.includes('already been registered')) {
        setError(t('login.errExists'));
      } else if (lower.includes('invalid credentials') || lower.includes('invalid login')) {
        setError(t('login.errInvalid'));
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 items-center justify-center shadow-2xl shadow-amber-500/20 mb-4">
            <Church size={32} className="text-slate-900" />
          </div>
          <h1 className="text-2xl font-bold text-white">{t('app.name')}</h1>
          <p className="text-slate-400 mt-1 text-sm">{t('app.tagline')}</p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-7">
          {smsNotConfigured && (
            <div className="mb-5 p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
              <div className="flex items-start gap-2.5">
                <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{t('login.smsNotConfiguredTitle')}</p>
                  <p className="text-xs text-amber-600 dark:text-amber-400/80 mt-1 leading-relaxed">{t('login.smsNotConfiguredBody')}</p>
                </div>
              </div>
            </div>
          )}

          {/* Account type toggle */}
          <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-700/50 mb-4">
            <button
              onClick={() => { setAccountType('pastor'); setError(''); resetFields(); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                accountType === 'pastor'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t('login.pastor')}
            </button>
            <button
              onClick={() => { setAccountType('coordinator'); setError(''); resetFields(); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                accountType === 'coordinator'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Admin
            </button>
          </div>

          {/* Sign In / Sign Up toggle */}
          {mfaStep === 'password' && <div className="flex gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-700/50 mb-5">
            <button
              onClick={() => { setMode('signin'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signin'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t('login.signIn')}
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t('login.signUp')}
            </button>
          </div>}

          {mfaStep === 'password' && <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && accountType === 'pastor' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('login.churchName')}</label>
                  <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={churchName}
                      onChange={(e) => setChurchName(e.target.value)}
                      className="form-input pl-9"
                      placeholder="God's Kingdom Connect Church"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('login.yourNamePastor')}</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={pastorName}
                      onChange={(e) => setPastorName(e.target.value)}
                      className="form-input pl-9"
                      placeholder="Pastor John Daniels"
                    />
                  </div>
                </div>
              </>
            )}

            {mode === 'signup' && accountType === 'coordinator' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('login.joinCode')}</label>
                  <div className="relative">
                    <KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="form-input pl-9 text-center text-lg tracking-[0.3em] font-bold uppercase"
                      placeholder="ABC123"
                      maxLength={6}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">{t('login.joinCodeHint')}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('login.yourName')}</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="form-input pl-9"
                      placeholder="Jane Smith"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('login.email')}</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="form-input pl-9"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{t('login.password')}</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type={showPassword ? 'text' : 'password'}
                  className="form-input pl-9 pr-9"
                  placeholder={mode === 'signup' ? t('login.passwordSignup') : t('login.passwordSignin')}
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                <AlertCircle size={16} className="text-rose-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50 transition-all shadow-lg ${
                accountType === 'pastor'
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/20'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {mode === 'signup' ? t('login.creatingAccount') : t('login.signingIn')}
                </>
              ) : (
                mode === 'signup'
                  ? (accountType === 'pastor' ? t('login.createPastorAccount') : t('login.createCoordinatorAccount'))
                  : t('login.signInBtn')
              )}
            </button>
          </form>}

          {mfaStep !== 'password' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center mb-5">
                <div className="inline-flex w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 items-center justify-center mb-3">
                  {mfaStep === 'phone' ? <Smartphone size={24} className="text-amber-500" /> : <ShieldCheck size={24} className="text-amber-500" />}
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{mfaStep === 'phone' ? t('login.phoneTitle') : t('login.codeTitle')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{mfaStep === 'phone' ? t('login.phoneDescription') : t('login.codeDescription')}</p>
              </div>
              {mfaStep === 'phone' ? (
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  className="form-input"
                  placeholder="+1 234 567 890"
                  autoComplete="tel"
                />
              ) : (
                <input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\\D/g, '').slice(0, 6))}
                  inputMode="numeric"
                  maxLength={6}
                  className="form-input text-center text-2xl tracking-[0.35em] font-bold"
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
              )}
              {error && <p className="text-sm text-rose-500">{error}</p>}
              <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors">
                {loading ? <><Loader2 size={18} className="animate-spin" /> {t('login.verifying')}</> : mfaStep === 'phone' ? t('login.sendCode') : t('login.verifyCode')}
              </button>
            </form>
          )}

          {mode === 'signup' && accountType === 'pastor' && mfaStep === 'password' && (
            <p className="text-center text-xs text-slate-400 mt-4">
              {t('login.pastorTrialHint')}
            </p>
          )}
          {mode === 'signup' && accountType === 'coordinator' && (
            <p className="text-center text-xs text-slate-400 mt-4">
              {t('login.coordinatorFreeHint')}
            </p>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          {t('login.secureNote')}
        </p>
      </div>
    </div>
  );
}
