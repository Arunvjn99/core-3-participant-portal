import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Gauge, Info, Sparkles } from 'lucide-react'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useContributionLimits } from './useContributionLimits'

export function ContributionLimitsCard() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const r = useContributionLimits()
  const money = (v: number) => `$${Math.round(v).toLocaleString(locale)}`

  const status = r.reachesLimit
    ? t('contributionLimits.status_reaches')
    : t('contributionLimits.status_projected', { amount: money(r.projectedYearEnd), unused: money(r.employeeLimit - r.projectedYearEnd) })

  return (
    <div className="rounded-[12px] border border-border-default bg-surface-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-[14px] font-bold text-text-primary">
            {t('contributionLimits.title', { year: r.year })}
          </span>
        </div>
        <Link to="/enrollment/contribution" className="text-[12px] font-semibold text-primary hover:underline">
          {t('contributionLimits.change')}
        </Link>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            {t('contributionLimits.remaining')}
          </p>
          <p className="mt-1 text-[28px] font-bold leading-none text-text-primary">{money(r.remaining)}</p>
        </div>
        <p className="text-[12px] text-text-secondary">
          {t(r.ytdIsEstimate ? 'contributionLimits.contributed_est' : 'contributionLimits.contributed', {
            ytd: money(r.ytdEmployee),
            limit: money(r.employeeLimit),
          })}
        </p>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-elevated"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(r.percentUsed)}
        aria-label={t('contributionLimits.title', { year: r.year })}
      >
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${r.percentUsed}%` }} />
      </div>

      <p className="mt-3 text-[12px] leading-relaxed text-text-secondary">{status}</p>
      {r.percentToMax !== null && r.perPaycheckToMax !== null && !r.reachesLimit && (
        <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">
          {t('contributionLimits.to_max', { pct: r.percentToMax, amount: money(r.perPaycheckToMax) })}
        </p>
      )}

      {r.catchUp > 0 && (
        <p className="mt-3 text-[11px] text-text-muted">
          {t('contributionLimits.catchup_note', { base: money(r.baseLimit), catchUp: money(r.catchUp) })}
        </p>
      )}

      {r.match.gapPercent > 0 && (
        <div className="mt-4 flex gap-3 rounded-[12px] border border-status-warning/30 bg-status-warning-bg p-3.5">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-text-primary">
              {t('contributionLimits.match_title', { amount: money(r.match.missedAnnual) })}
            </p>
            <p className="mt-0.5 text-[12px] text-text-secondary">
              {t('contributionLimits.match_body', { pct: r.match.capPercent })}
            </p>
            <Link
              to="/enrollment/contribution"
              className="mt-2 inline-block text-[12px] font-semibold text-primary hover:underline"
            >
              {t('contributionLimits.match_cta', { pct: r.match.capPercent })}
            </Link>
          </div>
        </div>
      )}

      <div className="mt-4 flex items-start gap-1.5 border-t border-border-default pt-3 text-[11px] text-text-muted">
        <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
        <span>
          {t('contributionLimits.combined', {
            remaining: money(r.combined.remaining),
            limit: money(r.combined.limit),
          })}
        </span>
      </div>
    </div>
  )
}

export default ContributionLimitsCard
