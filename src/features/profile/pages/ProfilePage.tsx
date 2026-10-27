import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { Badge } from '@/design-system/components/Badge'
import { cn } from '@/lib/cn'
import { useNow } from '@/lib/useNow'
import { ageFrom } from '../profileData'
import { useProfileStore } from '../profileStore'
import { PersonalDetailsPanel } from '../components/PersonalDetailsPanel'
import { BankDetailsPanel } from '../components/BankDetailsPanel'
import { EmploymentPanel } from '../components/EmploymentPanel'
import { ClassificationPanel } from '../components/ClassificationPanel'
import { BeneficiariesPanel } from '../components/BeneficiariesPanel'
import { ChangePasswordPanel } from '../components/ChangePasswordPanel'
import { PreferencesPanel } from '../components/PreferencesPanel'

const SECTIONS = ['personal', 'bank', 'employment', 'classification', 'beneficiary', 'preferences', 'security'] as const
type Section = (typeof SECTIONS)[number]

export function ProfilePage() {
  const { t } = useTranslation()
  const [params, setParams] = useSearchParams()
  const personal = useProfileStore((s) => s.personal)
  const employment = useProfileStore((s) => s.employment)
  const tabsRef = useRef<HTMLDivElement>(null)
  const now = useNow()

  const requested = params.get('section')
  const active: Section = SECTIONS.includes(requested as Section) ? (requested as Section) : 'personal'
  const startAdding = active === 'beneficiary' && params.get('add') === '1'

  const select = (s: Section) => setParams({ section: s }, { replace: true })

  // Keep the active tab in view on narrow screens.
  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
  }, [active])

  const fullName = [personal.firstName, personal.lastName].filter(Boolean).join(' ')
  const initials = `${personal.firstName[0] ?? ''}${personal.lastName[0] ?? ''}`.toUpperCase()
  const age = ageFrom(personal.dob, now)

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('profile.d.subtitle')}</p>

        <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-5">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white" aria-hidden>{initials}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold text-gray-900 dark:text-white">{fullName}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {employment.employer} · {t('profile.d.employee_id')} {employment.employeeId}
              {age && <> · {t('profile.d.age_value', { years: age.years, months: age.months })}</>}
            </p>
          </div>
          <Badge variant="success">{t('profile.d.status_active')}</Badge>
        </div>

        <div ref={tabsRef} role="tablist" aria-label={t('profile.title')} className="mt-5 flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800">
          {SECTIONS.map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              id={`profile-tab-${s}`}
              aria-selected={active === s}
              aria-controls="profile-panel"
              onClick={() => select(s)}
              className={cn(
                'shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-all',
                active === s ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              )}
            >
              {t(`profile.d.tab_${s}`)}
            </button>
          ))}
        </div>

        <div id="profile-panel" role="tabpanel" aria-labelledby={`profile-tab-${active}`} className="mt-5">
          {active === 'personal' && <PersonalDetailsPanel />}
          {active === 'bank' && <BankDetailsPanel />}
          {active === 'employment' && <EmploymentPanel />}
          {active === 'classification' && <ClassificationPanel />}
          {active === 'beneficiary' && <BeneficiariesPanel key={startAdding ? 'add' : 'list'} startAdding={startAdding} />}
          {active === 'preferences' && <PreferencesPanel />}
          {active === 'security' && <ChangePasswordPanel />}
        </div>
      </div>
    </AnimatedPage>
  )
}

export default ProfilePage
