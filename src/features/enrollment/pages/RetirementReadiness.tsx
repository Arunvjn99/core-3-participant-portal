import { useNavigate } from 'react-router-dom'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Zap,
  TrendingUp,
  X,
  Percent,
  Award,
  Info,
  Globe,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { getGrowthRate, projectBalanceConstantAnnualContributions, type RiskLevel } from '@/lib/retirementCalculations'

/* ─── Types ─── */

interface Suggestion {
  id: string
  icon: React.ReactNode
  title: string
  description: string
  scoreIncrease: number
  newScore: number
  additionalAnnualSavings: number
  projectedBalance: number
  currentLabel: string
  currentValue: string
  newLabel: string
  newValue: string
  apply: () => void
}

/* ─── Animated Counter ─── */

function AnimatedScore({
  value,
  color,
  circumference,
}: {
  value: number
  color: string
  circumference: number
}) {
  const [displayValue, setDisplayValue] = useState(value)
  const [animating, setAnimating] = useState(false)
  const prevValue = useRef(value)

  useEffect(() => {
    if (prevValue.current !== value) {
      setAnimating(true)
      const start = prevValue.current
      const diff = value - start
      const duration = 800
      const startTime = performance.now()

      const animate = (now: number) => {
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setDisplayValue(Math.round(start + diff * eased))
        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setAnimating(false)
        }
      }
      requestAnimationFrame(animate)
      prevValue.current = value
    }
  }, [value])

  const strokeDashoffset = circumference - (displayValue / 100) * circumference

  return (
    <div className="relative h-48 w-48">
      <svg className="h-48 w-48 -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke="currentColor"
          className="text-gray-100 dark:text-gray-800"
          strokeWidth="10"
        />
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: animating ? 'none' : 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold tabular-nums text-gray-900 dark:text-white">{displayValue}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">out of 100</span>
      </div>
    </div>
  )
}

/* ─── Confirmation Modal ─── */

function ConfirmationModal({
  isOpen,
  suggestion,
  currentScore,
  currentBalance,
  formatCurrency,
  onCancel,
  onApply,
}: {
  isOpen: boolean
  suggestion: Suggestion | null
  currentScore: number
  currentBalance: number
  formatCurrency: (val: number) => string
  onCancel: () => void
  onApply: () => void
}) {
  const backdropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen || !suggestion) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) onCancel()
  }

  const scoreDiff = suggestion.newScore - currentScore
  const balanceDiff = suggestion.projectedBalance - currentBalance
  const newScoreColor =
    suggestion.newScore >= 60
      ? 'text-blue-600 dark:text-blue-400'
      : suggestion.newScore >= 40
        ? 'text-gray-700 dark:text-gray-300'
        : 'text-gray-600 dark:text-gray-400'

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-800">
          <div>
            <p className="text-base font-semibold text-gray-900 dark:text-white">Confirm Change</p>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Review the impact before applying.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              What&apos;s changing
            </p>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 p-3 text-center dark:border-gray-700 dark:bg-gray-800/50">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{suggestion.currentLabel}</p>
                <p className="mt-0.5 text-lg font-bold text-gray-900 dark:text-white">{suggestion.currentValue}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400" />
              <div className="flex-1 rounded-xl border border-blue-200 bg-blue-50/80 p-3 text-center dark:border-blue-800/40 dark:bg-blue-950/30">
                <p className="text-xs font-medium text-blue-700 dark:text-blue-400">{suggestion.newLabel}</p>
                <p className="mt-0.5 text-lg font-bold text-blue-600 dark:text-blue-400">{suggestion.newValue}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Impact</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
                <span className="text-sm text-gray-500 dark:text-gray-400">Readiness score</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-gray-500 dark:text-gray-400">{currentScore}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  <span className={`text-sm font-bold tabular-nums ${newScoreColor}`}>{suggestion.newScore}</span>
                  <span className="flex items-center gap-0.5 rounded bg-blue-100 px-1.5 py-0.5 text-xs font-semibold text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                    <ArrowUpRight className="h-2.5 w-2.5" />+{scoreDiff}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
                <span className="text-sm text-gray-500 dark:text-gray-400">Additional annual savings</span>
                <span className="text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">
                  +${suggestion.additionalAnnualSavings.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800/50">
                <span className="text-sm text-gray-500 dark:text-gray-400">Projected retirement balance</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">{formatCurrency(currentBalance)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                    {formatCurrency(suggestion.projectedBalance)}
                  </span>
                </div>
              </div>

              {balanceDiff > 0 && (
                <div className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-center dark:border-gray-700 dark:bg-gray-800/50">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    +{formatCurrency(balanceDiff)} more at retirement
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4 dark:border-gray-800">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="btn-brand flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium active:scale-[0.98]"
          >
            <Zap className="h-3.5 w-3.5" /> Apply Change
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main ─── */

function RetirementReadiness() {
  const navigate = useNavigate()
  const { data, updateData, personalization, advanceStep } = useEnrollment()
  const [appliedChanges, setAppliedChanges] = useState<string[]>([])
  const [confirmingSuggestion, setConfirmingSuggestion] = useState<Suggestion | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const yearsToRetirement = Math.max(1, personalization.retirementAge - personalization.currentAge)

  const computeScore = (contribPct: number, autoInc: boolean, riskLevel: string) => {
    const contribScore = contribPct * 5
    const autoIncScore = autoInc ? 12 : 0
    const timeScore = Math.min(yearsToRetirement * 0.8, 20)
    const savingsBonus = Math.min(personalization.currentSavings / 10000, 10)
    const riskBonus = riskLevel === 'growth' ? 3 : riskLevel === 'aggressive' ? 5 : 0
    return Math.min(Math.round(contribScore + autoIncScore + timeScore + savingsBonus + riskBonus), 100)
  }

  const score = computeScore(data.contributionPercent, data.autoIncrease, data.riskLevel)

  const matchPercent = Math.min(data.contributionPercent, 6)
  const annualContribution = Math.round((data.salary * data.contributionPercent) / 100)
  const employerContribution = Math.round((data.salary * matchPercent) / 100)

  const growthRate = getGrowthRate(data.riskLevel)

  // Annual Funding Summary data
  const retirementIncomeGoal = Math.round(data.salary * 0.8)
  const totalAnnualContributions = annualContribution + employerContribution
  const annualSavingsGap = Math.max(0, retirementIncomeGoal - totalAnnualContributions)

  const projectedBalance = projectBalanceConstantAnnualContributions(
    personalization.currentSavings,
    annualContribution,
    employerContribution,
    yearsToRetirement,
    growthRate,
  )

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000) return `$${Math.round(val / 1_000).toLocaleString()}K`
    return `$${Math.round(val).toLocaleString()}`
  }

  const circumference = 2 * Math.PI * 70
  const scoreColor = score >= 40 ? '#2563eb' : '#64748b'

  const getMessage = () => {
    if (score >= 80) return "You're on a great track!"
    if (score >= 60) return "You're building a solid foundation."
    if (score >= 40) return "You're getting started — keep going!"
    return 'Every step counts toward your goal.'
  }

  const suggestions: Suggestion[] = []

  const boostPct = 2
  const boostedContrib = data.contributionPercent + boostPct
  if (boostedContrib <= 25 && !appliedChanges.includes('boost-contribution')) {
    const boostedAnnual = Math.round((data.salary * boostedContrib) / 100)
    const boostedMatch = Math.round((data.salary * Math.min(boostedContrib, 6)) / 100)
    const boostedScore = computeScore(boostedContrib, data.autoIncrease, data.riskLevel)
    const boostedBalance = projectBalanceConstantAnnualContributions(
      personalization.currentSavings,
      boostedAnnual,
      boostedMatch,
      yearsToRetirement,
      growthRate,
    )
    const additionalPerYear = boostedAnnual + boostedMatch - annualContribution - employerContribution

    suggestions.push({
      id: 'boost-contribution',
      icon: <Percent className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
      title: `Increase contribution by ${boostPct}%`,
      description: 'A small increase now compounds into significant retirement savings over time.',
      scoreIncrease: boostedScore - score,
      newScore: boostedScore,
      additionalAnnualSavings: additionalPerYear,
      projectedBalance: boostedBalance,
      currentLabel: 'Current contribution',
      currentValue: `${data.contributionPercent}%`,
      newLabel: 'New contribution',
      newValue: `${boostedContrib}%`,
      apply: () => {
        updateData({ contributionPercent: boostedContrib })
      },
    })
  }

  if (!data.autoIncrease && !appliedChanges.includes('enable-auto-increase')) {
    const autoIncScore = computeScore(data.contributionPercent, true, data.riskLevel)
    const avgExtraContrib = Math.round(
      (data.salary *
        Math.min(data.autoIncreaseAmount * (yearsToRetirement / 2), data.autoIncreaseMax - data.contributionPercent)) /
        100,
    )
    const autoIncBalance = projectBalanceConstantAnnualContributions(
      personalization.currentSavings,
      annualContribution + avgExtraContrib,
      employerContribution,
      yearsToRetirement,
      growthRate,
    )

    suggestions.push({
      id: 'enable-auto-increase',
      icon: <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
      title: 'Enable automatic contribution increases',
      description: `Automatically increase your contribution by ${data.autoIncreaseAmount}% each year up to ${data.autoIncreaseMax}%.`,
      scoreIncrease: autoIncScore - score,
      newScore: autoIncScore,
      additionalAnnualSavings: avgExtraContrib,
      projectedBalance: autoIncBalance,
      currentLabel: 'Auto-increase',
      currentValue: 'Off',
      newLabel: 'Auto-increase',
      newValue: `${data.autoIncreaseAmount}%/yr`,
      apply: () => {
        updateData({ autoIncrease: true })
      },
    })
  }

  const growthUpgrade: Record<string, string> = {
    conservative: 'balanced',
    balanced: 'growth',
  }
  const riskLabels: Record<string, string> = {
    conservative: 'Conservative',
    balanced: 'Balanced',
    growth: 'Growth',
    aggressive: 'Aggressive',
  }
  const nextRiskLevel = growthUpgrade[data.riskLevel]
  if (nextRiskLevel && !appliedChanges.includes('upgrade-strategy')) {
    const nextRate = getGrowthRate(nextRiskLevel as RiskLevel)
    const upgradeScore = computeScore(data.contributionPercent, data.autoIncrease, nextRiskLevel)
    const upgradeBalance = projectBalanceConstantAnnualContributions(
      personalization.currentSavings,
      annualContribution,
      employerContribution,
      yearsToRetirement,
      nextRate,
    )
    const extraBalancePerYear = Math.round((upgradeBalance - projectedBalance) / yearsToRetirement)

    suggestions.push({
      id: 'upgrade-strategy',
      icon: <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
      title: 'Adjust investment strategy for higher growth',
      description: `Switch from ${riskLabels[data.riskLevel]} to ${riskLabels[nextRiskLevel]} for potentially higher long-term returns.`,
      scoreIncrease: upgradeScore - score,
      newScore: upgradeScore,
      additionalAnnualSavings: extraBalancePerYear > 0 ? extraBalancePerYear : 0,
      projectedBalance: upgradeBalance,
      currentLabel: 'Current strategy',
      currentValue: riskLabels[data.riskLevel],
      newLabel: 'New strategy',
      newValue: riskLabels[nextRiskLevel],
      apply: () => {
        updateData({ riskLevel: nextRiskLevel as 'conservative' | 'balanced' | 'growth' | 'aggressive' })
      },
    })
  }

  suggestions.sort((a, b) => b.scoreIncrease - a.scoreIncrease)

  const potentialScore = suggestions.length > 0 ? suggestions.reduce((max, s) => Math.max(max, s.newScore), score) : score

  const totalPotentialIncrease = potentialScore - score

  const handleOpenConfirm = (suggestion: Suggestion) => {
    setConfirmingSuggestion(suggestion)
  }

  const handleApply = () => {
    if (!confirmingSuggestion) return
    confirmingSuggestion.apply()
    setAppliedChanges((prev) => [...prev, confirmingSuggestion.id])
    setConfirmingSuggestion(null)
    setSuccessMessage('Change applied successfully')
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  const handleNext = () => {
    advanceStep({ score, acknowledgedAt: Date.now() }, 'readiness')
    navigate('/enrollment/review')
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5">
        <button
          type="button"
          onClick={() => navigate('/enrollment/investment')}
          className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-3xl font-semibold text-gray-900 dark:text-white">Your Retirement Readiness</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Here&apos;s how your choices add up before you finalize.
        </p>
      </div>

      <div className="grid items-start gap-8 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-7 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="flex flex-col items-center">
              <AnimatedScore value={score} color={scoreColor} circumference={circumference} />

              <p className="mt-4 text-center text-base font-semibold text-gray-900 dark:text-white">{getMessage()}</p>
              <p className="mt-1 text-center text-sm text-gray-500 dark:text-gray-400">
                You are <span className="font-semibold">{score}% on track</span> for your retirement goal.
              </p>
              <p className="mt-1 text-center text-xs text-gray-400 dark:text-gray-500">
                Most participants your age aim for a readiness score of 65 or higher.
              </p>

              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-800">
                  <div className="h-full rounded-full bg-gray-500 dark:bg-gray-400" style={{ width: '65%' }} />
                </div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Target: <span className="font-semibold">65</span>
                </span>
              </div>
            </div>

            <div className="my-5 border-t border-gray-200 dark:border-gray-700" />

            {/* Projected balance */}
            <div className="text-center mt-2">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Globe className="w-3.5 h-3.5 text-gray-400" />
                <p className="text-gray-400 dark:text-gray-500 uppercase tracking-wide"
                   style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em' }}>
                  Projected Balance
                </p>
              </div>
              <p className="text-gray-900 dark:text-white tabular-nums"
                 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px', transition: 'all 0.5s ease' }}>
                {formatCurrency(projectedBalance)}
              </p>
              <p className="text-gray-400 dark:text-gray-500 mt-0.5" style={{ fontSize: '0.75rem' }}>
                At age {personalization.retirementAge}
              </p>
            </div>
          </div>

          {/* Understanding Your Score card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
                <Info className="w-3 h-3 text-blue-600" />
              </div>
              <p className="text-gray-900 dark:text-white font-semibold" style={{ fontSize: '0.88rem' }}>
                Understanding Your Score
              </p>
            </div>
            <p className="text-gray-500 dark:text-gray-400" style={{ fontSize: '0.78rem', lineHeight: 1.6 }}>
              Your score of <span className="font-semibold text-gray-900 dark:text-white">{score}</span> is based
              on contributions, timeline, and projected growth—there's room to improve.
            </p>
          </div>

          {/* Annual Funding Summary card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <p className="text-gray-900 dark:text-white font-bold mb-3" style={{ fontSize: '0.9rem' }}>
              Annual Funding Summary
            </p>
            <div className="space-y-2.5">
              {/* Retirement Income Goal */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400 dark:bg-gray-500 shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.8rem' }}>
                    Retirement Income Goal
                  </span>
                </div>
                <span className="text-gray-900 dark:text-white font-semibold tabular-nums" style={{ fontSize: '0.85rem' }}>
                  ${retirementIncomeGoal.toLocaleString()}.00
                </span>
              </div>
              {/* Current Annual Contributions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.8rem' }}>
                    Current Annual Contributions
                  </span>
                </div>
                <span className="text-blue-600 dark:text-blue-400 font-semibold tabular-nums" style={{ fontSize: '0.85rem' }}>
                  ${totalAnnualContributions.toLocaleString()}
                </span>
              </div>
              {/* Annual Savings Gap */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.8rem' }}>
                    Annual Savings Gap
                  </span>
                </div>
                <span className="text-red-600 dark:text-red-400 font-semibold tabular-nums" style={{ fontSize: '0.85rem' }}>
                  ${annualSavingsGap.toLocaleString()}.00
                </span>
              </div>
            </div>
            {/* Footnote */}
            <p className="text-gray-400 dark:text-gray-600 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800"
               style={{ fontSize: '0.72rem', lineHeight: 1.5 }}>
              This shows the gap between your retirement income goal and current annual contributions.
              Close this gap by increasing contributions or adjusting your retirement timeline.
            </p>
          </div>

          {successMessage && (
            <div
              className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-3.5 dark:border-green-800/40 dark:bg-green-950/30"
              style={{ animation: 'fadeSlideIn 0.4s ease' }}
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-200">{successMessage}</p>
            </div>
          )}

          <div className="hidden pt-1 md:block" />
        </div>

        <div className="min-w-0 space-y-6">
          {suggestions.length > 0 && totalPotentialIncrease > 0 && (
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 px-5 py-4 shadow-lg dark:border-blue-800/40 dark:from-blue-950/30 dark:to-indigo-950/20">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <p className="text-sm font-bold text-gray-900 dark:text-white">Recommended for You</p>
                </div>
                <div className="rounded-lg bg-blue-100 px-2 py-1 dark:bg-blue-950/50">
                  <p className="text-xs font-extrabold text-blue-700 dark:text-blue-400">Score: {potentialScore}</p>
                </div>
              </div>
              <p className="mb-3 text-xs leading-normal text-gray-800 dark:text-gray-200">
                You can reach a score of <span className="font-semibold text-blue-600 dark:text-blue-400">{potentialScore}</span> —
                apply the recommendations below to boost your readiness by <span className="font-semibold">+{totalPotentialIncrease} points</span>.
              </p>
            </div>
          )}

          {suggestions.length > 0 && (
            <div>
              <div className="mb-3">
                <p className="text-base font-semibold text-gray-900 dark:text-white">Optional ways to improve your readiness</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  You can apply one of these improvements to increase your retirement readiness score.
                </p>
              </div>

              <div className="space-y-4">
                {suggestions.map((suggestion, index) => {
                  const isRecommended = index === 0
                  return (
                    <div
                      key={suggestion.id}
                      className={`rounded-xl border transition-all ${
                        isRecommended
                          ? 'border-blue-200 bg-blue-50/80 shadow-lg dark:border-blue-800/40 dark:bg-blue-950/20'
                          : 'border-gray-200 bg-gray-50/60 dark:border-gray-700 dark:bg-gray-800/50'
                      }`}
                    >
                      <div className="p-5">
                        {isRecommended && (
                          <div className="mb-2.5 flex items-center gap-1">
                            <Award className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                            <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                              Recommended
                            </span>
                          </div>
                        )}
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                              isRecommended ? 'bg-blue-100 dark:bg-blue-950/40' : 'border border-gray-200 bg-white dark:border-gray-600 dark:bg-gray-900'
                            }`}
                          >
                            {suggestion.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{suggestion.title}</p>
                            <p className="mt-0.5 text-xs leading-normal text-gray-500 dark:text-gray-400">{suggestion.description}</p>

                            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Score</p>
                                <div className="mt-0.5 flex items-center gap-1">
                                  <span className="text-sm font-semibold tabular-nums text-gray-500 dark:text-gray-400">{score}</span>
                                  <ArrowRight className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">{suggestion.newScore}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Savings</p>
                                <p className="mt-0.5 text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">
                                  +${suggestion.additionalAnnualSavings.toLocaleString()}/yr
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Balance</p>
                                <p className="mt-0.5 text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                                  {formatCurrency(suggestion.projectedBalance)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleOpenConfirm(suggestion)}
                          className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-900 transition-all hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                        >
                          Apply Recommendation
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {suggestions.length === 0 && appliedChanges.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white px-5 py-4 text-center shadow-lg dark:border-gray-700 dark:bg-gray-900">
              <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
              <p className="text-sm font-semibold text-gray-900 dark:text-white">All improvements applied</p>
              <p className="mt-0.5 text-xs text-blue-600 dark:text-blue-400">Your score and balance have been optimized.</p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
            <button
              type="button"
              onClick={handleNext}
              className="btn-brand flex flex-1 items-center justify-center gap-2 rounded-xl py-3 px-4 font-semibold shadow-md transition-all"
              style={{ fontSize: '0.85rem' }}
            >
              Apply Selected <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 py-3 px-4 rounded-xl flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold"
              style={{ fontSize: '0.85rem' }}
            >
              Customize Allocation
            </button>
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 pt-4 md:hidden">
        <button
          type="button"
          onClick={handleNext}
          className="btn-brand flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3.5 font-semibold active:scale-[0.98]"
        >
          Continue to Review <ArrowRight className="h-4 w-4" />
        </button>
      </div>

      <ConfirmationModal
        isOpen={!!confirmingSuggestion}
        suggestion={confirmingSuggestion}
        currentScore={score}
        currentBalance={projectedBalance}
        formatCurrency={formatCurrency}
        onCancel={() => setConfirmingSuggestion(null)}
        onApply={handleApply}
      />

      <style>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default RetirementReadiness
