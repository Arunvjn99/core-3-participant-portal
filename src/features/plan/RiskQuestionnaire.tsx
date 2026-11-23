import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Gauge } from 'lucide-react'
import { Modal } from '@/design-system/components/Modal'
import { AppIcon } from '@/design-system/icons'
import { cn } from '@/lib/cn'
import { LIKERT, QUESTIONS, riskScore, styleFromScore, type RiskStyle } from './electionsData'

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
const PRIMARY = `inline-flex h-10 items-center justify-center rounded-full bg-blue-600 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-600/40 ${FOCUS}`
const SECONDARY = `inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-[14px] font-semibold text-slate-900 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10 ${FOCUS}`

/** Ring colour and text colour for each style */
const STYLE_TONE: Record<RiskStyle, { ring: string; text: string }> = {
  conservative: { ring: '#0EA5E9', text: 'text-sky-700 dark:text-sky-300' },
  moderate: { ring: '#D97706', text: 'text-amber-700 dark:text-amber-300' },
  aggressive: { ring: '#2563EB', text: 'text-blue-700 dark:text-blue-300' },
}

/**
 * Consent, then five statements one at a time on an agree/disagree scale, then the investment style with a score
 * out of 100. Nothing is saved until the participant chooses Use This Style.
 * `inline` draws it straight into the surface that holds it (such as an edit panel) instead of a modal, so it never
 * stacks a popup on top of another layer.
 */
export function RiskQuestionnaire({ open, onClose, onComplete, inline = false }: { open: boolean; onClose: () => void; onComplete: (style: RiskStyle) => void; inline?: boolean }) {
  const { t } = useTranslation()
  const [stage, setStage] = useState<'consent' | 'questions' | 'result'>('consent')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const reset = () => {
    setStage('consent')
    setStep(0)
    setAnswers({})
  }
  const close = () => {
    onClose()
    reset()
  }

  const q = QUESTIONS[step]
  const score = riskScore(answers)
  const style = styleFromScore(score)
  const tone = STYLE_TONE[style]
  const next = () => (step < QUESTIONS.length - 1 ? setStep(step + 1) : setStage('result'))
  const back = () => (step > 0 ? setStep(step - 1) : setStage('consent'))

  // The result ring: the score as a share of a full circle
  const R = 40
  const C = 2 * Math.PI * R

  const body = (
    <>
      {stage === 'consent' && (
        <>
          <p className="text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">{t('plan.risk.consent_body')}</p>
          <div className={cn('mt-6 flex gap-2', inline ? 'justify-start' : 'justify-end')}>
            <button type="button" onClick={close} className={SECONDARY}>{t('plan.risk.decline')}</button>
            <button type="button" onClick={() => setStage('questions')} className={PRIMARY}>{t('plan.risk.consent')}</button>
          </div>
        </>
      )}

      {stage === 'questions' && (
        <div>
          {/* Where you are: back, a progress bar, and the count */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={back} className={cn('inline-flex h-9 items-center gap-1 rounded-full pl-1 pr-2 text-[13px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white', FOCUS)}>
              <AppIcon icon={ChevronLeft} size="inline" />
              {t('plan.risk.back')}
            </button>
            <div
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"
              role="progressbar"
              aria-valuemin={1}
              aria-valuemax={QUESTIONS.length}
              aria-valuenow={step + 1}
              aria-label={t('plan.risk.progress', { n: step + 1, total: QUESTIONS.length })}
            >
              <div className="h-full rounded-full bg-blue-600 transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%` }} />
            </div>
            <span className="text-[12px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">{t('plan.risk.progress', { n: step + 1, total: QUESTIONS.length })}</span>
          </div>

          <fieldset className="mt-6">
            <legend className="text-[18px] font-bold leading-snug text-slate-900 dark:text-white">{t(`plan.risk.q_${q}`)}</legend>
            <div className="mt-4 grid gap-2" role="radiogroup" aria-label={t(`plan.risk.q_${q}`)}>
              {LIKERT.map((value) => {
                const on = answers[q] === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setAnswers((s) => ({ ...s, [q]: value }))}
                    className={cn(
                      'flex min-h-12 items-center gap-3 rounded-xl border px-4 text-left text-[14px] font-medium transition-colors',
                      FOCUS,
                      on ? 'border-blue-600 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-blue-500/15 dark:text-blue-100' : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/15 dark:text-slate-200 dark:hover:bg-white/5',
                    )}
                  >
                    <span className={cn('flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ring-1', on ? 'bg-blue-600 ring-blue-600' : 'ring-slate-300 dark:ring-slate-500')} aria-hidden>
                      {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    {t(`plan.risk.likert_${value}`)}
                  </button>
                )
              })}
            </div>
          </fieldset>
          <p className="mt-3 text-[12px] text-slate-500 dark:text-slate-400">{t('plan.risk.helper')}</p>
          <div className="mt-6 flex justify-end">
            <button type="button" onClick={next} disabled={!answers[q]} className={PRIMARY}>
              {step < QUESTIONS.length - 1 ? t('common.continue') : t('plan.risk.see_result')}
            </button>
          </div>
        </div>
      )}

      {stage === 'result' && (
        <div className="text-center">
          {/* The score as a ring, the style named under it */}
          <div className="relative mx-auto h-28 w-28">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden>
              <circle cx="50" cy="50" r={R} fill="none" strokeWidth="7" className="stroke-slate-100 dark:stroke-white/10" />
              <circle cx="50" cy="50" r={R} fill="none" strokeWidth="7" strokeLinecap="round" stroke={tone.ring} strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} className="transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none" />
            </svg>
            <span className={cn('absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-50 dark:bg-white/[0.06]', tone.text)}>
              <AppIcon icon={Gauge} size="shortcut" />
            </span>
          </div>
          <p className={cn('mt-4 text-[12px] font-bold uppercase tracking-[0.08em]', tone.text)}>{t('plan.risk.score_line', { style: t(`plan.risk.style_${style}`), score })}</p>
          <p className="mt-1.5 text-[22px] font-bold text-slate-900 dark:text-white">{t('plan.risk.investor', { style: t(`plan.risk.style_${style}`) })}</p>
          <p className="mx-auto mt-2 max-w-[440px] text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">{t(`plan.risk.style_${style}_desc`)}</p>
          <p className="mx-auto mt-3 max-w-[440px] text-[12px] text-slate-500 dark:text-slate-400">{t('plan.risk.result_why')} {t('plan.risk.disclaimer')}</p>
          <div className="mt-6 flex justify-center gap-2">
            <button type="button" onClick={() => { setStep(0); setStage('questions') }} className={SECONDARY}>{t('plan.risk.retake')}</button>
            <button type="button" onClick={() => { onComplete(style); reset() }} className={PRIMARY}>{t('plan.risk.use_style')}</button>
          </div>
        </div>
      )}
    </>
  )

  if (inline) {
    if (!open) return null
    return <InlineQuestionnaire onClose={close} onComplete={(st) => { onComplete(st); reset() }} />
  }

  return (
    <Modal open={open} onClose={close} size="lg" title={stage === 'consent' ? t('plan.risk.consent_title') : t('plan.risk.title')}>
      {body}
    </Modal>
  )
}

/**
 * The questionnaire drawn inside an edit panel: one header (a single back arrow, the title, the step count and a
 * stepped progress bar), compact answers that move on by themselves once picked, and a short result to apply.
 */
function InlineQuestionnaire({ onClose, onComplete }: { onClose: () => void; onComplete: (style: RiskStyle) => void }) {
  const { t } = useTranslation()
  const [stage, setStage] = useState<'consent' | 'questions' | 'result'>('consent')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const q = QUESTIONS[step]
  const score = riskScore(answers)
  const style = styleFromScore(score)
  const tone = STYLE_TONE[style]
  const total = QUESTIONS.length

  /** One back arrow for the whole flow: a question back, or out to the intro, or out of the questionnaire */
  const back = () => {
    if (stage === 'result') return setStage('questions')
    if (stage === 'questions') return step > 0 ? setStep(step - 1) : setStage('consent')
    onClose()
  }
  const pick = (value: number) => {
    setAnswers((s) => ({ ...s, [q]: value }))
    // A short beat so the choice is seen, then on to the next one
    window.setTimeout(() => (step < total - 1 ? setStep(step + 1) : setStage('result')), 220)
  }
  const done = stage === 'result' ? total : stage === 'questions' ? step : 0

  const R = 30
  const C = 2 * Math.PI * R

  return (
    <section aria-labelledby="risk-inline-title" className="flex min-h-full flex-col">
      {/* Header: back, title, count, and the steps as segments */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={back}
          aria-label={stage === 'consent' ? t('plan.risk.back_to_investments') : t('plan.risk.back')}
          className={cn('-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white', FOCUS)}
        >
          <AppIcon icon={ChevronLeft} size="secondary" />
        </button>
        <h3 id="risk-inline-title" className="flex-1 text-[15px] font-semibold text-slate-900 dark:text-white">{t('plan.risk.inline_title')}</h3>
        {stage === 'questions' && (
          <span className="text-[12px] font-semibold tabular-nums text-slate-500 dark:text-slate-400">{t('plan.risk.progress', { n: step + 1, total })}</span>
        )}
      </div>
      <div className="mt-3 grid gap-1" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }} aria-hidden>
        {QUESTIONS.map((key, i) => (
          <span key={key} className={cn('h-1 rounded-full transition-colors', i < done || (stage === 'questions' && i === step) ? 'bg-blue-600 dark:bg-blue-400' : 'bg-slate-200 dark:bg-white/10')} />
        ))}
      </div>

      {stage === 'consent' && (
        <div className="mt-5">
          <p className="text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">{t('plan.risk.consent_body')}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setStage('questions')} className={PRIMARY}>{t('plan.risk.consent')}</button>
            <button type="button" onClick={onClose} className={cn('inline-flex h-10 items-center rounded-full px-4 text-[14px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10', FOCUS)}>{t('plan.risk.decline')}</button>
          </div>
        </div>
      )}

      {stage === 'questions' && (
        <fieldset key={q} className="mt-5">
          <legend className="text-[16px] font-semibold leading-snug text-slate-900 dark:text-white">{t(`plan.risk.q_${q}`)}</legend>
          <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-xl ring-1 ring-slate-200 dark:divide-white/10 dark:ring-white/15" role="radiogroup" aria-label={t(`plan.risk.q_${q}`)}>
            {LIKERT.map((value) => {
              const on = answers[q] === value
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => pick(value)}
                  className={cn(
                    'flex h-11 w-full items-center gap-3 px-3.5 text-left text-[14px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500',
                    on ? 'bg-blue-50 font-semibold text-blue-900 dark:bg-blue-500/15 dark:text-blue-100' : 'font-medium text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5',
                  )}
                >
                  <span className={cn('flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full ring-1', on ? 'bg-blue-600 ring-blue-600' : 'ring-slate-300 dark:ring-slate-500')} aria-hidden>
                    {on && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>
                  {t(`plan.risk.likert_${value}`)}
                </button>
              )
            })}
          </div>
          <p className="mt-2.5 text-[12px] text-slate-500 dark:text-slate-400">{t('plan.risk.tap_hint')}</p>
        </fieldset>
      )}

      {stage === 'result' && (
        <div className="mt-5">
          <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/[0.05]">
            <div className="relative h-16 w-16 shrink-0">
              <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden>
                <circle cx="40" cy="40" r={R} fill="none" strokeWidth="7" className="stroke-slate-200 dark:stroke-white/10" />
                <circle cx="40" cy="40" r={R} fill="none" strokeWidth="7" strokeLinecap="round" stroke={tone.ring} strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[15px] font-bold tabular-nums text-slate-900 dark:text-white">{score}</span>
            </div>
            <div className="min-w-0">
              <p className={cn('text-[11px] font-bold uppercase tracking-[0.08em]', tone.text)}>{t('plan.risk.your_style')}</p>
              <p className="text-[18px] font-bold text-slate-900 dark:text-white">{t(`plan.risk.style_${style}`)}</p>
            </div>
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-600 dark:text-slate-300">{t(`plan.risk.style_${style}_desc`)}</p>
          <p className="mt-2 text-[12px] text-slate-500 dark:text-slate-400">{t('plan.risk.disclaimer')}</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => onComplete(style)} className={PRIMARY}>{t('plan.risk.use_style')}</button>
            <button type="button" onClick={() => { setAnswers({}); setStep(0); setStage('questions') }} className={cn('inline-flex h-10 items-center rounded-full px-4 text-[14px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10', FOCUS)}>{t('plan.risk.retake')}</button>
          </div>
        </div>
      )}
    </section>
  )
}
