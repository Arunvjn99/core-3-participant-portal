import { useNavigate } from 'react-router-dom'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentDraftStore } from '@/core/store/enrollmentDraftStore'
import { useEnrollmentSave } from '@/core/hooks/useEnrollmentSave'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { Edit3, Shield, DollarSign, Briefcase, TrendingUp, Clock, Sparkles, ExternalLink } from 'lucide-react'

export default function ReviewEnrollment() {
  const navigate = useNavigate()
  const { data, updateData, personalization } = useEnrollment()
  const { advanceStep } = useEnrollmentDraftStore()
  const { saveCompleteEnrollment } = useEnrollmentSave()

  const yearsToRetirement = personalization.retirementAge - personalization.currentAge
  const matchPercent = Math.min(data.contributionPercent, 6)
  const annualContribution = Math.round((data.salary * data.contributionPercent) / 100)
  const employerContribution = Math.round((data.salary * matchPercent) / 100)
  const totalAnnual = annualContribution + employerContribution

  const growthRates: Record<string, number> = { conservative: 0.045, balanced: 0.068, growth: 0.082, aggressive: 0.095 }
  const growthRate = growthRates[data.riskLevel] || 0.068

  let projectedBalance = personalization.currentSavings
  for (let i = 0; i < yearsToRetirement; i++) {
    projectedBalance = (projectedBalance + totalAnnual) * (1 + growthRate)
  }

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`
    if (val >= 1_000) return `$${Math.round(val / 1_000).toLocaleString()}K`
    return `$${Math.round(val).toLocaleString()}`
  }

  const riskLabels: Record<string, string> = {
    conservative: 'Conservative',
    balanced: 'Balanced',
    growth: 'Growth',
    aggressive: 'Aggressive',
  }

  const sourcesParts: string[] = []
  if (data.contributionSources.preTax > 0) sourcesParts.push(`Pre-tax ${data.contributionSources.preTax}%`)
  if (data.contributionSources.roth > 0) sourcesParts.push(`Roth ${data.contributionSources.roth}%`)
  if (data.supportsAfterTax && data.contributionSources.afterTax > 0) sourcesParts.push(`After-tax ${data.contributionSources.afterTax}%`)
  const sourcesDisplay = sourcesParts.join(' / ')

  const planSections = [
    {
      label: 'Plan',
      value:
        data.plan === 'traditional' ? 'Traditional 401(k)' : data.plan === 'roth' ? 'Roth 401(k)' : '—',
      editStep: 1,
      editPath: '/enrollment/plan',
    },
    { label: 'Contribution', value: `${data.contributionPercent}% ($${annualContribution.toLocaleString()}/year)`, editStep: 2, editPath: '/enrollment/contribution' },
    { label: 'Contribution source', value: sourcesDisplay || 'Pre-tax 100%', editStep: 3, editPath: '/enrollment/contribution-source' },
    {
      label: 'Auto increase',
      value: data.autoIncrease ? `+${data.autoIncreaseAmount}%/yr up to ${data.autoIncreaseMax}%` : 'Disabled',
      editStep: 4,
      editPath: '/enrollment/auto-increase',
    },
    { label: 'Investment strategy', value: `${riskLabels[data.riskLevel]} Portfolio`, editStep: 5, editPath: '/enrollment/investment' },
  ]

  const handleConfirm = async () => {
    advanceStep({ confirmedAt: Date.now(), agreed: true }, 'review')
    await saveCompleteEnrollment()
    navigate('/enrollment/success')
  }

  const confidenceMessage =
    employerContribution >= annualContribution * 0.5
      ? `Your employer contributes $${employerContribution.toLocaleString()} per year to your retirement savings.`
      : `You are on track for retirement at age ${personalization.retirementAge} with your current plan setup.`

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-5xl space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-gray-900 dark:text-white">Review Your Retirement Plan</h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400" style={{ fontSize: '0.9rem' }}>
            Confirm your selections before enrolling.
          </p>
        </div>

        {/* Hero — blue gradient */}
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white">
          <p className="text-blue-200" style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Projected retirement balance
          </p>
          <p className="mt-1 tabular-nums" style={{ fontSize: '2.6rem', fontWeight: 700 }}>
            {formatCurrency(projectedBalance)}
          </p>
          <p className="mt-0.5 text-blue-200" style={{ fontSize: '0.75rem' }}>
            Based on your current plan setup over {yearsToRetirement} years. Past results do not guarantee future returns.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { Icon: DollarSign, label: 'Your contribution', value: `$${annualContribution.toLocaleString()}`, sub: 'per year' },
              { Icon: Briefcase, label: 'Employer match', value: `$${employerContribution.toLocaleString()}`, sub: 'per year' },
              {
                Icon: TrendingUp,
                label: 'Expected growth',
                value: `~${(growthRate * 100).toFixed(1)}%`,
                sub: `annual (${riskLabels[data.riskLevel].toLowerCase()})`,
              },
              { Icon: Clock, label: 'Time horizon', value: `${yearsToRetirement} years`, sub: `retire at age ${personalization.retirementAge}` },
            ].map(({ Icon, label, value, sub }) => (
              <div key={label} className="rounded-xl bg-white/10 px-3.5 py-3 backdrop-blur-sm">
                <div className="mb-1 flex items-center gap-1.5">
                  <Icon className="h-3 w-3 text-blue-200" />
                  <span className="text-blue-200" style={{ fontSize: '0.62rem', fontWeight: 500 }}>
                    {label}
                  </span>
                </div>
                <p style={{ fontSize: '1.05rem', fontWeight: 700 }}>{value}</p>
                <p className="text-blue-200" style={{ fontSize: '0.6rem' }}>
                  {sub}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Plan Summary Grid */}
        <div>
          <p className="mb-3 text-gray-900 dark:text-white" style={{ fontSize: '0.95rem', fontWeight: 600 }}>
            Your Plan Setup
          </p>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3">
            {planSections.map((section) => (
              <div
                key={section.label}
                className="group flex flex-col justify-between rounded-xl border border-gray-200 bg-white px-4 py-3.5 dark:border-gray-700 dark:bg-gray-900"
              >
                <div>
                  <p className="text-gray-400 dark:text-gray-500" style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {section.label}
                  </p>
                  <p className="mt-1 text-gray-900 dark:text-white" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
                    {section.value}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(section.editPath)}
                  className="mt-2.5 flex items-center gap-1 self-start text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  style={{ fontSize: '0.7rem', fontWeight: 500 }}
                >
                  <Edit3 className="h-3 w-3" /> Edit
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Confidence Banner */}
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5 dark:border-amber-800/40 dark:bg-amber-950/30">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          <p className="text-amber-800 dark:text-amber-400" style={{ fontSize: '0.82rem', fontWeight: 500 }}>
            {confidenceMessage}
          </p>
        </div>

        {/* Terms Checkbox */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <label className="flex cursor-pointer items-start gap-3">
            <div className="mt-0.5">
              <input
                type="checkbox"
                checked={data.agreedToTerms}
                onChange={(e) => updateData({ agreedToTerms: e.target.checked })}
                className="h-5 w-5 rounded border-gray-300 text-blue-600 accent-blue-600"
              />
            </div>
            <span className="text-gray-700 dark:text-gray-300" style={{ fontSize: '0.82rem' }}>
              I confirm my retirement plan enrollment and understand my contributions will begin next pay period.{' '}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="inline-flex items-center gap-0.5 text-blue-600 hover:text-blue-700 dark:text-blue-400"
                style={{ fontWeight: 500 }}
              >
                View full plan terms <ExternalLink className="h-3 w-3" />
              </a>
            </span>
          </label>
        </div>

        {/* Submit */}
        <div className="sticky bottom-4 md:static">
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={!data.agreedToTerms}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-8 py-3.5 shadow-lg transition-all md:shadow-none ${
              data.agreedToTerms
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]'
                : 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-800'
            }`}
          >
            <Shield className="h-4 w-4" /> Enroll in Retirement Plan
          </button>
        </div>
      </div>
    </AnimatedPage>
  )
}
