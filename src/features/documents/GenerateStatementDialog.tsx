import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/design-system/components/Modal'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useNow } from '@/lib/useNow'
import { DOC_PLANS } from './buildDocuments'
import { buildPdf, downloadBlob } from './pdf'
import { PERIODS, periodRange, type StatementPeriod as Period } from './statementPeriods'

/** Choose a plan and period, then download a statement PDF. Sample content for the demo. */
export function GenerateStatementDialog({ open, onClose, defaultPlanId }: { open: boolean; onClose: () => void; defaultPlanId?: string }) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const now = useNow()
  const [planId, setPlanId] = useState(defaultPlanId ?? '')
  const [period, setPeriod] = useState<Period>('last_3_months')
  const [error, setError] = useState(false)

  const field = 'h-10 w-full rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white'

  const submit = () => {
    const plan = DOC_PLANS.find((p) => p.id === planId)
    if (!plan) return setError(true)
    const { from, to } = periodRange(period, now)
    const fmt = (d: Date) => d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })
    const blob = buildPdf(t('documents.generate.pdf_title'), [
      `${plan.name} (${plan.planId})`,
      `${t('documents.generate.period')}: ${t(`documents.generate.period_${period}`)}`,
      `${fmt(from)} - ${fmt(to)}`,
      t('documents.pdf.sample'),
    ])
    downloadBlob(blob, `statement_${plan.planId}_${period}.pdf`)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} size="md" title={t('documents.generate.title')}>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="space-y-4"
      >
        <div>
          <label htmlFor="stmt-plan" className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{t('documents.filters.plan')} *</label>
          <select id="stmt-plan" value={planId} aria-invalid={error && !planId ? true : undefined} onChange={(e) => { setPlanId(e.target.value); setError(false) }} className={field}>
            <option value="">{t('profile.d.select')}</option>
            {DOC_PLANS.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {error && !planId && <p role="alert" className="mt-1 text-xs text-red-600">{t('profile.d.err_required')}</p>}
        </div>
        <div>
          <label htmlFor="stmt-period" className="mb-1 block text-sm font-medium text-gray-900 dark:text-white">{t('documents.generate.period')}</label>
          <select id="stmt-period" value={period} onChange={(e) => setPeriod(e.target.value as Period)} className={field}>
            {PERIODS.map((p) => (
              <option key={p} value={p}>{t(`documents.generate.period_${p}`)}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">{t('profile.d.cancel')}</button>
          <button type="submit" className="btn-brand rounded-lg px-5 py-2 text-sm font-semibold">{t('documents.generate.submit')}</button>
        </div>
      </form>
    </Modal>
  )
}
