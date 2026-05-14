import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Card } from '@/design-system/components/Card'
import { Badge } from '@/design-system/components/Badge'
import svgPaths from '@/features/transactions/svgPaths'
import DraftTransactions from '@/features/transactions/components/DraftTransactions'
import RecentTransactionsCompact from '@/features/transactions/components/RecentTransactionsCompact'
import FinancialGuidanceCompact from '@/features/transactions/components/FinancialGuidanceCompact'
import RetirementImpactWidget from '@/features/transactions/components/RetirementImpactWidget'
import { computeLoanEligible, computeWithdrawable, formatUsd } from '@/features/transactions/utils/transactionCenterAmounts'

const CP = 'transactions.center_page.'

/** Demo plan snapshot — replace with API / store when wired. */
const DEMO_PLAN = {
  planBalance: 30_000,
  vestedBalance: 25_000,
}

const DRAFT_COUNT = 2

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 15 18.34" aria-hidden>
      <path
        d={svgPaths.p30439e00}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.667"
      />
    </svg>
  )
}

function ChartBarIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? 'h-5 w-5'} fill="none" viewBox="0 0 20 20" aria-hidden>
      <path
        d={svgPaths.p284f7580}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.667"
      />
      <path d="M7.833 14.167H15" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.667" />
      <path d="M7.833 10.833H18.333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.667" />
      <path d="M7.833 7.5H10.833" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.667" />
    </svg>
  )
}

function SectionHeader({
  icon,
  title,
  subtitle,
  badge,
  variant = 'default',
}: {
  icon: ReactNode
  title: string
  subtitle?: string
  badge?: { text: string; color: string }
  variant?: 'default' | 'ai'
}) {
  return (
    <div
      className={cn(
        'mb-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:mb-4',
        subtitle ? 'sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center' : '',
      )}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className={cn('shrink-0', variant === 'ai' ? 'text-violet-500 dark:text-violet-400' : 'text-primary')}>
          {icon}
        </div>
        <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1">
          <h2 className="text-base font-bold tracking-[-0.3px] text-text-primary">{title}</h2>
          {badge ? (
            <span className={cn('rounded-md px-2.5 py-[3px] text-[11px] font-bold', badge.color)}>{badge.text}</span>
          ) : null}
        </div>
      </div>
      {subtitle ? (
        <span className="hidden text-xs font-medium leading-snug text-text-muted sm:block sm:max-w-[min(100%,14rem)] sm:text-right">
          {subtitle}
        </span>
      ) : null}
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

/** Compact horizontal card used in the 5-item Quick Actions strip */
function QuickActionCard({
  item,
  badgeLabel,
}: {
  item: QuickItem
  badgeLabel: (b: QuickBadge) => string
}) {
  return (
    <button
      type="button"
      onClick={item.onClick}
      className="group relative flex min-w-[170px] flex-1 flex-col overflow-hidden rounded-[14px] border border-slate-100 bg-white pb-3 pl-5 pr-4 pt-4 text-left transition-all hover:border-primary/30 hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-blue-50 to-blue-100 text-primary dark:from-blue-950/40 dark:to-blue-900/40">
          {item.icon}
        </div>
        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-primary dark:text-gray-600" aria-hidden />
      </div>
      <div className="mt-3 flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-sm font-bold leading-snug text-text-primary">{item.title}</span>
          {item.badge ? (
            <Badge variant="default" className="text-[9px] font-semibold uppercase tracking-wide">
              {badgeLabel(item.badge)}
            </Badge>
          ) : null}
        </div>
        <p className="mt-1 text-xs font-bold leading-snug text-primary">{item.keyLine}</p>
        <p className="mt-0.5 line-clamp-1 text-[11px] leading-normal text-text-secondary">{item.supporting}</p>
      </div>
      {/* Bottom blue accent bar */}
      <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-[14px] bg-primary" aria-hidden />
    </button>
  )
}

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
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="mb-6 sm:mb-8"
    >
      <Card
        padding="md"
        className={cn(
          'rounded-xl border border-primary/35 shadow-none',
          'bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_14%,var(--surface-page))_0%,color-mix(in_srgb,var(--color-primary)_10%,var(--surface-elevated))_100%)]'
        )}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-0">
          <div className="flex items-center gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/35 bg-surface-card"
              aria-hidden
            >
              <ShieldIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase leading-[14px] tracking-[0.5px] text-text-secondary">
                {t('transactions.plan_name_label')}
              </p>
              <p className="mt-0.5 text-[15px] font-extrabold leading-[22px] tracking-[-0.3px] text-text-primary">
                {planName}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-[0.5px] text-text-muted">
                  {t(`${CP}plan_balance_colon`)}
                </span>
                <span className="text-sm font-extrabold tracking-[-0.3px] text-primary">{planBalanceLabel}</span>
              </div>
            </div>
          </div>

          <div className="hidden h-14 w-px shrink-0 bg-primary/35 sm:mx-10 lg:mx-14 sm:block" aria-hidden />
          <div className="h-px w-full shrink-0 bg-primary/35 sm:hidden" aria-hidden />

          <div className="flex flex-1 items-center gap-4">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/35 bg-surface-card"
              aria-hidden
            >
              <ChartBarIcon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10.5px] font-bold uppercase leading-[14px] tracking-[0.5px] text-text-secondary">
                {t('transactions.vested_balance_label')}
              </p>
              <div className="mt-0.5 flex flex-wrap items-baseline gap-2.5">
                <span className="text-[28px] font-extrabold leading-9 tracking-[-0.5px] text-text-primary">
                  {vestedBalanceLabel}
                </span>
                <span className="text-xs font-semibold text-text-secondary">
                  {t('transactions.vested_percent', { pct: vestedPct.toFixed(1) })}
                </span>
              </div>
              <div
                className="mt-2 h-[5px] w-full max-w-md overflow-hidden rounded bg-primary/15 dark:bg-primary/25"
                role="presentation"
              >
                <div className="h-full rounded bg-primary" style={{ width: pctWidth }} />
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}

export default function TransactionCenter() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const planBalance = DEMO_PLAN.planBalance
  const vestedBalance = DEMO_PLAN.vestedBalance
  const vestedPct = (vestedBalance / planBalance) * 100

  const loanEligible = useMemo(() => computeLoanEligible(vestedBalance), [vestedBalance])
  const withdrawable = useMemo(() => computeWithdrawable(vestedBalance), [vestedBalance])

  const planBalanceLabel = useMemo(() => formatUsd(planBalance), [planBalance])
  const vestedBalanceLabel = useMemo(() => formatUsd(vestedBalance), [vestedBalance])


  const badgeLabel = (b: QuickBadge) =>
    b === 'recommended' ? t(`${CP}badge_recommended`) : t(`${CP}badge_most_used`)

  const quickItems: QuickItem[] = useMemo(
    () => [
      {
        id: 'loan',
        icon: <HandCoins className="h-5 w-5" strokeWidth={2} aria-hidden />,
        title: t('dashboard.takeLoan'),
        keyLine: t(`${CP}borrow_up_to`, { amount: formatUsd(loanEligible) }),
        supporting: t(`${CP}qa_loan_support`),
        onClick: () => navigate('/transactions/loan'),
        badge: 'recommended',
      },
      {
        id: 'withdraw',
        icon: <DollarSign className="h-5 w-5" strokeWidth={2} aria-hidden />,
        title: t('dashboard.withdrawMoney'),
        keyLine: t(`${CP}available_line`, { amount: formatUsd(withdrawable) }),
        supporting: t(`${CP}qa_withdraw_support`),
        onClick: () => navigate('/transactions/withdrawal'),
        badge: 'most_used',
      },
      {
        id: 'transfer',
        icon: <ArrowLeftRight className="h-5 w-5" strokeWidth={2} aria-hidden />,
        title: t('dashboard.transferFunds'),
        keyLine: t(`${CP}reallocate_balance`),
        supporting: t(`${CP}qa_transfer_support`),
        onClick: () => navigate('/transactions/transfer'),
      },
      {
        id: 'rebalance',
        icon: <TrendingUp className="h-5 w-5" strokeWidth={2} aria-hidden />,
        title: t('transactions.rebalance'),
        keyLine: t('transactions.qa_rebalance_sub'),
        supporting: t('transactions.qa_rebalance_hint'),
        onClick: () => navigate('/transactions/rebalance'),
      },
      {
        id: 'rollover',
        icon: <RefreshCcw className="h-5 w-5" strokeWidth={2} aria-hidden />,
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
      <div className="mx-auto w-full max-w-[1200px] pb-8">
        <header className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary sm:text-[28px] sm:leading-tight">
            {t(`${CP}title`)}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary sm:text-[15px]">
            {t(`${CP}subtitle`)}
          </p>
        </header>

        <PlanSummaryCard
          planName={t('transactions.plan_default_name')}
          planBalanceLabel={planBalanceLabel}
          vestedBalanceLabel={vestedBalanceLabel}
          vestedPct={vestedPct}
        />

        <div className="space-y-6 sm:space-y-8">

          {/* ── Quick Actions — full-width horizontal 5-card strip ── */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.06 }}
          >
            <SectionHeader
              icon={<Sparkles className="h-4 w-4" />}
              title={t(`${CP}what_like_to_do`)}
            />
            <div
              className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:overflow-x-visible lg:grid lg:grid-cols-5"
              role="list"
            >
              {quickItems.map((item) => (
                <div key={item.id} role="listitem" className="flex min-w-[170px] flex-1 lg:min-w-0">
                  <QuickActionCard item={item} badgeLabel={badgeLabel} />
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── Main 2-col grid ── */}
          <div className="grid grid-cols-1 items-stretch gap-6 sm:gap-8 lg:grid-cols-[1fr_400px]">

            {/* LEFT — Retirement Outlook + Recent Transactions */}
            <div className="flex flex-col gap-6 sm:gap-8">

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
              >
                <SectionHeader
                  icon={<TrendingUp className="h-4 w-4" />}
                  title="Retirement Outlook"
                  subtitle="Projected growth"
                />
                <RetirementImpactWidget
                  estimatedValue={30_000}
                  contributionsThisYear={5538}
                  contributionLimit={23500}
                  growthRate={7.2}
                  yearsToRetire={28}
                  targetAge={65}
                  retirementGoal={450_000}
                  onTrack
                  delay={0.2}
                />
              </motion.section>

              <motion.section
                className="flex flex-1 flex-col"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.16 }}
              >
                <SectionHeader
                  icon={<ChartBar className="h-4 w-4" />}
                  title={t('transactions.recent_transactions')}
                  subtitle={t('transactions.last_90_days')}
                />
                <Card padding="md" className="flex-1 rounded-2xl border border-border-default">
                  <RecentTransactionsCompact />
                </Card>
              </motion.section>

            </div>

            {/* RIGHT — Draft Transactions only */}
            <div className="flex flex-col gap-6 sm:gap-8">

              <motion.section
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: 0.12 }}
              >
                <SectionHeader
                  icon={<FilePen className="h-4 w-4" />}
                  title={t('transactions.draft_transactions')}
                  badge={{
                    text: t('transactions.drafts_badge', { count: DRAFT_COUNT }),
                    color: 'bg-primary/10 text-primary',
                  }}
                  subtitle={t('transactions.resume_subtitle')}
                />
                <Card padding="md" className="rounded-2xl border border-border-default">
                  <DraftTransactions />
                </Card>
              </motion.section>

            </div>
          </div>

          {/* ── Financial Guidance — full width ── */}
          <motion.section
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut', delay: 0.24 }}
          >
            <SectionHeader
              icon={<Sparkles className="h-4 w-4" />}
              title={t('transactions.financial_guidance')}
              subtitle={t('transactions.personalized_insights')}
              variant="ai"
              badge={{
                text: t('transactions.ai_insights'),
                color: 'bg-violet-500/10 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300',
              }}
            />
            <FinancialGuidanceCompact />
          </motion.section>

        </div>
      </div>
    </div>
  )
}
