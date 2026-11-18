import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { getAppDateLocale } from '@/lib/dateLocale'
import {
  ArrowRight,
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  Zap,
  TrendingUp,
  X,
  Percent,
  Info,
  Globe,
} from 'lucide-react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '@/lib/cn'
import { BODY_TEXT, Card, CARD_TITLE, HEADING, IconChip, MUTED_TEXT, PILL_PRIMARY, PILL_SECONDARY, RULE, SECTION_LABEL, StepHeader, TitleBadge, badge, card } from '@/features/enrollment/enrollmentUi'
import { getGrowthRate, type RiskLevel } from '@/lib/retirementCalculations'
import { annualEmployerMatch, projectBalance, retirementIncome } from '@/features/enrollment/enrollmentMath'
import { useRetirementGoal } from '@/features/retirement/retirementStore'
import { goalExtras } from '@/features/retirement/readinessExtras'
import { useEnrollmentStepNav, type EnrollmentPrimaryLabel } from '@/features/enrollment/components/EnrollmentStepNavContext'

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
  const { t } = useTranslation()
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

  const strokeDashoffset = circumference - (Math.min(Math.max(displayValue, 0), 100) / 100) * circumference

  return (
    <div className="relative h-48 w-48">
      <svg className="h-48 w-48 -rotate-90" viewBox="0 0 160 160">
        <circle
          cx="80"
          cy="80"
          r="70"
          fill="none"
          stroke="currentColor"
          className="text-slate-100 dark:text-white/10"
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
        <span className="text-5xl font-bold tabular-nums text-[#0B1533] dark:text-white">{displayValue}</span>
        <span className="text-xs text-slate-500 dark:text-slate-400">{t('enrollment.readiness.out_of_100')}</span>
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
  const { t } = useTranslation()
  const locale = getAppDateLocale()
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
        ? 'text-slate-600 dark:text-slate-300'
        : 'text-slate-600 dark:text-slate-300'

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1533]/50 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl ring-1 ring-slate-200/70 dark:bg-[#0B1436] dark:ring-white/10">
        <div className={cn('flex items-center justify-between border-b px-6 py-4', RULE)}>
          <div>
            <p className={CARD_TITLE}>{t('enrollment.readiness.confirm_title')}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{t('enrollment.readiness.confirm_subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-[#0B1533] dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <p className={cn('mb-3', SECTION_LABEL)}>{t('enrollment.readiness.confirm_whats_changing')}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-2xl bg-white p-3 text-center ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{suggestion.currentLabel}</p>
                <p className="mt-0.5 text-lg font-bold text-[#0B1533] dark:text-white">{suggestion.currentValue}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
              <div className="flex-1 rounded-2xl bg-blue-50 p-3 text-center ring-2 ring-primary dark:bg-blue-500/10 dark:ring-blue-400">
                <p className="text-xs font-medium text-primary dark:text-blue-300">{suggestion.newLabel}</p>
                <p className="mt-0.5 text-lg font-bold text-primary dark:text-blue-300">{suggestion.newValue}</p>
              </div>
            </div>
          </div>

          <div>
            <p className={cn('mb-1', SECTION_LABEL)}>{t('enrollment.readiness.impact')}</p>
            <div className="divide-y divide-slate-200/80 dark:divide-white/10">
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">{t('enrollment.readiness.readiness_score')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold tabular-nums text-slate-500 dark:text-slate-400">{currentScore}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  <span className={`text-sm font-bold tabular-nums ${newScoreColor}`}>{suggestion.newScore}</span>
                  <span className={cn(badge('emerald'), 'gap-0.5 px-1.5')}>
                    <ArrowUpRight className="h-2.5 w-2.5" />+{scoreDiff}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">{t('enrollment.readiness.additional_annual')}</span>
                <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                  {suggestion.additionalAnnualSavings > 0 ? `+$${suggestion.additionalAnnualSavings.toLocaleString(locale)}` : '—'}
                </span>
              </div>

              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">{t('enrollment.readiness.projected_balance')}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm tabular-nums text-slate-500 dark:text-slate-400">{formatCurrency(currentBalance)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-sm font-bold tabular-nums text-[#0B1533] dark:text-white">
                    {formatCurrency(suggestion.projectedBalance)}
                  </span>
                </div>
              </div>

              {balanceDiff > 0 && (
                <div className="pt-3 text-center">
                  <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {t('enrollment.readiness.confirm_more_retirement', { amount: `+${formatCurrency(balanceDiff)}` })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={cn('flex items-center justify-end gap-3 border-t px-6 py-4', RULE)}>
          <button
            type="button"
            onClick={onCancel}
            className={PILL_SECONDARY}
          >
            {t('enrollment.readiness.cancel')}
          </button>
          <button
            type="button"
            onClick={onApply}
            className={PILL_PRIMARY}
          >
            <Zap className="h-3.5 w-3.5" /> {t('enrollment.readiness.apply_change')}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Main ─── */

function RetirementReadiness() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData, personalization, advanceStep } = useEnrollment()
  const [appliedChanges, setAppliedChanges] = useState<string[]>([])
  const [confirmingSuggestion, setConfirmingSuggestion] = useState<Suggestion | null>(null)
  const [successMessage, setSuccessMessage] = useState(false)

  const yearsToRetirement = Math.max(1, personalization.retirementAge - personalization.currentAge)

  const annualContribution = Math.round((data.salary * data.contributionPercent) / 100)
  const employerContribution = annualEmployerMatch(data.salary, data.contributionPercent, data.contributionSources)
  const currentAutoIncrease = data.autoIncrease ? { amount: data.autoIncreaseAmount, max: data.autoIncreaseMax } : null
  /** Same projection as Review and the Auto Increase step, for any contribution rate, auto-increase or growth rate */
  const project = (ratePercent: number, autoIncrease: { amount: number; max: number } | null, rate: number) =>
    projectBalance({
      startingBalance: personalization.currentSavings,
      salary: data.salary,
      ratePercent,
      sources: data.contributionSources,
      years: yearsToRetirement,
      growthRate: rate,
      autoIncrease,
    })

  const growthRate = getGrowthRate(data.riskLevel)
  // The retirement goal saved on the Retirement readiness page (if any), so every screen scores the plan the same way
  const savedGoal = useRetirementGoal()
  const incomeExtras = { ...goalExtras(savedGoal, data.contributionSources, growthRate), retirementAge: personalization.retirementAge }

  /** Readiness score: % of the retirement income goal covered by savings income plus Social Security */
  const computeScore = (contribPct: number, autoInc: boolean, riskLevel: string) =>
    retirementIncome(
      project(contribPct, autoInc ? { amount: data.autoIncreaseAmount, max: data.autoIncreaseMax } : null, getGrowthRate(riskLevel as RiskLevel)),
      yearsToRetirement,
      data.salary,
      { ...incomeExtras, growthRate: getGrowthRate(riskLevel as RiskLevel) },
    ).readinessPct

  const projectedBalance = project(data.contributionPercent, currentAutoIncrease, growthRate)
  const score = computeScore(data.contributionPercent, data.autoIncrease, data.riskLevel)

  // Annual Funding Summary: yearly income goal vs. projected yearly income, both in today's dollars
  const income = retirementIncome(projectedBalance, yearsToRetirement, data.salary, incomeExtras)

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`
    if (val >= 1_000) return `$${Math.round(val / 1_000).toLocaleString(locale)}K`
    return `$${Math.round(val).toLocaleString(locale)}`
  }

  const circumference = 2 * Math.PI * 70
  // Same bands as the dashboard: red under 50, amber 50 to 70, green above 70
  const scoreColor = score > 70 ? 'var(--status-success)' : score >= 50 ? 'var(--status-warning)' : 'var(--status-danger)'

  const getMessage = () => {
    if (score >= 80) return t('enrollment.readiness.score_message_80')
    if (score >= 60) return t('enrollment.readiness.score_message_60')
    if (score >= 40) return t('enrollment.readiness.score_message_40')
    return t('enrollment.readiness.score_message_low')
  }

  const candidates: Suggestion[] = []

  const boostPct = 2
  const boostedContrib = data.contributionPercent + boostPct
  if (boostedContrib <= 25 && !appliedChanges.includes('boost-contribution')) {
    const boostedAnnual = Math.round((data.salary * boostedContrib) / 100)
    const boostedMatch = annualEmployerMatch(data.salary, boostedContrib, data.contributionSources)
    const boostedScore = computeScore(boostedContrib, data.autoIncrease, data.riskLevel)
    const boostedBalance = project(boostedContrib, currentAutoIncrease, growthRate)
    const additionalPerYear = boostedAnnual + boostedMatch - annualContribution - employerContribution

    candidates.push({
      id: 'boost-contribution',
      icon: <Percent className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
      title: t('enrollment.readiness.suggest_boost_title', { pct: boostPct }),
      description: t('enrollment.readiness.suggest_boost_desc'),
      scoreIncrease: boostedScore - score,
      newScore: boostedScore,
      additionalAnnualSavings: additionalPerYear,
      projectedBalance: boostedBalance,
      currentLabel: t('enrollment.readiness.label_current_contrib'),
      currentValue: `${data.contributionPercent}%`,
      newLabel: t('enrollment.readiness.label_new_contrib'),
      newValue: `${boostedContrib}%`,
      apply: () => {
        updateData({ contributionPercent: boostedContrib })
      },
    })
  }

  if (!data.autoIncrease && !appliedChanges.includes('enable-auto-increase')) {
    const autoIncScore = computeScore(data.contributionPercent, true, data.riskLevel)
    const autoIncBalance = project(data.contributionPercent, { amount: data.autoIncreaseAmount, max: data.autoIncreaseMax }, growthRate)
    // Average extra saved per year (you plus any extra match) across the years to retirement
    let extraTotal = 0
    let autoRate = data.contributionPercent
    const autoCeiling = Math.max(data.autoIncreaseMax, data.contributionPercent)
    for (let y = 0; y < yearsToRetirement; y++) {
      extraTotal +=
        (data.salary * (autoRate - data.contributionPercent)) / 100 +
        annualEmployerMatch(data.salary, autoRate, data.contributionSources) -
        employerContribution
      autoRate = Math.min(autoRate + data.autoIncreaseAmount, autoCeiling)
    }
    const avgExtraContrib = yearsToRetirement > 0 ? Math.round(extraTotal / yearsToRetirement) : 0

    candidates.push({
      id: 'enable-auto-increase',
      icon: <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
      title: t('enrollment.readiness.suggest_auto_title'),
      description: t('enrollment.readiness.suggest_auto_desc', { amt: data.autoIncreaseAmount, max: data.autoIncreaseMax }),
      scoreIncrease: autoIncScore - score,
      newScore: autoIncScore,
      additionalAnnualSavings: avgExtraContrib,
      projectedBalance: autoIncBalance,
      currentLabel: t('enrollment.readiness.label_auto'),
      currentValue: t('enrollment.readiness.value_off'),
      newLabel: t('enrollment.readiness.label_new_auto'),
      newValue: t('enrollment.readiness.value_per_yr', { amt: data.autoIncreaseAmount }),
      apply: () => {
        updateData({ autoIncrease: true })
      },
    })
  }

  const growthUpgrade: Record<string, string> = {
    conservative: 'balanced',
    balanced: 'growth',
  }
  const nextRiskLevel = growthUpgrade[data.riskLevel]
  if (nextRiskLevel && !appliedChanges.includes('upgrade-strategy')) {
    const nextRate = getGrowthRate(nextRiskLevel as RiskLevel)
    const upgradeScore = computeScore(data.contributionPercent, data.autoIncrease, nextRiskLevel)
    const upgradeBalance = project(data.contributionPercent, currentAutoIncrease, nextRate)
    // Switching investments doesn't change what you save each year; only the balance grows differently
    const extraBalancePerYear = 0

    candidates.push({
      id: 'upgrade-strategy',
      icon: <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
      title: t('enrollment.readiness.suggest_upgrade_title'),
      description: t('enrollment.readiness.suggest_upgrade_desc', {
        from: t(`enrollment.review_page.risk_${data.riskLevel}`),
        to: t(`enrollment.review_page.risk_${nextRiskLevel}`),
      }),
      scoreIncrease: upgradeScore - score,
      newScore: upgradeScore,
      additionalAnnualSavings: extraBalancePerYear > 0 ? extraBalancePerYear : 0,
      projectedBalance: upgradeBalance,
      currentLabel: t('enrollment.readiness.label_current_strategy'),
      currentValue: t(`enrollment.review_page.risk_${data.riskLevel}`),
      newLabel: t('enrollment.readiness.label_new_strategy'),
      newValue: t(`enrollment.review_page.risk_${nextRiskLevel}`),
      apply: () => {
        updateData({ riskLevel: nextRiskLevel as 'conservative' | 'balanced' | 'growth' | 'aggressive' })
      },
    })
  }

  // Only suggestions that would actually raise the score are offered, biggest gain first
  const suggestions = candidates.filter((c) => c.newScore > score).sort((a, b) => b.scoreIncrease - a.scoreIncrease)
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
    setSuccessMessage(true)
    setTimeout(() => setSuccessMessage(false), 3000)
  }

  const handleNext = useCallback(() => {
    advanceStep({ score, acknowledgedAt: Date.now() }, 'readiness')
    navigate('/enrollment/review')
  }, [advanceStep, score, navigate])

  useEffect(() => {
    setStepNav({
      showBack: true,
      onBack: () => navigate('/enrollment/investment'),
      onNext: handleNext,
      primaryLabel: t('enrollment.next') as EnrollmentPrimaryLabel,
    })
    return () => setStepNav(null)
  }, [setStepNav, navigate, handleNext, t])

  return (
    <div className="mx-auto max-w-[1040px]">
      <StepHeader className="mb-5" title={t('enrollment.readiness.title')} subtitle={t('enrollment.readiness.subtitle')} />

      <div className="grid items-start gap-5 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-4">
          {/* Score, then the projected balance under one rule */}
          <Card tone="blue">
            <div className="flex flex-col items-center">
              <AnimatedScore value={score} color={scoreColor} circumference={circumference} />

              <p className={cn('mt-4 text-center text-lg font-bold', HEADING)}>{getMessage()}</p>
              <p className={cn('mt-1 text-center text-sm', BODY_TEXT)}>
                {t('enrollment.readiness.on_track_line', { onTrack: t('enrollment.readiness.on_track_em', { score: income.goalPct }) })}
              </p>
              <p className={cn('mt-1 text-center text-xs', MUTED_TEXT)}>{t('enrollment.readiness.peer_benchmark')}</p>

              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div className="h-full rounded-full bg-slate-500 dark:bg-slate-300" style={{ width: '65%' }} />
                </div>
                <span className={cn('text-xs font-medium', MUTED_TEXT)}>
                  {t('enrollment.readiness.target')} <span className="font-semibold">100%</span>
                </span>
              </div>
            </div>

            <div className={cn('mt-5 border-t pt-5 text-center', RULE)}>
              <p className={cn('flex items-center justify-center gap-1.5', SECTION_LABEL)}>
                <Globe className="h-3.5 w-3.5" aria-hidden />
                {t('enrollment.readiness.projected_balance_label')}
              </p>
              <p className={cn('mt-1 text-[32px] font-extrabold leading-none tabular-nums', HEADING)}>{formatCurrency(projectedBalance)}</p>
              <p className={cn('mt-1.5 text-xs', MUTED_TEXT)}>{t('enrollment.readiness.at_age', { age: personalization.retirementAge })}</p>
            </div>
          </Card>

          {/* Understanding Your Score and the yearly figures behind it, in one card */}
          <Card>
            <div className="flex items-start gap-3">
              <IconChip Icon={Info} tone="blue" />
              <div className="min-w-0">
                <h2 className={CARD_TITLE}>{t('enrollment.readiness.understanding_title')}</h2>
                <p className={cn('mt-1 text-[13px] leading-relaxed', BODY_TEXT)}>{t('enrollment.readiness.understanding_body', { score })}</p>
              </div>
            </div>
            <h3 className={cn('mt-4 border-t pt-4 text-[14px] font-bold', RULE, HEADING)}>{t('enrollment.readiness.annual_summary_title')}</h3>
            <dl className="mt-3 space-y-2.5">
              {[
                { dot: 'bg-slate-400', label: t('enrollment.readiness.income_goal'), value: income.goal, color: HEADING },
                { dot: 'bg-[var(--chart-blue)]', label: t('enrollment.readiness.current_annual'), value: income.total, color: 'text-primary dark:text-blue-300' },
                { dot: 'bg-rose-500', label: t('enrollment.readiness.savings_gap'), value: income.gap, color: 'text-rose-600 dark:text-rose-400' },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between gap-3">
                  <dt className={cn('flex items-center gap-2 text-[13px]', BODY_TEXT)}>
                    <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', row.dot)} aria-hidden />
                    {row.label}
                  </dt>
                  <dd className={cn('text-sm font-bold tabular-nums', row.color)}>${row.value.toLocaleString(locale)}</dd>
                </div>
              ))}
            </dl>
            <p className={cn('mt-3 border-t pt-3 text-xs leading-relaxed', RULE, MUTED_TEXT)}>{t('enrollment.readiness.annual_footnote')}</p>
          </Card>

          {successMessage && (
            <div className={cn(card('green', false), 'flex items-center gap-3 px-5 py-3.5')} style={{ animation: 'fadeSlideIn 0.4s ease' }}>
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <p className={cn('text-sm font-semibold', HEADING)}>{t('enrollment.readiness.success_applied')}</p>
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-4">
          {suggestions.length > 0 && totalPotentialIncrease > 0 && (
            <Card tone="sky">
              {/* Heading and score side by side on one line; the score pill never breaks, and on a narrow card it moves under the heading instead of covering it */}
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <div className="flex min-w-0 items-center gap-2">
                  <TitleBadge Icon={Sparkles} />
                  <p className={cn(CARD_TITLE, 'whitespace-nowrap text-[15px]')}>{t('enrollment.readiness.reco_title')}</p>
                </div>
                <span className={cn(badge('blue'), 'shrink-0 whitespace-nowrap')}>{t('enrollment.readiness.reco_score', { score: potentialScore })}</span>
              </div>
              <p className={cn('mt-3 text-[13px] leading-relaxed', BODY_TEXT)}>{t('enrollment.readiness.reco_body', { potentialScore, points: totalPotentialIncrease })}</p>
            </Card>
          )}

          {suggestions.length > 0 && (
            <div>
              <div className="mb-3">
                <h2 className={CARD_TITLE}>{t('enrollment.readiness.optional_title')}</h2>
                <p className={cn('mt-1 text-xs', MUTED_TEXT)}>{t('enrollment.readiness.optional_sub')}</p>
              </div>

              <div className="space-y-3">
                {suggestions.map((suggestion, index) => {
                  const isRecommended = index === 0
                  return (
                    <div key={suggestion.id} className={cn(card(isRecommended ? 'selected' : 'plain', false), 'p-5')}>
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 ring-1 ring-blue-100 dark:bg-blue-500/15 dark:ring-blue-400/20" aria-hidden>
                          {suggestion.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={cn('text-sm font-bold', HEADING)}>{suggestion.title}</p>
                          <p className={cn('mt-0.5 text-xs leading-normal', BODY_TEXT)}>{suggestion.description}</p>
                        </div>
                      </div>

                      {/* Score, savings and balance as three figures between two rules */}
                      <dl className={cn('mt-3 grid grid-cols-3 divide-x border-y py-2.5', RULE, 'divide-slate-200/80 dark:divide-white/10')}>
                        <div className="pr-3">
                          <dt className={cn('text-[11px]', MUTED_TEXT)}>{t('enrollment.readiness.score_col')}</dt>
                          <dd className="mt-0.5 flex items-center gap-1">
                            <span className={cn('text-sm font-semibold tabular-nums', MUTED_TEXT)}>{score}</span>
                            <ArrowRight className="h-3 w-3 text-slate-400" aria-hidden />
                            <span className="text-sm font-bold tabular-nums text-primary dark:text-blue-300">{suggestion.newScore}</span>
                          </dd>
                        </div>
                        <div className="px-3">
                          <dt className={cn('text-[11px]', MUTED_TEXT)}>{t('enrollment.readiness.savings_col')}</dt>
                          <dd className="mt-0.5 text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {suggestion.additionalAnnualSavings > 0
                              ? t('enrollment.readiness.savings_yr', { amount: suggestion.additionalAnnualSavings.toLocaleString(locale) })
                              : '—'}
                          </dd>
                        </div>
                        <div className="pl-3">
                          <dt className={cn('text-[11px]', MUTED_TEXT)}>{t('enrollment.readiness.balance_col')}</dt>
                          <dd className={cn('mt-0.5 text-sm font-bold tabular-nums', HEADING)}>{formatCurrency(suggestion.projectedBalance)}</dd>
                        </div>
                      </dl>

                      <button type="button" onClick={() => handleOpenConfirm(suggestion)} className={cn(isRecommended ? PILL_PRIMARY : PILL_SECONDARY, 'mt-3 h-10 w-full')}>
                        {t('enrollment.readiness.apply_reco')}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {suggestions.length === 0 && (
            <Card className="text-center">
              <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <p className={cn('text-sm font-bold', HEADING)}>{t(appliedChanges.length > 0 ? 'enrollment.readiness.all_applied_title' : 'enrollment.readiness.no_tips_title')}</p>
              <p className={cn('mt-0.5 text-xs', BODY_TEXT)}>{t(appliedChanges.length > 0 ? 'enrollment.readiness.all_applied_sub' : 'enrollment.readiness.no_tips_sub')}</p>
            </Card>
          )}
        </div>
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
