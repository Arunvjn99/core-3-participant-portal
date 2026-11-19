import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import {
  DollarSign,
  HandCoins,
  ArrowLeftRight,
  RefreshCcw,
  Sparkles,
  FilePen,
  ChartBar,
  ChevronRight,
  TrendingUp,
  Route,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import svgPaths from '@/features/transactions/svgPaths'
import DraftTransactions from '@/features/transactions/components/DraftTransactions'
import RecentTransactionsCompact from '@/features/transactions/components/RecentTransactionsCompact'
import FinancialGuidanceCompact from '@/features/transactions/components/FinancialGuidanceCompact'
import RetirementImpactWidget from '@/features/transactions/components/RetirementImpactWidget'
import { TransactionTracker } from '@/features/transactions/tracking/TransactionTracker'
import { ActivityHistory } from '@/features/transactions/components/ActivityHistory'
import { useTrackedTransactions } from '@/features/transactions/tracking/useTrackedTransactions'
import { computeLoanEligible, computeWithdrawable, formatUsd } from '@/features/transactions/utils/transactionCenterAmounts'

const CP = 'transactions.center_page.'
const ease = [0.22, 1, 0.36, 1] as const

/** Demo plan snapshot — replace with API / store when wired. */
const DEMO_PLAN = {
  planBalance: 30_000,
  vestedBalance: 25_000,
}

const DRAFT_COUNT = 2

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 15 18.34" aria-hidden>
      <path d={svgPaths.p30439e00} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.667" />
    </svg>
  )
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 20 20" aria-hidden>
      <path d={svgPaths.p284f7580} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.667" />
      <path d="M7.833 14.167H15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.667" />
      <path d="M7.833 10.833H18.333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.667" />
      <path d="M7.833 7.5H10.833" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.667" />
    </svg>
  )
}

/** The post-enrollment dashboard's card: white surface, soft ring and shadow, fades up into view */
function SpecCard({ children, className = '', noPadding }: { children: ReactNode; className?: string; noPadding?: boolean }) {
  const reduce = useReducedMotion()
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease }}
      className={cn('min-w-0 rounded-[20px] bg-surface-card shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ring-1 ring-slate-200/70 dark:ring-white/10', !noPadding && 'p-5', className)}
    >
      {children}
    </motion.section>
  )
}

/** The dashboard's card header: coloured badge tile, title, optional count pill, and a note on the right */
function CardHeader({
  Icon,
  tone,
  title,
  note,
  badge,
  className,
}: {
  Icon: typeof Zap
  tone: string
  title: string
  note?: string
  badge?: { text: string; color: string }
  className?: string
}) {
  return (
    <div className={cn('mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1', className)}>
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_16px_-8px_rgba(11,21,51,0.45)]', tone)}
          aria-hidden
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <h2 className="text-[16px] font-bold text-text-primary">{title}</h2>
        {badge ? <span className={cn('rounded-full px-2.5 py-0.5 text-[12px] font-semibold ring-1', badge.color)}>{badge.text}</span> : null}
      </div>
      {note ? <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{note}</span> : null}
    </div>
  )
}

type QuickBadge = 'recommended' | 'most_used'

type QuickItem = {
  id: string
  icon: ReactNode
  title: string
  keyLine: string
  supporting: string
  onClick: () => void
  badge?: QuickBadge
}

/** One quick action, as a tile in the dashboard's Quick Actions card: round icon, text, chevron */
function QuickActionTile({ item, badgeLabel }: { item: QuickItem; badgeLabel: (b: QuickBadge) => string }) {
  return (
    <button
      type="button"
      onClick={item.onClick}
      className="group flex h-full w-full flex-col bg-surface-card px-4 py-4 text-left sm:px-5 transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary dark:hover:bg-[#162048]"
    >
      <span className="flex items-center justify-between gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/20" aria-hidden>
          {item.icon}
        </span>
        <ChevronRight className="h-4 w-4 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" aria-hidden />
      </span>
      <span className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[14px] font-bold leading-tight text-text-primary">{item.title}</span>
        {item.badge ? (
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-800 ring-1 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/30">
            {badgeLabel(item.badge)}
          </span>
        ) : null}
      </span>
      <span className="mt-1 text-[13px] font-medium text-primary dark:text-blue-300">{item.keyLine}</span>
      <span className="mt-0.5 text-[12px] leading-snug text-slate-600 dark:text-slate-300">{item.supporting}</span>
    </button>
  )
}

/** Plan name and balance beside the vested balance, in one white card like the dashboard's balance strip */
function PlanSummaryCard({
  planName,
  planBalanceLabel,
  vestedBalanceLabel,
  vestedPct,
}: {
  planName: string
  planBalanceLabel: string
  vestedBalanceLabel: string
  vestedPct: number
}) {
  const { t } = useTranslation()
  const pctWidth = `${Math.min(100, Math.max(0, vestedPct))}%`
  return (
    <SpecCard className="lg:col-span-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-0">
        <div className="flex items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_16px_-8px_rgba(11,21,51,0.45)]" aria-hidden>
            <ShieldIcon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{t('transactions.plan_name_label')}</p>
            <p className="mt-0.5 text-[16px] font-bold leading-snug text-text-primary">{planName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{t(`${CP}plan_balance_colon`)}</span>
              <span className="text-[14px] font-bold tabular-nums text-text-primary">{planBalanceLabel}</span>
            </div>
          </div>
        </div>

        <div className="hidden h-14 w-px shrink-0 bg-slate-200/80 sm:mx-8 sm:block lg:mx-12 dark:bg-white/10" aria-hidden />
        <div className="h-px w-full shrink-0 bg-slate-200/80 sm:hidden dark:bg-white/10" aria-hidden />

        <div className="flex flex-1 items-center gap-3.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_16px_-8px_rgba(11,21,51,0.45)]" aria-hidden>
            <ChartBarIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{t('transactions.vested_balance_label')}</p>
            <div className="mt-0.5 flex flex-wrap items-baseline gap-2.5">
              <span className="text-[26px] font-bold leading-9 tabular-nums text-text-primary">{vestedBalanceLabel}</span>
              <span className="text-[12px] font-semibold text-emerald-800 dark:text-emerald-300">{t('transactions.vested_percent', { pct: vestedPct.toFixed(1) })}</span>
            </div>
            <div className="mt-1.5 h-2 w-full max-w-md overflow-hidden rounded-full bg-slate-100 dark:bg-white/10" role="presentation">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: pctWidth }} />
            </div>
          </div>
        </div>
      </div>
    </SpecCard>
  )
}

export default function TransactionCenter() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const activeRequests = useTrackedTransactions().filter((r) => !r.timeline.complete).length

  const planBalance = DEMO_PLAN.planBalance
  const vestedBalance = DEMO_PLAN.vestedBalance
  const vestedPct = (vestedBalance / planBalance) * 100

  const loanEligible = useMemo(() => computeLoanEligible(vestedBalance), [vestedBalance])
  const withdrawable = useMemo(() => computeWithdrawable(vestedBalance), [vestedBalance])

  const planBalanceLabel = useMemo(() => formatUsd(planBalance), [planBalance])
  const vestedBalanceLabel = useMemo(() => formatUsd(vestedBalance), [vestedBalance])

  const badgeLabel = (b: QuickBadge) => (b === 'recommended' ? t(`${CP}badge_recommended`) : t(`${CP}badge_most_used`))

  const quickItems: QuickItem[] = useMemo(
    () => [
      {
        id: 'loan',
        icon: <HandCoins className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />,
        title: t('dashboard.takeLoan'),
        keyLine: t(`${CP}borrow_up_to`, { amount: formatUsd(loanEligible) }),
        supporting: t(`${CP}qa_loan_support`),
        onClick: () => navigate('/transactions/loan'),
        badge: 'recommended',
      },
      {
        id: 'withdraw',
        icon: <DollarSign className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />,
        title: t('dashboard.withdrawMoney'),
        keyLine: t(`${CP}available_line`, { amount: formatUsd(withdrawable) }),
        supporting: t(`${CP}qa_withdraw_support`),
        onClick: () => navigate('/transactions/withdrawal'),
        badge: 'most_used',
      },
      {
        id: 'transfer',
        icon: <ArrowLeftRight className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />,
        title: t('dashboard.transferFunds'),
        keyLine: t(`${CP}reallocate_balance`),
        supporting: t(`${CP}qa_transfer_support`),
        onClick: () => navigate('/transactions/transfer'),
      },
      {
        id: 'rebalance',
        icon: <TrendingUp className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />,
        title: t('transactions.rebalance'),
        keyLine: t('transactions.qa_rebalance_sub'),
        supporting: t('transactions.qa_rebalance_hint'),
        onClick: () => navigate('/transactions/rebalance'),
      },
      {
        id: 'rollover',
        icon: <RefreshCcw className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden />,
        title: t('dashboard.rollOver'),
        keyLine: t(`${CP}consolidate_savings`),
        supporting: t(`${CP}qa_rollover_support`),
        onClick: () => navigate('/transactions/rollover'),
      },
    ],
    [t, loanEligible, withdrawable, navigate],
  )

  return (
    <div className="transactions-page w-full min-w-0" data-page="transaction-center">
      {/* Full width of the app frame, so the page lines up with the header (EverVest logo to account menu) */}
      <div className="w-full pb-6 pt-2 lg:pt-3">
        <header className="mb-5">
          <h1 className="text-[28px] font-bold leading-tight text-[#0B1533] dark:text-white">{t(`${CP}title`)}</h1>
          <p className="mt-1 text-[15px] leading-snug text-text-secondary">{t(`${CP}subtitle`)}</p>
        </header>

        {/* The dashboard's grid: full-width cards, and wide + narrow cards paired so each row ends level */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <PlanSummaryCard
            planName={t('transactions.plan_default_name')}
            planBalanceLabel={planBalanceLabel}
            vestedBalanceLabel={vestedBalanceLabel}
            vestedPct={vestedPct}
          />

          {/* Quick actions: one card, five tiles divided by hairlines */}
          <SpecCard noPadding className="overflow-hidden lg:col-span-12">
            <CardHeader Icon={Zap} tone="bg-blue-600" title={t(`${CP}what_like_to_do`)} className="mb-0 px-5 pb-3.5 pt-5" />
            <div className="grid grid-cols-2 gap-px border-t border-slate-200/80 bg-slate-200/80 lg:grid-cols-5 dark:border-white/10 dark:bg-white/10" role="list">
              {quickItems.map((item) => (
                <div key={item.id} role="listitem" className="flex last:col-span-2 lg:last:col-span-1">
                  <QuickActionTile item={item} badgeLabel={badgeLabel} />
                </div>
              ))}
            </div>
          </SpecCard>

          {/* Two stacked columns, so the cards end level without blank space: requests over recent transactions,
              drafts over the retirement outlook; requests over account activity; the last card in each column takes up any difference */}
          <div className="flex min-w-0 flex-col gap-5 lg:col-span-8">
            <SpecCard>
              <CardHeader
                Icon={Route}
                tone="bg-blue-600"
                title={t('tracking.title')}
                note={t('tracking.subtitle')}
                badge={activeRequests > 0 ? { text: t('tracking.active_badge', { count: activeRequests }), color: 'bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/30' } : undefined}
              />
              <TransactionTracker openFirst={false} />
            </SpecCard>
            {/* Contribution and activity history: the newest few, the rest on request */}
            <SpecCard className="flex-1">
              <CardHeader Icon={ChartBar} tone="bg-slate-700" title={t('activity.title')} note={t('activity.subtitle')} />
              <ActivityHistory limit={6} />
            </SpecCard>
          </div>
          <div className="flex min-w-0 flex-col gap-5 lg:col-span-4">
            <SpecCard>
              <CardHeader
                Icon={FilePen}
                tone="bg-amber-500"
                title={t('transactions.draft_transactions')}
                badge={{ text: t('transactions.drafts_badge', { count: DRAFT_COUNT }), color: 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30' }}
              />
              <p className="-mt-1.5 mb-3 text-[12px] font-medium text-slate-600 dark:text-slate-300">{t('transactions.resume_subtitle')}</p>
              <DraftTransactions />
            </SpecCard>
            <SpecCard className="flex-1">
              <CardHeader Icon={TrendingUp} tone="bg-emerald-600" title="Retirement Outlook" note="Projected growth" />
              <RetirementImpactWidget
                bare
                estimatedValue={30_000}
                contributionsThisYear={5538}
                contributionLimit={23500}
                growthRate={7.2}
                yearsToRetire={28}
                targetAge={65}
                retirementGoal={450_000}
                onTrack
                delay={0}
              />
            </SpecCard>
          </div>

          {/* Recent transactions: a five-column table, so it gets the full width */}
          <SpecCard className="lg:col-span-12">
            <CardHeader Icon={ChartBar} tone="bg-blue-600" title={t('transactions.recent_transactions')} note={t('transactions.last_90_days')} />
            <RecentTransactionsCompact maxItems={5} />
          </SpecCard>

          {/* Financial guidance, full width */}
          <SpecCard className="lg:col-span-12">
            <CardHeader
              Icon={Sparkles}
              tone="bg-violet-600"
              title={t('transactions.financial_guidance')}
              note={t('transactions.personalized_insights')}
              badge={{ text: t('transactions.ai_insights'), color: 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-500/15 dark:text-violet-200 dark:ring-violet-400/30' }}
            />
            <FinancialGuidanceCompact />
          </SpecCard>
        </div>
      </div>
    </div>
  )
}
