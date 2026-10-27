import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { getAppDateLocale } from '@/lib/dateLocale'
import { useProfileStore } from '../profileStore'
import { ProfileCard, ReadField, ReadGrid } from './ProfileCard'

/** Read-only: classifications are assigned by the plan, with the history of each. */
export function ClassificationPanel() {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const categories = useProfileStore((s) => s.classification)
  const [activeId, setActiveId] = useState(categories[0]?.id)
  const active = categories.find((c) => c.id === activeId) ?? categories[0]

  const fmt = (iso: string) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' }) : '—')

  if (!active) return null

  return (
    <ProfileCard title={t('profile.d.classification_title')} subtitle={t('profile.d.classification_sub')}>
      <div role="tablist" aria-label={t('profile.d.classification_title')} className="mb-5 flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={c.id === active.id}
            onClick={() => setActiveId(c.id)}
            className={cn(
              'rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
              c.id === active.id ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('profile.d.current')}</h3>
      <ReadGrid cols={3}>
        <ReadField label={t('profile.d.type')}>{active.label}</ReadField>
        <ReadField label={t('profile.d.code')}>{active.current.code}</ReadField>
        <ReadField label={t('profile.d.cls_name')}>{active.current.name}</ReadField>
        <ReadField label={t('profile.d.start_date')}>{fmt(active.current.start)}</ReadField>
        <ReadField label={t('profile.d.end_date')}>{fmt(active.current.end)}</ReadField>
      </ReadGrid>

      <h3 className="mb-3 mt-6 text-sm font-semibold text-gray-700 dark:text-gray-300">{t('profile.d.history')}</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-100 dark:border-gray-800">
        <table className="w-full min-w-[28rem] text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">{t('profile.d.type')}</th>
              <th scope="col" className="px-3 py-2 font-semibold">{t('profile.d.code')}</th>
              <th scope="col" className="px-3 py-2 font-semibold">{t('profile.d.start_date')}</th>
              <th scope="col" className="px-3 py-2 font-semibold">{t('profile.d.end_date')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {active.history.map((h, i) => (
              <tr key={`${h.code}-${i}`}>
                <td className="px-3 py-2">{active.label}</td>
                <td className="px-3 py-2">{h.code}</td>
                <td className="px-3 py-2">{fmt(h.start)}</td>
                <td className="px-3 py-2">{fmt(h.end)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ProfileCard>
  )
}
