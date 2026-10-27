import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { AlertCircle, Check, ChevronDown, Loader2, Lock, ShieldCheck, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { LEGAL } from '@/lib/constants'
import { LegalHrefLink } from '@/features/legal/components/LegalHrefLink'
import type { DisclosureId } from './planConfig'
import type { SubmitPhase, SummaryData } from './EnrollmentSummaryPanel'
import { Rich } from './AgentChat'

const PHASES: SubmitPhase[] = ['validating', 'sending', 'confirming']

/**
 * The last stop before submitting: a short review of every selection, the plan disclosures and explicit consent.
 * Submission starts only from the button here, and its live status (checking, sending, confirming) is shown in place.
 */
export function ReviewDialog({
  open,
  onClose,
  data,
  disclosures,
  disclosureVars,
  consent,
  onConsent,
  phase,
  onSubmit,
}: {
  open: boolean
  onClose: () => void
  data: SummaryData
  disclosures: readonly DisclosureId[]
  disclosureVars: Record<string, string | number>
  consent: boolean
  onConsent: (v: boolean) => void
  phase: SubmitPhase
  onSubmit: () => void
}) {
  const { t } = useTranslation()
  const reduce = useReducedMotion()
  const busy = phase === 'validating' || phase === 'sending' || phase === 'confirming'
  const panelRef = useRef<HTMLDivElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)

  // Escape closes (not while submitting), Tab stays inside, the page behind doesn't scroll, focus returns on close
  const closeRef = useRef(onClose)
  const busyRef = useRef(busy)
  useEffect(() => {
    closeRef.current = onClose
    busyRef.current = busy
  })
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    headingRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busyRef.current) closeRef.current()
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), summary, a[href]')
      if (!items.length) return
      const first = items[0]!
      const last = items[items.length - 1]!
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [open])

  const rows: [string, string][] = [
    [t('enrollment.agent.review.contribution'), t('enrollment.agent.review.contribution_value', { rate: data.rate, amount: data.perPaycheck })],
    [t('enrollment.agent.summary.tax'), data.taxLabel],
    [t('enrollment.agent.summary.employer_adds'), t('enrollment.agent.review.per_year', { amount: data.employerPerYear })],
    [t('enrollment.agent.summary.auto'), data.autoText],
    [t('enrollment.agent.summary.invest'), `${data.investLabel} · ${t('enrollment.agent.review.fee', { fee: data.fee })}`],
    [t('enrollment.agent.summary.projection'), t('enrollment.agent.summary.projection_value', { amount: data.projected, age: data.retireAge })],
  ]

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div key="review" className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-app-blocking-overlay>
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={busy ? undefined : onClose} aria-hidden />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="review-title"
            initial={reduce ? false : { y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[2rem] bg-white shadow-2xl dark:bg-gray-900 sm:rounded-[2rem]"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-6 pb-4 pt-5 dark:border-gray-800">
              <div>
                <h2 id="review-title" ref={headingRef} tabIndex={-1} className="text-slate-900 dark:text-white" style={{ fontSize: '1.35rem', fontWeight: 700, outline: 'none' }}>
                  {t('enrollment.agent.review.title')}
                </h2>
                <p className="mt-0.5 text-slate-500 dark:text-gray-400" style={{ fontSize: '0.92rem' }}>
                  {data.planName} · {data.planId}
                </p>
              </div>
              <button type="button" onClick={onClose} disabled={busy} aria-label={t('glossary.close')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-40 dark:hover:bg-gray-800">
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              <dl className="divide-y divide-slate-100 dark:divide-gray-800">
                {rows.map(([k, v]) => (
                  <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
                    <dt className="text-slate-500 dark:text-gray-400" style={{ fontSize: '0.92rem' }}>{k}</dt>
                    <dd className="text-right font-semibold text-slate-900 dark:text-white" style={{ fontSize: '0.98rem' }}>{v}</dd>
                  </div>
                ))}
              </dl>

              <details className="group mt-3 rounded-xl border border-slate-200 dark:border-gray-700">
                <summary className="flex min-h-[48px] cursor-pointer list-none items-center justify-between gap-2 px-3 font-semibold text-slate-900 marker:hidden dark:text-white" style={{ fontSize: '0.95rem' }}>
                  {t('enrollment.agent.summary.disclosures_group', { n: disclosures.length })}
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <div className="space-y-3 px-3 pb-3 text-slate-700 dark:text-gray-300" style={{ fontSize: '0.9rem', lineHeight: 1.55 }}>
                  {disclosures.map((id) => (
                    <div key={id}>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{t(`enrollment.agent.disclosures.${id}.title`)}</h3>
                      <p>
                        <Rich text={t(`enrollment.agent.disclosures.${id}.body`, disclosureVars)} />
                        {id === 'plan_terms' && (
                          <>
                            {' '}
                            <LegalHrefLink href={LEGAL.termsOfServiceHref} className="font-semibold text-blue-700 hover:underline dark:text-blue-300">
                              {t('enrollment.review_page.view_terms')}
                            </LegalHrefLink>
                          </>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </details>

              <label className={cn('mt-3 flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3', consent ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/30' : 'border-slate-200 dark:border-gray-700')}>
                <input type="checkbox" checked={consent} disabled={busy} onChange={(e) => onConsent(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 rounded accent-blue-700" />
                <span className="text-slate-900 dark:text-white" style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>
                  <Rich text={t('enrollment.agent.summary.consent', { plan: data.planName })} />
                </span>
              </label>

              {(busy || phase === 'error') && (
                <div className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-gray-800/60" aria-live="polite">
                  {phase === 'error' ? (
                    <p role="alert" className="flex items-start gap-2 text-red-800 dark:text-red-300" style={{ fontSize: '0.92rem' }}>
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                      <span>
                        <strong className="block">{t('enrollment.agent.summary.submit_error_title')}</strong>
                        {t('enrollment.agent.summary.submit_error_body')}
                      </span>
                    </p>
                  ) : (
                    <ol className="space-y-1.5" style={{ fontSize: '0.92rem' }}>
                      {PHASES.map((p) => {
                        const idx = PHASES.indexOf(phase)
                        const me = PHASES.indexOf(p)
                        return (
                          <li key={p} className={cn('flex items-center gap-2', me > idx ? 'text-slate-400' : 'text-slate-800 dark:text-gray-100')}>
                            {me < idx ? <Check className="h-4 w-4 text-green-600" aria-hidden /> : me === idx ? <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-hidden /> : <span className="h-4 w-4" aria-hidden />}
                            {t(`enrollment.agent.summary.phase_${p}`)}
                          </li>
                        )
                      })}
                    </ol>
                  )}
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 px-6 pb-5 pt-4 dark:border-gray-800">
              <button
                type="button"
                onClick={onSubmit}
                disabled={!consent || busy}
                className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-blue-700 px-5 text-white shadow-lg shadow-blue-700/20 transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-600 disabled:shadow-none"
                style={{ fontSize: '1.05rem', fontWeight: 700 }}
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : <Lock className="h-5 w-5" aria-hidden />}
                {busy ? t(`enrollment.agent.summary.phase_${phase}`) : phase === 'error' ? t('enrollment.agent.summary.try_again') : t('enrollment.agent.review.submit')}
              </button>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-slate-500 dark:text-gray-400" style={{ fontSize: '0.82rem' }}>
                <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden />
                {!consent && !busy ? t('enrollment.agent.summary.needs_consent') : t('enrollment.agent.summary.sim_short')}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
