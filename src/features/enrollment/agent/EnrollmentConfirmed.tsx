import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarCheck, CheckCircle2, FlaskConical, LayoutDashboard, Printer, Settings2 } from 'lucide-react'
import { getAppDateLocale } from '@/lib/dateLocale'
import type { EnrollmentConfirmation } from './enrollmentService'
import type { SummaryData } from './EnrollmentSummaryPanel'
import { AgentAvatar, Rich } from './AgentChat'

/** Shown after a (simulated) submission succeeds: the confirmation, what was elected, and what happens next. */
export function EnrollmentConfirmed({
  confirmation,
  data,
  onDashboard,
  onManage,
}: {
  confirmation: EnrollmentConfirmation
  data: SummaryData
  onDashboard: () => void
  onManage: () => void
}) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => headingRef.current?.focus(), [])
  const date = (d: Date | number) => new Date(d).toLocaleDateString(locale, { month: 'long', day: 'numeric', year: 'numeric' })
  const time = new Date(confirmation.submittedAt).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })

  const facts: [string, string][] = [
    [t('enrollment.agent.confirmed.rate'), t('enrollment.agent.confirmed.rate_value', { rate: data.rate, amount: data.perPaycheck })],
    [t('enrollment.agent.summary.tax'), data.taxLabel],
    [t('enrollment.agent.summary.employer_adds'), data.employerPerYear],
    [t('enrollment.agent.summary.auto'), data.autoText],
    [t('enrollment.agent.summary.invest'), data.investLabel],
  ]

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-start gap-3">
        <AgentAvatar />
        <div className="flex-1 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_8px_30px_rgba(30,58,138,0.08)] dark:border-gray-800 dark:bg-gray-900">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-600 px-6 py-6 text-white">
            <CheckCircle2 className="h-10 w-10" aria-hidden />
            <h1 ref={headingRef} tabIndex={-1} className="mt-3 focus:outline-none" style={{ fontSize: '1.6rem', fontWeight: 700 }}>
              {t('enrollment.agent.confirmed.title')}
            </h1>
            <p className="mt-1 text-emerald-50" style={{ fontSize: '1rem' }}>{t('enrollment.agent.confirmed.body', { plan: data.planName })}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1" style={{ fontSize: '0.8rem', fontWeight: 600 }}>
              <FlaskConical className="h-4 w-4" aria-hidden />
              {t('enrollment.agent.confirmed.sim_badge')}
            </span>
          </div>

          <div className="space-y-5 px-6 py-5">
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2" style={{ fontSize: '0.95rem' }}>
              <div>
                <dt className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.82rem' }}>{t('enrollment.agent.confirmed.conf_id')}</dt>
                <dd className="font-mono font-semibold text-gray-900 dark:text-white">{confirmation.confirmationId}</dd>
              </div>
              <div>
                <dt className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.82rem' }}>{t('enrollment.agent.confirmed.submitted')}</dt>
                <dd className="font-semibold text-gray-900 dark:text-white">{date(confirmation.submittedAt)}, {time}</dd>
              </div>
              {facts.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.82rem' }}>{k}</dt>
                  <dd className="font-semibold text-gray-900 dark:text-white">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="flex items-start gap-3 rounded-2xl bg-blue-50 p-4 text-blue-900 dark:bg-blue-950/30 dark:text-blue-200">
              <CalendarCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p style={{ fontSize: '0.95rem' }}>
                <Rich text={t('enrollment.agent.confirmed.effective', { date: date(confirmation.effectiveDate) })} />
              </p>
            </div>

            <div>
              <h2 className="text-gray-900 dark:text-white" style={{ fontSize: '1rem', fontWeight: 700 }}>{t('enrollment.agent.confirmed.next_title')}</h2>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-gray-700 dark:text-gray-300" style={{ fontSize: '0.95rem' }}>
                {[1, 2, 3].map((n) => (
                  <li key={n}>{t(`enrollment.agent.confirmed.next_${n}`)}</li>
                ))}
              </ol>
            </div>

            <p className="rounded-xl bg-slate-100 p-3 text-gray-700 dark:bg-gray-800 dark:text-gray-300" style={{ fontSize: '0.85rem' }}>
              {t('enrollment.agent.confirmed.sim_note')}
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={onDashboard} className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 font-semibold text-white hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300">
                <LayoutDashboard className="h-5 w-5" aria-hidden />
                {t('enrollment.agent.confirmed.dashboard')}
              </button>
              <button type="button" onClick={onManage} className="inline-flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 font-semibold text-gray-800 hover:bg-slate-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800">
                <Settings2 className="h-5 w-5" aria-hidden />
                {t('enrollment.agent.confirmed.manage')}
              </button>
              <button type="button" onClick={() => window.print()} className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl px-4 font-semibold text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-950/40">
                <Printer className="h-5 w-5" aria-hidden />
                {t('enrollment.agent.confirmed.print')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
