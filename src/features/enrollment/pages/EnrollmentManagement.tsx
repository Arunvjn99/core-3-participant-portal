import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Shield, ChevronRight, AlertCircle } from 'lucide-react'

type PlanStatus = 'enrolled' | 'eligible' | 'ineligible'
type FilterTab = 'all' | PlanStatus

interface Plan {
  id: string
  name: string
  planId: string
  type: string
  status: PlanStatus
  balance?: number
  balanceChange?: string
  description?: string
  ineligibleReason?: string
}

const PLANS: Plan[] = [
  {
    id: 'roth-401k',
    name: 'Roth 401(k)',
    planId: 'PLAN-ROTH-401K-001',
    type: 'Roth 401(k)',
    status: 'enrolled',
    balance: 125000,
    balanceChange: '+2.4% this month',
  },
  {
    id: 'trad-401k',
    name: 'Traditional 401(k)',
    planId: 'PLAN-TRAD-401K-001',
    type: 'Traditional 401(k)',
    status: 'eligible',
    description:
      'Maximize your savings with pre-tax contributions. This plan allows you to defer taxes on your contributions and earnings until withdrawal.',
  },
  {
    id: 'roth-ira',
    name: 'Roth IRA',
    planId: 'PLAN-ROTH-IRA-001',
    type: 'Roth IRA',
    status: 'eligible',
    description:
      'Tax-free growth and tax-free withdrawals in retirement. Perfect for those who expect to be in a higher tax bracket later in life.',
  },
  {
    id: '403b',
    name: '403(b) Plan',
    planId: 'PLAN-403B-001',
    type: '403(b)',
    status: 'ineligible',
    ineligibleReason:
      'Not available for your current employment classification. Please contact HR for more information regarding eligibility requirements.',
  },
]

const STATUS_STYLES: Record<PlanStatus, { label: string; bg: string; text: string }> = {
  enrolled: {
    label: 'Enrolled',
    bg: 'bg-[var(--color-primary)] dark:bg-blue-600',
    text: 'text-white',
  },
  eligible: {
    label: 'Eligible',
    bg: 'bg-[var(--status-success-bg)] dark:bg-emerald-950/40',
    text: 'text-[var(--status-success)] dark:text-emerald-400',
  },
  ineligible: {
    label: 'Ineligible',
    bg: 'bg-[var(--surface-elevated)] dark:bg-gray-800',
    text: 'text-[var(--text-muted)] dark:text-gray-500',
  },
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All Plans' },
  { key: 'enrolled', label: 'Enrolled' },
  { key: 'eligible', label: 'Eligible' },
  { key: 'ineligible', label: 'Ineligible' },
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}

function StatusBadge({ status }: { status: PlanStatus }) {
  const s = STATUS_STYLES[status]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${s.bg} ${s.text}`}>
      {s.label}
    </span>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
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
            PLAN ID: {plan.planId}
          </p>
        </div>
        <StatusBadge status={plan.status} />
      </div>

      {isEnrolled && plan.balance != null && (
        <>
          <div className="mb-5 rounded-xl border border-[var(--border-default)] px-5 py-4 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--text-secondary)]">Current Balance</span>
              <span className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                {formatCurrency(plan.balance)}
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
            Manage Plan <ChevronRight className="h-4 w-4" />
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
            Start Enrolment
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
  const [filter, setFilter] = useState<FilterTab>('all')

  const filtered = filter === 'all' ? PLANS : PLANS.filter((p) => p.status === filter)

  const counts: Record<FilterTab, number> = {
    all: PLANS.length,
    enrolled: PLANS.filter((p) => p.status === 'enrolled').length,
    eligible: PLANS.filter((p) => p.status === 'eligible').length,
    ineligible: PLANS.filter((p) => p.status === 'ineligible').length,
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-primary-subtle)] dark:bg-blue-950/40">
            <Shield className="h-5 w-5 text-[var(--color-primary)] dark:text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">
            Enrolment Management
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)] sm:text-base">
          View and manage your retirement plan enrolments across all available assets.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTER_TABS.map((tab) => (
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
            {tab.label}
            <span
              className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                filter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-muted)] dark:bg-gray-800'
              }`}
            >
              {counts[tab.key]}
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
            <p className="text-sm text-[var(--text-muted)]">No plans match this filter.</p>
          </div>
        )}
      </div>
    </div>
  )
}
