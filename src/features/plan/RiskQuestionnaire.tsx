import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from '@/design-system/components/Modal'
import { cn } from '@/lib/cn'
import { ANSWER_KEYS, QUESTIONS, styleFromScore, type RiskStyle } from './electionsData'

/** Consent, then five questions, then a Conservative / Moderate / Aggressive result. Nothing is saved until the participant confirms the election. */
export function RiskQuestionnaire({ open, onClose, onComplete }: { open: boolean; onClose: () => void; onComplete: (style: RiskStyle) => void }) {
  const { t } = useTranslation()
  const [stage, setStage] = useState<'consent' | 'questions' | 'result'>('consent')
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [missing, setMissing] = useState(false)

  const reset = () => {
    setStage('consent')
    setAnswers({})
    setMissing(false)
  }
  const close = () => {
    onClose()
    reset()
  }

  const score = Object.values(answers).reduce((s, v) => s + v, 0)
  const style = styleFromScore(score)

  const submit = () => {
    if (QUESTIONS.some((q) => !answers[q])) {
      setMissing(true)
      return
    }
    setStage('result')
  }

  return (
    <Modal open={open} onClose={close} size="lg" title={stage === 'consent' ? t('plan.risk.consent_title') : t('plan.risk.title')}>
      {stage === 'consent' && (
        <>
          <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">{t('plan.risk.consent_body')}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={close} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">{t('plan.risk.decline')}</button>
            <button type="button" onClick={() => setStage('questions')} className="btn-brand rounded-lg px-5 py-2 text-sm font-semibold">{t('plan.risk.consent')}</button>
          </div>
        </>
      )}

      {stage === 'questions' && (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="space-y-5"
        >
          {QUESTIONS.map((q, qi) => (
            <fieldset key={q}>
              <legend className="text-sm font-semibold text-gray-900 dark:text-white">{qi + 1}. {t(`plan.risk.q_${q}`)}</legend>
              <div className="mt-2 grid gap-1.5" role="radiogroup" aria-label={t(`plan.risk.q_${q}`)}>
                {ANSWER_KEYS.map((a, ai) => {
                  const value = ai + 1
                  const on = answers[q] === value
                  return (
                    <button
                      key={a}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      onClick={() => setAnswers((s) => ({ ...s, [q]: value }))}
                      className={cn('rounded-lg border px-3 py-2 text-left text-sm transition-colors', on ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200' : 'border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800')}
                    >
                      {t(`plan.risk.${q}_${a}`)}
                    </button>
                  )
                })}
              </div>
            </fieldset>
          ))}
          {missing && <p role="alert" className="text-sm text-red-600">{t('plan.risk.answer_all')}</p>}
          <div className="flex justify-end gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
            <button type="button" onClick={close} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">{t('profile.d.cancel')}</button>
            <button type="submit" className="btn-brand rounded-lg px-5 py-2 text-sm font-semibold">{t('plan.risk.see_result')}</button>
          </div>
        </form>
      )}

      {stage === 'result' && (
        <>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{t('plan.risk.your_style')}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{t(`plan.risk.style_${style}`)}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{t(`plan.risk.style_${style}_desc`)}</p>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">{t('plan.risk.disclaimer')}</p>
          <div className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={() => { setStage('questions') }} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800">{t('plan.risk.retake')}</button>
            <button type="button" onClick={() => { onComplete(style); reset() }} className="btn-brand rounded-lg px-5 py-2 text-sm font-semibold">{t('plan.risk.use_style')}</button>
          </div>
        </>
      )}
    </Modal>
  )
}
