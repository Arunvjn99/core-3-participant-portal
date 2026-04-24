import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { TrendingUp, ArrowUpRight, BarChart3 } from 'lucide-react'
import { getAppDateLocale } from '@/lib/dateLocale'

function PortfolioSnapshot() {
  const { t, i18n } = useTranslation()
  const totalBalance = 287450.82
  const totalInvested = 239220.0
  const totalGain = totalBalance - totalInvested
  const gainPercent = ((totalGain / totalInvested) * 100).toFixed(1)
  const annualReturn = 12.4
  const spComparison = 1.2

  const asOf = useMemo(() => {
    const d = new Date(2026, 2, 16)
    return d.toLocaleDateString(getAppDateLocale(), { month: 'long', day: 'numeric', year: 'numeric' })
  }, [i18n.language])

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="p-5 pb-5 sm:p-7">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50">
            <BarChart3 className="h-[18px] w-[18px] text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-900 dark:text-white" style={{ fontWeight: 500 }}>
              {t('investments.snapshot_title')}
            </p>
            <p className="text-[11px] text-gray-400">{t('investments.snapshot_as_of', { date: asOf })}</p>
          </div>
        </div>

        <div className="mb-5">
          <p className="mb-1 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400" style={{ fontWeight: 500 }}>
            {t('investments.snapshot_total_balance')}
          </p>
          <div className="flex flex-wrap items-baseline gap-3">
            <p className="text-4xl tracking-tight text-gray-900 dark:text-white sm:text-5xl" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
              ${Math.floor(totalBalance).toLocaleString()}
              <span className="text-xl text-gray-300 dark:text-gray-600" style={{ fontWeight: 400 }}>
                .{(totalBalance % 1).toFixed(2).slice(2)}
              </span>
            </p>
            <span
              className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"
              style={{ fontWeight: 500 }}
            >
              <TrendingUp className="h-3 w-3" />
              {t('investments.snapshot_ytd', { pct: annualReturn })}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard
            label={t('investments.snapshot_invested')}
            value={`$${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
            detail={t('investments.snapshot_invested_detail')}
            color="text-gray-900 dark:text-white"
          />
          <MetricCard
            label={t('investments.snapshot_gain')}
            value={`+$${totalGain.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            detail={t('investments.snapshot_gain_detail', { pct: gainPercent })}
            color="text-emerald-600"
            positive
          />
          <MetricCard
            label={t('investments.snapshot_annual_return')}
            value={`+${annualReturn}%`}
            detail={t('investments.snapshot_since')}
            color="text-emerald-600"
            positive
          />
          <MetricCard
            label={t('investments.snapshot_vs_sp')}
            value={`+${spComparison}%`}
            detail={t('investments.snapshot_vs_sp_detail')}
            color="text-blue-600"
            positive
          />
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  detail,
  color,
  positive,
}: {
  label: string
  value: string
  detail: string
  color: string
  positive?: boolean
}) {
  return (
    <div className="rounded-xl bg-gray-50/80 p-3.5 dark:bg-gray-800">
      <p className="mb-1.5 text-[11px] text-gray-500 dark:text-gray-400">{label}</p>
      <div className="flex items-center gap-1">
        {positive && <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-emerald-500" />}
        <p className={`text-base tracking-tight sm:text-lg ${color}`} style={{ fontWeight: 600 }}>
          {value}
        </p>
      </div>
      <p className="mt-0.5 text-[10px] text-gray-400 dark:text-gray-500">{detail}</p>
    </div>
  )
}

export default PortfolioSnapshot
