import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, ArrowRight, Minus, Plus, Scale, Shield, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { ALL_US_STATES } from '@/lib/usStates'
import { useEnrollmentDraftStore, type PersonalizationDraftData } from '@/core/store/enrollmentDraftStore'
import { ageFromBirth } from '../quickEnrollmentDefaults'
import { AgentMessage, Rich, UserReply } from './AgentChat'
import { QUESTIONS, type WizardQuestion } from './wizardQuestions'

type Risk = NonNullable<PersonalizationDraftData['riskTolerance']>

/**
 * The "about you" questions, asked one at a time as interactive cards inside the chat: the same questions as the
 * "Start my enrolment" popup on the dashboard, plus salary. Each answer becomes the participant's reply bubble.
 * Answers are saved to the shared enrolment draft only when the last one is given, so stopping part-way (for
 * example while editing) leaves the current plan untouched.
 */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const RETIRE_CHIPS = [60, 62, 65, 67, 70]
const SALARY_CHIPS = [40_000, 60_000, 80_000, 100_000]
const SAVINGS_CHIPS = [10_000, 50_000, 100_000]
const RISKS: { id: Risk; Icon: typeof Shield }[] = [
  { id: 'conservative', Icon: Shield },
  { id: 'balanced', Icon: Scale },
  { id: 'growth', Icon: TrendingUp },
  { id: 'aggressive', Icon: Zap },
]

const fieldCls =
  'h-14 w-full rounded-2xl border border-slate-200 bg-white px-4 text-lg text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-900/50'
const chipCls = (active: boolean) =>
  cn(
    'min-h-[48px] rounded-full border px-4 text-base font-semibold transition-all',
    active
      ? 'border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20'
      : 'border-slate-200 bg-white text-gray-800 hover:border-blue-300 hover:bg-blue-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
  )

function MoneyInput({ value, onChange, label, placeholder }: { value: number; onChange: (v: number) => void; label: string; placeholder: string }) {
  const locale = getAppDateLocale()
  return (
    <span className="relative block">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-gray-400">$</span>
      <input
        inputMode="numeric"
        autoComplete="off"
        value={value ? value.toLocaleString(locale) : ''}
        placeholder={placeholder}
        onChange={(e) => onChange(parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0)}
        aria-label={label}
        className={cn(fieldCls, 'pl-9 text-xl font-semibold tabular-nums')}
      />
    </span>
  )
}

export function ChatQuestions({
  questions = QUESTIONS,
  onDone,
  onCancel,
  done = false,
}: {
  /** Only these questions are asked (e.g. just the missing ones); defaults to all */
  questions?: readonly WizardQuestion[]
  onDone: () => void
  /** When editing existing answers: keep them and go back to the plan */
  onCancel?: () => void
  /** After the last answer: keep the conversation on screen without a question card */
  done?: boolean
}) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const { draftData, mergeDraftSection } = useEnrollmentDraftStore()
  const p = draftData.personalization ?? {}
  const thisYear = new Date().getFullYear()

  const [index, setIndex] = useState(0)
  const [birthMonth, setBirthMonth] = useState(p.birthMonth ?? 'January')
  const [birthYear, setBirthYear] = useState(p.birthYear ?? 1975)
  const age = ageFromBirth(birthYear, birthMonth, p.birthDay ?? 1)
  const [retireAge, setRetireAge] = useState(p.retirementAge ?? 65)
  const [location, setLocation] = useState(p.selectedLocation ?? '')
  const [salary, setSalary] = useState(draftData.savings?.salary ?? p.salary ?? 0)
  const [savings, setSavings] = useState(p.savingsAmount ?? 0)
  const [risk, setRisk] = useState<Risk>(p.riskTolerance ?? 'balanced')

  const asked = questions.length ? questions : QUESTIONS
  const current = asked[index]!
  const last = index === asked.length - 1
  const retire = Math.max(retireAge, age + 1)
  const money = (v: number) => `$${v.toLocaleString(locale)}`
  const canContinue = current !== 'salary' || salary >= 1000

  // Each new question is announced and brought into view
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (done) return
    headingRef.current?.focus({ preventScroll: true })
    headingRef.current?.closest('[data-question-card]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [index, done])

  const finish = () => {
    mergeDraftSection('personalization', {
      birthMonth,
      birthYear,
      birthDay: p.birthDay ?? 1,
      currentAge: age,
      retirementAge: retire,
      selectedLocation: location,
      salary,
      savingsAmount: savings,
      riskTolerance: risk,
    })
    mergeDraftSection('savings', { salary })
    onDone()
  }

  /** The participant's answer, as their reply bubble. */
  const reply = (q: WizardQuestion) =>
    ({
      birth: `${t(`enrollment.agent.month_${MONTHS.indexOf(birthMonth)}`)} ${birthYear}`,
      retire: t('enrollment.agent.reply_retire', { age: retire }),
      location: location || t('enrollment.agent.not_sure'),
      salary: money(salary),
      savings: savings ? money(savings) : t('enrollment.agent.nothing_yet'),
      comfort: t(`enrollment.investment.level_${risk}`),
    })[q]

  /** A short, factual note under the answer as it changes. */
  const insight: string | null =
    current === 'birth'
      ? t('enrollment.agent.insight_age', { age })
      : current === 'retire'
        ? t('enrollment.agent.react_retire', { years: Math.max(retire - age, 0) })
        : current === 'savings' && !savings
          ? t('enrollment.agent.react_savings_none')
          : null

  return (
    <div className="space-y-4">
      {(done ? asked : asked.slice(0, index)).map((q) => (
        <div key={q} className="space-y-3">
          <AgentMessage>{t(`enrollment.agent.q_${q}`)}</AgentMessage>
          <UserReply>{reply(q)}</UserReply>
        </div>
      ))}

      {!done && (
      <div data-question-card className="scroll-mt-24">
        <AgentMessage card>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!canContinue) return
              if (last) finish()
              else setIndex((i) => i + 1)
            }}
          >
            <h2 ref={headingRef} tabIndex={-1} className="text-slate-900 dark:text-white" style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.3, outline: 'none' }}>
              {t(`enrollment.agent.q_${current}`)}
            </h2>
            <p className="mt-1 text-slate-600 dark:text-gray-400" style={{ fontSize: '0.95rem' }}>
              {t(`enrollment.agent.q_${current}_hint`)}
            </p>

        <div className="mt-5">
          {current === 'birth' && (
            <div className="grid grid-cols-[1.4fr_1fr] gap-3">
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {t('enrollment.agent.month')}
                <select value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)} className={cn(fieldCls, 'mt-1.5')}>
                  {MONTHS.map((m, i) => (
                    <option key={m} value={m}>{t(`enrollment.agent.month_${i}`)}</option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {t('enrollment.agent.year')}
                <select value={birthYear} onChange={(e) => setBirthYear(parseInt(e.target.value, 10))} className={cn(fieldCls, 'mt-1.5')}>
                  {Array.from({ length: 70 }, (_, i) => thisYear - 18 - i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {current === 'retire' && (
            <div className="space-y-5">
              <div className="flex items-center justify-center gap-5">
                <button type="button" onClick={() => setRetireAge(Math.max(age + 1, retire - 1))} disabled={retire <= age + 1} aria-label={t('enrollment.quick.decrease')} className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-gray-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <Minus className="h-5 w-5" aria-hidden />
                </button>
                <p className="min-w-[6rem] text-center tabular-nums text-gray-900 dark:text-white" aria-live="polite">
                  <span style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1 }}>{retire}</span>
                  <span className="block text-gray-500 dark:text-gray-400" style={{ fontSize: '0.9rem' }}>{t('enrollment.agent.years_old')}</span>
                </p>
                <button type="button" onClick={() => setRetireAge(Math.min(80, retire + 1))} disabled={retire >= 80} aria-label={t('enrollment.quick.increase')} className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white text-gray-700 shadow-sm hover:bg-slate-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <Plus className="h-5 w-5" aria-hidden />
                </button>
              </div>
              <div className="px-1">
                <input
                  type="range"
                  min={Math.max(age + 1, 50)}
                  max={80}
                  step={1}
                  value={retire}
                  onChange={(e) => setRetireAge(parseInt(e.target.value, 10))}
                  aria-label={t('enrollment.agent.q_retire')}
                  aria-valuetext={`${retire} ${t('enrollment.agent.years_old')}`}
                  className="h-2 w-full cursor-pointer accent-blue-600"
                />
                <div className="mt-1 flex justify-between text-sm text-gray-500 dark:text-gray-400" aria-hidden>
                  <span>{Math.max(age + 1, 50)}</span>
                  <span>80</span>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-2" role="radiogroup" aria-label={t('enrollment.agent.q_retire')}>
                {RETIRE_CHIPS.filter((a) => a > age).map((a) => (
                  <button key={a} type="button" role="radio" aria-checked={retire === a} onClick={() => setRetireAge(a)} className={chipCls(retire === a)}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          )}

          {current === 'location' && (
            <div className="space-y-3">
              <select value={location} onChange={(e) => setLocation(e.target.value)} aria-label={t('enrollment.agent.q_location')} className={fieldCls}>
                <option value="">{t('enrollment.agent.choose_state')}</option>
                {ALL_US_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <button type="button" onClick={() => setLocation('')} className={chipCls(location === '')}>
                {t('enrollment.agent.not_sure')}
              </button>
            </div>
          )}

          {current === 'salary' && (
            <div className="space-y-3">
              <MoneyInput value={salary} onChange={setSalary} label={t('enrollment.agent.q_salary')} placeholder="75,000" />
              <div className="flex flex-wrap gap-2">
                {SALARY_CHIPS.map((v) => (
                  <button key={v} type="button" onClick={() => setSalary(v)} className={chipCls(salary === v)}>
                    {money(v)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {current === 'savings' && (
            <div className="space-y-3">
              <MoneyInput value={savings} onChange={setSavings} label={t('enrollment.agent.q_savings')} placeholder="0" />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setSavings(0)} className={chipCls(savings === 0)}>
                  {t('enrollment.agent.nothing_yet')}
                </button>
                {SAVINGS_CHIPS.map((v) => (
                  <button key={v} type="button" onClick={() => setSavings(v)} className={chipCls(savings === v)}>
                    {money(v)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {current === 'comfort' && (
            <div role="radiogroup" aria-label={t('enrollment.agent.q_comfort')} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {RISKS.map(({ id, Icon }) => {
                const active = risk === id
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setRisk(id)}
                    className={cn(
                      'flex items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all',
                      active ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-600/10 dark:bg-blue-950/40' : 'border-slate-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800',
                    )}
                  >
                    <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300')} aria-hidden>
                      <Icon className="h-5 w-5" />
                    </span>
                    <span>
                      <span className="block text-gray-900 dark:text-white" style={{ fontSize: '1.02rem', fontWeight: 700 }}>{t(`enrollment.investment.level_${id}`)}</span>
                      <span className="mt-0.5 block text-gray-600 dark:text-gray-400" style={{ fontSize: '0.88rem', lineHeight: 1.4 }}>{t(`enrollment.agent.risk_short_${id}`)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {insight && (
          <p className="mt-5 flex items-center gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200" style={{ fontSize: '0.98rem' }} aria-live="polite">
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            <span>
              <Rich text={insight} />
            </span>
          </p>
        )}

            <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4 dark:border-gray-800">
              {index > 0 ? (
                <button type="button" onClick={() => setIndex((i) => i - 1)} className="inline-flex min-h-[48px] items-center gap-2 rounded-xl px-3 font-semibold text-slate-700 hover:bg-slate-100 dark:text-gray-200 dark:hover:bg-gray-800">
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                  {t('enrollment.agent.back')}
                </button>
              ) : onCancel ? (
                <button type="button" onClick={onCancel} className="inline-flex min-h-[48px] items-center rounded-xl px-3 font-semibold text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-800">
                  {t('enrollment.agent.keep_answers')}
                </button>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={!canContinue}
                className="ml-auto inline-flex min-h-[52px] items-center gap-2 rounded-2xl bg-blue-700 px-6 text-white shadow-lg shadow-blue-700/20 transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-300 disabled:bg-gray-300 disabled:text-gray-600 disabled:shadow-none"
                style={{ fontSize: '1.02rem', fontWeight: 700 }}
              >
                {last ? t('enrollment.agent.build_plan') : t('enrollment.agent.continue')}
                {last ? <Sparkles className="h-5 w-5" aria-hidden /> : <ArrowRight className="h-5 w-5" aria-hidden />}
              </button>
            </div>
          </form>
        </AgentMessage>
      </div>
      )}
    </div>
  )
}
