import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Printer,
  XCircle,
  TrendingUp,
  Wallet,
  Activity,
  FileText,
  Eye,
} from 'lucide-react'

const PLAN_DATA: Record<
  string,
  {
    name: string
    planId: string
    type: string
    totalBalance: number
    balanceChange: string
    vestedBalance: number
    vestedPercent: string
    contribution: string
    contributionNote: string
    healthScore: number
    contributions: { label: string; value: string }[]
    investments: { category: string; funds: { name: string; pct: string }[] }[]
    autoFeatures: { label: string; value: string }[]
    beneficiaries: { name: string; relation: string; pct: string }[]
    documents: string[]
    activity: { date: string; title: string; description: string }[]
  }
> = {
  'roth-401k': {
    name: 'Roth 401(k)',
    planId: 'PLAN-ROTH-401K-001',
    type: 'Roth 401(k)',
    totalBalance: 125000,
    balanceChange: '+2.4% this month',
    vestedBalance: 125000,
    vestedPercent: '100% Vested',
    contribution: '10%',
    contributionNote: '2% below employer match',
    healthScore: 84,
    contributions: [
      { label: 'Roth', value: '10%' },
      { label: 'Total', value: '10%' },
    ],
    investments: [
      {
        category: 'Roth',
        funds: [
          { name: 'S&P 500 Index Fund', pct: '60%' },
          { name: 'International Stock Fund', pct: '25%' },
          { name: 'Bond Index Fund', pct: '15%' },
        ],
      },
    ],
    autoFeatures: [
      { label: 'Auto Increase', value: 'Enabled (1% annual, max 15%)' },
      { label: 'Annual Limit', value: '$23,000' },
      { label: 'Catch-up Limit', value: '$7,500' },
      { label: 'Employer Match Cap', value: '6%' },
      { label: 'Last Modified', value: 'June 1, 2024' },
    ],
    beneficiaries: [{ name: 'Jane Doe', relation: 'Spouse', pct: '100%' }],
    documents: ['Plan Documents', 'Account Statements'],
    activity: [
      { date: 'Jan 15, 2024', title: 'Enrolled', description: 'Enrolled in Roth 401(k) plan' },
      {
        date: 'Jun 1, 2024',
        title: 'Contribution Changed',
        description: 'Updated contribution from 8% to 10%',
      },
      {
        date: 'Sep 15, 2024',
        title: 'Investment Changed',
        description: 'Rebalanced portfolio allocation',
      },
    ],
  },
}

function fmt(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(n)
}

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: { label: string; onClick?: () => void }
  children: React.ReactNode
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 dark:border-gray-700"
    >
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="btn-brand rounded-lg px-4 py-2 text-xs font-semibold"
          >
            {action.label}
          </button>
        )}
      </div>
      {children}
    </motion.section>
  )
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border-light)] py-3 last:border-0 dark:border-gray-800">
      <span className="text-sm text-[var(--text-secondary)]">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold' : 'font-medium'} text-[var(--text-primary)]`}>
        {value}
      </span>
    </div>
  )
}

export default function PlanDetail() {
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const plan = planId ? PLAN_DATA[planId] : undefined

  if (!plan) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)]">Plan not found</p>
          <button
            type="button"
            onClick={() => navigate('/enrollment/manage')}
            className="mt-4 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Back to Enrolment
          </button>
        </div>
      </div>
    )
  }

  const healthColor =
    plan.healthScore >= 80
      ? 'text-[var(--status-success)]'
      : plan.healthScore >= 60
        ? 'text-[var(--status-warning)]'
        : 'text-[var(--status-danger)]'

  const healthBarColor =
    plan.healthScore >= 80
      ? 'bg-[var(--color-primary)]'
      : plan.healthScore >= 60
        ? 'bg-[var(--status-warning)]'
        : 'bg-[var(--status-danger)]'

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
      {/* Back link */}
      <button
        type="button"
        onClick={() => navigate('/enrollment/manage')}
        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Enrolment
      </button>

      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {plan.name}
            </h1>
            <span className="inline-flex items-center rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white dark:bg-blue-600">
              Enrolled
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Plan ID: {plan.planId} &nbsp;·&nbsp; {plan.type}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-brand flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-lg border border-[var(--status-danger)] px-4 py-2 text-xs font-semibold text-[var(--status-danger)] transition-colors hover:bg-[var(--status-danger-bg)] dark:border-red-500 dark:text-red-400"
          >
            <XCircle className="h-3.5 w-3.5" /> Opt-out Plan
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {
            icon: Wallet,
            label: 'Total Balance',
            value: fmt(plan.totalBalance),
            sub: plan.balanceChange,
            subColor: 'text-[var(--status-success)]',
          },
          {
            icon: Wallet,
            label: 'Vested Balance',
            value: fmt(plan.vestedBalance),
            sub: plan.vestedPercent,
            subColor: 'text-[var(--text-muted)]',
          },
          {
            icon: TrendingUp,
            label: 'My Contribution',
            value: plan.contribution,
            sub: plan.contributionNote,
            subColor: 'text-[var(--text-muted)]',
          },
          {
            icon: Activity,
            label: 'Health Score',
            value: `${plan.healthScore}/100`,
            sub: null,
            subColor: '',
            isHealth: true,
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-xl border border-[var(--border-default)] bg-[var(--color-primary)] p-4 text-white dark:border-blue-800 dark:bg-blue-900"
          >
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/70">
              {stat.label}
            </p>
            <p className={`mt-1 text-xl font-extrabold ${stat.isHealth ? healthColor : ''}`}>
              {stat.value}
            </p>
            {stat.isHealth ? (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                <div
                  className={`h-full rounded-full ${healthBarColor}`}
                  style={{ width: `${plan.healthScore}%` }}
                />
              </div>
            ) : stat.sub ? (
              <p className={`mt-1 text-[11px] font-medium ${stat.subColor === 'text-[var(--status-success)]' ? 'text-emerald-300' : 'text-white/60'}`}>
                {stat.sub}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-5">
        {/* Contribution Election */}
        <Section title="Contribution Election" action={{ label: 'Edit Contribution' }}>
          {plan.contributions.map((c) => (
            <Row key={c.label} label={c.label} value={c.value} />
          ))}
        </Section>

        {/* Investment Election */}
        <Section title="Investment Election" action={{ label: 'Change Investments' }}>
          {plan.investments.map((group) => (
            <div key={group.category}>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                {group.category}
              </p>
              {group.funds.map((f) => (
                <Row key={f.name} label={f.name} value={f.pct} />
              ))}
            </div>
          ))}
        </Section>

        {/* Auto Features */}
        <Section title="Auto Features" action={{ label: 'Manage Features' }}>
          {plan.autoFeatures.map((f) => (
            <Row key={f.label} label={f.label} value={f.value} />
          ))}
        </Section>

        {/* Beneficiaries */}
        <Section title="Beneficiaries" action={{ label: 'Update' }}>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Primary
          </p>
          {plan.beneficiaries.map((b) => (
            <div
              key={b.name}
              className="flex items-center justify-between border-b border-[var(--border-light)] py-3 last:border-0 dark:border-gray-800"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{b.name}</p>
              </div>
              <div className="flex items-center gap-6 text-sm text-[var(--text-secondary)]">
                <span>{b.relation}</span>
                <span className="font-semibold text-[var(--text-primary)]">{b.pct}</span>
              </div>
            </div>
          ))}
        </Section>

        {/* Documents */}
        <Section title="Documents">
          {plan.documents.map((doc) => (
            <div
              key={doc}
              className="flex items-center justify-between border-b border-[var(--border-light)] py-3 last:border-0 dark:border-gray-800"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">{doc}</span>
              </div>
              <button
                type="button"
                className="btn-brand flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                <Eye className="h-3 w-3" /> View
              </button>
            </div>
          ))}
        </Section>

        {/* Activity Log */}
        <Section
          title="Activity Log"
          action={{ label: 'View All Activity', onClick: undefined }}
        >
          <div className="relative pl-4">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[var(--border-default)] dark:bg-gray-700" />
            {plan.activity.map((event, i) => (
              <div key={i} className="relative mb-5 last:mb-0">
                <div className="absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--surface-card)] bg-[var(--color-primary)] dark:border-gray-900" />
                <div className="ml-2">
                  <p className="text-[11px] font-medium text-[var(--text-muted)]">{event.date}</p>
                  <p className="text-sm font-bold text-[var(--text-primary)]">{event.title}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  )
}
