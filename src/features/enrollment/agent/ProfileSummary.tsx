import { useTranslation } from 'react-i18next'
import { Pencil } from 'lucide-react'
import { getAppDateLocale } from '@/lib/dateLocale'
import type { PersonalizationDraftData } from '@/core/store/enrollmentDraftStore'
import { AgentMessage } from './AgentChat'

/** What the assistant already knows from the popup or the questions, on one line, with a way to change it. */
export function ProfileSummary({
  profile,
  age,
  salary,
  onEdit,
}: {
  profile: PersonalizationDraftData
  age: number
  salary: number
  onEdit: () => void
}) {
  const { t } = useTranslation()
  const locale = getAppDateLocale()
  const facts = [
    t('enrollment.agent.fact_age_short', { age }),
    profile.retirementAge ? t('enrollment.agent.fact_retire_short', { age: profile.retirementAge }) : null,
    `$${salary.toLocaleString(locale)}`,
    profile.riskTolerance ? t(`enrollment.investment.level_${profile.riskTolerance}`) : null,
  ].filter(Boolean)
  return (
    <AgentMessage>
      <span className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.88rem' }}>{t('enrollment.agent.know_title_short')}</span>
      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
        {facts.map((f, i) => (
          <span key={i} className="font-semibold text-gray-900 dark:text-white">
            {i > 0 && <span className="mr-2 text-gray-300 dark:text-gray-600" aria-hidden>·</span>}
            {f}
          </span>
        ))}
        <button type="button" onClick={onEdit} className="inline-flex min-h-[44px] items-center gap-1 text-blue-700 hover:underline dark:text-blue-300" style={{ fontSize: '0.88rem', fontWeight: 600 }}>
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          {t('enrollment.agent.edit_answers')}
        </button>
      </span>
    </AgentMessage>
  )
}
