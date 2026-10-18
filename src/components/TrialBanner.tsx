import { useWorkspace } from '@/context/WorkspaceContext';
import { Calendar, BadgeCheck, CreditCard, AlertTriangle, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

export function TrialBanner() {
  const { trialDaysLeft, isTrialActive, hasActiveSubscription, hasFreeAccess, createCheckoutSession } = useWorkspace();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (hasFreeAccess || hasActiveSubscription) return null;
  if (!isTrialActive) return null;

  const isUrgent = trialDaysLeft <= 2;

  async function handleSubscribe() {
    setLoading(true);
    setError('');
    try {
      await createCheckoutSession();
    } catch (subscribeError) {
      setError(subscribeError instanceof Error ? subscribeError.message : 'Unable to open checkout. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div
      className={`relative rounded-2xl p-4 border flex items-center justify-between gap-4 ${
        isUrgent
          ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
          : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isUrgent
              ? 'bg-rose-100 dark:bg-rose-500/20'
              : 'bg-amber-100 dark:bg-amber-500/20'
          }`}
        >
          {isUrgent ? <AlertTriangle size={20} className="text-rose-500" /> : <Calendar size={20} className="text-amber-500" />}
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${isUrgent ? 'text-rose-700 dark:text-rose-300' : 'text-amber-700 dark:text-amber-300'}`}>
            {t('trial.daysLeft', { count: trialDaysLeft, unit: trialDaysLeft === 1 ? t('common.day') : t('common.days') })}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('trial.subscribeHint')}
          </p>
        </div>
      </div>
      <button
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors flex-shrink-0 disabled:opacity-60"
        onClick={handleSubscribe}
        disabled={loading}
      >
        {loading ? <Loader2 size={14} className="animate-spin" /> : <CreditCard size={14} />}
        {t('trial.subscribe')}
      </button>
      {error && <p className="absolute left-4 right-4 -bottom-7 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
