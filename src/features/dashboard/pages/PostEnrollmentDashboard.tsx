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
  Target,
  CreditCard,
  CheckSquare,
  User,
  Shield,
  ArrowDownLeft,
  Building2,
  Mail,
  CalendarDays,
  Lock,
  Zap,
  ChevronRight,
} from 'lucide-react'
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { NotificationBanner } from '@/features/notifications/NotificationBanner'
import { ContributionLimitsCard } from '@/features/contributions/ContributionLimitsCard'
import { PremiumBalanceChart } from '@/features/dashboard/components/PremiumBalanceChart'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { PLANS, allHoldings, byAssetClass, weightedReturn } from '@/features/portfolio/portfolioData'
import { annualEmployerMatch, missedEmployerMatch, projectBalance, retirementIncome } from '@/features/enrollment/enrollmentMath'
import { getGrowthRate } from '@/lib/retirementCalculations'
import { getAppDateLocale } from '@/lib/dateLocale'

/** Card surfaces from the pre-enrollment dashboard, so both dashboards share one look in light and dark. */
const CARD_TONES = {
  plain: 'bg-surface-card ring-1 ring-slate-200/70 dark:ring-white/10',
  /** Same wash as the Enrich card */
  blue: 'bg-[radial-gradient(90%_120%_at_0%_0%,#D9F3FF_0%,rgba(217,243,255,0)_60%),radial-gradient(70%_130%_at_100%_100%,#DCE1FB_0%,rgba(220,225,251,0)_65%),linear-gradient(#F8F9FE,#F8F9FE)] ring-1 ring-slate-200/70 dark:bg-[radial-gradient(90%_120%_at_0%_0%,#12305C_0%,rgba(18,48,92,0)_60%),radial-gradient(70%_130%_at_100%_100%,#262F86_0%,rgba(38,47,134,0)_65%),linear-gradient(#0B1436,#0B1436)] dark:ring-white/10',
  /** Same wash as the Ask Core AI card */
  sky: 'bg-[linear-gradient(180deg,#EAF2FF_0%,#F6F9FF_100%)] ring-1 ring-blue-100 dark:bg-[linear-gradient(180deg,rgba(59,130,246,0.16)_0%,rgba(15,23,42,1)_100%)] dark:ring-blue-400/20',
  /** Same green corner as the banner */
  green: 'bg-[radial-gradient(80%_120%_at_100%_100%,#DDF9E3_0%,rgba(221,249,227,0)_60%),linear-gradient(#FFFFFF,#FFFFFF)] ring-1 ring-slate-200/70 dark:bg-[radial-gradient(80%_120%_at_100%_100%,#123F46_0%,rgba(18,63,70,0)_60%),linear-gradient(#0B1436,#0B1436)] dark:ring-white/10',
} as const

/** Card shell: rounded 20px with a soft ring, like the pre-enrollment cards. */
function SpecCard({
  children,
  className = '',
  noPadding,
  tone = 'plain',
}: {
  children: React.ReactNode
  className?: string
  noPadding?: boolean
  tone?: keyof typeof CARD_TONES
}) {
  return (
    <div className={`rounded-[20px] shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ${CARD_TONES[tone]} ${noPadding ? '' : 'p-5'} ${className}`}>
      {children}
    </div>
  )
}

/** Solid icon badge beside a card title, like the Enrich card's. */
function TitleBadge({ Icon, color }: { Icon: React.ComponentType<{ className?: string }>; color: string }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_16px_-8px_rgba(11,21,51,0.45)] ${color}`}
      aria-hidden
    >
      <Icon className="h-4 w-4" />
    </span>
  )
}

/** Shape of the balance line; scaled so its last point equals the account balance. */
const balanceChartShape = [
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

  const locale = getAppDateLocale()
  const money = (v: number, cents = false) =>
    `$${v.toLocaleString(locale, { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`

  // ── Account: same balance, vested amount and holdings as Account Summary ──
  const election = useElectionsStore((s) => s.investment)
  const account = PLANS[0]
  const holdings = useMemo(() => allHoldings(election), [election])
  const quarterReturn = Math.round(weightedReturn(holdings, '3M') * 10) / 10
  const vestedPct = Math.round((account.vested / account.balance) * 100)
  const balanceChartData = useMemo(() => {
    const scale = account.balance / balanceChartShape[balanceChartShape.length - 1].value
    return balanceChartShape.map((p) => ({ ...p, value: Math.round(p.value * scale) }))
  }, [account.balance])

  // ── Enrollment: contributions, match and readiness use the same math as the enrollment steps ──
  const { data, personalization } = useEnrollment()
  const yearsToRetirement = Math.max(0, personalization.retirementAge - personalization.currentAge)
  const retirementYear = new Date().getFullYear() + yearsToRetirement
  const monthlyYou = Math.round((data.salary * data.contributionPercent) / 100 / 12)
  const annualMatch = annualEmployerMatch(data.salary, data.contributionPercent, data.contributionSources)
  const monthlyMatch = Math.round(annualMatch / 12)
  const monthlyTotal = monthlyYou + monthlyMatch
  const fullMatch = annualMatch + missedEmployerMatch(data.salary, data.contributionPercent, data.contributionSources)
  const employerPct = data.salary > 0 ? Math.round((annualMatch / data.salary) * 1000) / 10 : 0
  const income = retirementIncome(
    projectBalance({
      startingBalance: personalization.currentSavings,
      salary: data.salary,
      ratePercent: data.contributionPercent,
      sources: data.contributionSources,
      years: yearsToRetirement,
      growthRate: getGrowthRate(data.riskLevel),
      autoIncrease: data.autoIncrease ? { amount: data.autoIncreaseAmount, max: data.autoIncreaseMax } : null,
    }),
    yearsToRetirement,
    data.salary,
  )
  const readiness = income.readinessPct
  const replacePct = data.salary > 0 ? Math.round((income.total / data.salary) * 100) : 0
  // "On track" from 80, the same point where the Readiness step says "You're on a great track"
  const onTrack = readiness >= 80
  const contributionMonth = new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' })

  const riskDot: Record<typeof data.riskLevel, string> = {
    conservative: 'bg-emerald-500',
    balanced: 'bg-blue-500',
    growth: 'bg-status-warning',
    aggressive: 'bg-status-danger',
  }

  const segmentStyle: Record<string, { labelKey: string; color: string }> = {
    'U.S. Equity': { labelKey: 'postDashboard.seg_us', color: 'var(--chart-blue)' },
    'International Equity': { labelKey: 'postDashboard.seg_intl', color: 'var(--chart-teal)' },
    'Taxable Bond': { labelKey: 'postDashboard.seg_bonds', color: 'var(--chart-green-dark)' },
    'Real Estate': { labelKey: 'postDashboard.seg_real_estate', color: 'var(--chart-amber)' },
  }
  const portfolioSegments = useMemo(() => {
    const groups = byAssetClass(holdings)
    const total = groups.reduce((s, g) => s + g.value, 0)
    return groups.map((g) => ({
      key: g.assetClass,
      label: segmentStyle[g.assetClass] ? t(segmentStyle[g.assetClass].labelKey) : g.assetClass,
      pct: total > 0 ? Math.round((g.value / total) * 100) : 0,
      amount: money(Math.round(g.value)),
      color: segmentStyle[g.assetClass]?.color ?? 'var(--chart-gray)',
    })).map((s, i, all) => {
      // Any rounding point goes to the largest class so the bar adds up to 100%
      const diff = 100 - all.reduce((a, b) => a + b.pct, 0)
      return i === 0 && total > 0 ? { ...s, pct: s.pct + diff } : s
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings, t, locale])

  return (
    <AnimatedPage className="min-h-full">
      <div className="min-h-screen bg-surface-page font-sans text-text-primary">
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {/* Page header: the pre-enrollment banner's wash, greeting above the title */}
          <header className="relative isolate mb-6 flex flex-col-reverse overflow-hidden rounded-[24px] bg-[radial-gradient(90%_120%_at_0%_0%,#D9F3FF_0%,rgba(217,243,255,0)_60%),radial-gradient(80%_120%_at_100%_100%,#DDF9E3_0%,rgba(221,249,227,0)_60%),linear-gradient(#FFFFFF,#FFFFFF)] px-6 py-6 ring-1 ring-slate-200/70 sm:px-8 dark:bg-[radial-gradient(90%_120%_at_0%_0%,#12305C_0%,rgba(18,48,92,0)_60%),radial-gradient(80%_120%_at_100%_100%,#123F46_0%,rgba(18,63,70,0)_60%),linear-gradient(#0B1436,#0B1436)] dark:ring-white/10">
            <span className="pointer-events-none absolute -right-16 -top-20 -z-10 h-56 w-72 rounded-full bg-[#8C9BFF] opacity-20 blur-[70px] dark:bg-[#5B6BFF] dark:opacity-30" aria-hidden />
            <h1 className="mt-2 text-[28px] font-bold leading-tight text-[#0B1533] dark:text-white">{t('dashboard.overview')}</h1>
            <p className="text-[14px] font-medium leading-relaxed text-slate-700 dark:text-slate-300">{subtitle}</p>
          </header>

          <NotificationBanner />

          <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:gap-6">
            {/* LEFT ~65% */}
            <div className="flex flex-col gap-5 lg:col-span-8">
              {/* Card 1: Total balance */}
              <SpecCard tone="blue" className="relative overflow-hidden">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{t('dashboard.totalBalance')}</p>
                    <p className="mt-1 text-[36px] font-bold leading-none tracking-tight text-text-primary">{money(Math.round(account.balance))}</p>
                    <p className={`mt-2 flex items-center gap-1 text-[14px] font-medium ${quarterReturn >= 0 ? 'text-status-success' : 'text-status-danger'}`}>
                      <TrendingUp className={`h-4 w-4 shrink-0 ${quarterReturn < 0 ? 'rotate-180' : ''}`} aria-hidden />
                      {t('postDashboard.quarter_return', { pct: quarterReturn })}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${onTrack ? 'bg-status-success-bg text-status-success' : 'bg-status-warning-bg text-status-warning'}`}>
                      {onTrack ? t('postDashboard.on_track_badge') : t('postDashboard.status_needs_attention')}
                    </span>
                    <Link to="/account-summary" className="mt-2 text-xs font-semibold text-primary hover:underline">
                      {t('portfolio.view_summary')}
                    </Link>
                  </div>
                </div>

                <div className="h-[120px] w-full">
                  <PremiumBalanceChart data={balanceChartData} isDark={isDark} />
                </div>

                <div className="mt-5 grid grid-cols-1 divide-y divide-slate-200/80 border-t border-slate-200/80 pt-5 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:pt-5 dark:divide-white/10 dark:border-white/10">
                  <div className="flex items-center gap-2 pb-4 sm:pb-0 sm:pr-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/80 text-blue-600 ring-1 ring-slate-200/70 dark:bg-white/10 dark:text-blue-300 dark:ring-white/10" aria-hidden>
                      <Lock className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-[12px] text-text-secondary">
                      <span className="text-text-secondary">{t('postDashboard.vested_balance_colon')} </span>
                      <span className="font-semibold text-text-primary">{money(Math.round(account.vested))}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 py-4 sm:px-4 sm:py-0">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/80 text-blue-600 ring-1 ring-slate-200/70 dark:bg-white/10 dark:text-blue-300 dark:ring-white/10" aria-hidden>
                      <CalendarDays className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-[12px] text-text-secondary">
                      <span>{t('postDashboard.retirement_label')} </span>
                      <span className="font-semibold text-text-primary">{t('postDashboard.retirement_est', { year: retirementYear })}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 pt-4 sm:pt-0 sm:pl-4">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/80 text-blue-600 ring-1 ring-slate-200/70 dark:bg-white/10 dark:text-blue-300 dark:ring-white/10" aria-hidden>
                      <Zap className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-[12px] text-text-secondary">
                      <span>{t('postDashboard.vested_short')} </span>
                      <span className="font-semibold text-text-primary">{vestedPct}%</span>
                    </p>
                  </div>
                </div>
              </SpecCard>

              {/* Card 2: Quick Actions — one card, 4 tiles with dividers */}
              <div>
                <h2 className="mb-4 text-[22px] font-bold leading-tight text-text-primary">{t('dashboard.quickActions')}</h2>
                <SpecCard noPadding className="overflow-hidden">
                  <div className="grid grid-cols-1 divide-y divide-slate-200/80 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 dark:divide-white/10">
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
                          className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${tile.circle}`}
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
              <SpecCard tone="green">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <TitleBadge Icon={Calendar} color="bg-emerald-600" />
                    <span className="text-[16px] font-bold text-text-primary">{t('dashboard.monthlyContributions')}</span>
                  </div>
                  <span className="text-[12px] text-text-secondary">{t('postDashboard.contrib_month_sample', { month: contributionMonth })}</span>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                  <div>
                    <p className="text-[11px] text-text-secondary">{t('postDashboard.contrib_you', { pct: data.contributionPercent })}</p>
                    <p className="mt-1 text-[20px] font-bold text-primary">{money(monthlyYou)}</p>
                    {/* Your share of what goes in each month */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${monthlyTotal > 0 ? (monthlyYou / monthlyTotal) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-secondary">{t('postDashboard.contrib_employer', { pct: employerPct })}</p>
                    <p className="mt-1 text-[20px] font-bold text-status-success">+{money(monthlyMatch)}</p>
                    {/* How much of the full employer match you're getting */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                      <div className="h-full rounded-full bg-status-success" style={{ width: `${fullMatch > 0 ? (annualMatch / fullMatch) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] text-text-secondary">{t('postDashboard.contrib_total_mo')}</p>
                    <p className="mt-1 text-[20px] font-bold text-text-primary">{money(monthlyTotal)}</p>
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
                <h2 className="mb-4 text-[22px] font-bold leading-tight text-text-primary">{t('dashboard.learningHub')}</h2>
                <SpecCard noPadding className="overflow-hidden">
                  <div className="grid min-h-[220px] grid-cols-1 md:grid-cols-[35%_minmax(0,1fr)]">
                    <div className="relative flex min-h-[200px] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-500 via-blue-600 to-violet-600 p-6 md:min-h-0">
                      <img
                        src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=80"
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
                      {/* Same pill as Start learning on the pre-enrollment dashboard */}
                      <Link
                        to="/post-enrollment-dashboard"
                        className="mt-4 inline-flex h-10 w-fit items-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(11,21,51,0.35)] dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
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
                    <div className="flex items-center gap-2.5">
                      <TitleBadge Icon={PieChart} color="bg-blue-600" />
                      <span className="text-[16px] font-bold text-text-primary">{t('dashboard.portfolioAllocation')}</span>
                    </div>
                    <p className="mt-0.5 pl-[42px] text-[12px] text-text-secondary">{t('postDashboard.current_asset_mix')}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
                    <span className={`h-2 w-2 rounded-full ${riskDot[data.riskLevel]}`} aria-hidden />
                    {t(`enrollment.investment.risk_short_${data.riskLevel}`)}
                  </div>
                </div>
                <div className="mb-1 flex justify-between px-0.5 text-[11px] text-text-muted">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full">
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
              {/* Readiness */}
              <SpecCard tone="sky" className="text-center">
                <div className="mb-4 flex items-center justify-center gap-2.5">
                  <TitleBadge Icon={Target} color="bg-emerald-600" />
                  <span className="text-[16px] font-bold text-text-primary">{t('dashboard.readinessScore')}</span>
                </div>
                <div className="relative mx-auto h-[140px] w-[140px] text-text-primary [&_.recharts-surface]:overflow-visible">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%"
                      cy="50%"
                      innerRadius="78%"
                      outerRadius="100%"
                      barSize={10}
                      data={[{ value: readiness }]}
                      startAngle={90}
                      endAngle={450}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar
                        background={{ fill: isDark ? 'var(--chart-grid-muted)' : 'var(--chart-grid)' }}
                        dataKey="value"
                        cornerRadius={6}
                        fill={onTrack ? 'var(--status-success)' : 'var(--status-warning)'}
                        animationDuration={1000}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pt-1">
                    <span className="text-[36px] font-bold leading-none text-text-primary">{readiness}</span>
                    <span className="text-[14px] text-text-secondary">/100</span>
                  </div>
                </div>
                <div className={`mt-3 flex items-center justify-center gap-1.5 text-[14px] font-semibold ${onTrack ? 'text-status-success' : 'text-status-warning'}`}>
                  <span className={`h-2 w-2 rounded-full ${onTrack ? 'bg-status-success' : 'bg-status-warning'}`} aria-hidden />
                  {onTrack ? t('dashboard.onTrack') : t('postDashboard.status_needs_attention')}
                </div>
                <p className="mx-auto mt-3 max-w-[260px] text-[12px] leading-relaxed text-text-secondary">
                  {t('postDashboard.projected_income', { pct: replacePct })}
                </p>
                {/* Same pill as Start chatting on the pre-enrollment dashboard */}
                <Link
                  to="/retirement-goal"
                  className="mt-5 inline-flex h-10 items-center gap-1 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(11,21,51,0.35)] dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)]"
                >
                  {t('dashboard.launchSimulator')}
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Link>
              </SpecCard>

              <ContributionLimitsCard />

              {/* Active Loan */}
              <SpecCard>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <TitleBadge Icon={CreditCard} color="bg-blue-600" />
                    <span className="text-[16px] font-bold text-text-primary">{t('dashboard.activeLoan')}</span>
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
                <p className="mt-0.5 text-[10px] font-mono text-text-muted">LOAN-2024-001</p>
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
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated">
                  <div className="h-full w-[60%] rounded-full bg-status-success" />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-text-secondary">
                  <span>{t('postDashboard.paid_off_progress')}</span>
                  <span>{t('postDashboard.payments_left')}</span>
                </div>
              </SpecCard>

              {/* Your Advisor */}
              <div
                className="overflow-hidden rounded-[20px] shadow-[0_12px_32px_-24px_rgba(11,21,51,0.6)] ring-1 ring-white/10"
                style={{
                  background: 'linear-gradient(135deg, var(--gradient-dark-start), var(--gradient-dark-end))',
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
                    <Link
                      to="/advisor?tab=messages"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full border-2 border-white py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                    >
                      <Mail className="h-4 w-4" aria-hidden />
                      {t('dashboard.message')}
                    </Link>
                    <Link
                      to="/advisor?tab=meetings"
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white py-2.5 text-sm font-semibold text-primary shadow-sm transition hover:bg-slate-100"
                    >
                      <CalendarDays className="h-4 w-4" aria-hidden />
                      {t('dashboard.scheduleCall')}
                    </Link>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <SpecCard>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[16px] font-bold text-text-primary">{t('dashboard.recentActivity')}</h3>
                  <Link to="/post-enrollment-dashboard" className="text-[13px] font-semibold text-primary hover:underline">
                    {t('postDashboard.view_all_arrow')}
                  </Link>
                </div>
                <ul className="divide-y divide-slate-200/80 dark:divide-white/10">
                  <li className="flex gap-4 py-4 first:pt-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-success-bg text-status-success">
                      <ArrowDownLeft className="h-5 w-5" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-text-primary">{t('postDashboard.activity_contribution')}</p>
                      <p className="text-[12px] text-text-secondary">{t('postDashboard.activity_payroll')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-status-success">+{money(monthlyYou, true)}</p>
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
                      <p className="font-bold text-status-success">+{money(monthlyMatch, true)}</p>
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

              {/* Next Best Actions */}
              <SpecCard>
                <div className="mb-4 flex items-center gap-2.5">
                  <TitleBadge Icon={CheckSquare} color="bg-slate-700 dark:bg-slate-600" />
                  <span className="text-[16px] font-bold text-text-primary">{t('dashboard.nextBestActions')}</span>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-3 rounded-2xl border border-status-danger/20 bg-status-danger-bg p-4">
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
                  <div className="flex items-center gap-3 rounded-2xl border border-border-default bg-surface-elevated p-4">
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
              <SpecCard>
                <p className="mb-2 text-[14px] font-bold text-text-primary">{t('dashboard.quick_links')}</p>
                <ul className="space-y-1.5 text-[13px] font-semibold">
                  {[
                    ['/profile?section=beneficiary&add=1', 'dashboard.ql_beneficiary'],
                    ['/documents', 'dashboard.ql_documents'],
                    ['/investments', 'dashboard.ql_portfolio'],
                    ['/documents?generate=1', 'dashboard.ql_statement'],
                  ].map(([to, key]) => (
                    <li key={key}>
                      <Link to={to} className="text-primary hover:underline">{t(key)}</Link>
                    </li>
                  ))}
                </ul>
              </SpecCard>
              <SpecCard>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">{t('enrich.title')}</p>
                <p className="mt-1 text-[14px] font-bold text-text-primary">{t('enrich.subtitle')}</p>
                <p className="mt-1 text-[12px] text-text-secondary">{t('enrich.intro')}</p>
                <Link to="/enrich" className="mt-3 inline-block text-[13px] font-semibold text-primary hover:underline">{t('enrich.read')} →</Link>
              </SpecCard>
            </aside>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
