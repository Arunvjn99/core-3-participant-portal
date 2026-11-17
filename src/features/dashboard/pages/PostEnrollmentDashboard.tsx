import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { useTheme } from '@/core/hooks/useTheme'
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
  History,
  Home,
  Landmark,
  Link2,
  GraduationCap,
  PiggyBank,
  Check,
} from 'lucide-react'
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'
import { NotificationBanner } from '@/features/notifications/NotificationBanner'
import { useContributionLimits } from '@/features/contributions/useContributionLimits'
import { PremiumBalanceChart } from '@/features/dashboard/components/PremiumBalanceChart'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { PLANS, allHoldings, byAssetClass, weightedReturn } from '@/features/portfolio/portfolioData'
import { annualEmployerMatch, missedEmployerMatch, projectBalance, retirementIncome } from '@/features/enrollment/enrollmentMath'
import { getGrowthRate } from '@/lib/retirementCalculations'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useOutsideAssetsStore } from '@/features/outside-assets/outsideAssetsStore'
import { useNextBestActions, type NextActionId } from '@/features/dashboard/useNextBestActions'
import { formatMoney, summarize } from '@/features/outside-assets/summary'

const ease = [0.22, 1, 0.36, 1] as const

/** Icon for each next best action. */
const NEXT_ACTION_ICONS: Record<NextActionId, React.ComponentType<{ className?: string }>> = {
  add_beneficiary: User,
  sign_beneficiary: User,
  spouse_consent: User,
  full_match: DollarSign,
  verify_bank: Building2,
  verify_address: Home,
  auto_increase: TrendingUp,
  link_accounts: Link2,
  review_risk: Shield,
}

/** Card surfaces from the pre-enrollment dashboard, so both dashboards share one look in light and dark. */
const CARD_TONES = {
  plain: 'bg-surface-card ring-1 ring-slate-200/70 dark:ring-white/10',
  /** Same wash as the Enrich card */
  blue: 'bg-[radial-gradient(90%_120%_at_0%_0%,#D9F3FF_0%,rgba(217,243,255,0)_60%),radial-gradient(70%_130%_at_100%_100%,#DCE1FB_0%,rgba(220,225,251,0)_65%),linear-gradient(#F8F9FE,#F8F9FE)] ring-1 ring-slate-200/70 dark:bg-[radial-gradient(90%_120%_at_0%_0%,#12305C_0%,rgba(18,48,92,0)_60%),radial-gradient(70%_130%_at_100%_100%,#262F86_0%,rgba(38,47,134,0)_65%),linear-gradient(#0B1436,#0B1436)] dark:ring-white/10',
  /** Same wash as the Ask Core AI card */
  sky: 'bg-[linear-gradient(180deg,#EAF2FF_0%,#F6F9FF_100%)] ring-1 ring-blue-100 dark:bg-[linear-gradient(180deg,rgba(59,130,246,0.16)_0%,rgba(15,23,42,1)_100%)] dark:ring-blue-400/20',
  /** Same green corner as the banner */
  green: 'bg-[radial-gradient(80%_120%_at_100%_100%,#EFFAF2_0%,rgba(239,250,242,0)_50%),linear-gradient(#FFFFFF,#FFFFFF)] ring-1 ring-slate-200/70 dark:bg-[radial-gradient(80%_120%_at_100%_100%,rgba(18,63,70,0.45)_0%,rgba(18,63,70,0)_50%),linear-gradient(#0B1436,#0B1436)] dark:ring-white/10',
  /** Same green and amber wash as the "Learn more about the plan" widget */
  warm: 'bg-[radial-gradient(70%_120%_at_0%_0%,#F1FAF5_0%,rgba(241,250,245,0)_50%),radial-gradient(60%_120%_at_100%_0%,#FFF3DC_0%,rgba(255,243,220,0)_60%),linear-gradient(#F8F9FE,#F8F9FE)] ring-1 ring-slate-200/70 dark:bg-[radial-gradient(70%_120%_at_0%_0%,rgba(16,185,129,0.07)_0%,rgba(16,185,129,0)_50%),radial-gradient(60%_120%_at_100%_0%,rgba(245,158,11,0.14)_0%,rgba(245,158,11,0)_60%),linear-gradient(#0B1436,#0B1436)] dark:ring-white/10',
} as const

/** The pre-enrollment dashboard's buttons: a solid pill and a white one. */
const PILL_PRIMARY =
  'inline-flex h-10 items-center justify-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(11,21,51,0.35)] dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)]'
const PILL_SECONDARY =
  'inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_-10px_rgba(11,21,51,0.3)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:text-white dark:ring-white/15 dark:hover:bg-slate-800'
const TEXT_LINK = 'inline-flex items-center gap-0.5 font-semibold text-primary hover:underline dark:text-blue-300'

/** Card shell: rounded 20px with a soft ring, revealed the first time it scrolls into view, like the pre-enrollment cards. */
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
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease }}
      className={`rounded-[20px] shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ${CARD_TONES[tone]} ${noPadding ? '' : 'p-5'} ${className}`}
    >
      {children}
    </motion.div>
  )
}

type IconType = React.ComponentType<{ className?: string }>

/** Solid icon badge beside a card title, like the Enrich card's. */
function TitleBadge({ Icon, color }: { Icon: IconType; color: string }) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_16px_-8px_rgba(11,21,51,0.45)] ${color}`}
      aria-hidden
    >
      <Icon className="h-[18px] w-[18px]" />
    </span>
  )
}

const CHIP_TONES = {
  emerald: 'bg-emerald-50 text-emerald-600 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20',
  blue: 'bg-blue-50 text-blue-600 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20',
  rose: 'bg-rose-50 text-rose-600 ring-rose-100 dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-400/20',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200 dark:bg-white/10 dark:text-slate-300 dark:ring-white/10',
} as const

/** Round tinted icon chip, like the ones in the plan widget. */
function IconChip({ Icon, tone, small }: { Icon: IconType; tone: keyof typeof CHIP_TONES; small?: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full ring-1 ${small ? 'h-7 w-7' : 'h-9 w-9'} ${CHIP_TONES[tone]}`}
      aria-hidden
    >
      <Icon className={small ? 'h-3.5 w-3.5' : 'h-[18px] w-[18px]'} />
    </span>
  )
}

/** Active plan loans. One shows in full; two or more show as rows with a total. */
interface ActiveLoan {
  ref: string
  purpose: 'general' | 'residential'
  originated: string
  balance: number
  payment: number
  paidPct: number
  paymentsLeft: number
}
const ACTIVE_LOANS: ActiveLoan[] = [
  { ref: 'LOAN-2024-001', purpose: 'general', originated: '2022-01-15', balance: 2450, payment: 125, paidPct: 60, paymentsLeft: 14 },
  { ref: 'LOAN-2025-014', purpose: 'residential', originated: '2025-03-01', balance: 18200, payment: 310, paidPct: 18, paymentsLeft: 59 },
]

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
  const { resolvedMode } = useTheme()
  const isDark = resolvedMode === 'dark'

  const locale = getAppDateLocale()
  const money = (v: number, cents = false) =>
    `$${v.toLocaleString(locale, { minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 })}`

  // ── Account: same balance, vested amount and holdings as Account Summary ──
  const election = useElectionsStore((s) => s.investment)
  const account = PLANS[0]
  const holdings = useMemo(() => allHoldings(election), [election])
  const quarterReturn = Math.round(weightedReturn(holdings, '3M') * 10) / 10
  const vestedPct = Math.round((account.vested / account.balance) * 100)
  // ── Accounts held elsewhere, added to this plan's balance for the "All your accounts" card ──
  const outsideAccounts = useOutsideAssetsStore((s) => s.accounts)
  const nextActions = useNextBestActions()
  const allAccounts = useMemo(() => summarize(outsideAccounts, account.balance), [outsideAccounts, account.balance])
  const balanceChartData = useMemo(() => {
    const scale = account.balance / balanceChartShape[balanceChartShape.length - 1].value
    return balanceChartShape.map((p) => ({ ...p, value: Math.round(p.value * scale) }))
  }, [account.balance])
  /** One point a month, ending this month */
  const balanceMonths = useMemo(() => {
    const now = new Date()
    return balanceChartShape.map((_, i) =>
      new Date(now.getFullYear(), now.getMonth() - (balanceChartShape.length - 1 - i), 1).toLocaleDateString(locale, { month: 'short', year: '2-digit' }),
    )
  }, [locale])

  // ── Enrollment: contributions, match and readiness use the same math as the enrollment steps ──
  const { data, personalization } = useEnrollment()
  const yearsToRetirement = Math.max(0, personalization.retirementAge - personalization.currentAge)
  const retirementYear = new Date().getFullYear() + yearsToRetirement
  const monthlyYou = Math.round((data.salary * data.contributionPercent) / 100 / 12)
  const annualMatch = annualEmployerMatch(data.salary, data.contributionPercent, data.contributionSources)
  const monthlyMatch = Math.round(annualMatch / 12)
  const monthlyTotal = monthlyYou + monthlyMatch
  const fullMatch = annualMatch + missedEmployerMatch(data.salary, data.contributionPercent, data.contributionSources)
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
  const limits = useContributionLimits()
  const monthlyGap = Math.round((fullMatch - annualMatch) / 12)
  // Loan payments come out on the 15th: the next one is this month's if it hasn't passed, otherwise next month's
  const nextLoanDue = (() => {
    const now = new Date()
    const due = new Date(now.getFullYear(), now.getMonth(), 15)
    if (now.getDate() > 15) due.setMonth(due.getMonth() + 1)
    return due.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  })()
  const loansTotal = ACTIVE_LOANS.reduce((sum, l) => sum + l.balance, 0)

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

  const quickActions: { Icon: IconType; title: string; sub: string; hint: string; href: string; tone: keyof typeof CHIP_TONES }[] = [
    { Icon: HandCoins, title: t('dashboard.takeLoan'), sub: t('transactions.qa_loan_sub'), hint: t('postDashboard.take_loan_hint'), href: '/transactions/loan', tone: 'blue' },
    { Icon: DollarSign, title: t('dashboard.withdrawMoney'), sub: t('transactions.qa_withdraw_sub'), hint: t('postDashboard.withdraw_hint'), href: '/transactions/withdrawal', tone: 'emerald' },
    { Icon: ArrowLeftRight, title: t('dashboard.transferFunds'), sub: t('transactions.qa_transfer_sub'), hint: t('postDashboard.transfer_hint'), href: '/transactions/transfer', tone: 'blue' },
    { Icon: RefreshCcw, title: t('dashboard.rollOver'), sub: t('transactions.qa_rollover_sub'), hint: t('postDashboard.rollover_hint'), href: '/transactions/rollover', tone: 'emerald' },
  ]

  return (
    <AnimatedPage className="min-h-full">
      <div className="min-h-screen bg-surface-page font-sans text-text-primary">
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-7">
          {/* Page title: plain text on the page, no card and no artwork */}
          <header className="mb-5">
            <h1 className="text-[28px] font-bold leading-tight text-[#0B1533] dark:text-white">{t('dashboard.overview')}</h1>
            <p className="mt-1 text-[15px] leading-snug text-text-secondary">{t('dashboard.overview_sub')}</p>
          </header>

          <NotificationBanner />

          {/* Balance and readiness share a row, so they are always the same height */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Card 1: Total balance */}
            <SpecCard className="relative flex flex-col overflow-hidden lg:col-span-8">
              {/* Label and status share the top line; the amount; then this quarter's change and the way into the details */}
              <div className="mb-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{t('dashboard.totalBalance')}</p>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${onTrack ? 'bg-status-success-bg text-status-success' : 'bg-status-warning-bg text-status-warning'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${onTrack ? 'bg-status-success' : 'bg-status-warning'}`} aria-hidden />
                    {onTrack ? t('dashboard.onTrack') : t('postDashboard.status_needs_attention')}
                  </span>
                </div>
                <p className="mt-1.5 text-[36px] font-bold leading-none tracking-tight tabular-nums text-text-primary">{money(Math.round(account.balance))}</p>
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="inline-flex items-center gap-2 text-[13px] text-text-secondary">
                    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-semibold tabular-nums ${quarterReturn >= 0 ? 'bg-status-success-bg text-status-success' : 'bg-status-danger-bg text-status-danger'}`}>
                      <TrendingUp className={`h-3.5 w-3.5 shrink-0 ${quarterReturn < 0 ? 'rotate-180' : ''}`} aria-hidden />
                      {`${quarterReturn >= 0 ? '+' : ''}${quarterReturn}%`}
                    </span>
                    {t('postDashboard.this_quarter')}
                  </span>
                  <span className="hidden h-4 w-px bg-slate-200 sm:block dark:bg-white/10" aria-hidden />
                  <Link to="/account-summary" className={`group/summary text-[13px] ${TEXT_LINK}`}>
                    {t('portfolio.view_summary')}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover/summary:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                  </Link>
                </div>
              </div>

              <div className="mb-5 w-full">
                <PremiumBalanceChart data={balanceChartData} isDark={isDark} axes={{ xLabels: balanceMonths, formatY: (v) => `$${Math.round(v / 1000)}K` }} />
              </div>

              {/* Three facts in a row under the chart, split by thin dividers: no panel inside the card */}
              <div className="mt-auto grid grid-cols-1 divide-y divide-slate-200/80 border-t border-slate-200/80 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:pt-4 dark:divide-white/10 dark:border-white/10">
                <div className="flex items-center gap-2.5 py-3 last:pb-0 sm:px-4 sm:py-0 sm:first:pl-0">
                  <IconChip Icon={Lock} tone="blue" small />
                  <p className="text-[12px] text-text-secondary">
                    <span className="text-text-secondary">{t('postDashboard.vested_balance_colon')} </span>
                    <span className="font-semibold text-text-primary">{money(Math.round(account.vested))}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2.5 py-3 last:pb-0 sm:px-4 sm:py-0 sm:first:pl-0">
                  <IconChip Icon={CalendarDays} tone="amber" small />
                  <p className="text-[12px] text-text-secondary">
                    <span>{t('postDashboard.retirement_label')} </span>
                    <span className="font-semibold text-text-primary">{t('postDashboard.retirement_est', { year: retirementYear })}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2.5 py-3 last:pb-0 sm:px-4 sm:py-0 sm:first:pl-0">
                  <IconChip Icon={Zap} tone="emerald" small />
                  <p className="text-[12px] text-text-secondary">
                    <span>{t('postDashboard.vested_short')} </span>
                    <span className="font-semibold text-text-primary">{vestedPct}%</span>
                  </p>
                </div>
              </div>
            </SpecCard>

            {/* Readiness */}
            <SpecCard tone="sky" className="flex flex-col items-center justify-center text-center lg:col-span-4">
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
              <Link to="/retirement-goal" className={`group mt-5 px-5 ${PILL_PRIMARY}`}>
                {t('dashboard.launchSimulator')}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
              </Link>
            </SpecCard>
          </div>

          {/* Rows that pair a wide card with a narrow one, so each pair lines up top and bottom; the library spans the last row */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="grid min-w-0 lg:col-span-8">
                {/* Card 2: Quick Actions — one card, 4 tiles with dividers */}
                  <SpecCard noPadding className="overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
                      <TitleBadge Icon={Zap} color="bg-blue-600" />
                      <h2 className="text-[16px] font-bold text-text-primary">{t('dashboard.quickActions')}</h2>
                    </div>
                    <div className="grid grid-cols-1 divide-y divide-slate-200/80 border-t border-slate-200/80 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 dark:divide-white/10 dark:border-white/10">
                      {quickActions.map((tile) => (
                        <Link
                          key={tile.title}
                          to={tile.href}
                          className="group relative block p-5 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:hover:bg-white/5"
                        >
                          <ChevronRight className="absolute right-3 top-4 h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                          <IconChip Icon={tile.Icon} tone={tile.tone} />
                          <p className="mt-3 pr-6 text-[14px] font-bold leading-tight text-text-primary">{tile.title}</p>
                          <p className="mt-1 text-[13px] font-medium text-primary dark:text-blue-300">{tile.sub}</p>
                          <p className="mt-0.5 text-[11px] text-text-secondary">{tile.hint}</p>
                        </Link>
                      ))}
                    </div>
                  </SpecCard>
            </div>

            <div className="grid min-w-0 lg:col-span-4">
                {/* Next Best Actions */}
                <SpecCard className="flex flex-col">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <TitleBadge Icon={CheckSquare} color="bg-emerald-600" />
                      <span className="text-[16px] font-bold text-text-primary">{t('dashboard.nextBestActions')}</span>
                    </div>
                    <span className="text-[12px] font-medium text-text-secondary">{t('postDashboard.actions_count', { count: Math.min(nextActions.length, 3) })}</span>
                  </div>
                  {/* Up to three, most important first; each whole row is the link */}
                  <ul className="-mx-2 divide-y divide-slate-200/80 dark:divide-white/10">
                    {nextActions.slice(0, 3).map((action, i) => {
                      const ActionIcon = NEXT_ACTION_ICONS[action.id]
                      return (
                        <li key={action.id}>
                          <Link
                            to={action.href}
                            className="group flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:hover:bg-white/5"
                          >
                            <IconChip Icon={ActionIcon} tone={action.required ? 'rose' : i === 0 ? 'blue' : 'slate'} small />
                            <span className="min-w-0 flex-1">
                              <span className="flex flex-wrap items-center gap-2">
                                <span className="text-[14px] font-semibold text-text-primary">{t(`next_actions.${action.id}`, action.values)}</span>
                                {action.required && (
                                  <span className="rounded-full bg-status-danger-bg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-status-danger">{t('postDashboard.badge_required')}</span>
                                )}
                              </span>
                              <span className="mt-0.5 block text-[12px] text-text-secondary">{t(`next_actions.${action.id}_sub`, action.values)}</span>
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                  {nextActions.length < 3 && (
                    <p className="mt-auto flex items-center gap-1.5 border-t border-slate-200/80 pt-3 text-[12px] text-text-secondary dark:border-white/10">
                      <Check className="h-3.5 w-3.5 text-status-success" aria-hidden />
                      {t('postDashboard.actions_rest_done')}
                    </p>
                  )}
                </SpecCard>
            </div>

            <div className="grid min-w-0 lg:col-span-8">
                {/* Your contributions: this month's three figures, how the total splits, then this year's limit */}
                <SpecCard className="flex flex-col">
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <TitleBadge Icon={Calendar} color="bg-emerald-600" />
                      <span className="whitespace-nowrap text-[16px] font-bold text-text-primary">{t('postDashboard.contributions_title')}</span>
                    </div>
                    <span className="text-[12px] text-text-secondary">{contributionMonth}</span>
                  </div>

                  {/* Phones: one row per figure, label left and amount right. Wider screens: three columns split by thin rules */}
                  <dl className="grid grid-cols-1 divide-y divide-slate-200/80 sm:grid-cols-3 sm:divide-x sm:divide-y-0 dark:divide-white/10">
                    {[
                      {
                        key: 'you',
                        dot: 'bg-primary',
                        label: t('postDashboard.c_you'),
                        value: money(monthlyYou),
                        valueClass: 'text-text-primary',
                        sub: <>{t('postDashboard.c_of_pay', { pct: data.contributionPercent })}</>,
                        subClass: 'text-text-secondary',
                      },
                      {
                        key: 'employer',
                        dot: 'bg-status-success',
                        label: t('postDashboard.c_employer'),
                        value: `+${money(monthlyMatch)}`,
                        valueClass: 'text-status-success',
                        sub:
                          monthlyGap > 0 ? (
                            <>{t('postDashboard.c_match_gap', { amount: money(monthlyGap) })}</>
                          ) : (
                            <>
                              <Check className="h-3.5 w-3.5" aria-hidden />
                              {t('postDashboard.c_full_match')}
                            </>
                          ),
                        subClass: monthlyGap > 0 ? 'text-status-warning' : 'text-status-success',
                      },
                      {
                        key: 'total',
                        dot: null,
                        label: t('postDashboard.c_total'),
                        value: money(monthlyTotal),
                        valueClass: 'text-text-primary',
                        sub: <>{t('postDashboard.c_total_sub')}</>,
                        subClass: 'text-text-secondary',
                      },
                    ].map((fig) => (
                      <div key={fig.key} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 sm:block sm:px-4 sm:py-0 sm:first:pl-0 sm:last:pr-0">
                        <div className="min-w-0">
                          <dt className="flex items-center gap-1.5 text-[13px] text-text-secondary">
                            {fig.dot && <span className={`h-2 w-2 rounded-full ${fig.dot}`} aria-hidden />}
                            {fig.label}
                          </dt>
                          {/* On phones the detail sits under the label */}
                          <dd className={`mt-0.5 flex items-center gap-1 text-[12px] sm:hidden ${fig.subClass}`}>{fig.sub}</dd>
                        </div>
                        <dd className={`shrink-0 text-[18px] font-semibold tabular-nums tracking-tight sm:mt-1 sm:text-[22px] ${fig.valueClass}`}>
                          {fig.value}
                          <span className="ml-0.5 text-[13px] font-normal text-text-secondary">{t('postDashboard.per_mo')}</span>
                        </dd>
                        <dd className={`mt-0.5 hidden items-center gap-1 text-[12px] sm:flex ${fig.subClass}`}>{fig.sub}</dd>
                      </div>
                    ))}
                  </dl>

                  {/* How the monthly total splits: yours and your employer's */}
                  <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" role="img" aria-label={`${t('postDashboard.c_you')} ${money(monthlyYou)}, ${t('postDashboard.c_employer')} ${money(monthlyMatch)}`}>
                    <span className="h-full bg-primary" style={{ width: `${monthlyTotal > 0 ? (monthlyYou / monthlyTotal) * 100 : 0}%` }} />
                    <span className="h-full bg-status-success" style={{ width: `${monthlyTotal > 0 ? (monthlyMatch / monthlyTotal) * 100 : 0}%` }} />
                  </div>

                  {/* This year's limit */}
                  <div className="mt-auto pt-5">
                    <div className="border-t border-slate-200/80 pt-4 dark:border-white/10">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <p className="text-[13px] text-text-secondary">{t('contributionLimits.title', { year: limits.year })}</p>
                        <Link to="/enrollment/contribution" className={`group text-[12px] ${TEXT_LINK}`}>
                          {t('contributionLimits.change')}
                          <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                        </Link>
                      </div>
                      <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[18px] font-semibold tabular-nums text-text-primary">{money(limits.remaining)}</span>
                        <span className="text-[13px] text-text-secondary">{t('postDashboard.limit_left', { limit: money(limits.employeeLimit) })}</span>
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(limits.percentUsed)} aria-label={t('contributionLimits.title', { year: limits.year })}>
                        <div className="h-full rounded-full bg-primary" style={{ width: `${limits.percentUsed}%` }} />
                      </div>
                      <p className="mt-2 text-[12px] text-text-secondary">
                        {limits.reachesLimit
                          ? t('contributionLimits.status_reaches')
                          : t(limits.ytdIsEstimate ? 'postDashboard.limit_pace_est' : 'postDashboard.limit_pace', { ytd: money(limits.ytdEmployee), projected: money(limits.projectedYearEnd) })}
                      </p>
                    </div>
                  </div>
                </SpecCard>
            </div>

            <div className="grid min-w-0 lg:col-span-4">
                {/* Active loans: one shows in full; two or more show as rows with the total underneath */}
                <SpecCard className="flex flex-col">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <TitleBadge Icon={CreditCard} color="bg-blue-600" />
                      <span className="text-[16px] font-bold text-text-primary">{t(ACTIVE_LOANS.length > 1 ? 'postDashboard.loans_title' : 'dashboard.activeLoan')}</span>
                    </div>
                    {ACTIVE_LOANS.length > 1 && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-semibold tabular-nums text-text-secondary dark:bg-white/10">{ACTIVE_LOANS.length}</span>
                    )}
                  </div>

                  {ACTIVE_LOANS.length === 1 ? (
                    ACTIVE_LOANS.map((loan) => (
                      <div key={loan.ref}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-text-primary">{t(`postDashboard.loan_${loan.purpose}`)}</p>
                            <p className="mt-0.5 text-[11px] text-text-muted">
                              <span className="font-mono">{loan.ref}</span> · {t('postDashboard.loan_since', { date: new Date(loan.originated).toLocaleDateString(locale, { month: 'short', year: 'numeric' }) })}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-status-success-bg px-2 py-0.5 text-[11px] font-semibold text-status-success">{t('common.active')}</span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-4 dark:border-white/10">
                          <div>
                            <p className="text-[12px] text-text-secondary">{t('postDashboard.remaining')}</p>
                            <p className="mt-0.5 text-[20px] font-semibold tabular-nums text-text-primary">{money(loan.balance)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[12px] text-text-secondary">{t('postDashboard.next_payment')}</p>
                            <p className="mt-0.5 text-[15px] font-semibold tabular-nums text-text-primary">{money(loan.payment)} · {nextLoanDue}</p>
                          </div>
                        </div>
                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                          <div className="h-full rounded-full bg-status-success" style={{ width: `${loan.paidPct}%` }} />
                        </div>
                        <div className="mt-1.5 flex justify-between text-[11px] text-text-secondary">
                          <span>{t('postDashboard.loan_paid', { pct: loan.paidPct })}</span>
                          <span>{t('postDashboard.loan_left', { count: loan.paymentsLeft })}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <ul className="divide-y divide-slate-200/80 dark:divide-white/10">
                        {ACTIVE_LOANS.map((loan) => (
                          <li key={loan.ref} className="py-3 first:pt-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="min-w-0 truncate text-[14px] font-semibold text-text-primary">{t(`postDashboard.loan_${loan.purpose}`)}</p>
                              <p className="shrink-0 text-[15px] font-semibold tabular-nums text-text-primary">{money(loan.balance)}</p>
                            </div>
                            <div className="mt-0.5 flex items-baseline justify-between gap-2 text-[11px] text-text-secondary">
                              <span className="font-mono text-text-muted">{loan.ref}</span>
                              <span>{t('postDashboard.loan_next_short', { amount: money(loan.payment), date: nextLoanDue })}</span>
                            </div>
                            <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={loan.paidPct} aria-label={t('postDashboard.loan_paid', { pct: loan.paidPct })}>
                              <div className="h-full rounded-full bg-status-success" style={{ width: `${loan.paidPct}%` }} />
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-auto flex items-baseline justify-between border-t border-slate-200/80 pt-3 dark:border-white/10">
                        <span className="text-[12px] text-text-secondary">{t('postDashboard.loans_total')}</span>
                        <span className="text-[16px] font-semibold tabular-nums text-text-primary">{money(loansTotal)}</span>
                      </div>
                    </>
                  )}
                </SpecCard>
            </div>

            <div className="grid min-w-0 lg:col-span-8">
                {/* Card 4: Portfolio Allocation */}
                <SpecCard>
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <TitleBadge Icon={PieChart} color="bg-blue-600" />
                        <span className="text-[16px] font-bold text-text-primary">{t('dashboard.portfolioAllocation')}</span>
                      </div>
                      <p className="mt-0.5 pl-[46px] text-[12px] text-text-secondary">{t('postDashboard.current_asset_mix')}</p>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[12px] font-medium text-text-secondary dark:bg-white/10">
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
                  <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
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

            <div className="grid min-w-0 lg:col-span-4">
                {/* All your accounts: this plan plus accounts linked from elsewhere */}
                <SpecCard className="flex flex-col">
                  <div className="mb-3 flex items-center gap-2.5">
                    <TitleBadge Icon={Landmark} color="bg-blue-600" />
                    <span className="text-[16px] font-bold text-text-primary">{t('outside_assets.card_title')}</span>
                  </div>
                  {outsideAccounts.length > 0 ? (
                    <dl className="grid grid-cols-2 divide-x divide-slate-200/80 dark:divide-white/10">
                      <div className="pr-4">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">{t('outside_assets.net_worth')}</dt>
                        <dd className="mt-1 text-[18px] font-bold tabular-nums text-text-primary">{formatMoney(allAccounts.netWorth, locale)}</dd>
                      </div>
                      <div className="pl-4">
                        <dt className="text-[10px] font-semibold uppercase tracking-wide text-text-secondary">{t('outside_assets.card_retirement')}</dt>
                        <dd className="mt-1 text-[18px] font-bold tabular-nums text-text-primary">{formatMoney(allAccounts.totalRetirement, locale)}</dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{t('outside_assets.card_invite')}</p>
                  )}
                  <Link to="/outside-assets" className={`group mt-auto pt-3 text-[13px] ${TEXT_LINK}`}>
                    {outsideAccounts.length > 0 ? t('outside_assets.card_link') : t('outside_assets.card_link_empty')}
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                  </Link>
                </SpecCard>
            </div>

            <div className="grid min-w-0 lg:col-span-8">
                {/* Recent Activity */}
                <SpecCard>
                  <div className="mb-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <TitleBadge Icon={History} color="bg-blue-600" />
                      <h3 className="text-[16px] font-bold text-text-primary">{t('dashboard.recentActivity')}</h3>
                    </div>
                    <Link to="/post-enrollment-dashboard" className={`text-[13px] ${TEXT_LINK}`}>
                      {t('postDashboard.view_all_arrow')}
                    </Link>
                  </div>
                  <ul className="divide-y divide-slate-200/80 dark:divide-white/10">
                    <li className="flex items-center gap-3.5 py-3.5 first:pt-0">
                      <IconChip Icon={ArrowDownLeft} tone="emerald" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold text-text-primary">{t('postDashboard.activity_contribution')}</p>
                        <p className="text-[12px] text-text-secondary">{t('postDashboard.activity_payroll')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-bold text-status-success">+{money(monthlyYou, true)}</p>
                        <p className="text-[12px] text-text-secondary">{t('postDashboard.sample_date_oct')}</p>
                      </div>
                    </li>
                    <li className="flex items-center gap-3.5 py-3.5">
                      <IconChip Icon={Building2} tone="blue" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold text-text-primary">{t('postDashboard.activity_employer_match')}</p>
                        <p className="text-[12px] text-text-secondary">{t('postDashboard.activity_safe_harbor')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-bold text-status-success">+{money(monthlyMatch, true)}</p>
                        <p className="text-[12px] text-text-secondary">{t('postDashboard.sample_date_oct')}</p>
                      </div>
                    </li>
                    <li className="flex items-center gap-3.5 py-3.5 last:pb-0">
                      <IconChip Icon={RefreshCcw} tone="slate" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold text-text-primary">{t('postDashboard.activity_rebalance')}</p>
                        <p className="text-[12px] text-text-secondary">{t('postDashboard.activity_auto_quarterly')}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-medium text-text-secondary">{t('common.completed')}</p>
                        <p className="text-[12px] text-text-secondary">{t('postDashboard.sample_date_oct1')}</p>
                      </div>
                    </li>
                  </ul>
                </SpecCard>
            </div>

            <div className="grid min-w-0 lg:col-span-4">
                {/* Your Advisor: the plan widget's wash, a face, the numbers between two thin rules */}
                <SpecCard tone="warm">
                  <div className="flex items-center gap-3.5">
                    <img
                      src="https://randomuser.me/api/portraits/women/44.jpg"
                      alt="Sarah Jenkins"
                      className="h-14 w-14 shrink-0 rounded-full object-cover shadow-[0_6px_16px_-8px_rgba(11,21,51,0.5)] ring-2 ring-white dark:ring-slate-900"
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">{t('dashboard.yourAdvisor')}</p>
                      <h3 className="mt-0.5 text-[18px] font-bold leading-tight text-text-primary">Sarah Jenkins</h3>
                      <p className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-300">{t('postDashboard.advisor_title_role')}</p>
                    </div>
                  </div>
                  {/* Stats sit straight on the card between two thin rules: no panel inside the card */}
                  <div className="mt-4 grid grid-cols-3 divide-x divide-slate-200/80 border-y border-slate-200/80 py-3 text-center dark:divide-white/10 dark:border-white/10">
                    <div className="px-2">
                      <p className="text-[16px] font-bold text-text-primary">4.9</p>
                      <p className="text-[11px] text-text-secondary">{t('postDashboard.advisor_rating')}</p>
                    </div>
                    <div className="px-2">
                      <p className="text-[16px] font-bold text-text-primary">12yr</p>
                      <p className="text-[11px] text-text-secondary">{t('postDashboard.advisor_experience')}</p>
                    </div>
                    <div className="px-2">
                      <p className="text-[16px] font-bold text-text-primary">240+</p>
                      <p className="text-[11px] text-text-secondary">{t('postDashboard.advisor_clients')}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                    {t('postDashboard.advisor_bio')}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    <Link to="/advisor?tab=messages" className={`flex-auto whitespace-nowrap ${PILL_SECONDARY}`}>
                      <Mail className="h-4 w-4" aria-hidden />
                      {t('dashboard.message')}
                    </Link>
                    <Link to="/advisor?tab=meetings" className={`flex-auto gap-1.5 whitespace-nowrap ${PILL_PRIMARY}`}>
                      <CalendarDays className="h-4 w-4" aria-hidden />
                      {t('dashboard.scheduleCall')}
                    </Link>
                  </div>
                </SpecCard>
            </div>

            <div className="grid min-w-0 lg:col-span-12">
                {/* Financial wellness library: the Enrich card's look, coin art and all */}
                  <SpecCard tone="blue" className="group relative isolate flex min-h-[208px] overflow-hidden pb-6 transition-shadow hover:shadow-[0_24px_48px_-28px_rgba(37,99,235,0.45)]">
                    {/* The coin art's periwinkle, glowing behind it so the image and card share one light */}
                    <span className="pointer-events-none absolute -right-10 top-1/2 -z-10 h-64 w-80 -translate-y-1/2 rounded-full bg-[#8C9BFF] opacity-25 blur-[70px] transition-opacity group-hover:opacity-40 dark:bg-[#5B6BFF] dark:opacity-35" aria-hidden />
                    <div className="relative z-10 flex flex-1 flex-col items-start sm:max-w-[56%]">
                      <div className="flex items-center gap-2.5">
                        <TitleBadge Icon={GraduationCap} color="bg-blue-600" />
                        <h2 className="text-[16px] font-bold text-text-primary">{t('dashboard.learningHub')}</h2>
                      </div>
                      <h3 className="mt-4 text-[20px] font-bold leading-tight text-slate-900 dark:text-white">{t('enrich.subtitle')}</h3>
                      <p className="mb-5 mt-2 max-w-[380px] text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">
                        {t('enrich.intro')}
                      </p>
                      <Link to="/enrich" className={`group/cta mt-auto ${PILL_PRIMARY}`}>
                        {t('postDashboard.library_cta')}
                        <ChevronRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                      </Link>
                    </div>

                    {/* The three topics: saving, home, growth */}
                    <div className="absolute right-4 top-4 z-10 hidden gap-1.5 sm:flex" aria-hidden>
                      <IconChip Icon={PiggyBank} tone="amber" small />
                      <IconChip Icon={Home} tone="blue" small />
                      <IconChip Icon={TrendingUp} tone="emerald" small />
                    </div>

                    {/* The coin on the steps, faded into the card on its left and its bright top-right corner */}
                    <img
                      src="/media/enrich-coin.png"
                      alt=""
                      width={300}
                      height={180}
                      className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[320px] max-w-none object-cover object-[center_8%] transition-transform duration-700 [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent_0%,black_30%),radial-gradient(60%_55%_at_100%_0%,transparent_0%,transparent_30%,black_95%)] [-webkit-mask-composite:source-in] group-hover:scale-[1.05] motion-reduce:transition-none sm:block"
                      aria-hidden
                    />
                  </SpecCard>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
