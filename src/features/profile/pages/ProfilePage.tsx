import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { cn } from '@/lib/cn'
import { User, Users, Settings, Shield } from 'lucide-react'
import { PreferencesPanel } from '../components/PreferencesPanel'

const TAB_KEYS = ['personal', 'beneficiaries', 'preferences', 'security'] as const
type TabKey = (typeof TAB_KEYS)[number]

export function ProfilePage() {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<TabKey>('personal')

  const tabs: { key: TabKey; label: string; icon: typeof User }[] = [
    { key: 'personal', label: t('profile.personal_info'), icon: User },
    { key: 'beneficiaries', label: t('profile.beneficiaries'), icon: Users },
    { key: 'preferences', label: t('profile.preferences'), icon: Settings },
    { key: 'security', label: t('profile.security'), icon: Shield },
  ]

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{t('profile.title')}</h1>

        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800 sm:inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          {activeTab === 'personal' && <PersonalInfoSection />}
          {activeTab === 'beneficiaries' && <BeneficiariesSection />}
          {activeTab === 'preferences' && <PreferencesPanel />}
          {activeTab === 'security' && <SecuritySection />}
        </div>
      </div>
    </AnimatedPage>
  )
}

function PersonalInfoSection() {
  const { t } = useTranslation()
  const fields = [
    { labelKey: 'profile.form_full_name' as const, placeholderKey: 'profile.placeholder_name' as const },
    { labelKey: 'profile.form_email' as const, placeholderKey: 'profile.placeholder_email' as const },
    { labelKey: 'profile.form_phone' as const, placeholderKey: 'profile.placeholder_phone' as const },
    { labelKey: 'profile.form_dob' as const, placeholderKey: 'profile.placeholder_dob' as const },
  ]

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('profile.personal_info')}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.labelKey}>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t(field.labelKey)}
            </label>
            <input
              type="text"
              placeholder={t(field.placeholderKey)}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
            />
          </div>
        ))}
      </div>
      <button type="button" className="btn-brand mt-6 rounded-xl px-6 py-2.5 text-sm font-semibold">
        {t('profile.save')}
      </button>
    </div>
  )
}

function BeneficiariesSection() {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('profile.beneficiaries')}</h2>
        <button type="button" className="btn-brand rounded-xl px-4 py-2 text-sm font-semibold">
          {t('profile.beneficiaries_add')}
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.beneficiaries_empty')}</p>
    </div>
  )
}

function SecuritySection() {
  const { t } = useTranslation()
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{t('profile.security')}</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('profile.security_current_password')}
          </label>
          <input
            type="password"
            placeholder={t('profile.password_placeholder')}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('profile.security_new_password')}
          </label>
          <input
            type="password"
            placeholder={t('profile.password_placeholder')}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <button type="button" className="btn-brand rounded-xl px-6 py-2.5 text-sm font-semibold">
          {t('profile.security_update')}
        </button>
      </div>
    </div>
  )
}

export default ProfilePage
