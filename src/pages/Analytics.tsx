import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useWorkspace } from '@/context/WorkspaceContext';
import { Attendance, Service } from '@/types';
import { BarChart, LineChart, DonutChart, MultiLineChart } from '@/components/Charts';
import { TrendingUp, Calendar, Users, Award } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';

export function Analytics() {
  const { workspace } = useWorkspace();
  const { t } = useLanguage();
  const wid = workspace?.id ?? '';
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (wid) loadData(); }, [wid]);

  async function loadData() {
    setLoading(true);
    const [attRes, svcRes] = await Promise.all([
      supabase.from('attendance').select('*').eq('workspace_id', wid),
      supabase.from('services').select('*').eq('workspace_id', wid),
    ]);
    setAttendance(attRes.data ?? []);
    setServices(svcRes.data ?? []);
    setLoading(false);
  }

  const weeklyData = useMemo(() => {
    const weeks: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7 - now.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const count = attendance.filter((a) => {
        const d = new Date(a.timestamp);
        return d >= weekStart && d <= weekEnd;
      }).length;
      weeks.push({
        label: weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        value: count,
      });
    }
    return weeks;
  }, [attendance]);

  const monthlyData = useMemo(() => {
    const months: { label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);
      const count = attendance.filter((a) => {
        const d = new Date(a.timestamp);
        return d >= monthStart && d <= monthEnd;
      }).length;
      months.push({
        label: monthStart.toLocaleDateString(undefined, { month: 'short' }),
        value: count,
      });
    }
    return months;
  }, [attendance]);

  const yearlyData = useMemo(() => {
    const years: { label: string; value: number }[] = [];
    const currentYear = new Date().getFullYear();
    for (let i = 4; i >= 0; i--) {
      const year = currentYear - i;
      const count = attendance.filter((a) => new Date(a.timestamp).getFullYear() === year).length;
      years.push({ label: String(year), value: count });
    }
    return years;
  }, [attendance]);

  const topServices = useMemo(() => {
    const counts: Record<string, number> = {};
    attendance.forEach((a) => {
      counts[a.service_id] = (counts[a.service_id] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([id, count]) => ({
        name: services.find((s) => s.id === id)?.name ?? t('common.unknown'),
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [attendance, services]);

  const donutData = useMemo(() => {
    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6'];
    return topServices.map((s, i) => ({
      label: s.name,
      value: s.count,
      color: colors[i % colors.length],
    }));
  }, [topServices]);

  const comparisonData = useMemo(() => {
    const recentServices = [...services]
      .sort((a, b) => new Date(b.service_date).getTime() - new Date(a.service_date).getTime())
      .slice(0, 8)
      .reverse();

    const labels = recentServices.map((s) =>
      `${s.name} ${new Date(s.service_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    );

    const totalSeries = recentServices.map((s) =>
      attendance.filter((a) => a.service_id === s.id).length
    );
    const newcomerSeries = recentServices.map((s) =>
      attendance.filter((a) => a.service_id === s.id && a.is_new_comer).length
    );

    return {
      labels,
      series: [
        { name: t('analytics.totalAttendance'), color: '#3b82f6', values: totalSeries },
        { name: t('analytics.newComers'), color: '#10b981', values: newcomerSeries },
      ],
    };
  }, [services, attendance, t]);

  const totalAttendance = attendance.length;
  const newComers = attendance.filter((a) => a.is_new_comer).length;
  const avgWeekly = weeklyData.length > 0 ? Math.round(weeklyData.reduce((s, d) => s + d.value, 0) / weeklyData.length) : 0;
  const topService = topServices[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('analytics.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t('analytics.subtitle')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={TrendingUp} label={t('analytics.totalAttendance')} value={totalAttendance} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-500/10" />
        <KPICard icon={Users} label={t('analytics.newComers')} value={newComers} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-500/10" />
        <KPICard icon={Calendar} label={t('analytics.avgWeekly')} value={avgWeekly} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-500/10" />
        <KPICard icon={Award} label={t('analytics.topService')} value={topService?.name ?? '—'} color="text-rose-600 dark:text-rose-400" bg="bg-rose-50 dark:bg-rose-500/10" small />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title={t('analytics.weeklyAttendance')} subtitle={t('analytics.last8Weeks')}>
          <BarChart data={weeklyData} color="#3b82f6" />
        </ChartCard>
        <ChartCard title={t('analytics.monthlyAttendance')} subtitle={t('analytics.last6Months')}>
          <LineChart data={monthlyData} color="#10b981" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title={t('analytics.yearlyAttendance')} subtitle={t('analytics.last5Years')} className="lg:col-span-2">
          <BarChart data={yearlyData} color="#f59e0b" />
        </ChartCard>
        <ChartCard title={t('analytics.serviceDistribution')} subtitle={t('analytics.byAttendance')}>
          <div className="flex flex-col items-center gap-4 pt-2">
            <DonutChart data={donutData} />
            <div className="w-full space-y-2">
              {topServices.map((s, i) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: donutData[i]?.color ?? '#ccc' }} />
                    <span className="text-slate-600 dark:text-slate-300 truncate">{s.name}</span>
                  </div>
                  <span className="font-semibold text-slate-900 dark:text-white">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* Service Comparison */}
      <ChartCard title={t('analytics.serviceComparison')} subtitle={t('analytics.serviceComparisonSubtitle')}>
        {comparisonData.labels.length < 2 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t('analytics.noData')}</p>
        ) : (
          <MultiLineChart labels={comparisonData.labels} series={comparisonData.series} />
        )}
      </ChartCard>

      {/* Top Services Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="font-bold text-slate-900 dark:text-white">{t('analytics.topServicesByAttendance')}</h2>
        </div>
        {topServices.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">{t('analytics.noData')}</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="text-left text-xs font-medium text-slate-400 uppercase px-5 py-3">{t('analytics.rank')}</th>
                <th className="text-left text-xs font-medium text-slate-400 uppercase px-5 py-3">{t('analytics.service')}</th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase px-5 py-3">{t('analytics.attendance')}</th>
                <th className="text-right text-xs font-medium text-slate-400 uppercase px-5 py-3">{t('analytics.percentage')}</th>
              </tr>
            </thead>
            <tbody>
              {topServices.map((s, i) => (
                <tr key={s.name} className="border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs font-bold">
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-900 dark:text-white">{s.name}</td>
                  <td className="px-5 py-3 text-sm text-slate-600 dark:text-slate-300 text-right font-semibold">{s.count}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-24 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                        <div className="h-full rounded-full bg-amber-500" style={{ width: `${totalAttendance > 0 ? (s.count / totalAttendance) * 100 : 0}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-10 text-right">
                        {totalAttendance > 0 ? Math.round((s.count / totalAttendance) * 100) : 0}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color, bg, small }: {
  icon: typeof TrendingUp;
  label: string;
  value: number | string;
  color: string;
  bg: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon size={20} className={color} />
      </div>
      <p className={`font-bold text-slate-900 dark:text-white mt-3 ${small ? 'text-lg' : 'text-3xl'}`}>{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = '' }: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 ${className}`}>
      <div className="mb-4">
        <h2 className="font-bold text-slate-900 dark:text-white">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
