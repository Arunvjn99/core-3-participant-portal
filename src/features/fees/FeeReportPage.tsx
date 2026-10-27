import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Download, Info } from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { getAppDateLocale } from '@/lib/dateLocale'
import { buildPdf, downloadBlob } from '@/features/documents/pdf'
import { ADMIN_FEES } from './feeSchedule'
import { useFeeReport } from './useFeeReport'

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[12px] border border-border-default bg-surface-card p-5 shadow-card ${className}`}>{children}</div>
}

export default function FeeReportPage() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const { year, balance, report: r } = useFeeReport()

  const money = (v: number, digits = 0) =>
    `$${v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })}`
  const pct = (v: number, digits = 2) => `${v.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits })}%`
  const fmtDate = (ms: number) => new Date(ms).toLocaleDateString(locale, { month: 'short', day: 'numeric' })

  const handleDownload = () => {
    const lines = [
      `${t('fees.pdf.balance')}: ${money(balance, 2)}`,
      `${t('fees.total_label')}: ${money(r.totalAnnual, 2)} (${pct(r.effectivePct, 3)})`,
      `${t('fees.investment_title')}: ${money(r.investmentFees, 2)}`,
      `${t('fees.admin_assets')} (${pct(ADMIN_FEES.assetBasedPct)}): ${money(r.adminAssetFee, 2)}`,
      `${t('fees.admin_flat')}: ${money(r.adminFlatFee, 2)}`,
      ...r.funds.map((f) => `${f.name} (${f.ticker}): ${pct(f.expenseRatioPct)} = ${money(f.annualCost, 2)}`),
      t('documents.pdf.sample'),
    ]
    downloadBlob(buildPdf(t('fees.pdf.title', { year }), lines), `fee_report_${year}.pdf`)
  }

  const rows = [
    { label: t('fees.investment_title'), sub: t('fees.investment_sub'), amount: r.investmentFees },
    { label: t('fees.admin_assets'), sub: t('fees.admin_assets_sub', { pct: pct(ADMIN_FEES.assetBasedPct) }), amount: r.adminAssetFee },
    { label: t('fees.admin_flat'), sub: t('fees.admin_flat_sub'), amount: r.adminFlatFee },
  ]

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-surface-page">
        <div className="mx-auto max-w-[1100px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Link to="/investments" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t('fees.back')}
          </Link>
          <header className="flex flex-col gap-3 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-[28px] font-bold leading-tight text-text-primary">{t('fees.title')}</h1>
              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-text-secondary">{t('fees.subtitle')}</p>
            </div>
            <button
              type="button"
              onClick={handleDownload}
              className="flex shrink-0 items-center justify-center gap-1.5 rounded-md border border-border-default bg-surface-card px-3 py-2 text-[13px] font-medium text-text-primary transition-colors hover:bg-surface-elevated"
            >
              <Download className="h-4 w-4" aria-hidden />
              {t('fees.download')}
            </button>
          </header>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="flex flex-col gap-5 lg:col-span-8">
              {/* Headline */}
              <Card>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{t('fees.total_label')}</p>
                <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-1">
                  <p className="text-[36px] font-bold leading-none text-text-primary">{money(r.totalAnnual)}</p>
                  <p className="pb-1 text-[14px] text-text-secondary">
                    {t('fees.of_balance', { pct: pct(r.effectivePct, 3), balance: money(balance) })}
                  </p>
                </div>
                <p className="mt-2 text-[13px] text-text-secondary">{t('fees.per_1000', { amount: money(r.per1000, 2) })}</p>
              </Card>

              {/* Breakdown */}
              <Card>
                <h2 className="mb-3 text-[15px] font-bold text-text-primary">{t('fees.breakdown_title')}</h2>
                <ul className="divide-y divide-border-default">
                  {rows.map((row) => (
                    <li key={row.label} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-[14px] font-semibold text-text-primary">{row.label}</p>
                        <p className="mt-0.5 text-[12px] text-text-secondary">{row.sub}</p>
                      </div>
                      <p className="shrink-0 text-[14px] font-semibold text-text-primary">{money(row.amount, 2)}</p>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* By fund */}
              <Card className="!p-0 overflow-hidden">
                <div className="px-5 pb-3 pt-5">
                  <h2 className="text-[15px] font-bold text-text-primary">{t('fees.funds_title')}</h2>
                  <p className="mt-0.5 text-[12px] text-text-secondary">{t('fees.funds_sub')}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-y border-border-default bg-surface-page text-[11px] uppercase tracking-wider text-text-muted">
                        <th className="px-5 py-2.5 text-left font-semibold">{t('fees.col_fund')}</th>
                        <th className="px-3 py-2.5 text-right font-semibold">{t('fees.col_value')}</th>
                        <th className="px-3 py-2.5 text-right font-semibold">{t('fees.col_ratio')}</th>
                        <th className="px-5 py-2.5 text-right font-semibold">{t('fees.col_cost')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default">
                      {r.funds.map((f) => (
                        <tr key={f.ticker}>
                          <td className="px-5 py-3">
                            <p className="font-medium text-text-primary">{f.name}</p>
                            <div className="mt-1.5 h-1 w-full max-w-[140px] overflow-hidden rounded-full bg-surface-elevated" aria-hidden>
                              <div className="h-full rounded-full bg-primary" style={{ width: `${f.shareOfFees}%` }} />
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right text-text-secondary">{money(f.value)}</td>
                          <td className="px-3 py-3 text-right text-text-secondary">{pct(f.expenseRatioPct)}</td>
                          <td className="px-5 py-3 text-right font-medium text-text-primary">{money(f.annualCost, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            <aside className="flex flex-col gap-5 lg:col-span-4">
              {/* Impact */}
              <Card>
                <h2 className="text-[15px] font-bold text-text-primary">{t('fees.impact_title', { years: r.impact.years })}</h2>
                <p className="mt-2 text-[28px] font-bold leading-none text-text-primary">{money(r.impact.difference)}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-text-secondary">
                  {t('fees.impact_body', { pct: pct(r.effectivePct, 3), growth: r.impact.growthPct, years: r.impact.years })}
                </p>
                <p className="mt-2 text-[11px] leading-relaxed text-text-muted">{t('fees.impact_note')}</p>
              </Card>

              {/* Service fees */}
              <Card>
                <h2 className="text-[15px] font-bold text-text-primary">{t('fees.service_title', { year })}</h2>
                {r.serviceFees.length === 0 ? (
                  <p className="mt-2 text-[13px] text-text-secondary">{t('fees.service_none')}</p>
                ) : (
                  <>
                    <ul className="mt-3 divide-y divide-border-default">
                      {r.serviceFees.map((f) => (
                        <li key={f.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                          <div>
                            <p className="text-[13px] font-medium text-text-primary">{t(`tracking.type.${f.type}`)}</p>
                            <p className="text-[11px] text-text-muted">{fmtDate(f.at)}</p>
                          </div>
                          <p className="text-[13px] font-semibold text-text-primary">{money(f.amount, 2)}</p>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 flex justify-between border-t border-border-default pt-3 text-[13px] font-bold text-text-primary">
                      <span>{t('fees.service_total')}</span>
                      <span>{money(r.serviceFeesTotal, 2)}</span>
                    </p>
                  </>
                )}
              </Card>

              <div className="flex items-start gap-2 rounded-[12px] border border-border-default bg-surface-elevated p-3.5 text-[12px] leading-relaxed text-text-secondary">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <p>
                  {t('fees.who_pays')}{' '}
                  <Link to="/documents" className="font-semibold text-primary hover:underline">
                    {t('fees.see_disclosure')}
                  </Link>
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}
