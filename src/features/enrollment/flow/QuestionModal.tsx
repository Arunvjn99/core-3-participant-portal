import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react'
import { getAppDateLocale } from '@/lib/dateLocale'
import { ALL_US_STATES } from '@/lib/usStates'
import { ageFromBirth } from '../quickEnrollmentDefaults'
import { ChipGroup, MoneyField, RadioList, RangeField } from './Controls'
import { FlowModal } from './FlowModal'
import { fieldCls, ghostBtn, primaryBtn } from './styles'
import type { Answers, QuestionId } from './flowTypes'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

/**
 * Asks the agent's open questions one at a time in a compact pop-up. Back steps through earlier answers; the
 * answers are handed over only when the last question is answered, so closing part-way changes nothing.
 */
export function QuestionModal({
  open,
  queue,
  initial,
  onFinish,
  onClose,
}: {
  open: boolean
  queue: QuestionId[]
  initial: Answers
  onFinish: (a: Answers) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const [index, setIndex] = useState(0)
  const [a, setA] = useState<Answers>(initial)
  const set = <K extends keyof Answers>(k: K, v: Answers[K]) => setA((x) => ({ ...x, [k]: v }))

  const q = queue[index]
  if (!q) return null
  const last = index === queue.length - 1
  const age = ageFromBirth(a.birthYear, a.birthMonth)
  const retire = Math.max(a.retirementAge, age + 1)
  const thisYear = new Date().getFullYear()
  const valid = q !== 'salary' || a.salary >= 1000
  const money = (v: number) => `$${v.toLocaleString(locale)}`

  const next = () => {
    if (!valid) return
    if (last) onFinish({ ...a, retirementAge: retire })
    else setIndex((i) => i + 1)
  }

  const hint: string | null =
    q === 'birth' ? t('enrollment.agent.insight_age', { age }) : q === 'retire' ? t('enrollment.agent.react_retire', { years: Math.max(retire - age, 0) }) : null

  return (
    <FlowModal
      open={open}
      onClose={onClose}
      eyebrow={t('enrollment.flow.needs_answer')}
      label={t(q === 'tax' ? 'enrollment.flow.q_tax' : `enrollment.agent.q_${q}`)}
      footer={
        <>
          {index > 0 && (
            <button type="button" onClick={() => setIndex((i) => i - 1)} className={ghostBtn}>
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t('enrollment.agent.back')}
            </button>
          )}
          <button type="button" onClick={next} disabled={!valid} className={primaryBtn} style={{ fontWeight: 700 }}>
            {last ? t('enrollment.flow.done_answering') : t('enrollment.agent.continue')}
            {last ? <Sparkles className="h-4 w-4" aria-hidden /> : <ArrowRight className="h-4 w-4" aria-hidden />}
          </button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          next()
        }}
      >
        <p className="mb-4 text-slate-500 dark:text-gray-400" style={{ fontSize: '0.92rem' }}>
          {t(q === 'tax' ? 'enrollment.flow.q_tax_hint' : `enrollment.agent.q_${q}_hint`)}
        </p>

        {q === 'birth' && (
          <div className="grid grid-cols-[1.4fr_1fr] gap-3">
            <label className="text-sm text-slate-600 dark:text-gray-300">
              {t('enrollment.agent.month')}
              <select value={a.birthMonth} onChange={(e) => set('birthMonth', e.target.value)} className={`${fieldCls} mt-1.5`}>
                {MONTHS.map((m, i) => (
                  <option key={m} value={m}>{t(`enrollment.agent.month_${i}`)}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-slate-600 dark:text-gray-300">
              {t('enrollment.agent.year')}
              <select value={a.birthYear} onChange={(e) => set('birthYear', Number(e.target.value))} className={`${fieldCls} mt-1.5`}>
                {Array.from({ length: 70 }, (_, i) => thisYear - 18 - i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
          </div>
        )}

        {q === 'retire' && (
          <div className="space-y-4">
            <RangeField label={t('enrollment.agent.q_retire')} value={retire} min={Math.max(age + 1, 50)} max={80} onChange={(v) => set('retirementAge', v)} format={(v) => String(v)} />
            <ChipGroup
              label={t('enrollment.agent.q_retire')}
              value={retire}
              onChange={(v) => set('retirementAge', v)}
              options={[60, 62, 65, 67, 70].filter((v) => v > age).map((v) => ({ value: v, label: String(v) }))}
            />
          </div>
        )}

        {q === 'location' && (
          <select value={a.location} onChange={(e) => set('location', e.target.value)} aria-label={t('enrollment.agent.q_location')} className={fieldCls}>
            <option value="">{t('enrollment.agent.not_sure')}</option>
            {ALL_US_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        )}

        {q === 'salary' && (
          <div className="space-y-3">
            <MoneyField value={a.salary} onChange={(v) => set('salary', v)} label={t('enrollment.agent.q_salary')} placeholder="75,000" />
            <ChipGroup label={t('enrollment.agent.q_salary')} value={a.salary} onChange={(v) => set('salary', v)} options={[40_000, 60_000, 80_000, 100_000].map((v) => ({ value: v, label: money(v) }))} />
          </div>
        )}

        {q === 'savings' && (
          <div className="space-y-3">
            <MoneyField value={a.savings} onChange={(v) => set('savings', v)} label={t('enrollment.agent.q_savings')} placeholder="0" />
            <ChipGroup
              label={t('enrollment.agent.q_savings')}
              value={a.savings}
              onChange={(v) => set('savings', v)}
              options={[{ value: 0, label: t('enrollment.agent.nothing_yet') }, ...[10_000, 50_000, 100_000].map((v) => ({ value: v, label: money(v) }))]}
            />
          </div>
        )}

        {q === 'comfort' && (
          <RadioList
            label={t('enrollment.agent.q_comfort')}
            value={a.risk}
            onChange={(v) => set('risk', v)}
            options={(['conservative', 'balanced', 'growth', 'aggressive'] as const).map((r) => ({ value: r, title: t(`enrollment.investment.level_${r}`), desc: t(`enrollment.agent.risk_short_${r}`) }))}
          />
        )}

        {q === 'tax' && (
          <RadioList
            label={t('enrollment.flow.q_tax')}
            value={a.tax}
            onChange={(v) => set('tax', v)}
            options={(['pretax', 'roth', 'mix'] as const).map((m) => ({
              value: m,
              title: t(`enrollment.quick.opt_${m}_title`),
              desc: t(`enrollment.quick.opt_${m}_desc`),
              badge: m === 'pretax' ? t('enrollment.flow.most_common') : undefined,
            }))}
          />
        )}

        {q === 'salary' && !valid && a.salary > 0 && (
          <p role="alert" className="mt-2 text-amber-700 dark:text-amber-300" style={{ fontSize: '0.86rem' }}>{t('enrollment.flow.salary_invalid')}</p>
        )}
        {hint && (
          <p className="mt-4 rounded-xl bg-blue-50 px-3.5 py-2.5 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200" style={{ fontSize: '0.9rem' }} aria-live="polite">
            {hint.replace(/\*\*/g, '')}
          </p>
        )}
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </FlowModal>
  )
}
