import { useTranslation } from 'react-i18next'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useElectionsStore } from './electionsStore'
import type { HistoryEntry } from './electionsData'

function useDetail() {
  const { t } = useTranslation()
  return (h: HistoryEntry): string => {
    const p = h.params
    switch (h.change) {
      case 'enrollment':
        return t('plan.hist.detail_enrollment')
      case 'deferral':
        return p.unit === 'dollar' ? t('plan.hist.detail_deferral_dollar', { pre: p.pre, roth: p.roth }) : t('plan.hist.detail_deferral_percent', { pre: p.pre, roth: p.roth })
      case 'auto_increase':
        if (!p.enabled) return t('plan.hist.detail_auto_off')
        return p.sourceWise ? t('plan.hist.detail_auto_src', p) : t('plan.hist.detail_auto_all', p)
      case 'investment':
        return t(`plan.hist.detail_investment_${p.mode}`, { style: p.style ? t(`plan.risk.style_${p.style}`) : '' })
      case 'sdb':
        return t(p.on ? 'plan.hist.detail_sdb_on' : 'plan.hist.detail_sdb_off')
      case 'rebalance':
        return t(p.on ? 'plan.hist.detail_rebalance_on' : 'plan.hist.detail_rebalance_off')
      case 'opt_out':
        return t('plan.hist.detail_opt_out')
    }
  }
}

export function HistoryPanel() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const history = useElectionsStore((s) => s.history)
  const detail = useDetail()
  const sorted = [...history].sort((a, b) => b.at - a.at)

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-base font-semibold text-gray-900 dark:text-white">{t('plan.hist.title')}</h3>
        <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{t('plan.hist.sub')}</p>
      </div>
      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">{t('plan.hist.none')}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-3 py-2 font-semibold">{t('plan.hist.col_date')}</th>
                <th scope="col" className="px-3 py-2 font-semibold">{t('plan.hist.col_change')}</th>
                <th scope="col" className="px-3 py-2 font-semibold">{t('plan.hist.col_details')}</th>
                <th scope="col" className="px-3 py-2 font-semibold">{t('plan.hist.col_by')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {sorted.map((h) => (
                <tr key={h.id}>
                  <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-gray-600 dark:text-gray-300">{new Date(h.at).toLocaleDateString(locale)}</td>
                  <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white">{t(`plan.hist.change_${h.change}`)}</td>
                  <td className="px-3 py-2.5 text-gray-700 dark:text-gray-200">{detail(h)}</td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">{t(`plan.hist.by_${h.by}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
