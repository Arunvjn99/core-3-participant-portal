import { useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Briefcase, Landmark, Lock, SlidersHorizontal, Tags, User, Users, type LucideIcon } from 'lucide-react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
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

/** An icon for each section in the menu */
const SECTION_ICONS: Record<Section, LucideIcon> = {
  personal: User,
  bank: Landmark,
  employment: Briefcase,
  classification: Tags,
  beneficiary: Users,
  preferences: SlidersHorizontal,
  security: Lock,
}

/** Card surface shared with the dashboards: soft ring, gentle shadow */
const CARD = 'rounded-[20px] bg-surface-card shadow-[0_12px_32px_-28px_rgba(11,21,51,0.45)] ring-1 ring-slate-200/70 dark:ring-white/10'

/**
 * Profile: who you are on the left (a summary card and the section menu, which stays in view on wide screens),
 * the chosen section on the right. On phones the summary sits on top and the menu becomes a row of tabs.
 */
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

  // Keep the active tab in view on narrow screens, where the menu scrolls sideways.
  useEffect(() => {
    tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'center' })
  }, [active])

  const fullName = [personal.firstName, personal.lastName].filter(Boolean).join(' ')
  const initials = `${personal.firstName[0] ?? ''}${personal.lastName[0] ?? ''}`.toUpperCase()
  const age = ageFrom(personal.dob, now)

  return (
    <AnimatedPage>
      <div className="w-full pb-6 pt-2 lg:pb-7 lg:pt-3">
        <header className="mb-5">
          <h1 className="text-[28px] font-bold leading-tight text-[#0B1533] dark:text-white">{t('profile.title')}</h1>
          <p className="mt-1 text-[15px] leading-snug text-text-secondary">{t('profile.d.subtitle')}</p>
        </header>

        <div className="grid gap-5 lg:grid-cols-[272px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <aside className="min-w-0 space-y-4 lg:sticky lg:top-20">
            {/* Who this is */}
            <section className={cn(CARD, 'relative overflow-hidden p-5')}>
              <span className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-[linear-gradient(180deg,#EAF2FF_0%,rgba(234,242,255,0)_100%)] dark:bg-[linear-gradient(180deg,rgba(59,130,246,0.16)_0%,rgba(59,130,246,0)_100%)]" aria-hidden />
              <div className="relative flex items-center gap-4 lg:flex-col lg:items-center lg:text-center">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-lg font-bold text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.6)] ring-4 ring-white lg:h-20 lg:w-20 lg:text-2xl dark:ring-gray-900"
                  aria-hidden
                >
                  {initials}
                </span>
                <div className="min-w-0 flex-1 lg:flex-none">
                  <p className="truncate text-[18px] font-bold leading-tight text-text-primary">{fullName}</p>
                  <p className="mt-1 text-[13px] leading-snug text-text-secondary">
                    {employment.employer} · <span className="whitespace-nowrap">{t('profile.d.employee_id')} {employment.employeeId}</span>
                    {age && (
                      <>
                        <span className="lg:hidden"> · </span>
                        <span className="lg:mt-0.5 lg:block">{t('profile.d.age_value', { years: age.years, months: age.months })}</span>
                      </>
                    )}
                  </p>
                  <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-status-success-bg px-2.5 py-1 text-[12px] font-semibold text-status-success">
                    <span className="h-1.5 w-1.5 rounded-full bg-status-success" aria-hidden />
                    {t('profile.d.status_active')}
                  </span>
                </div>
              </div>
            </section>

            {/* Sections: a list on wide screens, a sideways row of tabs on narrow ones */}
            <div className={cn(CARD, 'p-1.5 lg:p-2')}>
              <div ref={tabsRef} role="tablist" aria-label={t('profile.title')} className="flex gap-1 overflow-x-auto [scrollbar-width:none] lg:flex-col lg:overflow-visible [&::-webkit-scrollbar]:hidden">
                {SECTIONS.map((s) => {
                  const Icon = SECTION_ICONS[s]
                  const on = active === s
                  return (
                    <button
                      key={s}
                      type="button"
                      role="tab"
                      id={`profile-tab-${s}`}
                      aria-selected={on}
                      aria-controls="profile-panel"
                      onClick={() => select(s)}
                      className={cn(
                        'group flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-left text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:w-full lg:py-2.5',
                        on ? 'bg-blue-50 font-semibold text-primary dark:bg-blue-500/15 dark:text-blue-300' : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary dark:hover:bg-white/5',
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                          on ? 'bg-primary text-white dark:bg-blue-500' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700 dark:bg-white/10 dark:text-slate-300',
                        )}
                        aria-hidden
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      {t(`profile.d.tab_${s}`)}
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          <div id="profile-panel" role="tabpanel" aria-labelledby={`profile-tab-${active}`} className="min-w-0 space-y-5">
            {active === 'personal' && <PersonalDetailsPanel />}
            {active === 'bank' && <BankDetailsPanel />}
            {active === 'employment' && <EmploymentPanel />}
            {active === 'classification' && <ClassificationPanel />}
            {active === 'beneficiary' && <BeneficiariesPanel key={startAdding ? 'add' : 'list'} startAdding={startAdding} />}
            {active === 'preferences' && <PreferencesPanel />}
            {active === 'security' && <ChangePasswordPanel />}
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}

export default ProfilePage
