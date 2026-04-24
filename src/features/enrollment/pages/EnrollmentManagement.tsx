import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { Shield, ChevronRight, AlertCircle } from 'lucide-react'
import { getAppDateLocale } from '@/lib/dateLocale'

type PlanStatus = 'enrolled' | 'eligible' | 'ineligible'
type FilterTab = 'all' | PlanStatus

type PlanId = 'roth-401k' | 'trad-401k' | 'roth-ira' | '403b'

interface Plan {
  id: PlanId
  planId: string
  status: PlanStatus
  balance?: number
}

const PLANS_BASE: Plan[] = [
  {
    id: 'roth-401k',
    planId: 'PLAN-ROTH-401K-001',
    status: 'enrolled',
    balance: 125000,
  },
  {
    id: 'trad-401k',
    planId: 'PLAN-TRAD-401K-001',
    status: 'eligible',
  },
  {
    id: 'roth-ira',
    planId: 'PLAN-ROTH-IRA-001',
    status: 'eligible',
  },
  {
    id: '403b',
    planId: 'PLAN-403B-001',
    status: 'ineligible',
  },
]

function formatCurrency(amount: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function StatusBadge({ status }: { status: PlanStatus }) {
  const { t } = useTranslation()
  const styles: Record<PlanStatus, { labelKey: string; bg: string; text: string }> = {
    enrolled: {
      labelKey: 'status_enrolled',
      bg: 'bg-[var(--color-primary)] dark:bg-blue-600',
      text: 'text-white',
    },
    eligible: {
      labelKey: 'status_eligible',
      bg: 'bg-[var(--status-success-bg)] dark:bg-emerald-950/40',
      text: 'text-[var(--status-success)] dark:text-emerald-400',
    },
    ineligible: {
      labelKey: 'status_ineligible',
      bg: 'bg-[var(--surface-elevated)] dark:bg-gray-800',
      text: 'text-[var(--text-muted)] dark:text-gray-500',
    },
  }
  const s = styles[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
      {t(`enrollment.manage_page.${s.labelKey}`)}
    </span>
  )
}

function PlanCard({ plan }: { plan: Plan & { name: string; balanceChange?: string; description?: string; ineligibleReason?: string } }) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const navigate = useNavigate()
  const isEnrolled = plan.status === 'enrolled'
  const isEligible = plan.status === 'eligible'
  const isIneligible = plan.status === 'ineligible'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border bg-[var(--surface-card)] p-6 transition-shadow ${
        isIneligible
          ? 'border-[var(--border-default)] opacity-75 dark:border-gray-700'
          : 'border-[var(--border-default)] shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-card)] dark:border-gray-700'
      }`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">{plan.name}</h3>
          <p className="mt-0.5 text-xs font-medium text-[var(--text-muted)]">
            {t('enrollment.manage_page.plan_id', { id: plan.planId })}
          </p>
        </div>
        <StatusBadge status={plan.status} />
      </div>

      {isEnrolled && plan.balance != null && (
        <>
          <div className="mb-5 rounded-xl border border-[var(--border-default)] px-5 py-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text-secondary)]">{t('enrollment.manage_page.current_balance')}</span>
              <span className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                {formatCurrency(plan.balance, locale)}
              </span>
            </div>
            {plan.balanceChange && (
              <p className="mt-1 text-right text-xs font-medium text-[var(--status-success)]">
                {plan.balanceChange}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate(`/enrollment/manage/${plan.id}`)}
            className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98]"
          >
            {t('enrollment.manage_page.manage_plan')} <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {isEligible && (
        <>
          <p className="mb-5 text-sm leading-relaxed text-[var(--text-secondary)]">
            {plan.description}
          </p>
          <button
            type="button"
            onClick={() => navigate('/enrollment/plan')}
            className="text-sm font-semibold text-[var(--color-primary)] transition-colors hover:underline dark:text-blue-400"
          >
            {t('enrollment.manage_page.start_enrolment')}
          </button>
        </>
      )}

      {isIneligible && (
        <div className="flex items-start gap-2.5 rounded-xl bg-[var(--surface-elevated)] p-3.5 dark:bg-gray-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <p className="text-xs leading-relaxed text-[var(--text-muted)]">
            {plan.ineligibleReason}
          </p>
        </div>
      )}
    </motion.div>
  )
}

export default function EnrollmentManagement() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<FilterTab>('all')

  const plans = useMemo(
    () =>
      PLANS_BASE.map((p) => ({
        ...p,
        name: t(`enrollment.manage_page.plans.${p.id}.name`),
        balanceChange:
          p.id === 'roth-401k' ? t(`enrollment.manage_page.plans.${p.id}.balance_change`) : undefined,
        description: p.status === 'eligible' ? t(`enrollment.manage_page.plans.${p.id}.description`) : undefined,
        ineligibleReason: p.status === 'ineligible' ? t(`enrollment.manage_page.plans.${p.id}.ineligible`) : undefined,
      })),
    [t],
  )

  const filtered = filter === 'all' ? plans : plans.filter((p) => p.status === filter)

  const counts: Record<FilterTab, number> = {
    all: plans.length,
    enrolled: plans.filter((p) => p.status === 'enrolled').length,
    eligible: plans.filter((p) => p.status === 'eligible').length,
    ineligible: plans.filter((p) => p.status === 'ineligible').length,
  }

  const filterTabs: { key: FilterTab; labelKey: string }[] = [
    { key: 'all', labelKey: 'tab_all' },
    { key: 'enrolled', labelKey: 'tab_enrolled' },
    { key: 'eligible', labelKey: 'tab_eligible' },
    { key: 'ineligible', labelKey: 'tab_ineligible' },
  ]

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-subtle)] dark:bg-blue-950/40">
            <Shield className="h-5 w-5 text-[var(--color-primary)] dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            {t('enrollment.manage_page.title')}
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)] sm:text-base">
          {t('enrollment.manage_page.subtitle')}
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
              filter === tab.key
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white shadow-sm dark:border-blue-500 dark:bg-blue-600'
                : 'border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)] dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600'
            }`}
          >
            {t(`enrollment.manage_page.${tab.labelKey}`)}
            <span
              className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                filter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] dark:bg-gray-800'
              }`}
            >
              {counts[tab.key].toLocaleString(getAppDateLocale())}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {filtered.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex items-center justify-center rounded-2xl border border-dashed border-[var(--border-default)] py-16 dark:border-gray-700">
            <p className="text-sm text-[var(--text-muted)]">{t('enrollment.manage_page.empty_filter')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
