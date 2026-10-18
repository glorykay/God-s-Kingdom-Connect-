import { useWorkspace } from '@/context/WorkspaceContext';
import { Church, Lock, CreditCard, Calendar, ArrowLeft, BadgeCheck, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface PaywallScreenProps {
  onLeave: () => void;
}

type Plan = 'monthly' | 'yearly';

export function PaywallScreen({ onLeave }: PaywallScreenProps) {
  const { workspace, hasFreeAccess, trialDaysLeft, isTrialActive, signOutPastor, createCheckoutSession } = useWorkspace();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('yearly');
  const [error, setError] = useState('');

  if (hasFreeAccess) return null;

  const isExpired = !isTrialActive && trialDaysLeft === 0;

  async function handleSubscribe() {
    setLoading(true);
    setError('');
    try {
      await createCheckoutSession(selectedPlan);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('paywall.errCheckout'));
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 items-center justify-center shadow-2xl shadow-amber-500/20 mb-4">
            <Church size={32} className="text-slate-900" />
          </div>
          <h1 className="text-2xl font-bold text-white">{workspace?.name}</h1>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8">
          {isExpired ? (
            <>
              {/* Trial expired */}
              <div className="text-center mb-6">
                <div className="inline-flex w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-500/10 items-center justify-center mb-3">
                  <Lock size={26} className="text-rose-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('paywall.trialEnded')}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                  {t('paywall.trialEndedDesc')}
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Trial still active but low days */}
              <div className="text-center mb-6">
                <div className="inline-flex w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-500/10 items-center justify-center mb-3">
                  <Calendar size={26} className="text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('paywall.daysLeft', { count: trialDaysLeft, unit: trialDaysLeft === 1 ? t('common.day') : t('common.days') })}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                  {t('paywall.trialEndingDesc')}
                </p>
              </div>
            </>
          )}

          {/* Plan selector */}
          <div className="space-y-3 mb-5">
            {/* Yearly plan */}
            <button
              onClick={() => setSelectedPlan('yearly')}
              className={`w-full text-left rounded-2xl p-4 border-2 transition-all relative ${
                selectedPlan === 'yearly'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 ring-2 ring-amber-500/20'
                  : 'border-slate-200 dark:border-slate-600 hover:border-amber-300 dark:hover:border-amber-500/40'
              }`}
            >
              <div className="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                <Sparkles size={10} />
                {t('paywall.yearlySave')}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedPlan === 'yearly' ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-500'
                  }`}>
                    {selectedPlan === 'yearly' && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t('paywall.yearly')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">$17.50 {t('paywall.perMonth')} · {t('paywall.cancelAnytime')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">$210</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-0.5">{t('paywall.perYear')}</span>
                </div>
              </div>
            </button>

            {/* Monthly plan */}
            <button
              onClick={() => setSelectedPlan('monthly')}
              className={`w-full text-left rounded-2xl p-4 border-2 transition-all ${
                selectedPlan === 'monthly'
                  ? 'border-amber-500 bg-amber-50 dark:bg-amber-500/10 ring-2 ring-amber-500/20'
                  : 'border-slate-200 dark:border-slate-600 hover:border-amber-300 dark:hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    selectedPlan === 'monthly' ? 'border-amber-500 bg-amber-500' : 'border-slate-300 dark:border-slate-500'
                  }`}>
                    {selectedPlan === 'monthly' && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{t('paywall.monthly')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{t('paywall.cancelAnytime')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">$21</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 ml-0.5">{t('paywall.perMonth')}</span>
                </div>
              </div>
            </button>
          </div>

          {/* Features list */}
          <div className="space-y-2.5 mb-6">
            {[
              t('paywall.feature1'),
              t('paywall.feature2'),
              t('paywall.feature3'),
              t('paywall.feature4'),
              t('paywall.feature5'),
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                  <BadgeCheck size={13} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-sm text-slate-700 dark:text-slate-300">{feature}</span>
              </div>
            ))}
          </div>

          {error && <p className="text-sm text-red-500 text-center mb-3">{error}</p>}

          {/* Subscribe button */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-60"
          >
            {loading ? <><Loader2 size={18} className="animate-spin" /> {t('paywall.redirecting')}</> : <><CreditCard size={18} /> {selectedPlan === 'yearly' ? t('paywall.subscribeYearly') : t('paywall.subscribeMonthly')}</>}
          </button>

          <p className="text-center text-xs text-slate-400 mt-3">
            {t('paywall.securePayment')}
          </p>

          {/* Leave button */}
          <button
            onClick={signOutPastor}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mt-2"
          >
            <ArrowLeft size={16} />
            {t('paywall.signOut')}
          </button>


        </div>
      </div>
    </div>
  );
}
