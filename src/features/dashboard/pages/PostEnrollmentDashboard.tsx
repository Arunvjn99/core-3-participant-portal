import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useAuth } from '@/core/hooks/useAuth'
import { useUser } from '@/core/hooks/useUser'
import { useTheme } from '@/core/hooks/useTheme'
import { formatFirstNameForDisplay, getAuthenticatedFirstName } from '@/lib/userDisplayName'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import {
  TrendingUp,
  ArrowLeftRight,
  HandCoins,
  DollarSign,
  RefreshCcw,
  Calendar,
  PieChart,
  AlertTriangle,
  Target,
  CreditCard,
  CheckSquare,
  User,
  Shield,
  ArrowDownLeft,
  Building2,
  Mail,
  CalendarDays,
} from 'lucide-react'
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { PremiumBalanceChart } from '@/features/dashboard/components/PremiumBalanceChart'

/** Card shell — uses theme tokens so light/dark follow `data-theme` on `html`. */
function SpecCard({
  children,
  className = '',
  noPadding,
}: {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}) {
  return (
    <div
      className={`rounded-[12px] border border-border-default bg-surface-card shadow-card ${noPadding ? '' : 'p-5'} ${className}`}
    >
      {children}
    </div>
  )
}

/** Denser series + smooth curve reads as a continuous growth line (end matches headline balance). */
const balanceChartData = [
  { i: 0, value: 128000 },
  { i: 1, value: 128650 },
  { i: 2, value: 128420 },
  { i: 3, value: 129800 },
  { i: 4, value: 130950 },
  { i: 5, value: 130600 },
  { i: 6, value: 132100 },
  { i: 7, value: 133400 },
  { i: 8, value: 134200 },
  { i: 9, value: 135800 },
  { i: 10, value: 137100 },
  { i: 11, value: 138950 },
  { i: 12, value: 140200 },
  { i: 13, value: 141600 },
  { i: 14, value: 142893 },
]

export default function PostEnrollmentDashboard() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { profile } = useUser()
  const { resolvedMode } = useTheme()
  const isDark = resolvedMode === 'dark'

  const firstName = useMemo(() => {
    const raw = getAuthenticatedFirstName(profile, user)
    return formatFirstNameForDisplay(raw)
  }, [profile, user])

  const subtitle = useMemo(() => {
    const h = new Date().getHours()
    let period: 'morning' | 'afternoon' | 'evening' | 'night'
    if (h >= 5 && h < 12) period = 'morning'
    else if (h >= 12 && h < 17) period = 'afternoon'
    else if (h >= 17 && h < 22) period = 'evening'
    else period = 'night'
    const lead = t(`postDashboard.greeting_${period}`, { name: firstName })
    return `${lead} ${t('postDashboard.summary_suffix')}`
  }, [firstName, t])

  const portfolioSegments = useMemo(
    () => [
      { key: 'us', label: t('postDashboard.seg_us'), pct: 55, amount: '$78,591', color: '#2563EB' },
      { key: 'intl', label: t('postDashboard.seg_intl'), pct: 25, amount: '$35,723', color: '#0D9488' },
      { key: 'bonds', label: t('postDashboard.seg_bonds'), pct: 15, amount: '$21,433', color: '#16A34A' },
      { key: 'cash', label: t('postDashboard.seg_cash'), pct: 5, amount: '$7,144', color: '#94A3B8' },
    ],
    [t]
  )

  return (
    <AnimatedPage className="min-h-full">
      <div className="min-h-screen bg-surface-page font-sans text-text-primary">
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Page header */}
          <header className="pb-6">
            <h1 className="text-[28px] font-bold leading-tight text-text-primary">{t('dashboard.overview')}</h1>
            <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">{subtitle}</p>
          </header>

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6">
            {/* LEFT ~65% */}
            <div className="flex flex-col gap-5 lg:col-span-8">
              {/* Card 1: Total balance */}
              <SpecCard className="relative overflow-hidden">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{t('dashboard.totalBalance')}</p>
                    <p className="mt-1 text-[36px] font-bold leading-none tracking-tight text-text-primary">$142,893</p>
                    <p className="mt-2 flex items-center gap-1 text-[14px] font-medium text-status-success">
                      <TrendingUp className="h-4 w-4 shrink-0" aria-hidden />
                      {t('postDashboard.quarter_return')}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-status-success-bg px-3 py-1 text-xs font-semibold text-status-success">
                    {t('postDashboard.on_track_badge')}
                  </span>
                </div>

                <div className="h-[120px] w-full">
                  <PremiumBalanceChart data={balanceChartData} isDark={isDark} />
                </div>

                <div className="mt-5 grid grid-cols-1 divide-y divide-border-default border-t border-border-default pt-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:pt-5">
                  <div className="flex items-start gap-2 pb-4 sm:pb-0 sm:pr-4">
                    <span className="text-base" aria-hidden>
                      🔒
                    </span>
                    <p className="text-[12px] text-text-secondary">
                      <span className="text-text-secondary">{t('postDashboard.vested_balance_colon')} </span>
                      <span className="font-semibold text-text-primary">$138,450</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-2 py-4 sm:px-4 sm:py-0">
                    <span className="text-base" aria-hidden>
                      📅
                    </span>
                    <p className="text-[12px] text-text-secondary">
                      <span>{t('postDashboard.retirement_label')} </span>
                      <span className="font-semibold text-text-primary">{t('postDashboard.retirement_est')}</span>
                    </p>
                  </div>
                  <div className="flex items-start gap-2 pt-4 sm:pt-0 sm:pl-4">
                    <span className="text-base" aria-hidden>
                      ⚡
                    </span>
                    <p className="text-[12px] text-text-secondary">
                      <span>{t('postDashboard.vested_short')} </span>
                      <span className="font-semibold text-text-primary">100%</span>
                    </p>
                  </div>
                </div>
              </SpecCard>

              {/* Card 2: Quick Actions — one card, 4 tiles with dividers */}
              <div>
                <h2 className="mb-3 text-[16px] font-bold text-text-primary">{t('dashboard.quickActions')}</h2>
                <SpecCard noPadding className="overflow-hidden">
                  <div className="grid grid-cols-1 divide-y divide-border-default sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                    {(
                      [
                        {
                          Icon: HandCoins,
                          title: t('dashboard.takeLoan'),
                          sub: t('transactions.qa_loan_sub'),
                          hint: t('postDashboard.take_loan_hint'),
                          href: '/transactions/loan',
                          circle: 'bg-primary/15 text-primary',
                        },
                        {
                          Icon: DollarSign,
                          title: t('dashboard.withdrawMoney'),
                          sub: t('transactions.qa_withdraw_sub'),
                          hint: t('postDashboard.withdraw_hint'),
                          href: '/transactions/withdrawal',
                          circle: 'bg-status-success-bg text-status-success',
                        },
                        {
                          Icon: ArrowLeftRight,
                          title: t('dashboard.transferFunds'),
                          sub: t('transactions.qa_transfer_sub'),
                          hint: t('postDashboard.transfer_hint'),
                          href: '/transactions/transfer',
                          circle: 'bg-primary/15 text-primary',
                        },
                        {
                          Icon: RefreshCcw,
                          title: t('dashboard.rollOver'),
                          sub: t('transactions.qa_rollover_sub'),
                          hint: t('postDashboard.rollover_hint'),
                          href: '/transactions/rollover',
                          circle: 'bg-status-success-bg text-status-success',
                        },
                      ]
                    ).map((tile) => (
                      <Link
                        key={tile.title}
                        to={tile.href}
                        className="relative block p-5 transition-colors hover:bg-surface-elevated"
                      >
                        <span className="absolute right-3 top-3 text-lg text-text-muted">›</span>
                        <div
                          className={`mb-3 flex h-10 w-10 items-center justify-center rounded-full ${tile.circle}`}
                        >
                          <tile.Icon className="h-5 w-5" aria-hidden />
                        </div>
                        <p className="pr-6 text-[13px] font-bold text-text-primary">{tile.title}</p>
                        <p className="mt-1 text-[13px] font-medium text-primary">{tile.sub}</p>
                        <p className="mt-0.5 text-[11px] text-text-secondary">{tile.hint}</p>
                      </Link>
                    ))}
                  </div>
                </SpecCard>
              </div>

              {/* Card 3: Monthly Contributions */}
              <SpecCard>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-status-success" aria-hidden />
                    <span className="text-[15px] font-bold text-text-primary">{t('dashboard.monthlyContributions')}</span>
                  </div>
                  <span className="text-[12px] text-text-secondary">{t('postDashboard.contrib_month_sample')}</span>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] text-text-secondary">{t('postDashboard.contrib_you')}</p>
                    <p className="mt-1 text-[20px] font-bold text-primary">$450</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                      <div className="h-full w-[85%] rounded-full bg-primary" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-secondary">{t('postDashboard.contrib_employer')}</p>
                    <p className="mt-1 text-[20px] font-bold text-status-success">+$225</p>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                      <div className="h-full w-[70%] rounded-full bg-status-success" />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-secondary">{t('postDashboard.contrib_total_mo')}</p>
                    <p className="mt-1 text-[20px] font-bold text-text-primary">$675</p>
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-status-success-bg px-2.5 py-0.5 text-[11px] font-semibold text-status-success">
                        <span className="h-1.5 w-1.5 rounded-full bg-status-success" aria-hidden />
                        {t('common.active')}
                      </span>
                    </div>
                  </div>
                </div>
              </SpecCard>

              {/* Learning Hub */}
              <div>
                <h2 className="mb-3 text-[18px] font-bold text-text-primary">{t('dashboard.learningHub')}</h2>
                <SpecCard noPadding className="overflow-hidden">
                  <div className="grid min-h-[220px] grid-cols-1 md:grid-cols-[35%_minmax(0,1fr)]">
                    <div className="relative flex min-h-[200px] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-600 p-6 md:min-h-0">
                      <img
                        src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=400&q=80"
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-40"
                      />
                      <div className="relative z-10 flex flex-col items-center justify-center text-center">
                        <div className="flex justify-center gap-3 text-white/90">
                          <span className="rounded-full bg-white/20 px-2 py-1 text-xs">💰</span>
                          <span className="rounded-full bg-white/20 px-2 py-1 text-xs">🏠</span>
                          <span className="rounded-full bg-white/20 px-2 py-1 text-xs">📈</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col justify-center p-6 md:p-8">
                      <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-md border border-border-default bg-surface-elevated px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-text-primary">
                        <span className="h-1.5 w-1.5 rounded-full bg-status-success" aria-hidden />
                        {t('postDashboard.retirement_planning_badge')}
                      </span>
                      <h3 className="text-[22px] font-bold text-text-primary">{t('postDashboard.financial_wellness_title')}</h3>
                      <p className="mt-2 text-[14px] leading-relaxed text-text-secondary">
                        {t('postDashboard.learning_blurb')}
                      </p>
                      <Link
                        to="/post-enrollment-dashboard"
                        className="mt-4 inline-flex w-fit items-center gap-1 text-[14px] font-semibold text-primary underline-offset-2 hover:underline"
                      >
                        {t('postDashboard.know_more_arrow')}
                      </Link>
                    </div>
                  </div>
                </SpecCard>
              </div>

              {/* Card 4: Portfolio Allocation */}
              <SpecCard>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-text-secondary" aria-hidden />
                      <span className="text-[15px] font-bold text-text-primary">{t('dashboard.portfolioAllocation')}</span>
                    </div>
                    <p className="mt-0.5 pl-7 text-[12px] text-text-secondary">{t('postDashboard.current_asset_mix')}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                    <span className="h-2 w-2 rounded-full bg-status-warning" aria-hidden />
                    {t('postDashboard.risk_profile_moderate_agg')}
                  </div>
                </div>
                <div className="mb-1 flex justify-between px-0.5 text-[11px] text-text-muted">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-md">
                  {portfolioSegments.map((s) => (
                    <div
                      key={s.key}
                      style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                      title={`${s.label} ${s.pct}%`}
                    />
                  ))}
                </div>
                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {portfolioSegments.map((s) => (
                    <div key={s.key}>
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
                          {s.label}
                        </span>
                      </div>
                      <p className="mt-1 text-[16px] font-bold text-text-primary">{s.pct}%</p>
                      <p className="text-[12px] text-text-secondary">{s.amount}</p>
                    </div>
                  ))}
                </div>
              </SpecCard>

            </div>

            {/* RIGHT ~35% */}
            <aside className="flex flex-col gap-5 lg:col-span-4">
              {/* Hardship */}
              <SpecCard className="border-l-4 border-l-status-warning pl-4">
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-status-warning" aria-hidden />
                    <span className="text-[14px] font-bold text-text-primary">{t('postDashboard.hardship_title')}</span>
                  </div>
                  <span className="rounded-full bg-status-warning-bg px-2.5 py-0.5 text-[11px] font-bold text-status-warning">
                    {t('common.pending').toUpperCase()}
                  </span>
                </div>
                <p className="text-[12px] text-text-secondary">{t('postDashboard.request_line')}</p>
                <div className="mt-3 h-1 w-full overflow-hidden rounded-sm bg-surface-elevated">
                  <div className="h-full w-[60%] rounded-sm bg-gradient-to-r from-amber-400 to-amber-500" />
                </div>
                <p className="mt-1 text-right text-[11px] text-text-secondary">{t('postDashboard.under_review')}</p>
              </SpecCard>

              {/* Recent Activity */}
              <SpecCard>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[15px] font-bold text-text-primary">{t('dashboard.recentActivity')}</h3>
                  <Link to="/post-enrollment-dashboard" className="text-[13px] font-semibold text-primary hover:underline">
                    {t('postDashboard.view_all_arrow')}
                  </Link>
                </div>
                <ul className="divide-y divide-border-default">
                  <li className="flex gap-4 py-4 first:pt-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-success-bg text-status-success">
                      <ArrowDownLeft className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-text-primary">{t('postDashboard.activity_contribution')}</p>
                      <p className="text-[12px] text-text-secondary">{t('postDashboard.activity_payroll')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-status-success">+$450.00</p>
                      <p className="text-[12px] text-text-secondary">{t('postDashboard.sample_date_oct')}</p>
                    </div>
                  </li>
                  <li className="flex gap-4 py-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Building2 className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-text-primary">{t('postDashboard.activity_employer_match')}</p>
                      <p className="text-[12px] text-text-secondary">{t('postDashboard.activity_safe_harbor')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-status-success">+$225.00</p>
                      <p className="text-[12px] text-text-secondary">{t('postDashboard.sample_date_oct')}</p>
                    </div>
                  </li>
                  <li className="flex gap-4 py-4 last:pb-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-text-secondary">
                      <RefreshCcw className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-text-primary">{t('postDashboard.activity_rebalance')}</p>
                      <p className="text-[12px] text-text-secondary">{t('postDashboard.activity_auto_quarterly')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-medium text-text-secondary">{t('common.completed')}</p>
                      <p className="text-[12px] text-text-secondary">{t('postDashboard.sample_date_oct1')}</p>
                    </div>
                  </li>
                </ul>
              </SpecCard>

              {/* Readiness */}
              <SpecCard className="text-center">
                <div className="mb-4 flex items-center justify-center gap-2">
                  <Target className="h-5 w-5 text-status-success" aria-hidden />
                  <span className="text-[15px] font-bold text-text-primary">{t('dashboard.readinessScore')}</span>
                </div>
                <div className="relative mx-auto h-[140px] w-[140px] text-text-primary [&_.recharts-surface]:overflow-visible">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="78%"
                      outerRadius="100%"
                      barSize={10}
                      data={[{ value: 80 }]}
                      startAngle={90}
                      endAngle={450}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar
                        background={{ fill: isDark ? 'rgba(148, 163, 184, 0.22)' : '#E5E7EB' }}
                        dataKey="value"
                        cornerRadius={6}
                        fill="var(--status-success)"
                        animationDuration={1000}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                    <span className="text-[36px] font-bold leading-none text-text-primary">80</span>
                    <span className="text-[14px] text-text-secondary">/100</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-1.5 text-[14px] font-semibold text-status-success">
                  <span className="h-2 w-2 rounded-full bg-status-success" aria-hidden />
                  {t('dashboard.onTrack')}
                </div>
                <p className="mx-auto mt-3 max-w-[260px] text-[12px] leading-relaxed text-text-secondary">
                  {t('postDashboard.projected_income')}
                </p>
                <button type="button" className="btn-brand mt-5 w-full">
                  {t('dashboard.launchSimulator')}
                </button>
              </SpecCard>

              {/* Active Loan */}
              <SpecCard>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" aria-hidden />
                    <span className="text-[14px] font-bold text-text-primary">{t('dashboard.activeLoan')}</span>
                  </div>
                  <button type="button" className="text-[12px] font-semibold text-primary hover:underline">
                    {t('postDashboard.request_new_loan')}
                  </button>
                </div>
                <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                  <p className="text-[13px] font-bold text-text-primary">{t('postDashboard.loan_line_gp')}</p>
                  <span className="rounded-full bg-status-success-bg px-2 py-0.5 text-[11px] font-semibold text-status-success">
                    {t('common.active')}
                  </span>
                </div>
                <p className="text-[11px] text-text-secondary">{t('postDashboard.originated')}</p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">{t('postDashboard.remaining')}</p>
                    <p className="mt-1 text-[18px] font-bold text-text-primary">$2,450</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">{t('postDashboard.next_payment')}</p>
                    <p className="mt-1 text-[14px] font-bold text-text-primary">
                      {t('postDashboard.loan_payment_line')}
                    </p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-[3px] bg-surface-elevated">
                  <div className="h-full w-[60%] rounded-[3px] bg-status-success" />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-text-secondary">
                  <span>{t('postDashboard.paid_off_progress')}</span>
                  <span>{t('postDashboard.payments_left')}</span>
                </div>
              </SpecCard>

              {/* Next Best Actions */}
              <SpecCard>
                <div className="mb-4 flex items-center gap-2">
                  <CheckSquare className="h-4 w-4 text-text-secondary" aria-hidden />
                  <span className="text-[14px] font-bold text-text-primary">{t('dashboard.nextBestActions')}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 rounded-[12px] border border-status-danger/20 bg-status-danger-bg p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-danger/15 text-status-danger">
                      <User className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="text-[13px] font-bold text-text-primary">{t('postDashboard.action_beneficiary')}</p>
                        <span className="shrink-0 rounded bg-status-danger/20 px-2 py-0.5 text-[10px] font-bold text-status-danger">
                          {t('postDashboard.badge_required')}
                        </span>
                      </div>
                      <p className="mt-1 text-[12px] text-text-secondary">{t('postDashboard.action_beneficiary_sub')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-[12px] border border-border-default bg-surface-elevated p-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-page text-text-secondary">
                      <Shield className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[13px] font-bold text-text-primary">{t('postDashboard.action_risk')}</p>
                        <span className="text-lg text-text-muted">›</span>
                      </div>
                      <p className="mt-1 text-[12px] text-text-secondary">{t('postDashboard.action_risk_sub')}</p>
                    </div>
                  </div>
                </div>
              </SpecCard>

              {/* Your Advisor */}
              <div
                className="overflow-hidden rounded-[12px] border border-border-default shadow-card"
                style={{
                  background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%)',
                }}
              >
                <div className="relative p-5 pt-6 text-white">
                  <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="Sarah Jenkins"
                    className="absolute right-5 top-5 h-[70px] w-[70px] rounded-full border-2 border-white object-cover ring-2 ring-white/30"
                  />
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/80">{t('dashboard.yourAdvisor')}</p>
                  <h3 className="mt-2 pr-20 text-[20px] font-bold">Sarah Jenkins</h3>
                  <p className="mt-1 text-[13px] text-blue-100">{t('postDashboard.advisor_title_role')}</p>
                  <div className="mt-6 grid grid-cols-3 divide-x divide-white/20 text-center">
                    <div className="px-2">
                      <p className="text-[16px] font-bold">4.9</p>
                      <p className="text-[11px] text-white/70">{t('postDashboard.advisor_rating')}</p>
                    </div>
                    <div className="px-2">
                      <p className="text-[16px] font-bold">12yr</p>
                      <p className="text-[11px] text-white/70">{t('postDashboard.advisor_experience')}</p>
                    </div>
                    <div className="px-2">
                      <p className="text-[16px] font-bold">240+</p>
                      <p className="text-[11px] text-white/70">{t('postDashboard.advisor_clients')}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-[12px] leading-relaxed text-white/90">
                    {t('postDashboard.advisor_bio')}
                  </p>
                  <div className="mt-5 flex gap-2.5">
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border-2 border-white py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      <Mail className="h-4 w-4" aria-hidden />
                      {t('dashboard.message')}
                    </button>
                    <button
                      type="button"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-white py-2.5 text-sm font-semibold text-primary shadow-sm transition hover:bg-slate-100"
                    >
                      <CalendarDays className="h-4 w-4" aria-hidden />
                      {t('dashboard.scheduleCall')}
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
