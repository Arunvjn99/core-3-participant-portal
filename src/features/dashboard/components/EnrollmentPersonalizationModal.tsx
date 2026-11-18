import { useDialogA11y } from '@/lib/useDialogA11y'
import { useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Sparkles,
  Minus,
  Plus,
  Check,
  X,
  MapPin,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { RangeSlider } from '@/design-system/components/RangeSlider'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { ACCOUNT_BALANCE, retirementAgeRange } from '@/features/enrollment/enrollmentMath'
import { ALL_US_STATES, POPULAR_LOCATIONS } from '@/lib/usStates'

function getAgeInsight(retirementAge: number, _currentAge: number, yearsUntilRetirement: number) {
  if (retirementAge <= 50) {
    return {
      title: 'Early Retirement Ambition! 🔥',
      message: `Retiring at ${retirementAge} puts you in the top 3% of early retirees. You'll need roughly ${Math.round((retirementAge * 25 * 40000) / 1000)}K saved. Max out your 401(k) contributions now — time is your biggest asset with ${yearsUntilRetirement} years to build.`,
    }
  }
  if (retirementAge <= 58) {
    return {
      title: 'Smart Early Planning! 💡',
      message: `Retiring at ${retirementAge} gives you ${yearsUntilRetirement} years to build your nest egg. At a 7% average return, investing $500/month today could grow to $${Math.round((500 * (Math.pow(1.07 / 12 + 1, yearsUntilRetirement * 12) - 1)) / (0.07 / 12) / 1000)}K by retirement.`,
    }
  }
  if (retirementAge === 62) {
    return {
      title: 'Most people retire at 62 📊',
      message: `At 62, you align with the most common retirement age. You'll have full access to 401(k) funds penalty-free at 59½, and Medicare eligibility at 65. With ${yearsUntilRetirement} years, consistent contributions will compound significantly.`,
    }
  }
  if (retirementAge <= 65) {
    return {
      title: 'Traditional Retirement 🎯',
      message: `Retiring at ${retirementAge} is a solid traditional choice. You'll have full access to 401(k) funds penalty-free and be close to or eligible for Medicare. With ${yearsUntilRetirement} years to go, your contributions have time to grow.`,
    }
  }
  return {
    title: 'Maximizing Your Savings! 🏆',
    message: `Retiring at ${retirementAge} means more Social Security benefits (up to 8% more per year after 62), more time to compound investments, and a shorter retirement to fund. A very financially smart choice.`,
  }
}

function getSavingsInsight(savingsNum: number, yearsUntilRetirement: number) {
  if (savingsNum === 0) {
    return {
      title: 'Perfect Timing! ⚡',
      message: `Starting now with ${yearsUntilRetirement} years ahead is great timing. Enrolling in your 401(k) today is the best first step.`,
    }
  }
  if (savingsNum < 10000) {
    return {
      title: 'Great Start! 💪',
      message: `$${savingsNum.toLocaleString()} is a solid foundation. With ${yearsUntilRetirement} years of compound growth, small monthly additions add up.`,
    }
  }
  if (savingsNum < 100000) {
    return {
      title: 'Strong Foundation! 📈',
      message: `With $${savingsNum.toLocaleString()} saved, you're ahead of 60% of Americans your age. Your 401(k) can build on it over ${yearsUntilRetirement} years.`,
    }
  }
  return {
    title: 'Excellent Progress! 🎉',
    message: `With $${savingsNum.toLocaleString()} saved, you're in the top 25% of savers your age and on track for a comfortable retirement.`,
  }
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

type RiskOption = {
  id: string
  icon: string
  label: string
  description: string
}

const RISK_OPTIONS: RiskOption[] = [
  {
    id: 'conservative',
    icon: '🛡️',
    label: 'Conservative',
    description: "Lower risk, emphasis on preserving what you've built.",
  },
  {
    id: 'balanced',
    icon: '📊',
    label: 'Balanced',
    description: 'Moderate growth with a mix of stocks and steadier assets.',
  },
  {
    id: 'growth',
    icon: '📈',
    label: 'Growth',
    description: 'Higher growth potential with more market movement.',
  },
  {
    id: 'aggressive',
    icon: '⚡',
    label: 'Aggressive',
    description: 'Maximum growth focus; expect sharper swings.',
  },
]

const STEPS = [
  { id: 1, label: 'Age' },
  { id: 2, label: 'Location' },
  { id: 3, label: 'Savings' },
  { id: 4, label: 'Comfort' },
]

/* The pre-enrollment dashboard's look, reused here so the wizard feels like part of that page:
   its banner wash, navy headings, pill buttons, soft rings and solid icon badges. */
const WASH_BANNER =
  'bg-[radial-gradient(90%_120%_at_0%_0%,#D9F3FF_0%,rgba(217,243,255,0)_60%),radial-gradient(80%_120%_at_100%_100%,#EFFAF2_0%,rgba(239,250,242,0)_50%),linear-gradient(#FFFFFF,#FFFFFF)] dark:bg-[radial-gradient(90%_120%_at_0%_0%,#12305C_0%,rgba(18,48,92,0)_60%),radial-gradient(80%_120%_at_100%_100%,rgba(18,63,70,0.45)_0%,rgba(18,63,70,0)_50%),linear-gradient(#0B1436,#0B1436)]'
const HEADING = 'text-[#0B1533] dark:text-white'
const BODY_TEXT = 'text-slate-600 dark:text-slate-300'
const RULE = 'border-slate-200/80 dark:border-white/10'
const PILL_PRIMARY =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(11,21,51,0.35)] transition-transform hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)]'
const PILL_SECONDARY =
  'inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-slate-900 shadow-[0_8px_20px_-10px_rgba(11,21,51,0.3)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:text-white dark:ring-white/15 dark:hover:bg-slate-800'
const ROUND_BUTTON =
  'flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_6px_14px_-10px_rgba(11,21,51,0.35)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 disabled:opacity-40 dark:bg-slate-900 dark:text-slate-200 dark:ring-white/15 dark:hover:bg-slate-800'
const HEADER_CHIP =
  'flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/70 dark:bg-white/10 dark:text-slate-200 dark:ring-white/10'
const FIELD =
  'w-full rounded-xl bg-white px-3 py-2.5 text-sm text-slate-900 ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-white/5 dark:text-white dark:ring-white/15'
const FIELD_LABEL = 'mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400'
const SECTION_LABEL = 'text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'
const TEXT_LINK = 'font-semibold text-primary hover:underline dark:text-blue-300'
/** A tile the participant picks: a soft ring at rest, the brand ring and a blue tint once chosen. */
const choiceClass = (selected: boolean) =>
  selected
    ? 'bg-blue-50 ring-2 ring-primary dark:bg-blue-500/10 dark:ring-blue-400'
    : 'bg-white ring-1 ring-slate-200 hover:ring-blue-300 dark:bg-white/5 dark:ring-white/10 dark:hover:ring-blue-400/50'

/** The AI tip on each step: the Ask Core AI card's blue wash with a solid sparkle badge. The text is held to two lines. */
function Insight({ title, children, action }: { title: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-[linear-gradient(180deg,#EAF2FF_0%,#F6F9FF_100%)] p-3.5 ring-1 ring-blue-100 dark:bg-none dark:bg-white/5 dark:ring-white/10">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_16px_-6px_rgba(37,99,235,0.6)]" aria-hidden>
        <Sparkles className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-sm font-bold', HEADING)}>{title}</p>
        <p className={cn('mt-0.5 line-clamp-2 text-xs leading-snug', BODY_TEXT)}>{children}</p>
        {action}
      </div>
    </div>
  )
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  userName: string
}

export function EnrollmentPersonalizationModal({ isOpen, onClose, onComplete, userName }: Props) {
  const { t } = useTranslation()
  const dialogRef = useDialogA11y<HTMLDivElement>(isOpen, onClose)
  const [currentStep, setCurrentStep] = useState(1)
  const [retirementAge, setRetirementAge] = useState(62)
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  // Starts at the 401(k) account balance, the same figure Account Summary shows
  const [savingsAmount, setSavingsAmount] = useState(() => ACCOUNT_BALANCE.toLocaleString())
  const [riskTolerance, setRiskTolerance] = useState<string>('balanced')

  const [birthMonth, setBirthMonth] = useState('January')
  const [birthDay, setBirthDay] = useState(1)
  const [birthYear, setBirthYear] = useState(1990)
  const [tempMonth, setTempMonth] = useState('January')
  const [tempDay, setTempDay] = useState(1)
  const [tempYear, setTempYear] = useState(1990)

  const currentYear = new Date().getFullYear()
  const currentMonthNum = new Date().getMonth() + 1
  const currentDay = new Date().getDate()

  const birthMonthIndex = MONTHS.indexOf(birthMonth) + 1
  let currentAge = currentYear - birthYear
  if (currentMonthNum < birthMonthIndex || (currentMonthNum === birthMonthIndex && currentDay < birthDay)) {
    currentAge--
  }

  const retirementYear = birthYear + retirementAge
  const yearsUntilRetirement = Math.max(1, retirementYear - currentYear)

  const filteredStates = ALL_US_STATES.filter((s) => s.toLowerCase().includes(locationSearch.toLowerCase()))

  const savingsNum = parseInt(savingsAmount.replace(/,/g, '') || '0', 10)
  const ageInsight = getAgeInsight(retirementAge, currentAge, yearsUntilRetirement)
  const savingsInsight = getSavingsInsight(savingsNum, yearsUntilRetirement)

  const selectedLocationData = POPULAR_LOCATIONS.find((l) => l.name === selectedLocation)

  const handleSaveBirthDate = () => {
    setBirthMonth(tempMonth)
    setBirthDay(tempDay)
    setBirthYear(tempYear)
    setIsEditingBirthDate(false)
  }

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location)
    setLocationSearch(location)
    setShowSuggestions(false)
  }

  const mergeDraftSection = useEnrollmentDraftStore((s) => s.mergeDraftSection)

  const handleComplete = () => {
    mergeDraftSection('savings', { salary: 85000 })
    mergeDraftSection('personalization', {
      currentAge,
      retirementAge,
      birthYear,
      birthMonth,
      birthDay,
      selectedLocation,
      savingsAmount: savingsNum,
      salary: 85000,
      riskTolerance: riskTolerance as 'conservative' | 'balanced' | 'growth' | 'aggressive',
    })
    onComplete()
    onClose()
  }

  const displayInitials =
    userName?.trim() && userName !== 'there'
      ? (userName.trim().slice(0, 2) || 'U').toUpperCase()
      : 'U'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="enrollment-personalization-modal"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('hero.modal_personalize_subtitle')}
          data-app-blocking-overlay
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative flex h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[24px] bg-white shadow-[0_40px_80px_-32px_rgba(11,21,51,0.55)] ring-1 ring-slate-200/70 dark:bg-[#0B1436] dark:ring-white/10 sm:h-auto sm:max-h-[88vh] sm:max-w-xl sm:rounded-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: the dashboard banner's light wash, with navy type instead of a solid blue block */}
            <div className={cn('relative flex-shrink-0 border-b px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-6', RULE, WASH_BANNER)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className={cn('mb-1 text-2xl font-bold leading-tight sm:text-[28px]', HEADING)}>
                    {userName && userName !== 'there'
                      ? t('hero.modal_greeting_with_name', { name: userName })
                      : t('hero.modal_greeting_generic')}
                  </h1>
                  <p className={cn('text-sm sm:text-[15px]', BODY_TEXT)}>{t('hero.modal_personalize_subtitle')}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-slate-600 shadow-[0_8px_20px_-12px_rgba(11,21,51,0.35)] ring-1 ring-slate-200 transition-colors hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-white/15 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 flex flex-nowrap items-stretch gap-2">
                <div className={HEADER_CHIP}>
                  <span className="shrink-0">⏱</span>
                  <span className="line-clamp-2 leading-tight">Takes ~3 minutes</span>
                </div>
                <div className={HEADER_CHIP}>
                  <span className="shrink-0">🔒</span>
                  <span className="line-clamp-2 leading-tight">Secure &amp; private</span>
                </div>
                <div className={HEADER_CHIP}>
                  <span className="shrink-0">✨</span>
                  <span className="line-clamp-2 leading-tight">AI-powered insights</span>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 [scrollbar-color:rgb(226_232_240)_transparent] [scrollbar-width:thin] dark:[scrollbar-color:rgb(51_65_85)_transparent] sm:space-y-4 sm:px-6 sm:py-5">
              {/* No progress strip on screen; the step number and name are still announced to screen readers */}
              <span className="sr-only">
                Step {currentStep} of {STEPS.length}: {STEPS[currentStep - 1]?.label}
              </span>
              <AnimatePresence>
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    {/* Who we think you are: one quiet row, so the question below leads the step */}
                    <div>
                      {!isEditingBirthDate ? (
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary dark:[background-color:color-mix(in_srgb,var(--color-primary)_78%,black)]">
                            <span className="text-xs font-bold text-white">{displayInitials}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={cn('text-sm font-bold leading-tight', HEADING)}>
                              You&apos;re {currentAge} years old 🎉
                            </p>
                            <p className={cn('mt-0.5 text-xs', BODY_TEXT)}>
                              Born {birthMonth} {birthDay}, {birthYear}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setTempMonth(birthMonth)
                              setTempDay(birthDay)
                              setTempYear(birthYear)
                              setIsEditingBirthDate(true)
                            }}
                            className={cn('shrink-0 text-xs', TEXT_LINK)}
                          >
                            Edit
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <h3 className={cn('text-base font-bold', HEADING)}>
                            Edit your birth date
                          </h3>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className={FIELD_LABEL}>Month</label>
                              <select
                                className={FIELD}
                                value={tempMonth}
                                onChange={(e) => setTempMonth(e.target.value)}
                              >
                                {MONTHS.map((m) => (
                                  <option key={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                            <div className="w-20">
                              <label className={FIELD_LABEL}>Day</label>
                              <input
                                type="number"
                                min={1}
                                max={31}
                                className={FIELD}
                                value={tempDay}
                                onChange={(e) => setTempDay(Number(e.target.value))}
                              />
                            </div>
                            <div className="w-24">
                              <label className={FIELD_LABEL}>Year</label>
                              <input
                                type="number"
                                min={1900}
                                max={currentYear - 18}
                                className={FIELD}
                                value={tempYear}
                                onChange={(e) => setTempYear(Number(e.target.value))}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingBirthDate(false)}
                              className={cn(PILL_SECONDARY, 'h-9 px-3.5')}
                            >
                              <X className="h-3.5 w-3.5" /> Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveBirthDate}
                              className={cn(PILL_PRIMARY, 'h-9 px-3.5')}
                            >
                              <Check className="h-3.5 w-3.5" /> Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* The one question of this step: heading, the age, the slider, then what it means */}
                    <div className="space-y-3">
                      <h2 className={cn('text-center text-[20px] font-bold leading-tight', HEADING)}>
                        At what age would you like to retire?
                      </h2>

                      <div className="flex items-center justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setRetirementAge((a) => Math.max(retirementAgeRange(currentAge)[0], a - 1))}
                          disabled={retirementAge <= retirementAgeRange(currentAge)[0]}
                          className={ROUND_BUTTON}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>

                        <div className="min-w-[72px] text-center">
                          <motion.div
                            key={retirementAge}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-4xl font-bold leading-none tracking-tight text-primary dark:text-blue-300"
                          >
                            {retirementAge}
                          </motion.div>
                          <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">years old</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setRetirementAge((a) => Math.min(retirementAgeRange(currentAge)[1], a + 1))}
                          disabled={retirementAge >= retirementAgeRange(currentAge)[1]}
                          className={ROUND_BUTTON}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div>
                        <RangeSlider
                          value={retirementAge}
                          onChange={setRetirementAge}
                          min={retirementAgeRange(currentAge)[0]}
                          max={retirementAgeRange(currentAge)[1]}
                          step={1}
                          aria-label="At what age would you like to retire?"
                          aria-valuetext={`${retirementAge} years old`}
                        />
                        <div className="mt-1 flex justify-between px-2 text-[10px] text-slate-500 dark:text-slate-400">
                          <span>{retirementAgeRange(currentAge)[0]}</span>
                          <span>{retirementAgeRange(currentAge)[1]}</span>
                        </div>
                      </div>

                      {/* What the choice means: one sentence and the two years, said once */}
                      <div className="text-center">
                        <p className={cn('text-sm', HEADING)}>
                          Retiring at <span className="font-bold">{retirementAge}</span> means{' '}
                          <span className="font-bold text-primary dark:text-blue-300">{yearsUntilRetirement} years</span> until retirement.
                        </p>
                        <p className={cn('mt-1 text-xs', BODY_TEXT)}>
                          Now — <span className={cn('font-semibold', HEADING)}>{currentYear}</span>
                          <span className="mx-2 text-slate-300 dark:text-slate-600" aria-hidden>·</span>
                          Retire — <span className={cn('font-semibold', HEADING)}>{retirementYear}</span>
                        </p>
                      </div>
                    </div>

                    <Insight
                      title={ageInsight.title}
                      action={
                        retirementAge !== 62 && (
                          <button
                            type="button"
                            onClick={() => setRetirementAge(62)}
                            className={cn('mt-1 text-xs', TEXT_LINK)}
                          >
                            Apply most popular age (62) →
                          </button>
                        )
                      }
                    >
                      {ageInsight.message}
                    </Insight>
                  </motion.div>
                )}

                {currentStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="space-y-1 text-center">
                      <h2 className={cn('text-[20px] font-bold leading-tight', HEADING)}>
                        Where do you imagine retiring? 🌎
                      </h2>
                      <p className={cn('text-sm', BODY_TEXT)}>
                        Your location helps us estimate cost of living and plan smarter.
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search any US state..."
                        className="w-full rounded-full bg-white py-3 pl-11 pr-4 text-sm text-slate-900 shadow-[0_8px_20px_-14px_rgba(11,21,51,0.3)] ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-white/5 dark:text-white dark:ring-white/15"
                        value={locationSearch}
                        onChange={(e) => {
                          setLocationSearch(e.target.value)
                          setShowSuggestions(e.target.value.length > 0)
                        }}
                        onFocus={() => locationSearch.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      />
                      {showSuggestions && filteredStates.length > 0 && (
                        <ul className="absolute z-10 mt-2 max-h-48 w-full overflow-y-auto rounded-2xl bg-white shadow-[0_24px_48px_-24px_rgba(11,21,51,0.45)] ring-1 ring-slate-200 dark:bg-[#0F1B45] dark:ring-white/10">
                          {filteredStates.map((state) => (
                            <li key={state}>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 border-b border-slate-100 px-4 py-2.5 text-left text-sm text-slate-800 last:border-0 hover:bg-blue-50 dark:border-white/5 dark:text-slate-200 dark:hover:bg-blue-500/10"
                                onClick={() => handleLocationSelect(state)}
                              >
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-primary dark:text-blue-300" />
                                {state}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className={cn('flex items-center gap-2', SECTION_LABEL)}>
                        <Sparkles className="h-3.5 w-3.5 text-primary dark:text-blue-300" />
                        Popular retirement destinations
                      </div>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {POPULAR_LOCATIONS.map((loc) => (
                          <button
                            key={loc.name}
                            type="button"
                            onClick={() => handleLocationSelect(loc.name)}
                            className={cn('rounded-2xl p-3 text-left transition-all', choiceClass(selectedLocation === loc.name))}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{loc.icon}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={cn('text-sm font-bold', HEADING)}>
                                    {loc.name}
                                  </span>
                                  <span
                                    className={cn(
                                      'rounded-full px-2 py-0.5 text-[10px] font-bold ring-1',
                                      loc.cost === 'Low'
                                        ? 'bg-emerald-50 text-emerald-700 ring-emerald-100 dark:bg-emerald-500/15 dark:text-emerald-300 dark:ring-emerald-400/20'
                                        : 'bg-amber-50 text-amber-700 ring-amber-100 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-400/20'
                                    )}
                                  >
                                    {loc.cost} Cost
                                  </span>
                                </div>
                                <p className={cn('mt-0.5 text-xs', BODY_TEXT)}>
                                  {loc.description}
                                </p>
                              </div>
                              {selectedLocation === loc.name && (
                                <Check className="h-4 w-4 flex-shrink-0 text-primary dark:text-blue-300" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedLocation && (
                      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                        <Insight title="Smart Choice! 🎯">
                          {selectedLocationData?.insight ??
                            `${selectedLocation} is a great retirement destination. Research shows location can impact retirement savings by up to 40%. We'll help optimize your plan!`}
                        </Insight>
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {currentStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1 text-center">
                      <h2 className={cn('text-[20px] font-bold leading-tight', HEADING)}>
                        What&apos;s your current retirement savings? 💰
                      </h2>
                      <p className={cn('text-sm', BODY_TEXT)}>
                        Sharing this helps us give you a clearer picture of your future.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                          $
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          aria-label="Total retirement savings"
                          className="w-full rounded-2xl bg-white py-3 pl-9 pr-4 text-lg font-bold text-[#0B1533] ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-white/5 dark:text-white dark:ring-white/15"
                          value={savingsAmount}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '')
                            setSavingsAmount(raw ? parseInt(raw, 10).toLocaleString() : '')
                          }}
                        />
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Exclude 401(k), IRA, pension — only personal savings and investments
                      </p>
                    </div>

                    {/* The snapshot as one quiet line: no label, no rules */}
                    {savingsNum > 0 && (
                      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('text-center text-sm', BODY_TEXT)}>
                        Retire at <span className={cn('font-bold', HEADING)}>{retirementAge}</span>
                        <span className="mx-2 text-slate-300 dark:text-slate-600" aria-hidden>·</span>
                        <span className={cn('font-bold', HEADING)}>{yearsUntilRetirement} years</span> to go
                        <span className="mx-2 text-slate-300 dark:text-slate-600" aria-hidden>·</span>
                        <span className={cn('font-bold', HEADING)}>${savingsNum >= 1000 ? `${(savingsNum / 1000).toFixed(0)}K` : savingsNum}</span> saved
                        {selectedLocation && (
                          <>
                            <span className="mx-2 text-slate-300 dark:text-slate-600" aria-hidden>·</span>
                            Retiring in <span className={cn('font-bold', HEADING)}>{selectedLocation}</span>
                          </>
                        )}
                      </motion.p>
                    )}

                    <Insight title={savingsInsight.title}>{savingsInsight.message}</Insight>
                  </motion.div>
                )}

                {currentStep === 4 && (
                  <motion.div
                    key="step-4"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="space-y-1 text-center">
                      <h2 className={cn('text-[20px] font-bold leading-tight', HEADING)}>
                        How comfortable are you with investment risk?
                      </h2>
                      <p className={cn('text-sm', BODY_TEXT)}>
                        This helps us recommend a portfolio that matches your style.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {RISK_OPTIONS.map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setRiskTolerance(option.id)}
                          className={cn(
                            'relative rounded-2xl p-4 text-left transition-all hover:scale-[1.01] motion-reduce:hover:scale-100',
                            choiceClass(riskTolerance === option.id)
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-2xl">{option.icon}</span>
                            <div>
                              <p className={cn('text-[15px] font-bold leading-tight', HEADING)}>{option.label}</p>
                              <p className={cn('mt-0.5 text-xs leading-snug', BODY_TEXT)}>
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <Insight
                      title={
                        <>
                          {riskTolerance === 'conservative' && 'Safe & Steady 🛡️'}
                          {riskTolerance === 'balanced' && 'Smart Balance 📊'}
                          {riskTolerance === 'growth' && 'Growth Focused 📈'}
                          {riskTolerance === 'aggressive' && 'Maximum Growth ⚡'}
                        </>
                      }
                    >
                      {riskTolerance === 'conservative' &&
                        `A conservative mix (about 70% bonds, 30% stocks) protects what you have, with steadier 4-5% average annual returns.`}
                      {riskTolerance === 'balanced' &&
                        `A balanced mix (60% stocks, 40% bonds) has historically returned 7-8% a year, a well-rounded fit for ${yearsUntilRetirement} years.`}
                      {riskTolerance === 'growth' &&
                        `A growth mix (80% stocks, 20% bonds) targets 9-10% a year. With ${yearsUntilRetirement} years, you have time to ride out market swings.`}
                      {riskTolerance === 'aggressive' &&
                        `An all-stock portfolio has historically returned 10-12% a year with big swings. Best with ${yearsUntilRetirement}+ years ahead.`}
                    </Insight>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <footer className={cn('flex flex-shrink-0 items-center justify-between border-t px-4 py-3 sm:px-6 sm:py-4', RULE)}>
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className={PILL_SECONDARY}
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className={PILL_SECONDARY}
                >
                  <Save className="h-4 w-4" /> Save &amp; Exit
                </button>
              )}

              <button
                type="button"
                onClick={currentStep === 4 ? handleComplete : () => setCurrentStep((s) => s + 1)}
                className={PILL_PRIMARY}
              >
                {currentStep === 4 ? 'View My Plan' : 'Continue'}
                <ChevronRight className="h-4 w-4" />
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default EnrollmentPersonalizationModal
