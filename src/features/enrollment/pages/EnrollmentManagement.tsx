import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, useReducedMotion } from 'framer-motion'
import { Shield, ChevronRight, AlertCircle, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useElectionsStore } from '@/features/plan/electionsStore'

type PlanStatus = 'enrolled' | 'eligible' | 'ineligible' | 'opted_out'
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

/** The pre-enrollment dashboard's pieces: card surface, the solid pill, the white pill and a focus ring everything shares */
const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
const CARD = 'rounded-[20px] bg-surface-card shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ring-1 ring-slate-200/70 dark:ring-white/10'
const PILL_PRIMARY = `inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-[14px] font-semibold text-white shadow-[0_6px_14px_-8px_rgba(37,99,235,0.5)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98] motion-reduce:active:scale-100 dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)] ${FOCUS}`
const PILL_SECONDARY = `inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-[14px] font-semibold text-slate-900 shadow-[0_2px_6px_-3px_rgba(11,21,51,0.12)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10 ${FOCUS}`
const TEXT_LINK = `inline-flex min-h-10 items-center gap-1 rounded-md text-[14px] font-semibold text-primary underline-offset-2 hover:underline dark:text-blue-300 ${FOCUS}`

/** Status pill: a dot and the word, in colours that stay readable on both themes */
function StatusBadge({ status }: { status: PlanStatus }) {
  const { t } = useTranslation()
  const styles: Record<PlanStatus, { labelKey: string; pill: string; dot: string }> = {
    enrolled: { labelKey: 'status_enrolled', pill: 'bg-blue-50 text-blue-800 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/30', dot: 'bg-blue-600 dark:bg-blue-300' },
    eligible: { labelKey: 'status_eligible', pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-200 dark:ring-emerald-400/30', dot: 'bg-emerald-600 dark:bg-emerald-300' },
    ineligible: { labelKey: 'status_ineligible', pill: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/15', dot: 'bg-slate-500 dark:bg-slate-300' },
    opted_out: { labelKey: 'status_opted_out', pill: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-400/30', dot: 'bg-amber-600 dark:bg-amber-300' },
  }
  const s = styles[status]
  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold ring-1 ring-inset', s.pill)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} aria-hidden />
      {t(`enrollment.manage_page.${s.labelKey}`)}
    </span>
  )
}

function PlanCard({ plan, index }: { plan: Plan & { name: string; balanceChange?: string; description?: string; ineligibleReason?: string }; index: number }) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const isEnrolled = plan.status === 'enrolled'
  const isEligible = plan.status === 'eligible'
  const isIneligible = plan.status === 'ineligible'
  const isOptedOut = plan.status === 'opted_out'
  const titleId = `plan-${plan.id}-title`

  return (
    <motion.article
      aria-labelledby={titleId}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: reduce ? 0 : index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        CARD,
        'flex h-full flex-col p-5 sm:p-6',
        // The plan you're in gets the soft blue wash from the dashboard; the others stay plain white
        isEnrolled && 'bg-[linear-gradient(180deg,#EAF2FF_0%,#F6F9FF_100%)] ring-blue-100 dark:bg-[linear-gradient(180deg,rgba(59,130,246,0.16)_0%,rgba(15,23,42,1)_100%)] dark:ring-blue-400/20',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={titleId} className="text-[18px] font-bold leading-tight text-text-primary">{plan.name}</h2>
          <p className="mt-1 text-[12px] font-medium text-slate-600 dark:text-slate-300">{t('enrollment.manage_page.plan_id', { id: plan.planId })}</p>
        </div>
        <StatusBadge status={plan.status} />
      </div>

      {isEnrolled && plan.balance != null && (
        <>
          {/* Balance straight on the card, no box inside the box */}
          <div className="mt-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <span className="text-[14px] font-medium text-slate-600 dark:text-slate-300">{t('enrollment.manage_page.current_balance')}</span>
            <span className="text-right">
              <span className="block text-[28px] font-bold leading-none tracking-tight tabular-nums text-text-primary">{formatCurrency(plan.balance, locale)}</span>
              {plan.balanceChange && <span className="mt-1.5 block text-[13px] font-semibold text-emerald-800 dark:text-emerald-300">{plan.balanceChange}</span>}
            </span>
          </div>
          <div className="mt-auto pt-5">
            <button type="button" onClick={() => navigate(`/enrollment/manage/${plan.id}`)} className={cn(PILL_PRIMARY, 'w-full')}>
              {t('enrollment.manage_page.manage_plan')}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </>
      )}

      {isEligible && (
        <>
          <p className="mt-4 text-[14px] leading-relaxed text-text-secondary">{plan.description}</p>
          <div className="mt-auto pt-5">
            <button type="button" onClick={() => navigate('/enrollment/plan')} className={PILL_SECONDARY}>
              {t('enrollment.manage_page.start_enrolment')}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </>
      )}

      {isOptedOut && (
        <>
          <p className="mt-4 text-[14px] leading-relaxed text-text-secondary">{t('enrollment.manage_page.opted_out_message')}</p>
          <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
            <button type="button" onClick={() => navigate('/enrollment/quick')} className={PILL_PRIMARY}>
              {t('enrollment.manage_page.reenroll')}
            </button>
            <button type="button" onClick={() => navigate(`/enrollment/manage/${plan.id}`)} className={PILL_SECONDARY}>
              {t('enrollment.manage_page.manage_plan')}
            </button>
          </div>
        </>
      )}

      {isIneligible && (
        <>
          {/* Full-strength text: the card is not faded, so the reason stays readable */}
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200/70 dark:bg-white/5 dark:ring-white/10">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
            <p className="text-[13px] leading-relaxed text-text-secondary">{plan.ineligibleReason}</p>
          </div>
          <div className="mt-auto pt-4">
            <button type="button" onClick={() => navigate('/enrollment/plan')} className={TEXT_LINK}>
              {t('enrollment.manage_page.provide_in_advance')}
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </>
      )}
    </motion.article>
  )
}

export default function EnrollmentManagement() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<FilterTab>('all')
  const optedOut = useElectionsStore((st) => st.optedOut)

  const plans = useMemo(
    () =>
      PLANS_BASE.map((p) => ({
        ...p,
        status: (p.id === 'roth-401k' && optedOut ? 'opted_out' : p.status) as PlanStatus,
        name: t(`enrollment.manage_page.plans.${p.id}.name`),
        balanceChange:
          p.id === 'roth-401k' ? t(`enrollment.manage_page.plans.${p.id}.balance_change`) : undefined,
        description: p.status === 'eligible' ? t(`enrollment.manage_page.plans.${p.id}.description`) : undefined,
        ineligibleReason: p.status === 'ineligible' ? t(`enrollment.manage_page.plans.${p.id}.ineligible`) : undefined,
      })),
    [t, optedOut],
  )

  const filtered = filter === 'all' ? plans : plans.filter((p) => p.status === filter)

  const counts: Record<FilterTab, number> = {
    all: plans.length,
    enrolled: plans.filter((p) => p.status === 'enrolled').length,
    eligible: plans.filter((p) => p.status === 'eligible').length,
    ineligible: plans.filter((p) => p.status === 'ineligible').length,
    opted_out: plans.filter((p) => p.status === 'opted_out').length,
  }

  const filterTabs: { key: FilterTab; labelKey: string }[] = [
    { key: 'all', labelKey: 'tab_all' },
    { key: 'enrolled', labelKey: 'tab_enrolled' },
    { key: 'eligible', labelKey: 'tab_eligible' },
    { key: 'ineligible', labelKey: 'tab_ineligible' },
    ...(optedOut ? [{ key: 'opted_out' as const, labelKey: 'tab_opted_out' }] : []),
  ]

  return (
    <div className="mx-auto w-full max-w-[1040px] px-4 py-6 sm:px-6 lg:py-7">
      {/* Page title in the dashboard's type: plain on the page, no card */}
      <header className="mb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-primary ring-1 ring-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:ring-blue-400/20" aria-hidden>
            <Shield className="h-5 w-5" />
          </span>
          <h1 className="text-[28px] font-bold leading-tight text-[#0B1533] dark:text-white">{t('enrollment.manage_page.title')}</h1>
        </div>
        <p className="mt-1 text-[15px] leading-snug text-text-secondary">{t('enrollment.manage_page.subtitle')}</p>
      </header>

      {/* Filters: toggle buttons that say which one is on; the row scrolls sideways on narrow screens instead of wrapping */}
      <div role="group" aria-label={t('enrollment.manage_page.title')} className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
        {filterTabs.map((tab) => {
          const on = filter === tab.key
          return (
            <button
              key={tab.key}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(tab.key)}
              className={cn(
                'inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[14px] font-semibold transition-colors',
                FOCUS,
                on
                  ? 'bg-[#0B1533] text-white shadow-[0_6px_14px_-8px_rgba(11,21,51,0.5)] dark:bg-white dark:text-[#0B1533]'
                  : 'bg-surface-card text-text-secondary ring-1 ring-slate-200 hover:bg-slate-50 hover:text-text-primary dark:ring-white/15 dark:hover:bg-white/5',
              )}
            >
              {t(`enrollment.manage_page.${tab.labelKey}`)}
              <span
                className={cn(
                  'inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[11px] font-bold tabular-nums',
                  on ? 'bg-white/20 text-white dark:bg-[#0B1533]/10 dark:text-[#0B1533]' : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-200',
                )}
              >
                {counts[tab.key].toLocaleString(getAppDateLocale())}
              </span>
            </button>
          )
        })}
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {filtered.map((plan, i) => (
          <PlanCard key={plan.id} plan={plan} index={i} />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full flex items-center justify-center rounded-[20px] border border-dashed border-slate-300 py-16 dark:border-white/15">
            <p className="text-[14px] text-text-secondary">{t('enrollment.manage_page.empty_filter')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
