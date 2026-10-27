import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
import { useState } from 'react'
import { getAppDateLocale } from '@/lib/dateLocale'
import { PlanElections } from '@/features/plan/PlanElections'
import { OptOutDialog } from '@/features/plan/OptOutDialog'
import { useElectionsStore } from '@/features/plan/electionsStore'

/** Numeric / structural demo data for roth-401k; all copy from `enrollment.plan_detail` + `roth`. */
const ROTH_PLAN_CORE = {
  planId: 'PLAN-ROTH-401K-001',
  totalBalance: 125000,
  vestedBalance: 125000,
  healthScore: 84,
  contribution: '10%',
  contributions: [
    { value: '10%', total: false },
    { value: '10%', total: true },
  ],
  investments: [
    {
      funds: [
        { pct: '60%' },
        { pct: '25%' },
        { pct: '15%' },
      ],
    },
  ],
  autoFeatures: [
    { valueKey: 'auto1' as const },
    { valueKey: 'auto2' as const },
    { valueKey: 'auto3' as const },
    { valueKey: 'auto4' as const },
    { valueKey: 'auto5' as const },
  ],
  beneficiaries: [{ pct: '100%' }],
  activity: [
    { dateKey: 'act1_date' as const, titleKey: 'act1_title' as const, descKey: 'act1_desc' as const },
    { dateKey: 'act2_date' as const, titleKey: 'act2_title' as const, descKey: 'act2_desc' as const },
    { dateKey: 'act3_date' as const, titleKey: 'act3_title' as const, descKey: 'act3_desc' as const },
  ],
} as const

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

export default function PlanDetail() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const { planId } = useParams<{ planId: string }>()
  const navigate = useNavigate()
  const [optOutOpen, setOptOutOpen] = useState(false)
  const deferral = useElectionsStore((st) => st.deferral)
  const optedOut = useElectionsStore((st) => st.optedOut)

  const tr = (k: string) => t(`enrollment.plan_detail.roth.${k}`)

  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(n)

  if (!planId || planId !== 'roth-401k') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold text-[var(--text-primary)]">{t('enrollment.plan_detail.not_found')}</p>
          <button
            type="button"
            onClick={() => navigate('/enrollment/manage')}
            className="mt-4 text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            {t('enrollment.plan_detail.back')}
          </button>
        </div>
      </div>
    )
  }

  const plan = ROTH_PLAN_CORE
  const planName = t('enrollment.manage_page.plans.roth-401k.name')
  const planType = t('enrollment.manage_page.plans.roth-401k.type')

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
      <button
        type="button"
        onClick={() => navigate('/enrollment/manage')}
        className="mb-6 flex items-center gap-1.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" /> {t('enrollment.plan_detail.back')}
      </button>

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {planName}
            </h1>
            <span className="inline-flex items-center rounded-full bg-[var(--color-primary)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white dark:bg-blue-600">
              {t('enrollment.plan_detail.enrolled')}
            </span>
          </div>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {t('enrollment.plan_detail.plan_id_label')} {plan.planId} &nbsp;·&nbsp; {planType}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-brand flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold"
          >
            <Printer className="h-3.5 w-3.5" /> {t('enrollment.plan_detail.print')}
          </button>
          <button
            type="button"
            onClick={() => setOptOutOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--status-danger)] px-4 py-2 text-xs font-semibold text-[var(--status-danger)] transition-colors hover:bg-[var(--status-danger-bg)] dark:border-red-500 dark:text-red-400"
          >
            <XCircle className="h-3.5 w-3.5" /> {t('enrollment.plan_detail.opt_out_plan')}
          </button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            {
              icon: Wallet,
              label: t('enrollment.plan_detail.total_balance'),
              value: fmt(plan.totalBalance),
              sub: tr('balance_change'),
              subColor: 'text-[var(--status-success)]' as const,
              isHealth: false as const,
            },
            {
              icon: Wallet,
              label: t('enrollment.plan_detail.vested'),
              value: fmt(plan.vestedBalance),
              sub: tr('vested_pct'),
              subColor: 'text-[var(--text-muted)]' as const,
              isHealth: false as const,
            },
            {
              icon: TrendingUp,
              label: t('enrollment.plan_detail.stat_my_contribution'),
              value: optedOut ? '0%' : deferral.unit === 'percent' ? `${Math.round((deferral.preTax + deferral.roth) * 100) / 100}%` : `$${deferral.preTax + deferral.roth}`,
              sub: tr('contrib_note'),
              subColor: 'text-[var(--text-muted)]' as const,
              isHealth: false as const,
            },
            {
              icon: Activity,
              label: t('enrollment.plan_detail.stat_health_score'),
              value: `${plan.healthScore}/100`,
              sub: '',
              subColor: '' as const,
              isHealth: true as const,
            },
          ] as const
        ).map((stat, i) => (
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

      <div className="flex flex-col gap-5">
        <PlanElections />

        <Section title={t('enrollment.plan_detail.beneficiaries')} action={{ label: t('enrollment.plan_detail.update'), onClick: () => navigate('/profile?section=beneficiary') }}>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            {t('enrollment.plan_detail.beneficiaries_primary')}
          </p>
          {plan.beneficiaries.map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-[var(--border-light)] py-3 last:border-0 dark:border-gray-800"
            >
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{tr('bene_name')}</p>
              </div>
              <div className="flex items-center gap-6 text-sm text-[var(--text-secondary)]">
                <span>{tr('bene_relation')}</span>
                <span className="font-semibold text-[var(--text-primary)]">{tr('bene_pct')}</span>
              </div>
            </div>
          ))}
        </Section>

        <Section title={t('enrollment.plan_detail.documents')}>
          {(['doc1', 'doc2'] as const).map((dk) => (
            <div
              key={dk}
              className="flex items-center justify-between border-b border-[var(--border-light)] py-3 last:border-0 dark:border-gray-800"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="h-4 w-4 text-[var(--text-muted)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">{tr(dk)}</span>
              </div>
              <button
                type="button"
                className="btn-brand flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold"
              >
                <Eye className="h-3 w-3" /> {t('enrollment.plan_detail.view')}
              </button>
            </div>
          ))}
        </Section>

      </div>
      <OptOutDialog open={optOutOpen} onClose={() => setOptOutOpen(false)} />
    </div>
  )
}
