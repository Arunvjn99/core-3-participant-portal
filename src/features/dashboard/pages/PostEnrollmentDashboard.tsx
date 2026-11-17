import React, { useId, useMemo } from 'react'
import { Trans, useTranslation } from 'react-i18next'
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
  Check,
  ShieldCheck,
  Calculator,
  Lightbulb,
} from 'lucide-react'
import { NotificationBanner } from '@/features/notifications/NotificationBanner'
import { useContributionLimits } from '@/features/contributions/useContributionLimits'
import { PremiumBalanceChart } from '@/features/dashboard/components/PremiumBalanceChart'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { PLANS, allHoldings, byAssetClass, weightedReturn } from '@/features/portfolio/portfolioData'
import { ASSUMED_INFLATION, annualEmployerMatch, missedEmployerMatch, projectBalance, retirementIncome } from '@/features/enrollment/enrollmentMath'
import { getGrowthRate } from '@/lib/retirementCalculations'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useOutsideAssetsStore } from '@/features/outside-assets/outsideAssetsStore'
import { useNextBestActions, type DoneActionId, type NextActionId } from '@/features/dashboard/useNextBestActions'
import { InfoTip } from '@/features/enrollment/flow/core/ui'
import { PLAN_CONFIG } from '@/features/enrollment/agent/planConfig'
import { ASSET_SLICES, accountName, formatMoney, summarize, type AssetSlice } from '@/features/outside-assets/summary'
import { useProfileStore } from '@/features/profile/profileStore'

const ease = [0.22, 1, 0.36, 1] as const

/**
 * Readiness bands: above 70 is on track (green), 50 to 70 needs attention (amber), under 50 is off track (red). Each has soft ring shades (close together, so a full ring
 * shows no visible join at the top), a faint track and its status pill.
 */
const READINESS_BANDS = {
  good: {
    labelKey: 'dashboard.onTrack',
    ring: ['#8FD5A9', '#72C796', '#5DBA86'],
    track: { light: 'rgba(77,175,122,0.13)', dark: 'rgba(111,199,147,0.16)' },
    pill: 'bg-status-success-bg text-status-success',
    panel: 'bg-emerald-50/60 ring-emerald-100/80 dark:bg-emerald-500/10 dark:ring-emerald-400/15',
    accent: 'text-emerald-600 dark:text-emerald-300',
    dot: 'bg-status-success',
  },
  fair: {
    labelKey: 'postDashboard.status_needs_attention',
    ring: ['#F2CF8A', '#EBBE6C', '#E2AE55'],
    track: { light: 'rgba(221,162,74,0.15)', dark: 'rgba(237,190,106,0.16)' },
    pill: 'bg-status-warning-bg text-status-warning',
    panel: 'bg-amber-50/60 ring-amber-100/80 dark:bg-amber-500/10 dark:ring-amber-400/15',
    accent: 'text-amber-600 dark:text-amber-300',
    dot: 'bg-status-warning',
  },
  low: {
    labelKey: 'postDashboard.status_off_track',
    ring: ['#EFAAAA', '#E79393', '#DE7F7F'],
    track: { light: 'rgba(217,115,115,0.13)', dark: 'rgba(233,147,147,0.16)' },
    pill: 'bg-status-danger-bg text-status-danger',
    panel: 'bg-rose-50/60 ring-rose-100/80 dark:bg-rose-500/10 dark:ring-rose-400/15',
    accent: 'text-rose-600 dark:text-rose-300',
    dot: 'bg-status-danger',
  },
} as const
type ReadinessBand = keyof typeof READINESS_BANDS
/** Lowest score that counts as on track (green) */
const ON_TRACK_MIN = 71
const readinessBandOf = (score: number): ReadinessBand => (score >= ON_TRACK_MIN ? 'good' : score >= 50 ? 'fair' : 'low')

/** Readiness ring inside a 148px box: centre, radius and line width */
const RING_BOX = 148
const RING_C = 74
const RING_R = 67
const RING_W = 13
const ringPoint = (turn: number, r = RING_R) => {
  const angle = turn * 2 * Math.PI - Math.PI / 2
  return `${(RING_C + r * Math.cos(angle)).toFixed(2)} ${(RING_C + r * Math.sin(angle)).toFixed(2)}`
}
/** Short arcs that make up the ring, each a step further from one colour to the other, so the colour runs around it */
function ringArcs(stops: string[], steps = 72) {
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16)
  // Blend across the stops in turn, so a middle stop keeps the colour rich half way round
  const mix = (k: number) => {
    const pos = k * (stops.length - 1)
    const at = Math.min(stops.length - 2, Math.floor(pos))
    const f = pos - at
    const [a, b] = [stops[at], stops[at + 1]]
    return `rgb(${[0, 1, 2].map((i) => Math.round(ch(a, i) + (ch(b, i) - ch(a, i)) * f)).join(',')})`
  }
  return Array.from({ length: steps }, (_, i) => ({
    // Each arc runs a hair past the next one's start so no seams show
    d: `M${ringPoint(i / steps)} A${RING_R} ${RING_R} 0 0 1 ${ringPoint(Math.min(1, (i + 1.6) / steps))}`,
    color: mix(i / (steps - 1)),
  }))
}

/** The linked-accounts page's colours, so the two read as one */
const ACCOUNT_SLICE_COLOR: Record<AssetSlice, string> = {
  plan: 'var(--chart-blue)',
  retirement: 'var(--chart-teal)',
  cash: 'var(--chart-green-dark)',
  property: 'var(--chart-amber)',
}

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

/**
 * Button levels. The page has one solid button (Launch Simulator); every other card action is the quiet
 * white pill, and in-card "see more" links are plain text links.
 */
const PILL_PRIMARY =
  'inline-flex h-9 items-center justify-center gap-1 rounded-full bg-primary px-4 text-[13px] font-semibold text-white shadow-[0_4px_10px_-6px_rgba(37,99,235,0.55)] transition-[filter] hover:brightness-110 dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)]'
const PILL_SECONDARY =
  'inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold text-slate-800 shadow-[0_1px_2px_rgba(11,21,51,0.06)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:ring-slate-300 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10'
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

/**
 * "Unclaimed match" under Employer adds, as a button that opens a pro tip: how far to raise savings for the full match,
 * what that costs and adds each month, the yearly total, and the way to change it. Closes on Escape or a click elsewhere.
 */
function MatchGapTip({ label, from, to, youMore, employerMore, yearly }: { label: string; from: number; to: number; youMore: string; employerMore: string; yearly: string }) {
  const { t } = useTranslation()
  const [open, setOpen] = React.useState(false)
  const wrap = React.useRef<HTMLSpanElement>(null)
  const panelId = useId()
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])
  return (
    <span ref={wrap} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1 rounded text-status-warning underline decoration-dotted underline-offset-2 hover:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {label}
        <Lightbulb className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open && (
        <span
          id={panelId}
          role="dialog"
          aria-label={t('postDashboard.match_tip_title')}
          className="absolute left-0 top-full z-30 mt-2 block w-[280px] rounded-xl bg-surface-card p-3.5 text-left shadow-[0_12px_32px_-12px_rgba(11,21,51,0.35)] ring-1 ring-slate-200 dark:ring-white/10"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-600 dark:text-amber-300">
            <Lightbulb className="h-3.5 w-3.5" aria-hidden />
            {t('postDashboard.match_tip_title')}
          </span>
          <span className="mt-1.5 block text-[13px] leading-snug text-text-primary">
            <Trans i18nKey="postDashboard.match_tip_body" values={{ from, to }} components={{ b: <span className="font-semibold" /> }} />
          </span>
          <span className="mt-2.5 block space-y-1 border-t border-slate-200/80 pt-2.5 text-[12px] dark:border-white/10">
            <span className="flex justify-between gap-3">
              <span className="text-text-secondary">{t('postDashboard.match_tip_you')}</span>
              <span className="font-semibold tabular-nums text-text-primary">+{youMore}{t('postDashboard.per_mo')}</span>
            </span>
            <span className="flex justify-between gap-3">
              <span className="text-text-secondary">{t('postDashboard.match_tip_employer')}</span>
              <span className="font-semibold tabular-nums text-status-success">+{employerMore}{t('postDashboard.per_mo')}</span>
            </span>
          </span>
          <span className="mt-2 block text-[12px] text-text-secondary">
            <Trans i18nKey="postDashboard.match_tip_year" values={{ amount: yearly }} components={{ b: <span className="font-semibold text-status-success" /> }} />
          </span>
          <Link to="/enrollment/contribution" className={`group mt-3 text-[13px] ${TEXT_LINK}`}>
            {t('contributionLimits.change')}
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
          </Link>
        </span>
      )}
    </span>
  )
}

/** Old 401(k)s and traditional IRAs can be rolled into this plan; a Roth IRA cannot */
const ROLLABLE_TYPES = ['retirement_401k', 'ira'] as const
const ROLLOVER_DISMISS_KEY = 'rollover_prompt_dismissed'

/**
 * "Do you want to roll over your funds?" at the top of the overview. When accounts added under All your accounts
 * hold money that could come into this plan, it names the amount and the accounts; otherwise it is a general
 * invitation. "Not now" hides it on this device.
 */
function RolloverPrompt() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const accounts = useOutsideAssetsStore((s) => s.accounts)
  const employer = useProfileStore((s) => s.employment.employer)
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return localStorage.getItem(ROLLOVER_DISMISS_KEY) === '1'
    } catch {
      return false
    }
  })
  if (dismissed) return null

  const rollable = accounts.filter((a) => (ROLLABLE_TYPES as readonly string[]).includes(a.type) && a.balance > 0)
  const total = rollable.reduce((sum, a) => sum + a.balance, 0)
  const plan = t('enrollment.rw.plan_name', { employer })
  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(ROLLOVER_DISMISS_KEY, '1')
    } catch {
      /* private mode: it simply shows again next visit */
    }
  }

  return (
    <section
      aria-labelledby="rollover-title"
      className="mb-5 flex flex-col gap-4 rounded-[20px] bg-[linear-gradient(180deg,#EAF2FF_0%,#F6F9FF_100%)] p-5 ring-1 ring-blue-100 sm:flex-row sm:items-center dark:bg-[linear-gradient(180deg,rgba(59,130,246,0.16)_0%,rgba(15,23,42,1)_100%)] dark:ring-blue-400/20"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-[0_1px_2px_rgba(11,21,51,0.06)] ring-1 ring-blue-100 dark:bg-white/10 dark:text-blue-300 dark:ring-white/10" aria-hidden>
        <ArrowLeftRight className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <h2 id="rollover-title" className="text-[16px] font-bold leading-tight text-text-primary">{t('postDashboard.rollover_title')}</h2>
        <p className="mt-1 text-[14px] leading-snug text-slate-700 dark:text-slate-300">
          {rollable.length > 0 ? (
            <Trans
              i18nKey="postDashboard.rollover_body_known"
              count={rollable.length}
              values={{ amount: formatMoney(total, locale), names: rollable.map((a) => accountName(a, t)).join(', '), plan }}
              components={{ b: <span className="font-semibold text-text-primary" /> }}
            />
          ) : (
            t('postDashboard.rollover_body_generic', { plan })
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Link to="/transactions/rollover" className={`group ${PILL_SECONDARY} h-10 px-5 text-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}>
          {t('postDashboard.rollover_cta')}
          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="inline-flex h-10 items-center rounded-full px-4 text-[14px] font-semibold text-slate-700 transition-colors hover:bg-white/70 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {t('postDashboard.rollover_later')}
        </button>
      </div>
    </section>
  )
}

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
  const { pending: nextActions, done: doneActions } = useNextBestActions()
  const allAccounts = useMemo(() => summarize(outsideAccounts, account.balance), [outsideAccounts, account.balance])
  /** What net worth is made of: each kind of asset held, then any debts */
  const accountRows = [
    ...ASSET_SLICES.map((id) => ({ id: id as string, label: t(`outside_assets.slice.${id}`), value: allAccounts.slices[id], color: ACCOUNT_SLICE_COLOR[id] })),
    { id: 'debts', label: t('outside_assets.group.debts'), value: -allAccounts.totalDebts, color: 'var(--chart-gray)' },
  ].filter((row) => row.value !== 0)
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
  const readinessShown = Math.max(0, Math.min(100, Math.round(readiness)))
  const reduceMotion = useReducedMotion()
  // useId adds characters that break url(#…), so keep letters, digits and dashes only
  const ringId = `ring-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const replacePct = data.salary > 0 ? Math.round((income.total / data.salary) * 100) : 0
  // On track above 70 (green), needs attention 50 to 70 (amber), off track under 50 (red)
  const band = READINESS_BANDS[readinessBandOf(readinessShown)]
  // Soft shades of the band's colour run round the ring; a full ring is one even shade, so there is no join at the top
  const ringFull = readinessShown >= 100
  const ringSegments = useMemo(() => ringArcs(ringFull ? [band.ring[1], band.ring[1]] : [...band.ring]), [band, ringFull])
  const contributionMonth = new Date().toLocaleDateString(locale, { month: 'long', year: 'numeric' })
  const limits = useContributionLimits()
  const monthlyGap = Math.round((fullMatch - annualMatch) / 12)
  // ── Readiness suggestion: the single change that would help most, from the participant's own numbers, in order:
  //    claim the full match, get on track, turn on auto-increase, save 1% more; with no room left to save, keep the mix in check ──
  const readinessTip = (() => {
    const rate = data.contributionPercent
    const base = {
      startingBalance: personalization.currentSavings,
      salary: data.salary,
      sources: data.contributionSources,
      years: yearsToRetirement,
      growthRate: getGrowthRate(data.riskLevel),
      autoIncrease: data.autoIncrease ? { amount: data.autoIncreaseAmount, max: data.autoIncreaseMax } : null,
    }
    const incomeAt = (ratePercent: number, autoIncrease = base.autoIncrease) =>
      retirementIncome(projectBalance({ ...base, ratePercent, autoIncrease }), yearsToRetirement, data.salary)
    // Extra savings at retirement from a change, in today's dollars, rounded to the nearest $100
    const addedSavings = (ratePercent: number, autoIncrease = base.autoIncrease) => {
      const gain = projectBalance({ ...base, ratePercent, autoIncrease }) - projectBalance({ ...base, ratePercent: rate })
      return Math.round(gain / Math.pow(1 + ASSUMED_INFLATION, yearsToRetirement) / 100) * 100
    }
    const perMonth = (yearly: number) => money(Math.round(yearly / 12))
    if (limits.match.gapPercent > 0) {
      return { key: 'tip_match', values: { pct: limits.match.gapPercent, amount: money(Math.round(fullMatch - annualMatch)) }, href: '/enrollment/contribution' }
    }
    if (readiness < ON_TRACK_MIN) {
      // Most the participant could add this year without passing the IRS limit, in whole percent
      const maxExtra = data.salary > 0 ? Math.max(0, Math.floor((limits.employeeLimit / data.salary) * 100) - rate) : 0
      const steps = Array.from({ length: Math.min(15, maxExtra) }, (_, i) => i + 1)
      const extra = steps.find((x) => incomeAt(rate + x).readinessPct >= ON_TRACK_MIN)
      if (extra) return { key: 'tip_on_track', values: { pct: extra, amount: perMonth((data.salary * extra) / 100) }, href: '/enrollment/contribution' }
      // Saving more alone won't get there in time: see whether retiring a little later would
      const laterYears = Array.from({ length: 10 }, (_, i) => i + 1).find(
        (y) => retirementIncome(projectBalance({ ...base, ratePercent: rate, years: yearsToRetirement + y }), yearsToRetirement + y, data.salary).readinessPct >= ON_TRACK_MIN,
      )
      if (laterYears) return { key: 'tip_retire_later', values: { count: laterYears, age: personalization.retirementAge + laterYears }, href: '/retirement-goal' }
      // Otherwise, the biggest step that still moves the score
      const best = steps.length ? steps[Math.min(4, steps.length - 1)] : 0
      const raised = best ? incomeAt(rate + best).readinessPct : readiness
      if (raised > readiness) return { key: 'tip_raise', values: { pct: best, score: raised }, href: '/enrollment/contribution' }
      return { key: 'tip_simulator', values: {}, href: '/retirement-goal' }
    }
    const auto = PLAN_CONFIG.autoIncrease.default
    if (!data.autoIncrease && rate < auto.max) {
      const added = addedSavings(rate, { amount: auto.amount, max: auto.max })
      if (added > 0) return { key: 'tip_auto', values: { amount: money(added) }, href: '/enrollment/auto-increase' }
    }
    if (limits.remaining > 0) {
      const added = addedSavings(rate + 1)
      if (added > 0) return { key: 'tip_more', values: { cost: perMonth(data.salary / 100), amount: money(added) }, href: '/enrollment/contribution' }
    }
    return { key: 'tip_review', values: { pct: replacePct }, href: '/investments' }
  })()
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

          {/* First thing on the page: an offer to bring money from an old plan or IRA into this one */}
          <RolloverPrompt />

          <NotificationBanner />

          {/* Balance and readiness share a row, so they are always the same height */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            {/* Card 1: Total balance */}
            <SpecCard className="relative flex flex-col overflow-hidden lg:col-span-8">
              {/* Label and status share the top line; the amount; then this quarter's change and the way into the details */}
              <div className="mb-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{t('dashboard.totalBalance')}</p>
                  <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${band.pill}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${band.dot}`} aria-hidden />
                    {t(band.labelKey)}
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

            {/* Readiness: a soft tile icon with a one-line explainer, a ring in soft shades of the score band's colour, with the score inside and the status under it, what the score means in a quiet panel, then the page's main button */}
            <SpecCard className="relative isolate flex flex-col lg:col-span-4">
              {/* Soft wash in the top-right corner, clipped to the card in its own layer so tooltips can still spill out */}
              <span className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[20px]" aria-hidden>
                <span className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(52,211,153,0.16),rgba(52,211,153,0)_70%)] dark:bg-[radial-gradient(closest-side,rgba(52,211,153,0.12),rgba(52,211,153,0)_70%)]" />
                <span className="absolute -right-24 -top-10 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,rgba(96,165,250,0.12),rgba(96,165,250,0)_70%)]" />
              </span>

              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20" aria-hidden>
                  <ShieldCheck className="h-[22px] w-[22px]" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[16px] font-bold leading-tight text-text-primary">{t('dashboard.readinessScore')}</h2>
                  <p className="mt-0.5 flex items-center gap-1 text-[12px] text-text-secondary">
                    {t('postDashboard.readiness_sub')}
                    <InfoTip label={t('postDashboard.readiness_tip_label')} text={t('postDashboard.readiness_tip')} side="bottom" align="end" />
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col items-center justify-center py-2">
                <div className="relative h-[148px] w-[148px]" role="img" aria-label={`${t('dashboard.readinessScore')}: ${readinessShown}/100, ${t(band.labelKey)}`}>
                  <svg viewBox={`0 0 ${RING_BOX} ${RING_BOX}`} className="block h-full w-full overflow-visible" aria-hidden>
                    <defs>
                      {/* Reveals the coloured ring up to the score; animates on load */}
                      <mask id={`${ringId}-mask`} maskUnits="userSpaceOnUse" x={-10} y={-10} width={RING_BOX + 20} height={RING_BOX + 20}>
                        <motion.circle
                          cx={RING_C}
                          cy={RING_C}
                          r={RING_R}
                          fill="none"
                          stroke="#fff"
                          strokeWidth={RING_W}
                          strokeLinecap="round"
                          transform={`rotate(-90 ${RING_C} ${RING_C})`}
                          pathLength={1}
                          initial={reduceMotion ? false : { pathLength: 0 }}
                          animate={{ pathLength: Math.min(readinessShown, 100) / 100 }}
                          transition={{ duration: 1.1, ease }}
                        />
                      </mask>
                    </defs>
                    {/* The empty part of the ring: the same colour, faint */}
                    <circle
                      cx={RING_C}
                      cy={RING_C}
                      r={RING_R}
                      fill="none"
                      strokeWidth={RING_W}
                      stroke={isDark ? band.track.dark : band.track.light}
                    />
                    {/* The colour runs round the ring, light at the top and deeper as it goes */}
                    <g mask={`url(#${ringId}-mask)`}>
                      {ringSegments.map((seg) => (
                        <path key={seg.d} d={seg.d} fill="none" stroke={seg.color} strokeWidth={RING_W} />
                      ))}
                    </g>
                    {/* Rounded start in the starting colour, so the deeper end colour never peeks out behind it */}
                    {/* A full ring has no start to round off, so it is left as one smooth band */}
                    {readinessShown > 0 && !ringFull && <circle cx={RING_C} cy={RING_C - RING_R} r={RING_W / 2} fill={ringSegments[0].color} />}
                  </svg>
                  {/* Score in the middle */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[38px] font-medium leading-none tracking-tight tabular-nums text-text-primary">{readinessShown}</span>
                    <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-text-secondary">{t('postDashboard.readiness_of')}</span>
                  </div>
                </div>
                {/* Status under the ring */}
                <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ${band.pill}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${band.dot}`} aria-hidden />
                  {t(band.labelKey)}
                </span>
              </div>

              {/* One tip worked out from the participant's numbers, on one line; the whole panel opens the place to act on it */}
              <Link
                to={readinessTip.href}
                title={t(`postDashboard.${readinessTip.key}`, readinessTip.values).replace(/<\/?b>/g, '')}
                className={`group flex items-center gap-2 rounded-2xl px-3.5 py-2.5 ring-1 transition-shadow hover:shadow-[0_4px_12px_-6px_rgba(11,21,51,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${band.panel}`}
              >
                <span className="min-w-0 flex-1">
                  <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${band.accent}`}>
                    <Lightbulb className="h-3 w-3" aria-hidden />
                    {t('postDashboard.tip_label')}
                  </span>
                  {/* One line: the tips are written short, and anything longer is cut with an ellipsis (the full text is the panel's title) */}
                  <span className="mt-0.5 block truncate text-[13px] text-text-secondary">
                    <Trans i18nKey={`postDashboard.${readinessTip.key}`} values={readinessTip.values} components={{ b: <span className="font-semibold text-text-primary" /> }} />
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
              </Link>

              <Link to="/retirement-goal" className={`group mt-4 h-10 w-full gap-2 text-[14px] ${PILL_PRIMARY}`}>
                <Calculator className="h-4 w-4" aria-hidden />
                {t('dashboard.launchSimulator')}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
              </Link>
            </SpecCard>
          </div>

          {/* Rows that pair a wide card with a narrow one, so each pair lines up top and bottom; the library spans the last row */}
          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="grid min-w-0 lg:col-span-8">
                {/* Card 2: Quick Actions — one card, 4 tiles with dividers */}
                  {/* The tiles fill whatever height the row gives them, with their content centred, so no blank band sits under them */}
                  <SpecCard noPadding className="flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2.5 px-5 pb-3.5 pt-5">
                      <TitleBadge Icon={Zap} color="bg-blue-600" />
                      <h2 className="text-[16px] font-bold text-text-primary">{t('dashboard.quickActions')}</h2>
                    </div>
                    <div className="grid flex-1 grid-cols-1 divide-y divide-slate-200/80 border-t border-slate-200/80 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 dark:divide-white/10 dark:border-white/10">
                      {quickActions.map((tile) => (
                        <Link
                          key={tile.title}
                          to={tile.href}
                          className="group flex flex-col justify-center px-5 py-4 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:hover:bg-white/5"
                        >
                          <span className="flex items-center justify-between">
                            <IconChip Icon={tile.Icon} tone={tile.tone} />
                            <ChevronRight className="-mr-1 h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                          </span>
                          <p className="mt-3 text-[14px] font-bold leading-tight text-text-primary">{tile.title}</p>
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
                  <div className="mb-1.5 flex items-center justify-between gap-2">
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
                            className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:hover:bg-white/5"
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
                    {/* With fewer than three to do, things already settled fill the list, marked done */}
                    {doneActions.slice(0, Math.max(0, 3 - nextActions.length)).map((id: DoneActionId) => (
                      <li key={id} className="flex items-center gap-3 px-2 py-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-status-success-bg text-status-success" aria-hidden>
                          <Check className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 flex-1 text-[13px] text-text-secondary">{t(`next_actions.done_${id}`)}</span>
                      </li>
                    ))}
                  </ul>
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
                            <MatchGapTip
                              label={t('postDashboard.c_match_gap', { amount: money(monthlyGap) })}
                              from={data.contributionPercent}
                              to={data.contributionPercent + limits.match.gapPercent}
                              youMore={money(Math.round((data.salary * limits.match.gapPercent) / 100 / 12))}
                              employerMore={money(monthlyGap)}
                              yearly={money(Math.round(fullMatch - annualMatch))}
                            />
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
                      <ul className="flex flex-1 flex-col divide-y divide-slate-200/80 dark:divide-white/10">
                        {ACTIVE_LOANS.map((loan) => (
                          <li key={loan.ref} className="flex flex-1 flex-col justify-center py-3 first:pt-0">
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
                            <div className="mt-1.5 flex justify-between text-[11px] text-text-secondary">
                              <span>{t('postDashboard.loan_paid', { pct: loan.paidPct })}</span>
                              <span>{t('postDashboard.loan_left', { count: loan.paymentsLeft })}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-baseline justify-between border-t border-slate-200/80 pt-3 dark:border-white/10">
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
                    <>
                      <p className="text-[12px] text-text-secondary">{t('outside_assets.net_worth')}</p>
                      <p className="mt-0.5 text-[24px] font-bold leading-tight tabular-nums text-text-primary">{formatMoney(allAccounts.netWorth, locale)}</p>
                      <dl className="mt-3 space-y-1.5 border-t border-slate-200/80 pt-3 dark:border-white/10">
                        {accountRows.map((row) => (
                          <div key={row.id} className="flex items-center justify-between gap-3 text-[13px]">
                            <dt className="flex min-w-0 items-center gap-2 text-text-secondary">
                              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: row.color }} aria-hidden />
                              <span className="truncate">{row.label}</span>
                            </dt>
                            <dd className="shrink-0 font-semibold tabular-nums text-text-primary">{formatMoney(row.value, locale)}</dd>
                          </div>
                        ))}
                      </dl>
                    </>
                  ) : (
                    <p className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">{t('outside_assets.card_invite')}</p>
                  )}
                  <Link to="/outside-assets" className={`group mt-auto self-start pt-3 text-[13px] ${TEXT_LINK}`}>
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
                    <Link to="/transactions" className={`group text-[13px] ${TEXT_LINK}`}>
                      {t('dashboard.viewAll')}
                      <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                    </Link>
                  </div>
                  <ul className="divide-y divide-slate-200/80 dark:divide-white/10">
                    <li className="flex items-center gap-3.5 py-3 first:pt-0">
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
                    <li className="flex items-center gap-3.5 py-3">
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
                    {ACTIVE_LOANS.length > 0 && (
                      <li className="flex items-center gap-3.5 py-3">
                        <IconChip Icon={CreditCard} tone="amber" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-bold text-text-primary">{t('postDashboard.activity_loan_repayment')}</p>
                          <p className="text-[12px] text-text-secondary">{t(`postDashboard.loan_${ACTIVE_LOANS[0].purpose}`)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[14px] font-bold tabular-nums text-text-primary">{money(ACTIVE_LOANS[0].payment, true)}</p>
                          <p className="text-[12px] text-text-secondary">{t('postDashboard.sample_date_oct')}</p>
                        </div>
                      </li>
                    )}
                    <li className="flex items-center gap-3.5 py-3 last:pb-0">
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
                    <Link to="/advisor?tab=meetings" className={`flex-auto gap-1.5 whitespace-nowrap ${PILL_SECONDARY}`}>
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
                      <Link to="/enrich" className={`group/cta mt-auto ${PILL_SECONDARY}`}>
                        {t('postDashboard.library_cta')}
                        <ChevronRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                      </Link>
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
