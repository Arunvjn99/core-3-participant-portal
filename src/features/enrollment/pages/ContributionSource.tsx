import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEnrollment } from '@/core/hooks/useEnrollment'
import { useEnrollmentStepNav, type EnrollmentPrimaryLabel } from '@/features/enrollment/components/EnrollmentStepNavContext'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { getAppDateLocale } from '@/lib/dateLocale'
import { cn } from '@/lib/cn'
import {
  Wallet,
  TrendingUp,
  Shield,
  DollarSign,
  Check,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

export default function ContributionSource() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const navigate = useNavigate()
  const { setStepNav } = useEnrollmentStepNav()
  const { data, updateData, advanceStep } = useEnrollment()
  const [showAdvanced, setShowAdvanced] = useState(data.contributionSources.afterTax > 0)

  const sources = data.contributionSources
  const salary = data.salary
  const percent = data.contributionPercent
  const monthlyTotal = Math.round((salary * percent) / 100 / 12)
  const monthlyPreTax = Math.round(monthlyTotal * sources.preTax / 100)
  const monthlyRoth = Math.round(monthlyTotal * sources.roth / 100)
  const monthlyAfterTax = Math.round(monthlyTotal * sources.afterTax / 100)

  // Plan's own default split — the "Reset" link restores this.
  const planDefault = { preTax: 60, roth: 40, afterTax: 0 }

  const handlePreTaxChange = (value: number) => {
    const newPreTax = Math.min(100, Math.max(0, value))
    const remaining = 100 - newPreTax
    const total = sources.roth + sources.afterTax
    if (total > 0) {
      updateData({
        contributionSources: {
          preTax: newPreTax,
          roth: Math.round((remaining * sources.roth) / total),
          afterTax: Math.round((remaining * sources.afterTax) / total),
        },
      })
    } else {
      updateData({ contributionSources: { preTax: newPreTax, roth: remaining, afterTax: 0 } })
    }
  }

  const handleRothChange = (value: number) => {
    const newRoth = Math.min(100, Math.max(0, value))
    const remaining = 100 - newRoth
    const total = sources.preTax + sources.afterTax
    if (total > 0) {
      updateData({
        contributionSources: {
          preTax: Math.round((remaining * sources.preTax) / total),
          roth: newRoth,
          afterTax: Math.round((remaining * sources.afterTax) / total),
        },
      })
    } else {
      updateData({ contributionSources: { preTax: remaining, roth: newRoth, afterTax: 0 } })
    }
  }

  const handleAfterTaxChange = (value: number) => {
    const newAfterTax = Math.min(100, Math.max(0, value))
    const remaining = 100 - newAfterTax
    const total = sources.preTax + sources.roth
    if (total > 0) {
      updateData({
        contributionSources: {
          preTax: Math.round((remaining * sources.preTax) / total),
          roth: Math.round((remaining * sources.roth) / total),
          afterTax: newAfterTax,
        },
      })
    } else {
      updateData({ contributionSources: { preTax: remaining, roth: 0, afterTax: newAfterTax } })
    }
  }

  const total = sources.preTax + sources.roth + sources.afterTax

  useEffect(() => {
    setStepNav({
      showBack: true,
      onBack: () => navigate('/enrollment/contribution'),
      onNext: () => {
        advanceStep(
          {
            preTax: sources.preTax,
            roth: sources.roth,
            afterTax: sources.afterTax,
          },
          'source'
        )
        navigate('/enrollment/auto-increase')
      },
      primaryLabel: t('enrollment.next') as EnrollmentPrimaryLabel,
      nextDisabled: total !== 100,
    })
    return () => setStepNav(null)
  }, [setStepNav, navigate, advanceStep, sources.preTax, sources.roth, sources.afterTax, total, t])

  return (
    <AnimatedPage>
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
              {t('enrollment.source_page.title')}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 sm:text-base">{t('enrollment.source_page.subtitle')}</p>
          </div>
          <div className="inline-flex shrink-0 items-center gap-3 rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-3 dark:border-blue-800/40 dark:from-blue-950/30 dark:to-blue-900/20">
            <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-bold text-blue-900 dark:text-blue-300">
              {t('enrollment.source_page.banner', {
                pct: percent,
                amount: monthlyTotal.toLocaleString(locale),
              })}
            </p>
          </div>
        </div>

        {/* Single column: one allocation control, nothing else.
            Plan-Default tile, Monthly-Impact sidebar with match figures,
            Recommended score and Customize-portfolio button all moved off
            this step. */}
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-5 shadow-lg dark:border-gray-700 dark:bg-gray-900 sm:p-6">
            <div className="flex min-w-0 flex-1 flex-col space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('enrollment.source_page.your_tax_strategy')}</h3>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{t('enrollment.source_page.total_allocation')}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    updateData({
                      contributionSources: { preTax: planDefault.preTax, roth: planDefault.roth, afterTax: planDefault.afterTax },
                      useRecommendedPortfolio: true,
                    })
                    setShowAdvanced(false)
                  }}
                  className="shrink-0 text-xs font-medium text-blue-600 underline-offset-2 hover:underline dark:text-blue-400"
                >
                  {t('enrollment.source_page.reset_default')}
                </button>
              </div>

              <div className="space-y-2">
                <div className="flex h-4 overflow-hidden rounded-full border border-gray-200 shadow-sm dark:border-gray-700">
                  {sources.preTax > 0 && (
                    <div className="brand-bg transition-all duration-300" style={{ width: `${sources.preTax}%` }} />
                  )}
                  {sources.roth > 0 && (
                    <div className="bg-purple-600 transition-all duration-300" style={{ width: `${sources.roth}%` }} />
                  )}
                  {sources.afterTax > 0 && (
                    <div className="bg-orange-600 transition-all duration-300" style={{ width: `${sources.afterTax}%` }} />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="brand-bg h-2 w-2 rounded-full" />
                    <span className="text-gray-500 dark:text-gray-400">
                      {sources.preTax}% {t('enrollment.source_page.pre_tax')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full bg-purple-600" />
                    <span className="text-gray-500 dark:text-gray-400">
                      {sources.roth}% {t('enrollment.source_page.roth')}
                    </span>
                  </div>
                  {sources.afterTax > 0 && (
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full bg-orange-600" />
                      <span className="text-gray-500 dark:text-gray-400">
                        {sources.afterTax}% {t('enrollment.source_page.after_tax')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="brand-bg h-3 w-3 rounded-full" />
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('enrollment.source_page.pre_tax')}</p>
                      </div>
                      <p className="ml-5 text-xs text-gray-500 dark:text-gray-400">{t('enrollment.source_page.pre_tax_hint')}</p>
                    </div>
                    <p className="text-xl font-extrabold text-blue-700 dark:text-blue-400">{sources.preTax}%</p>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sources.preTax}
                    onChange={(e) => handlePreTaxChange(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full"
                    style={{
                      background: `linear-gradient(to right, var(--chart-blue) 0%, var(--chart-blue) ${sources.preTax}%, var(--slider-track) ${sources.preTax}%, var(--slider-track) 100%)`,
                    }}
                  />
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>0%</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      ${monthlyPreTax.toLocaleString(locale)}/mo
                    </span>
                    <span>100%</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-purple-600" />
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('enrollment.source_page.roth')}</p>
                      </div>
                      <p className="ml-5 text-xs text-gray-500 dark:text-gray-400">{t('enrollment.source_page.roth_hint')}</p>
                    </div>
                    <p className="text-xl font-extrabold text-purple-700 dark:text-purple-400">{sources.roth}%</p>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={sources.roth}
                    onChange={(e) => handleRothChange(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-full"
                    style={{
                      background: `linear-gradient(to right, var(--accent-purple) 0%, var(--accent-purple) ${sources.roth}%, var(--slider-track) ${sources.roth}%, var(--slider-track) 100%)`,
                    }}
                  />
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>0%</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      ${monthlyRoth.toLocaleString(locale)}/mo
                    </span>
                    <span>100%</span>
                  </div>
                </div>

                {showAdvanced && (
                  <div className="space-y-2 border-t border-gray-100 pt-4 dark:border-gray-800">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="rounded border border-orange-200 bg-orange-50 px-2 py-0.5 dark:border-orange-800/40 dark:bg-orange-950/30">
                        <p className="text-xs font-bold uppercase text-orange-700 dark:text-orange-400">
                          {t('enrollment.source_page.advanced')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="h-3 w-3 rounded-full bg-orange-600" />
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('enrollment.source_page.after_tax')}</p>
                        </div>
                        <p className="ml-5 text-xs text-gray-500 dark:text-gray-400">{t('enrollment.source_page.after_tax_hint')}</p>
                      </div>
                      <p className="text-xl font-extrabold text-orange-700 dark:text-orange-400">{sources.afterTax}%</p>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={sources.afterTax}
                      onChange={(e) => handleAfterTaxChange(Number(e.target.value))}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full"
                      style={{
                        background: `linear-gradient(to right, var(--chart-amber) 0%, var(--chart-amber) ${sources.afterTax}%, var(--slider-track) ${sources.afterTax}%, var(--slider-track) 100%)`,
                      }}
                    />
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>0%</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        ${monthlyAfterTax.toLocaleString(locale)}/mo
                      </span>
                      <span>100%</span>
                    </div>
                  </div>
                )}
              </div>

              {!showAdvanced ? (
                <button
                  type="button"
                  onClick={() => setShowAdvanced(true)}
                  className="flex items-center gap-1.5 self-start text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <ChevronDown className="h-4 w-4" /> {t('enrollment.source_page.show_advanced')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowAdvanced(false)
                    if (sources.afterTax > 0) {
                      updateData({
                        contributionSources: {
                          preTax: sources.preTax + sources.afterTax,
                          roth: sources.roth,
                          afterTax: 0,
                        },
                      })
                    }
                  }}
                  className="flex items-center gap-1.5 self-start text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <ChevronUp className="h-4 w-4" /> {t('enrollment.source_page.hide_advanced')}
                </button>
              )}

              <a
                href="#understand-the-difference"
                className="self-start text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {t('enrollment.source_page.whats_difference')}
              </a>
            </div>
          {/* Recommended-for-You score, Customize-portfolio button, and the
              per-month Impact sidebar with match figures moved off this step. */}
        </div>

        <div id="understand-the-difference" className="space-y-3 opacity-90 scroll-mt-20">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('enrollment.source_page.understanding_title')}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                {
                  bg: 'from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/10',
                  border: 'border-blue-200 dark:border-blue-800/40',
                  icon: <TrendingUp className="h-4 w-4 text-white" />,
                  iconBg: 'brand-bg',
                  checkColor: 'text-blue-600',
                  titleKey: 'card_pre_title' as const,
                  pointKeys: ['card_pre_p1', 'card_pre_p2', 'card_pre_p3'] as const,
                },
                {
                  bg: 'from-purple-50 to-purple-100/50 dark:from-purple-950/30 dark:to-purple-900/10',
                  border: 'border-purple-200 dark:border-purple-800/40',
                  icon: <Shield className="h-4 w-4 text-white" />,
                  iconBg: 'bg-purple-600',
                  checkColor: 'text-purple-600',
                  titleKey: 'card_roth_title' as const,
                  pointKeys: ['card_roth_p1', 'card_roth_p2', 'card_roth_p3'] as const,
                },
                {
                  bg: 'from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/10',
                  border: 'border-orange-200 dark:border-orange-800/40',
                  icon: <DollarSign className="h-4 w-4 text-white" />,
                  iconBg: 'bg-orange-600',
                  checkColor: 'text-orange-600',
                  titleKey: 'card_after_title' as const,
                  pointKeys: ['card_after_p1', 'card_after_p2', 'card_after_p3'] as const,
                },
              ] as const
            ).map(({ bg, border, icon, iconBg, checkColor, titleKey, pointKeys }) => (
              <div key={titleKey} className={cn('rounded-xl border bg-gradient-to-br p-4 sm:col-span-1', bg, border)}>
                <div className="mb-3 flex items-center gap-2.5">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', iconBg)}>{icon}</div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t(`enrollment.source_page.${titleKey}`)}</h3>
                </div>
                <div className="space-y-1.5">
                  {pointKeys.map((pk) => (
                    <div key={pk} className="flex items-start gap-2">
                      <Check className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', checkColor)} />
                      <p className="text-xs text-gray-700 dark:text-gray-300">{t(`enrollment.source_page.${pk}`)}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
