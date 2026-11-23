import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronLeft, Gauge } from 'lucide-react'
import { Modal } from '@/design-system/components/Modal'
import { AppIcon } from '@/design-system/icons'
import { cn } from '@/lib/cn'
import { recommendedFunds } from '@/features/enrollment/investmentCatalog'
import { LIKERT, QUESTIONS, STYLE_TO_RISK, riskScore, styleFromScore, type RiskStyle } from './electionsData'

const FOCUS = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
const PRIMARY = `inline-flex h-10 items-center justify-center rounded-full bg-blue-600 px-5 text-[14px] font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-600/40 ${FOCUS}`
const SECONDARY = `inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-[14px] font-semibold text-slate-900 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-white/5 dark:text-white dark:ring-white/15 dark:hover:bg-white/10 ${FOCUS}`

/** Ring colour and text colour for each style */
/** The three styles, in order from steadiest to most growth */
const SPECTRUM: { style: RiskStyle; from: number; to: number }[] = [
  { style: 'conservative', from: 0, to: 40 },
  { style: 'moderate', from: 41, to: 70 },
  { style: 'aggressive', from: 71, to: 100 },
]
/** Each style's split between stocks and bonds, from the funds it uses */
const SPLIT = Object.fromEntries(
  SPECTRUM.map(({ style }) => {
    const bonds = recommendedFunds(STYLE_TO_RISK[style]).filter((f) => f.assetClass === 'Fixed Income').reduce((sum, f) => sum + f.allocation, 0)
    return [style, { stocks: 100 - bonds, bonds }]
  }),
) as Record<RiskStyle, { stocks: number; bonds: number }>

const STYLE_TONE: Record<RiskStyle, { ring: string; text: string }> = {
  conservative: { ring: '#0EA5E9', text: 'text-sky-700 dark:text-sky-300' },
  moderate: { ring: '#D97706', text: 'text-amber-700 dark:text-amber-300' },
  aggressive: { ring: '#2563EB', text: 'text-blue-700 dark:text-blue-300' },
}

/**
 * Consent, then five statements one at a time on an agree/disagree scale, then the investment style they point to. Nothing is saved until the participant chooses Use This Style.
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
          {/* The style, named: no score, since the questionnaire only places you in a style */}
          <span className={cn('mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-white/[0.06]', tone.text)} aria-hidden>
            <AppIcon icon={Gauge} size="shortcut" />
          </span>
          <p className={cn('mt-4 text-[12px] font-bold uppercase tracking-[0.08em]', tone.text)}>{t('plan.risk.your_style')}</p>
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
 * The questionnaire drawn inside an edit panel: consent, then all five statements on one page, each answered from a
 * row of five choices, then a short result to apply. One back arrow leads out at every stage.
 */
function InlineQuestionnaire({ onClose, onComplete }: { onClose: () => void; onComplete: (style: RiskStyle) => void }) {
  const { t } = useTranslation()
  const [stage, setStage] = useState<'questions' | 'result'>('questions')
  /** Consent sits at the top of the questions, so the page is never a lone paragraph on an empty panel */
  const [consented, setConsented] = useState(false)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const score = riskScore(answers)
  const style = styleFromScore(score)
  const tone = STYLE_TONE[style]
  const total = QUESTIONS.length
  const answered = QUESTIONS.filter((q) => answers[q]).length
  const showResult = () => setStage('result')

  const back = () => (stage === 'result' ? setStage('questions') : onClose())


  return (
    <section aria-labelledby="risk-inline-title">
      {/* Header: one back arrow, the title, and how many are answered */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={back}
          aria-label={stage === 'questions' ? t('plan.risk.back_to_investments') : t('plan.risk.back')}
          className={cn('-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white', FOCUS)}
        >
          <AppIcon icon={ChevronLeft} size="secondary" />
        </button>
        <h3 id="risk-inline-title" className="flex-1 text-[16px] font-semibold text-slate-900 dark:text-white">{t('plan.risk.inline_title')}</h3>
        {stage === 'questions' && consented && (
          <span className={cn('text-[12px] font-semibold tabular-nums', answered === total ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400')}>
            {t('plan.risk.answered', { n: answered, total })}
          </span>
        )}
      </div>

      {stage === 'questions' && (
        <div className="mt-4">
          {/* Consent first, in a band above the questions; once given it folds to a single line */}
          {consented ? (
            <p className="mb-3 flex items-center gap-1.5 text-[12px] font-medium text-emerald-700 dark:text-emerald-400">
              <AppIcon icon={Check} size="inline" />
              {t('plan.risk.consent_given')}
            </p>
          ) : (
            <div className="mb-4 flex flex-col gap-3 rounded-2xl bg-blue-50/70 p-4 ring-1 ring-blue-100 sm:flex-row sm:items-center dark:bg-blue-500/10 dark:ring-blue-400/20">
              <p className="flex-1 text-[13px] leading-relaxed text-slate-700 dark:text-slate-200">{t('plan.risk.consent_body')}</p>
              <div className="flex shrink-0 items-center gap-1.5">
                <button type="button" onClick={onClose} className={cn('inline-flex h-10 items-center rounded-full px-3.5 text-[14px] font-semibold text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10', FOCUS)}>{t('plan.risk.decline')}</button>
                <button type="button" onClick={() => setConsented(true)} className={PRIMARY}>{t('plan.risk.consent')}</button>
              </div>
            </div>
          )}
          {/* The questions show from the start, so it's clear what you're agreeing to; they open once you consent */}
          <ol className={cn('space-y-3 transition-opacity', !consented && 'pointer-events-none select-none opacity-45')} aria-disabled={!consented} inert={!consented}>
            {QUESTIONS.map((q, i) => (
              <li key={q} className={cn('rounded-2xl p-4 ring-1 transition-colors', answers[q] ? 'ring-slate-200 dark:ring-white/10' : 'ring-slate-200 dark:ring-white/15')}>
                <fieldset>
                  <legend className="flex gap-2 text-[14px] font-semibold leading-snug text-slate-900 dark:text-white">
                    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums', answers[q] ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300')} aria-hidden>
                      {i + 1}
                    </span>
                    {t(`plan.risk.q_${q}`)}
                  </legend>
                  {/* The five answers in one row, from agree to disagree */}
                  <div className="mt-3 grid grid-cols-5 gap-1.5" role="radiogroup" aria-label={t(`plan.risk.q_${q}`)}>
                    {LIKERT.map((value) => {
                      const on = answers[q] === value
                      return (
                        <button
                          key={value}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => setAnswers((a) => ({ ...a, [q]: value }))}
                          className={cn(
                            'flex min-h-10 items-center justify-center rounded-xl px-1.5 py-1.5 text-center text-[12px] font-medium leading-tight transition-colors',
                            FOCUS,
                            on ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-white/[0.04] dark:text-slate-200 dark:ring-white/10 dark:hover:bg-white/10',
                          )}
                        >
                          {t(`plan.risk.likert_${value}`)}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>
              </li>
            ))}
          </ol>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[12px] text-slate-500 dark:text-slate-400">{t('plan.risk.helper')}</p>
            <button type="button" onClick={showResult} disabled={!consented || answered < total} className={PRIMARY}>
              {t('plan.risk.see_result')}
            </button>
          </div>
        </div>
      )}

      {stage === 'result' && (
        <div className="mt-4">
          {/* Who you are as an investor, in words, and how to change it */}
          <p className={cn('text-[12px] font-bold uppercase tracking-[0.08em]', tone.text)}>{t('plan.risk.your_style')}</p>
          <p className="mt-1 text-[22px] font-bold leading-tight text-slate-900 dark:text-white">{t('plan.risk.result_title', { style: t(`plan.risk.style_${style}`) })}</p>
          <p className="mt-1.5 text-[14px] text-slate-600 dark:text-slate-300">{t('plan.risk.change_hint')}</p>

          {/* The three styles side by side for context; only your match can be applied. A different style means
              retaking the questionnaire, so the choice always rests on the answers */}
          <ul className="mt-5 grid gap-3 sm:grid-cols-3">
            {SPECTRUM.map(({ style: st }) => {
              const mine = st === style
              const split = SPLIT[st]
              return (
                <li
                  key={st}
                  aria-current={mine ? 'true' : undefined}
                  className={cn(
                    'flex flex-col rounded-2xl p-4 ring-1',
                    mine ? 'bg-blue-50/60 ring-2 ring-blue-600 dark:bg-blue-500/10 dark:ring-blue-400' : 'opacity-60 ring-slate-200 dark:ring-white/15',
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className={cn('text-[15px] font-bold', STYLE_TONE[st].text)}>{t(`plan.risk.style_${st}`)}</span>
                    {mine && <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-semibold text-white dark:bg-white dark:text-slate-900">{t('plan.risk.your_match')}</span>}
                  </span>
                  <span className="mt-1 text-[12px] leading-snug text-slate-600 dark:text-slate-300">{t(`plan.risk.style_${st}_short`)}</span>
                  <span className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10" aria-hidden>
                    <span className="h-full bg-blue-600 dark:bg-blue-400" style={{ width: `${split.stocks}%` }} />
                  </span>
                  <span className="mt-1.5 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">{t('plan.risk.split', { stocks: split.stocks, bonds: split.bonds })}</span>
                </li>
              )
            })}
          </ul>

          <p className="mt-4 text-[12px] text-slate-500 dark:text-slate-400">{t('plan.risk.disclaimer')}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => onComplete(style)} className={PRIMARY}>{t('plan.risk.use_named', { style: t(`plan.risk.style_${style}`) })}</button>
            <button type="button" onClick={() => { setAnswers({}); setStage('questions') }} className={cn('inline-flex h-10 items-center rounded-full px-4 text-[14px] font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10', FOCUS)}>{t('plan.risk.retake_quiz')}</button>
          </div>
        </div>
      )}
    </section>
  )
}
