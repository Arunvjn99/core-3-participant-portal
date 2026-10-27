import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useElectionsStore } from '@/features/plan/electionsStore'
import { SDB_ACCOUNTS } from './portfolioData'

/** Self-directed brokerage accounts, shown once the participant has opted in. */
export function SdbPanel() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const optedIn = useElectionsStore((s) => s.investment.sdbOptedIn)

  if (!optedIn) {
    return (
      <section className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <h3 className="text-gray-900 dark:text-white">{t('portfolio.sdb.not_in_title')}</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">{t('portfolio.sdb.not_in_body')}</p>
        <Link to="/enrollment/manage/roth-401k" className="btn-brand mt-4 inline-block rounded-lg px-5 py-2 text-sm font-semibold">{t('portfolio.sdb.opt_in')}</Link>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6">
      <h3 className="mb-4 text-gray-900 dark:text-white">{t('portfolio.sdb.title')}</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
        <table className="w-full min-w-[30rem] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">{t('portfolio.sdb.col_number')}</th>
              <th scope="col" className="px-3 py-2 font-semibold">{t('portfolio.sdb.col_type')}</th>
              <th scope="col" className="px-3 py-2 font-semibold">{t('portfolio.sdb.col_updated_on')}</th>
              <th scope="col" className="px-3 py-2 font-semibold">{t('portfolio.sdb.col_updated_through')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {SDB_ACCOUNTS.map((a) => (
              <tr key={a.number}>
                <td className="px-3 py-2.5 tabular-nums text-gray-900 dark:text-white">{`••••••${a.number.slice(-4)}`}</td>
                <td className="px-3 py-2.5">{t(`portfolio.sdb.type_${a.type}`)}</td>
                <td className="px-3 py-2.5 tabular-nums">{new Date(`${a.updatedOn}T00:00:00`).toLocaleDateString(locale)}</td>
                <td className="px-3 py-2.5">{t(`portfolio.sdb.through_${a.updatedThrough}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t('portfolio.sample_note')}</p>
    </section>
  )
}
