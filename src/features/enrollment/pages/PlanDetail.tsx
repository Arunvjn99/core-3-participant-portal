import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, Printer, XCircle, FileText, Eye } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'
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

/** The pre-enrollment dashboard's pieces: card surface, pills and one focus ring for every control */
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
const CARD = 'rounded-[20px] bg-surface-card shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ring-1 ring-slate-200/70 dark:ring-white/10'
const PILL_SECONDARY = `inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-slate-900 shadow-[0_2px_6px_-3px_rgba(11,21,51,0.12)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10 ${FOCUS}`
/** A quiet red pill for the one action that stops contributions */
const PILL_DANGER = `inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-red-700 ring-1 ring-red-200 transition-colors hover:bg-red-50 dark:bg-white/5 dark:text-red-300 dark:ring-red-400/30 dark:hover:bg-red-500/10 ${FOCUS}`

function Section({
  title,
  action,
  children,
}: {
  title: string
  action?: { label: string; onClick?: () => void }
  children: React.ReactNode
}) {
  const reduce = useReducedMotion()
  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn(CARD, 'p-5 sm:p-6')}
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[18px] font-bold leading-tight text-text-primary">{title}</h2>
        {action && (
          <button type="button" onClick={action.onClick} className={cn(PILL_SECONDARY, 'h-9')}>
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

  const backLink = (
    <button
      type="button"
      onClick={() => navigate('/enrollment/manage')}
      className={cn('inline-flex min-h-10 items-center gap-1.5 rounded-md text-[14px] font-semibold text-slate-600 transition-colors hover:text-text-primary dark:text-slate-300 dark:hover:text-white', FOCUS)}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden /> {t('enrollment.plan_detail.back')}
    </button>
  )

  if (!planId || planId !== 'roth-401k') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="text-[18px] font-bold text-text-primary">{t('enrollment.plan_detail.not_found')}</p>
          <div className="mt-3">{backLink}</div>
        </div>
      </div>
    )
  }

  const plan = ROTH_PLAN_CORE
  const planName = t('enrollment.manage_page.plans.roth-401k.name')
  const planType = t('enrollment.manage_page.plans.roth-401k.type')

  // Dark enough shades to read as text on white, and the bar in the same family
  const health =
    plan.healthScore >= 80
      ? { text: 'text-emerald-800 dark:text-emerald-300', bar: 'bg-emerald-600 dark:bg-emerald-400' }
      : plan.healthScore >= 60
        ? { text: 'text-amber-800 dark:text-amber-300', bar: 'bg-amber-500' }
        : { text: 'text-red-700 dark:text-red-300', bar: 'bg-red-500' }

  const stats = [
    {
      label: t('enrollment.plan_detail.total_balance'),
      value: fmt(plan.totalBalance),
      sub: tr('balance_change'),
      subClass: 'font-semibold text-emerald-800 dark:text-emerald-300',
    },
    {
      label: t('enrollment.plan_detail.vested'),
      value: fmt(plan.vestedBalance),
      sub: tr('vested_pct'),
      subClass: 'text-slate-600 dark:text-slate-300',
    },
    {
      label: t('enrollment.plan_detail.stat_my_contribution'),
      value: optedOut ? '0%' : deferral.unit === 'percent' ? `${Math.round((deferral.preTax + deferral.roth) * 100) / 100}%` : `$${deferral.preTax + deferral.roth}`,
      sub: tr('contrib_note'),
      subClass: 'text-slate-600 dark:text-slate-300',
    },
  ]

  return (
    <div className="w-full pb-6 pt-2 lg:pb-7 lg:pt-3">
      <div className="mb-3">{backLink}</div>

      {/* Title in the dashboard's type, with its status; the actions sit to the right on wide screens */}
      <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-bold leading-tight text-[#0B1533] dark:text-white">{planName}</h1>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[12px] font-semibold text-blue-800 ring-1 ring-inset ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/30">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-300" aria-hidden />
              {t('enrollment.plan_detail.enrolled')}
            </span>
          </div>
          <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-300">
            {t('enrollment.plan_detail.plan_id_label')} {plan.planId} &nbsp;·&nbsp; {planType}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => window.print()} className={PILL_SECONDARY}>
            <Printer className="h-4 w-4" aria-hidden /> {t('enrollment.plan_detail.print')}
          </button>
          <button type="button" onClick={() => setOptOutOpen(true)} className={PILL_DANGER}>
            <XCircle className="h-4 w-4" aria-hidden /> {t('enrollment.plan_detail.opt_out_plan')}
          </button>
        </div>
      </header>

      {/* The four figures in one card, split by thin rules (two by two on phones) */}
      <dl className={cn(CARD, 'mb-5 grid grid-cols-2 lg:grid-cols-4')}>
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className={cn(
              'min-w-0 p-4 sm:p-5',
              i % 2 === 1 && 'border-l border-slate-200/80 dark:border-white/10',
              i >= 2 && 'border-t border-slate-200/80 lg:border-t-0 dark:border-white/10',
              i === 2 && 'lg:border-l',
            )}
          >
            <dt className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{stat.label}</dt>
            <dd className="mt-1 text-[20px] font-bold leading-tight tracking-tight tabular-nums text-text-primary sm:text-[22px]">{stat.value}</dd>
            {stat.sub && <dd className={cn('mt-1 text-[12px]', stat.subClass)}>{stat.sub}</dd>}
          </div>
        ))}
        <div className="min-w-0 border-l border-t border-slate-200/80 p-4 sm:p-5 lg:border-t-0 dark:border-white/10">
          <dt className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{t('enrollment.plan_detail.stat_health_score')}</dt>
          <dd className={cn('mt-1 text-[20px] font-bold leading-tight tabular-nums sm:text-[22px]', health.text)}>{`${plan.healthScore}/100`}</dd>
          <dd className="mt-2">
            <span
              className="block h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={plan.healthScore}
              aria-label={t('enrollment.plan_detail.stat_health_score')}
            >
              <span className={cn('block h-full rounded-full', health.bar)} style={{ width: `${plan.healthScore}%` }} />
            </span>
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-5">
        <PlanElections />

        <Section title={t('enrollment.plan_detail.beneficiaries')} action={{ label: t('enrollment.plan_detail.update'), onClick: () => navigate('/profile?section=beneficiary') }}>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600 dark:text-slate-300">
            {t('enrollment.plan_detail.beneficiaries_primary')}
          </p>
          <ul className="divide-y divide-slate-200/80 dark:divide-white/10">
            {plan.beneficiaries.map((_, i) => (
              <li key={i} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 py-3">
                <p className="text-[15px] font-semibold text-text-primary">{tr('bene_name')}</p>
                <div className="flex items-center gap-6 text-[14px] text-slate-600 dark:text-slate-300">
                  <span>{tr('bene_relation')}</span>
                  <span className="font-semibold tabular-nums text-text-primary">{tr('bene_pct')}</span>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        <Section title={t('enrollment.plan_detail.documents')}>
          <ul className="divide-y divide-slate-200/80 dark:divide-white/10">
            {(['doc1', 'doc2'] as const).map((dk) => (
              <li key={dk} className="flex items-center justify-between gap-3 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300" aria-hidden>
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 text-[14px] font-medium text-text-primary">{tr(dk)}</span>
                </div>
                {/* Opens the documents page; the label names the document for screen readers */}
                <button
                  type="button"
                  onClick={() => navigate('/documents')}
                  aria-label={`${t('enrollment.plan_detail.view')}: ${tr(dk)}`}
                  className={cn(PILL_SECONDARY, 'h-9 shrink-0 px-3.5 text-[13px]')}
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden /> {t('enrollment.plan_detail.view')}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      </div>
      <OptOutDialog open={optOutOpen} onClose={() => setOptOutOpen(false)} />
    </div>
  )
}
