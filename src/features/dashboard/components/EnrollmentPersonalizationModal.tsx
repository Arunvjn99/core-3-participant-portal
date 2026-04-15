import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import * as SliderPrimitive from '@radix-ui/react-slider'
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Sparkles,
  TrendingUp,
  Minus,
  Plus,
  Calendar,
  Check,
  X,
  MapPin,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'

const ALL_US_STATES = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
]

const POPULAR_LOCATIONS = [
  {
    name: 'Florida',
    icon: '🌴',
    cost: 'Low' as const,
    description: 'Tax-friendly, warm climate',
    insight:
      'No state income tax + warm weather = $15,000+ annual tax savings. Top choice for 401(k) retirees.',
  },
  {
    name: 'Arizona',
    icon: '🌵',
    cost: 'Medium' as const,
    description: 'Dry climate, active communities',
    insight:
      '300+ sunny days, Social Security exempt from state tax, thriving 55+ communities like Sun City.',
  },
  {
    name: 'North Carolina',
    icon: '🏔️',
    cost: 'Low' as const,
    description: 'Mountains & beaches, affordable',
    insight:
      'Moderate climate, low property taxes, and a booming retiree community in Asheville and Charlotte.',
  },
  {
    name: 'South Carolina',
    icon: '⛱️',
    cost: 'Low' as const,
    description: 'Coastal living, low taxes',
    insight:
      'Retirement income deduction up to $15,000. Hilton Head and Myrtle Beach top retiree destinations.',
  },
  {
    name: 'Texas',
    icon: '⭐',
    cost: 'Medium' as const,
    description: 'No state income tax, growing cities',
    insight:
      'Zero state income tax, booming economy, and warm weather make Texas a top retirement pick.',
  },
  {
    name: 'Tennessee',
    icon: '🎸',
    cost: 'Low' as const,
    description: 'No income tax, low cost of living',
    insight:
      'No state income tax on wages, extremely low cost of living, and a vibrant music and culture scene.',
  },
]

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
  if (retirementAge <= 65) {
    return {
      title: 'Most people retire at 62 📊',
      message: `At ${retirementAge}, you align with the most common retirement age. You'll have full access to 401(k) funds penalty-free at 59½, and Medicare eligibility at 65. With ${yearsUntilRetirement} years, consistent contributions will compound significantly.`,
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
      message: `Starting from zero with ${yearsUntilRetirement} years ahead is actually great. The average American who starts at your stage retires with $800K+. Your 401(k) enrollment today is the single best financial decision you can make.`,
    }
  }
  if (savingsNum < 10000) {
    return {
      title: 'Great Start! 💪',
      message: `$${savingsNum.toLocaleString()} is a solid foundation. With ${yearsUntilRetirement} years and compound interest at 7%, adding just $200/month could grow this to over $${Math.round(((savingsNum + 200 * 12 * yearsUntilRetirement) * 1.5) / 1000)}K by retirement.`,
    }
  }
  if (savingsNum < 100000) {
    return {
      title: 'Strong Foundation! 📈',
      message: `You're ahead of 60% of Americans your age with $${savingsNum.toLocaleString()} saved. Maximizing your 401(k) contribution ($23,000/year limit in 2024) could add another $${Math.round((23000 * yearsUntilRetirement * 1.4) / 1000)}K over ${yearsUntilRetirement} years with market growth.`,
    }
  }
  return {
    title: 'Excellent Progress! 🎉',
    message: `With $${savingsNum.toLocaleString()} already saved, you're in the top 25% of savers your age. At this trajectory, you're on track for a comfortable retirement. Consider catch-up contributions ($7,500 extra/year if 50+) to maximize your position.`,
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
  popular?: boolean
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
    popular: true,
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

interface Props {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  userName: string
}

export function EnrollmentPersonalizationModal({ isOpen, onClose, onComplete, userName }: Props) {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(1)
  const [retirementAge, setRetirementAge] = useState(62)
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')
  const [selectedLocation, setSelectedLocation] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [savingsAmount, setSavingsAmount] = useState('')
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

  const yearsUntilRetirement = Math.max(1, retirementAge - currentAge)
  const retirementYear = currentYear + yearsUntilRetirement

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

  const displayInitials = (userName?.trim()?.slice(0, 2) || 'U').toUpperCase()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="enrollment-personalization-modal"
          data-app-blocking-overlay
          className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4 sm:p-6"
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
            className="relative flex h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-gray-900 sm:h-auto sm:max-h-[88vh] sm:max-w-xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-600 px-4 pb-4 pt-4 sm:px-6 sm:pb-5 sm:pt-6">
              <div className="absolute right-2 top-2 opacity-20">
                <Sparkles className="h-16 w-16 text-white" />
              </div>
              <div className="absolute bottom-0 right-0 opacity-10">
                <TrendingUp className="h-24 w-24 text-white" />
              </div>
              <div className="absolute -left-4 -top-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute -bottom-4 -right-4 h-32 w-32 rounded-full bg-indigo-400/20 blur-3xl" />

              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h1 className="mb-1 text-2xl font-bold text-white sm:text-3xl">
                    {userName && userName !== 'there'
                      ? t('hero.modal_greeting_with_name', { name: userName })
                      : t('hero.modal_greeting_generic')}
                  </h1>
                  <p className="text-sm text-blue-100 sm:text-base">{t('hero.modal_personalize_subtitle')}</p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-colors hover:bg-white/30"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="relative z-10 mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <span>⏱</span>
                  <span>Takes ~3 minutes</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <span>🔒</span>
                  <span>Secure &amp; private</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
                  <span>✨</span>
                  <span>AI-powered insights</span>
                </div>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 sm:px-6">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Step {currentStep} of {STEPS.length}
              </span>

              <div className="flex items-center gap-2">
                {STEPS.map((step) => (
                  <div
                    key={step.id}
                    className={cn(
                      'rounded-full transition-all duration-300',
                      currentStep === step.id
                        ? 'h-2 w-6 brand-bg'
                        : currentStep > step.id
                          ? 'h-2 w-2 bg-emerald-500'
                          : 'h-2 w-2 bg-gray-200 dark:bg-gray-700'
                    )}
                  />
                ))}
              </div>

              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {STEPS[currentStep - 1]?.label}
              </span>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto bg-white px-4 py-4 [scrollbar-color:rgb(229_231_235)_transparent] [scrollbar-width:thin] dark:bg-gray-900 dark:[scrollbar-color:rgb(55_65_81)_transparent] sm:space-y-5 sm:px-6 sm:py-5">
              <AnimatePresence>
                {currentStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-5"
                  >
                    <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:border-blue-900/40 dark:from-blue-950/30 dark:to-indigo-950/30">
                      <div className="absolute right-2 top-2 opacity-10">
                        <Calendar className="h-12 w-12 text-indigo-600" />
                      </div>

                      {!isEditingBirthDate ? (
                        <div className="flex items-center gap-3">
                          <div className="brand-bg flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full">
                            <span className="text-sm font-bold text-white">{displayInitials}</span>
                          </div>
                          <div className="flex-1">
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              You&apos;re {currentAge} years old 🎉
                            </p>
                            <div className="mt-0.5 flex items-center justify-between">
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Born {birthMonth} {birthDay}, {birthYear}
                              </p>
                              <button
                                type="button"
                                onClick={() => {
                                  setTempMonth(birthMonth)
                                  setTempDay(birthDay)
                                  setTempYear(birthYear)
                                  setIsEditingBirthDate(true)
                                }}
                                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                <Calendar className="h-3 w-3" /> Edit
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                            Edit your birth date
                          </h3>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <label className="mb-1 block text-xs font-medium text-gray-500">Month</label>
                              <select
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={tempMonth}
                                onChange={(e) => setTempMonth(e.target.value)}
                              >
                                {MONTHS.map((m) => (
                                  <option key={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                            <div className="w-20">
                              <label className="mb-1 block text-xs font-medium text-gray-500">Day</label>
                              <input
                                type="number"
                                min={1}
                                max={31}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={tempDay}
                                onChange={(e) => setTempDay(Number(e.target.value))}
                              />
                            </div>
                            <div className="w-24">
                              <label className="mb-1 block text-xs font-medium text-gray-500">Year</label>
                              <input
                                type="number"
                                min={1900}
                                max={currentYear - 18}
                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                                value={tempYear}
                                onChange={(e) => setTempYear(Number(e.target.value))}
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setIsEditingBirthDate(false)}
                              className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <X className="h-3.5 w-3.5" /> Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveBirthDate}
                              className="btn-brand flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold"
                            >
                              <Check className="h-3.5 w-3.5" /> Save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-center text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                        At what age would you like to retire?
                      </h2>

                      <div className="flex items-center justify-center gap-6 py-2">
                        <button
                          type="button"
                          onClick={() => setRetirementAge((a) => Math.max(currentAge + 1, a - 1))}
                          disabled={retirementAge <= currentAge + 1}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-40 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <Minus className="h-5 w-5" />
                        </button>

                        <div className="min-w-[100px] text-center">
                          <div className="mb-1 text-xs text-gray-500 dark:text-gray-400">I plan to retire at</div>
                          <motion.div
                            key={retirementAge}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-5xl font-black text-blue-600 sm:text-6xl"
                          >
                            {retirementAge}
                          </motion.div>
                          <div className="mt-1 text-xs text-gray-400">years old</div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setRetirementAge((a) => Math.min(75, a + 1))}
                          disabled={retirementAge >= 75}
                          className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-700 transition-colors hover:bg-gray-200 disabled:opacity-40 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>

                      <div className="px-2">
                        <SliderPrimitive.Root
                          className="relative flex h-6 w-full touch-none select-none items-center"
                          value={[retirementAge]}
                          onValueChange={([v]) => setRetirementAge(v)}
                          min={currentAge + 1}
                          max={75}
                          step={1}
                        >
                          <SliderPrimitive.Track className="relative h-2 grow rounded-full bg-gray-200 dark:bg-gray-700">
                            <SliderPrimitive.Range className="absolute h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600" />
                          </SliderPrimitive.Track>
                          <SliderPrimitive.Thumb className="block h-7 w-7 cursor-grab rounded-full border-2 border-blue-600 bg-white shadow-lg transition-transform hover:bg-blue-50 focus:outline-none focus:ring-4 focus:ring-blue-200 active:cursor-grabbing active:scale-110 dark:bg-gray-900" />
                        </SliderPrimitive.Root>
                        <div className="mt-1 flex justify-between text-xs text-gray-400">
                          <span>{currentAge + 1}</span>
                          <span>75</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-3 shadow-sm dark:border-purple-800/50 dark:from-purple-950/30 dark:to-blue-950/30">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                {ageInsight.title}
                              </span>
                            </div>
                            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                              {ageInsight.message}
                            </p>
                            {retirementAge !== 62 && (
                              <button
                                type="button"
                                onClick={() => setRetirementAge(62)}
                                className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                              >
                                Apply most popular age (62) →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                        <p className="text-center text-sm text-gray-800 dark:text-gray-200 sm:text-base">
                          Retiring at <span className="font-bold">{retirementAge}</span> means{' '}
                          <span className="font-bold text-blue-600">{yearsUntilRetirement} years</span> until
                          retirement.
                        </p>
                        <p className="text-center text-xs text-gray-600 dark:text-gray-400">
                          Estimated retirement year:{' '}
                          <span className="text-base font-black text-blue-600">{retirementYear}</span>
                        </p>
                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex flex-col items-center gap-1">
                            <div className="brand-bg h-2.5 w-2.5 rounded-full" />
                            <span className="text-[10px] font-medium text-gray-500">Now</span>
                            <span className="text-[10px] text-gray-400">{currentYear}</span>
                          </div>
                          <div className="relative h-0.5 flex-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600">
                            <div className="absolute left-1/2 top-1/2 whitespace-nowrap rounded border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600 -translate-x-1/2 -translate-y-1/2 dark:border-blue-800 dark:bg-blue-950">
                              {yearsUntilRetirement} years
                            </div>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div className="brand-bg h-2.5 w-2.5 rounded-full opacity-80" />
                            <span className="text-[10px] font-medium text-gray-500">Retire</span>
                            <span className="text-[10px] text-gray-400">{retirementYear}</span>
                          </div>
                        </div>
                      </div>
                    </div>
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
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        Where do you imagine retiring? 🌎
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Your location helps us estimate cost of living and plan smarter.
                      </p>
                    </div>

                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search any US state..."
                        className="w-full rounded-xl border-2 border-gray-200 bg-white py-3 pl-11 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        value={locationSearch}
                        onChange={(e) => {
                          setLocationSearch(e.target.value)
                          setShowSuggestions(e.target.value.length > 0)
                        }}
                        onFocus={() => locationSearch.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      />
                      {showSuggestions && filteredStates.length > 0 && (
                        <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                          {filteredStates.map((state) => (
                            <li key={state}>
                              <button
                                type="button"
                                className="flex w-full items-center gap-2 border-b border-gray-100 px-4 py-2.5 text-left text-sm text-gray-800 last:border-0 hover:bg-blue-50 dark:border-gray-700/50 dark:text-gray-200 dark:hover:bg-blue-950/30"
                                onClick={() => handleLocationSelect(state)}
                              >
                                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                                {state}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                        <Sparkles className="h-3.5 w-3.5 text-purple-500" />
                        Popular retirement destinations
                      </div>
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {POPULAR_LOCATIONS.map((loc) => (
                          <button
                            key={loc.name}
                            type="button"
                            onClick={() => handleLocationSelect(loc.name)}
                            className={cn(
                              'rounded-xl border-2 p-3 text-left transition-all',
                              selectedLocation === loc.name
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                                : 'border-gray-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-blue-700'
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{loc.icon}</span>
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {loc.name}
                                  </span>
                                  <span
                                    className={cn(
                                      'rounded-full px-2 py-0.5 text-[10px] font-bold',
                                      loc.cost === 'Low'
                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                    )}
                                  >
                                    {loc.cost} Cost
                                  </span>
                                </div>
                                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                  {loc.description}
                                </p>
                              </div>
                              {selectedLocation === loc.name && (
                                <Check className="h-4 w-4 flex-shrink-0 text-blue-600" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {selectedLocation && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-3 dark:border-purple-800/50 dark:from-purple-950/30 dark:to-blue-950/30"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                            <Sparkles className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                              Smart Choice! 🎯
                            </p>
                            <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                              {selectedLocationData?.insight ??
                                `${selectedLocation} is a great retirement destination. Research shows location can impact retirement savings by up to 40%. We'll help optimize your plan!`}
                            </p>
                          </div>
                        </div>
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
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        What&apos;s your current retirement savings? 💰
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Sharing this helps us give you a clearer picture of your future.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
                        Total retirement savings
                      </label>
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-400">
                          $
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0"
                          className="w-full rounded-xl border-2 border-gray-200 bg-white py-4 pl-10 pr-4 text-xl font-bold focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                          value={savingsAmount}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9]/g, '')
                            setSavingsAmount(raw ? parseInt(raw, 10).toLocaleString() : '')
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-400">
                        Exclude 401(k), IRA, pension — only personal savings and investments
                      </p>
                    </div>

                    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-4 dark:border-purple-800/50 dark:from-purple-950/30 dark:to-blue-950/30">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                            {savingsInsight.title}
                          </p>
                          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                            {savingsInsight.message}
                          </p>
                        </div>
                      </div>
                    </div>

                    {savingsNum > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                      >
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          Your retirement snapshot
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="text-center">
                            <div className="text-xl font-black text-blue-600">{retirementAge}</div>
                            <div className="text-[10px] font-medium text-gray-400">Retire at</div>
                          </div>
                          <div className="border-x border-gray-100 text-center dark:border-gray-700">
                            <div className="text-xl font-black text-indigo-600">{yearsUntilRetirement}y</div>
                            <div className="text-[10px] font-medium text-gray-400">To go</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xl font-black text-emerald-600">
                              ${savingsNum >= 1000 ? `${(savingsNum / 1000).toFixed(0)}K` : savingsNum}
                            </div>
                            <div className="text-[10px] font-medium text-gray-400">Saved</div>
                          </div>
                        </div>
                        {selectedLocation && (
                          <div className="flex items-center gap-2 border-t border-gray-100 pt-1 dark:border-gray-700">
                            <MapPin className="h-3.5 w-3.5 text-blue-500" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Retiring in{' '}
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {selectedLocation}
                              </span>
                            </span>
                          </div>
                        )}
                      </motion.div>
                    )}
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
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        How comfortable are you with investment risk?
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
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
                            'relative rounded-2xl border-2 p-5 text-left transition-all hover:scale-[1.01]',
                            riskTolerance === option.id
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                              : 'border-gray-200 bg-white hover:border-blue-300 dark:border-gray-700 dark:bg-gray-800/50'
                          )}
                        >
                          {option.popular && (
                            <div className="absolute -top-3 right-4 rounded-full bg-purple-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                              Most Common
                            </div>
                          )}
                          <div className="flex items-start gap-3">
                            <span className="mt-0.5 text-2xl">{option.icon}</span>
                            <div>
                              <p className="text-base font-bold text-gray-900 dark:text-white">{option.label}</p>
                              <p className="mt-1 text-sm leading-snug text-gray-500 dark:text-gray-400">
                                {option.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-4 dark:border-purple-800/50 dark:from-purple-950/30 dark:to-blue-950/30">
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="mb-1 text-sm font-semibold text-gray-900 dark:text-white">
                            {riskTolerance === 'conservative' && 'Safe & Steady 🛡️'}
                            {riskTolerance === 'balanced' && 'Smart Balance 📊'}
                            {riskTolerance === 'growth' && 'Growth Focused 📈'}
                            {riskTolerance === 'aggressive' && 'Maximum Growth ⚡'}
                          </p>
                          <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400">
                            {riskTolerance === 'conservative' &&
                              `With ${yearsUntilRetirement} years to retirement, a conservative approach preserves capital. Typical allocation: 70% bonds, 30% stocks. Lower volatility, steady 4-5% average annual returns.`}
                            {riskTolerance === 'balanced' &&
                              `The most popular choice. A balanced portfolio (60% stocks / 40% bonds) historically returns 7-8% annually. With ${yearsUntilRetirement} years, this is a well-rounded strategy.`}
                            {riskTolerance === 'growth' &&
                              `Growth portfolios (80% stocks / 20% bonds) target 9-10% average returns. With ${yearsUntilRetirement} years, you have time to ride out market fluctuations and build substantial wealth.`}
                            {riskTolerance === 'aggressive' &&
                              `100% equity portfolio. Historically 10-12% average annual returns with significant volatility. Best suited if you have ${yearsUntilRetirement}+ years and can stomach short-term swings.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <footer className="flex flex-shrink-0 items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-800/50 sm:px-6 sm:py-4">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                >
                  <Save className="h-4 w-4" /> Save &amp; Exit
                </button>
              )}

              <button
                type="button"
                onClick={currentStep === 4 ? handleComplete : () => setCurrentStep((s) => s + 1)}
                className="btn-brand flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] dark:shadow-blue-900/30"
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
