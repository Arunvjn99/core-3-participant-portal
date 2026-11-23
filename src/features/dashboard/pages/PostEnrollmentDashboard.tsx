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
  PieChart,
  CreditCard,
  CheckSquare,
  User,
  Shield,
  ArrowDownLeft,
  Building2,
  MessagesSquare,
  CalendarDays,
  Target,
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
import { LOAN_PAYMENT_DAY, activeLoans } from '@/features/transactions/planLoans'
import { useRetirementGoal } from '@/features/retirement/retirementStore'
import { ON_TRACK_MIN, READINESS_BANDS, readinessBandOf } from '@/features/retirement/readinessBands'
import { goalExtras } from '@/features/retirement/readinessExtras'
import { ReadinessRing, ReadinessStatus } from '@/features/retirement/ReadinessRing'
import { AdvisorAvatar } from '@/features/advisors/AdvisorAvatar'
import { AppIcon, IconTile } from '@/design-system/icons'
import { useDemoPersona } from '@/features/demo/demoStore'
import { PersonaNotice } from '@/features/demo/PersonaNotice'
import { createPortal } from 'react-dom'
import { useSecondPlan } from '@/features/plan/secondPlan'

const ease = [0.22, 1, 0.36, 1] as const

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
  check_readiness: Target,
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
      className={`rounded-[20px] shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ${CARD_TONES[tone]} ${noPadding ? '' : 'px-5 py-4'} ${className}`}
    >
      {children}
    </motion.div>
  )
}

type IconType = React.ComponentType<{ className?: string }>

/** Icon badge beside a card title: the icon system's subtle blue circle, the same on every card (`color` is kept for
 *  older callers and no longer changes the colour). */
function TitleBadge({ Icon }: { Icon: IconType; color: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/25 dark:text-blue-200" aria-hidden>
      <Icon className="h-[18px] w-[18px]" />
    </span>
  )
}

const CHIP_TONE_BLUE = 'bg-blue-50 text-[#2563EB] ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20'
/** Every round chip uses the icon system's subtle blue; the tone names stay so callers need no change */
const CHIP_TONES = { emerald: CHIP_TONE_BLUE, blue: CHIP_TONE_BLUE, amber: CHIP_TONE_BLUE, rose: CHIP_TONE_BLUE, slate: CHIP_TONE_BLUE } as const

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
  const panel = React.useRef<HTMLSpanElement>(null)
  const panelId = useId()
  /** Where the tip sits on screen: drawn above the page so no card can cut it off, and kept inside the window */
  const [pos, setPos] = React.useState<{ left: number; top: number } | null>(null)
  React.useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const btn = wrap.current?.getBoundingClientRect()
      const box = panel.current?.getBoundingClientRect()
      if (!btn || !box) return
      const edge = 12
      const left = Math.min(Math.max(edge, btn.left), window.innerWidth - box.width - edge)
      const below = btn.bottom + 8
      const top = below + box.height > window.innerHeight - edge ? Math.max(edge, btn.top - box.height - 8) : below
      setPos({ left, top })
    }
    place()
    const close = () => setOpen(false)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [open])
  React.useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!wrap.current?.contains(target) && !panel.current?.contains(target)) setOpen(false)
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
        onClick={() => {
          setPos(null)
          setOpen((o) => !o)
        }}
        aria-expanded={open}
        aria-controls={panelId}
        className="inline-flex items-center gap-1 rounded text-status-warning underline decoration-dotted underline-offset-2 hover:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        {label}
        <Lightbulb className="h-3.5 w-3.5" aria-hidden />
      </button>
      {open && createPortal(
        <span
          ref={panel}
          id={panelId}
          role="dialog"
          aria-label={t('postDashboard.match_tip_title')}
          style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, visibility: pos ? 'visible' : 'hidden' }}
          className="fixed z-[200] block w-[min(280px,calc(100vw-24px))] rounded-xl bg-surface-card p-3.5 text-left shadow-[0_12px_32px_-12px_rgba(11,21,51,0.35)] ring-1 ring-slate-200 dark:ring-white/10"
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
        </span>,
        document.body,
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
      className="mb-3 flex flex-col gap-4 rounded-[20px] bg-[linear-gradient(180deg,#EAF2FF_0%,#F6F9FF_100%)] px-5 py-4 ring-1 ring-blue-100 sm:flex-row sm:items-center dark:bg-[linear-gradient(180deg,rgba(59,130,246,0.16)_0%,rgba(15,23,42,1)_100%)] dark:ring-blue-400/20"
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
  // Prototype demo: a participant with their own balances uses those instead
  const persona = useDemoPersona()
  const planAccount = persona?.balance !== undefined ? { ...PLANS[0], balance: persona.balance, vested: persona.vested ?? persona.balance } : PLANS[0]
  // A second plan (457(b)) they're enrolled in counts toward the total; it's their own money, so fully vested
  const secondPlan = useSecondPlan()
  const secondEnrolled = !!secondPlan?.enrolled
  const secondBalance = secondEnrolled ? (secondPlan?.balance ?? 0) : 0
  const account = secondEnrolled ? { ...planAccount, balance: planAccount.balance + secondBalance, vested: planAccount.vested + secondBalance } : planAccount
  const dashEmployer = useProfileStore((s) => s.employment.employer)
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
  // What the participant set on the Retirement readiness page (goal, outside savings, location), so both show one score
  const savedGoal = useRetirementGoal()
  const incomeExtras = { ...goalExtras(savedGoal, data.contributionSources, getGrowthRate(data.riskLevel)), retirementAge: personalization.retirementAge }
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
    incomeExtras,
  )
  const readiness = income.readinessPct
  const readinessShown = Math.max(0, Math.min(100, Math.round(readiness)))
  const replacePct = data.salary > 0 ? Math.round((income.total / data.salary) * 100) : 0
  // On track above 70 (green), needs attention 50 to 70 (amber), off track under 50 (red)
  const band = READINESS_BANDS[readinessBandOf(readinessShown)]
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
      retirementIncome(projectBalance({ ...base, ratePercent, autoIncrease }), yearsToRetirement, data.salary, incomeExtras)
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
        (y) => retirementIncome(projectBalance({ ...base, ratePercent: rate, years: yearsToRetirement + y }), yearsToRetirement + y, data.salary, { ...incomeExtras, retirementAge: personalization.retirementAge + y }).readinessPct >= ON_TRACK_MIN,
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
    const due = new Date(now.getFullYear(), now.getMonth(), LOAN_PAYMENT_DAY)
    if (now.getDate() > LOAN_PAYMENT_DAY) due.setMonth(due.getMonth() + 1)
    return due.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
  })()
  // The plan's loans, worked out from their records: one shows in full, two or more as rows with a total
  const loans = useMemo(() => activeLoans(), [])
  const loansTotal = loans.reduce((sum, l) => sum + l.balance, 0)

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
        <div className="w-full pb-6 pt-2 lg:pb-7 lg:pt-3">
          {/* Prototype demo: an auto-enrolled participant is told so first */}
          <PersonaNotice persona={persona} className="mb-4" />

          {/* First thing on the page: an offer to bring money from an old plan or IRA into this one */}
          <RolloverPrompt />


          {/* Balance and readiness share a row, 65% and 35%, so they are always the same height */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,13fr)_minmax(0,7fr)]">
            {/* Card 1: Total balance */}
            <SpecCard className="relative flex flex-col overflow-hidden">
              {/* The balance leads; this month's contributions sit beside it, one step down, as supporting detail */}
              <div className="mb-3">
                <h1 className="sr-only">{t('dashboard.overview')}</h1>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{t('dashboard.totalBalance')}</p>
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
                  <div className="min-w-0 rounded-2xl bg-slate-50 px-4 py-3 sm:text-right dark:bg-white/[0.04]">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{t('postDashboard.contributions_title')}</p>
                    <p className="mt-1 text-[20px] font-bold leading-none tracking-tight tabular-nums text-text-primary">
                      {money(monthlyTotal)}
                      <span className="text-[13px] font-medium tracking-normal text-text-secondary">{t('postDashboard.per_mo')}</span>
                    </p>
                    <p className="mt-2 flex flex-wrap items-center gap-x-1.5 text-[12px] text-text-secondary sm:justify-end">
                      <span>{t('postDashboard.c_you')}</span>
                      <span className="font-semibold tabular-nums text-text-primary">{money(monthlyYou)}</span>
                      <span aria-hidden>·</span>
                      <span>{t('postDashboard.c_employer')}</span>
                      <span className="font-semibold tabular-nums text-status-success">{`+${money(monthlyMatch)}`}</span>
                    </p>
                    {monthlyGap > 0 && (
                      <div className="mt-1.5 flex items-center gap-1 text-[12px] text-status-warning sm:justify-end">
                      <MatchGapTip
                        label={t('postDashboard.c_match_gap', { amount: money(monthlyGap) })}
                        from={data.contributionPercent}
                        to={data.contributionPercent + limits.match.gapPercent}
                        youMore={money(Math.round((data.salary * limits.match.gapPercent) / 100 / 12))}
                        employerMore={money(monthlyGap)}
                        yearly={money(Math.round(fullMatch - annualMatch))}
                      />
                    </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-3 w-full">
                <PremiumBalanceChart data={balanceChartData} isDark={isDark} axes={{ xLabels: balanceMonths, formatY: (v) => `$${Math.round(v / 1000)}K` }} />
              </div>

              {/* Three facts in a row under the chart, split by thin dividers: no panel inside the card */}
              <div className="mt-auto grid grid-cols-1 divide-y divide-slate-200/80 border-t border-slate-200/80 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:pt-3 dark:divide-white/10 dark:border-white/10">
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
            <SpecCard className="relative isolate flex flex-col">
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
                <ReadinessRing score={readinessShown} />
                {/* Status under the ring */}
                <ReadinessStatus score={readinessShown} className="mt-3" />
              </div>

              {/* One tip worked out from the participant's numbers, shown in full (it wraps rather than being cut);
                  the whole panel still opens the place to act on it */}
              <Link
                to={readinessTip.href}
                className={`group block rounded-2xl px-3.5 py-2.5 ring-1 transition-shadow hover:shadow-[0_4px_12px_-6px_rgba(11,21,51,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${band.panel}`}
              >
                <span className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] ${band.accent}`}>
                  <Lightbulb className="h-3 w-3" aria-hidden />
                  {t('postDashboard.tip_label')}
                </span>
                <span className="mt-0.5 block text-[13px] leading-snug text-text-secondary">
                  <Trans i18nKey={`postDashboard.${readinessTip.key}`} values={readinessTip.values} components={{ b: <span className="font-semibold text-text-primary" /> }} />
                </span>
              </Link>

              <Link to="/retirement-goal" className={`group mt-3 h-10 w-full gap-2 text-[14px] ${PILL_PRIMARY}`}>
                <Calculator className="h-4 w-4" aria-hidden />
                {t('dashboard.launchSimulator')}
                <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
              </Link>
            </SpecCard>
          </div>

          {/* Two plans: each one's balance and what goes into it, side by side under the overview */}
          {secondEnrolled && secondPlan && (
            <section aria-labelledby="your-plans" className="mt-3">
              <h2 id="your-plans" className="sr-only">{t('plan2.dash_title')}</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { key: 'main', name: t('enrollment.rw.plan_name', { employer: dashEmployer }), type: t('plan2.main_type'), balance: planAccount.balance, rate: data.contributionPercent, note: t('plan2.dash_match', { cap: PLAN_CONFIG.match.capPercent }), tone: 'blue' as const },
                  { key: 'second', name: t('plan2.name', { employer: dashEmployer }), type: t('plan2.type'), balance: secondBalance, rate: secondPlan.rate, note: t('plan2.dash_no_match'), tone: 'violet' as const },
                ].map((p) => (
                  <SpecCard key={p.key} className="flex items-start gap-3">
                    <IconTile icon={Landmark} tone={p.tone} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate text-[15px] font-bold text-text-primary">{p.name}</h3>
                          <p className="text-[12px] text-text-secondary">{p.type}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/20">{t('plan2.dash_participating')}</span>
                      </div>
                      <p className="mt-2 text-[22px] font-bold leading-tight tabular-nums text-text-primary">{money(Math.round(p.balance))}</p>
                      <p className="mt-0.5 text-[13px] text-text-secondary">
                        {t('plan2.dash_saving', { rate: p.rate, amount: money(Math.round((data.salary * p.rate) / 100 / 12)) })} · {p.note}
                      </p>
                    </div>
                  </SpecCard>
                ))}
              </div>
            </section>
          )}

          {/* Below the first row: a 65% column on the left and a 35% column on the right; the last card in each grows so
              both columns end level. On small screens the two columns fold back into one list in reading order. */}
          <div className="mt-3 flex flex-col gap-3 lg:grid lg:grid-cols-[minmax(0,13fr)_minmax(0,7fr)]">
            <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-3">
              <div className="order-1 grid min-w-0 lg:order-none">
                  {/* Financial wellness library: the Enrich card's look and illustration, as on the pre-enrollment dashboard */}
                    <SpecCard tone="blue" className="group relative isolate flex min-h-[168px] overflow-hidden transition-shadow hover:shadow-[0_24px_48px_-28px_rgba(37,99,235,0.45)]">
                      {/* A soft periwinkle glow behind the illustration so it sits in the card's own light */}
                      <span className="pointer-events-none absolute -right-10 top-1/2 -z-10 h-64 w-80 -translate-y-1/2 rounded-full bg-[#8C9BFF] opacity-25 blur-[70px] transition-opacity group-hover:opacity-40 dark:bg-[#5B6BFF] dark:opacity-35" aria-hidden />
                      <div className="relative z-10 flex flex-1 flex-col items-start sm:max-w-[56%]">
                        <div className="flex items-center gap-2.5">
                          <TitleBadge Icon={GraduationCap} color="bg-blue-600" />
                          <h2 className="text-[16px] font-bold text-text-primary">{t('dashboard.learningHub')}</h2>
                        </div>
                        <h3 className="mt-3 text-[20px] font-bold leading-tight text-slate-900 dark:text-white">{t('enrich.subtitle')}</h3>
                        <p className="mb-4 mt-1.5 max-w-[380px] text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">
                          {t('enrich.intro')}
                        </p>
                        <Link to="/enrich" className={`group/cta mt-auto ${PILL_SECONDARY}`}>
                          {t('postDashboard.library_cta')}
                          <ChevronRight className="h-4 w-4 transition-transform group-hover/cta:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                        </Link>
                      </div>

                      {/* The saver on the safe, the same illustration as the pre-enrollment Enrich card: cut out of its
                          backdrop and fitted whole, its cut edges sitting on the card's bottom and right edges */}
                      <img
                        src="/media/enrich-big-goals.webp"
                        alt=""
                        width={960}
                        height={658}
                        className="pointer-events-none absolute bottom-0 right-0 hidden h-[calc(100%-12px)] w-auto max-w-[44%] origin-bottom-right object-contain object-right-bottom drop-shadow-[0_16px_24px_rgba(15,26,72,0.18)] transition-transform duration-700 group-hover:scale-[1.03] motion-reduce:transition-none sm:block"
                        aria-hidden
                      />
                    </SpecCard>
              </div>
              <div className="order-3 grid min-w-0 lg:order-none">
                  {/* Quick Actions: one card, four tiles in a row split by thin rules */}
                    <SpecCard noPadding className="flex flex-col overflow-hidden">
                      <div className="flex items-center gap-2.5 px-5 pb-3 pt-4">
                        <TitleBadge Icon={Zap} color="bg-blue-600" />
                        <h2 className="text-[16px] font-bold text-text-primary">{t('dashboard.quickActions')}</h2>
                      </div>
                      <div className="grid flex-1 grid-cols-1 divide-y divide-slate-200/80 border-t border-slate-200/80 sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4 dark:divide-white/10 dark:border-white/10">
                        {quickActions.map((tile) => (
                          <Link
                            key={tile.title}
                            to={tile.href}
                            className="group flex flex-col justify-center px-5 py-3 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:hover:bg-white/5"
                          >
                            <span className="flex items-center justify-between">
                              <IconChip Icon={tile.Icon} tone={tile.tone} />
                              <ChevronRight className="-mr-1 h-4 w-4 text-text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                            </span>
                            <p className="mt-3 text-[14px] font-bold leading-tight text-text-primary">{tile.title}</p>
                            <p className="mt-1 text-[13px] font-medium text-primary dark:text-blue-300">{tile.sub}</p>
                            <p className="mt-0.5 text-[12px] text-text-secondary">{tile.hint}</p>
                          </Link>
                        ))}
                      </div>
                    </SpecCard>
              </div>
              <div className="order-5 grid min-w-0 lg:order-none">
                  {/* Card 4: Portfolio Allocation — header, bar centred in the space, figures along the bottom */}
                  <SpecCard className="flex flex-col">
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
                    <div className="flex flex-1 flex-col justify-center py-2">
                    {/* Scale labels sit exactly over their quarter marks */}
                    <div className="relative mb-1.5 h-3 text-[11px] leading-none text-text-muted" aria-hidden>
                      {[0, 25, 50, 75, 100].map((v) => (
                        <span key={v} className="absolute top-0" style={{ left: `${v}%`, transform: `translateX(${v === 0 ? '0' : v === 100 ? '-100%' : '-50%'})` }}>
                          {v}%
                        </span>
                      ))}
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
                    </div>
                    <div className="grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-3 sm:grid-cols-4 dark:border-white/10">
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
              <div className="order-7 grid min-w-0 lg:order-none lg:flex-1">
                  {/* Recent Activity: the last card on the left, stretched so both columns end level */}
                  <SpecCard className="flex h-full flex-col">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <TitleBadge Icon={History} color="bg-blue-600" />
                        <h3 className="text-[16px] font-bold text-text-primary">{t('dashboard.recentActivity')}</h3>
                      </div>
                      <Link to="/transactions" className={`group text-[13px] ${TEXT_LINK}`}>
                        {t('dashboard.viewAll')}
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                      </Link>
                    </div>
                    <ul className="flex flex-1 flex-col justify-around divide-y divide-slate-200/80 dark:divide-white/10">
                      <li className="flex items-center gap-3.5 py-2 first:pt-0">
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
                      <li className="flex items-center gap-3.5 py-2">
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
                      {loans.length > 0 && (
                        <li className="flex items-center gap-3.5 py-2">
                          <IconChip Icon={CreditCard} tone="amber" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-bold text-text-primary">{t('postDashboard.activity_loan_repayment')}</p>
                            <p className="text-[12px] text-text-secondary">{t(`postDashboard.loan_${loans[0].purpose}`)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[14px] font-bold tabular-nums text-text-primary">{money(loans[0].payment, true)}</p>
                            <p className="text-[12px] text-text-secondary">{t('postDashboard.sample_date_oct')}</p>
                          </div>
                        </li>
                      )}
                      <li className="flex items-center gap-3.5 py-2 last:pb-0">
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
            </div>
            <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-3">
              <div className="order-2 grid min-w-0 lg:order-none">
                  {/* Your Advisor: the plan widget's wash, a face, the numbers between two thin rules */}
                  <SpecCard tone="warm">
                    <div className="flex items-center gap-3">
                      <AdvisorAvatar />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-text-secondary">{t('dashboard.yourAdvisor')}</p>
                        <h3 className="mt-0.5 text-[18px] font-bold leading-tight text-text-primary">Sarah Jenkins</h3>
                        <p className="mt-0.5 text-[13px] text-slate-600 dark:text-slate-300">{t('postDashboard.advisor_title_role')}</p>
                      </div>
                    </div>
                    {/* Stats sit straight on the card between two thin rules: no panel inside the card */}
                    <div className="mt-3 grid grid-cols-3 divide-x divide-slate-200/80 border-y border-slate-200/80 py-2.5 text-center dark:divide-white/10 dark:border-white/10">
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
                    <p className="mt-3 text-[13px] leading-relaxed text-slate-600 dark:text-slate-300">
                      {t('postDashboard.advisor_bio')}
                    </p>
                    {/* One way in: the adviser page holds both messages and booking a call */}
                    <Link to="/advisor" className={`mt-3 w-full whitespace-nowrap ${PILL_SECONDARY}`}>
                      <AppIcon icon={MessagesSquare} />
                      {t('postDashboard.advisor_cta', { name: 'Sarah' })}
                    </Link>
                  </SpecCard>
              </div>
              <div className="order-4 grid min-w-0 lg:order-none">
                  {/* Next Best Actions: the two most important, each a boxed card; a required one is tinted */}
                  <SpecCard className="flex flex-col">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <TitleBadge Icon={CheckSquare} color="bg-emerald-600" />
                        <h2 className="text-[16px] font-bold text-text-primary">{t('dashboard.nextBestActions')}</h2>
                      </div>
                      <span className="text-[12px] font-medium text-text-secondary">{t('postDashboard.actions_count', { count: Math.min(nextActions.length, 2) })}</span>
                    </div>
                    <ul className="flex flex-1 flex-col gap-3">
                      {nextActions.slice(0, 2).map((action) => {
                        const ActionIcon = NEXT_ACTION_ICONS[action.id]
                        return (
                          <li key={action.id} className="flex flex-1">
                            <Link
                              to={action.href}
                              className={`group flex w-full items-center gap-3 rounded-2xl border p-4 transition-shadow hover:shadow-[0_6px_16px_-10px_rgba(11,21,51,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${action.required ? 'border-status-danger/20 bg-status-danger-bg' : 'border-border-default bg-surface-elevated'}`}
                            >
                              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${action.required ? 'bg-status-danger/15 text-status-danger' : 'bg-surface-page text-text-secondary'}`} aria-hidden>
                                <ActionIcon className="h-5 w-5" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="text-[13px] font-bold text-text-primary">{t(`next_actions.${action.id}`, action.values)}</span>
                                  {action.required && (
                                    <span className="rounded bg-status-danger/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-status-danger">{t('postDashboard.badge_required')}</span>
                                  )}
                                </span>
                                <span className="mt-1 block text-[12px] text-text-secondary">{t(`next_actions.${action.id}_sub`, action.values)}</span>
                              </span>
                              <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                            </Link>
                          </li>
                        )
                      })}
                      {/* With fewer than two to do, things already settled fill the space, marked done */}
                      {doneActions.slice(0, Math.max(0, 2 - nextActions.length)).map((id: DoneActionId) => (
                        <li key={id} className="flex flex-1 items-center gap-3 rounded-2xl border border-border-default bg-surface-elevated p-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-status-success-bg text-status-success" aria-hidden>
                            <Check className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1 text-[13px] text-text-secondary">{t(`next_actions.done_${id}`)}</span>
                        </li>
                      ))}
                    </ul>
                  </SpecCard>
              </div>
              <div className="order-6 grid min-w-0 lg:order-none">
                  {/* Active loans: one shows in full; two or more show as rows with the total underneath */}
                  <SpecCard className="flex flex-col">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <TitleBadge Icon={CreditCard} color="bg-blue-600" />
                        <div className="min-w-0">
                          <h2 className="text-[16px] font-bold leading-tight text-text-primary">{t(loans.length > 1 ? 'postDashboard.loans_title' : 'dashboard.activeLoan')}</h2>
                          {loans[0] && <p className="mt-0.5 truncate text-[12px] text-text-secondary">{t('postDashboard.loans_from_plan', { plan: loans[0].planName })}</p>}
                        </div>
                      </div>
                      {loans.length > 1 && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[12px] font-semibold tabular-nums text-text-secondary dark:bg-white/10">{loans.length}</span>
                      )}
                    </div>

                    {loans.length === 1 ? (
                      loans.map((loan) => (
                        <div key={loan.ref}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-[14px] font-semibold text-text-primary">{t(`postDashboard.loan_${loan.purpose}`)}</p>
                              <p className="mt-0.5 text-[12px] text-text-secondary">
                                {loan.ref} · {t('postDashboard.loan_since', { date: new Date(`${loan.originated}T00:00:00`).toLocaleDateString(locale, { month: 'short', year: 'numeric' }) })}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full bg-status-success-bg px-2 py-0.5 text-[12px] font-semibold text-status-success">{t('common.active')}</span>
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-4 border-t border-slate-200/80 pt-3 dark:border-white/10">
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
                          <div className="mt-1.5 flex justify-between text-[12px] text-text-secondary">
                            <span>{t('postDashboard.loan_paid', { pct: loan.paidPct })}</span>
                            <span>{t('postDashboard.loan_left', { count: loan.paymentsLeft })}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <ul className="flex flex-1 flex-col divide-y divide-slate-200/80 dark:divide-white/10">
                          {loans.map((loan) => (
                            <li key={loan.ref} className="flex flex-1 flex-col justify-center py-2.5 first:pt-0">
                              <div className="flex items-baseline justify-between gap-2">
                                <p className="min-w-0 truncate text-[14px] font-semibold text-text-primary">{t(`postDashboard.loan_${loan.purpose}`)}</p>
                                <p className="shrink-0 text-[15px] font-semibold tabular-nums text-text-primary">{money(loan.balance)}</p>
                              </div>
                              <div className="mt-0.5 flex items-baseline justify-between gap-2 text-[12px] text-text-secondary">
                                <span>{loan.ref}</span>
                                <span>{t('postDashboard.loan_next_short', { amount: money(loan.payment), date: nextLoanDue })}</span>
                              </div>
                              <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={loan.paidPct} aria-label={t('postDashboard.loan_paid', { pct: loan.paidPct })}>
                                <div className="h-full rounded-full bg-status-success" style={{ width: `${loan.paidPct}%` }} />
                              </div>
                              <div className="mt-1.5 flex justify-between text-[12px] text-text-secondary">
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
              <div className="order-8 grid min-w-0 lg:order-none lg:flex-1">
                  {/* All your accounts, kept short: the total (or this plan, before any are linked), up to three accounts, one link */}
                  <SpecCard className="flex flex-col">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <TitleBadge Icon={Landmark} color="bg-blue-600" />
                        <span className="truncate text-[16px] font-bold text-text-primary">{t('outside_assets.card_title')}</span>
                      </div>
                      <Link to="/outside-assets" className={`group shrink-0 text-[13px] ${TEXT_LINK}`}>
                        {outsideAccounts.length > 0 ? t('outside_assets.card_link') : t('outside_assets.card_link_empty')}
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
                      </Link>
                    </div>
                    {outsideAccounts.length > 0 ? (
                      <>
                        <p className="text-[12px] text-text-secondary">{t('outside_assets.net_worth')}</p>
                        <p className="mt-0.5 text-[22px] font-bold leading-tight tabular-nums text-text-primary">{formatMoney(allAccounts.netWorth, locale)}</p>
                        <dl className="mt-2.5 space-y-1.5 border-t border-slate-200/80 pt-2.5 dark:border-white/10">
                          {accountRows.slice(0, 3).map((row) => (
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
                      <>
                        <p className="text-[12px] text-text-secondary">{t('outside_assets.slice.plan')}</p>
                        <p className="mt-0.5 text-[22px] font-bold leading-tight tabular-nums text-text-primary">{formatMoney(allAccounts.slices.plan, locale)}</p>
                        <p className="mt-1.5 text-[13px] leading-snug text-slate-600 dark:text-slate-300">{t('outside_assets.card_invite')}</p>
                      </>
                    )}
                  </SpecCard>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
