import { useState } from 'react'
import { AnimatedPage } from '@/design-system/motion/AnimatedPage'
import { cn } from '@/lib/cn'
import { User, Users, Settings, Shield } from 'lucide-react'

const TABS = [
  { key: 'personal', label: 'Personal Info', icon: User },
  { key: 'beneficiaries', label: 'Beneficiaries', icon: Users },
  { key: 'preferences', label: 'Preferences', icon: Settings },
  { key: 'security', label: 'Security', icon: Shield },
] as const

type TabKey = typeof TABS[number]['key']

export function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>('personal')

  return (
    <AnimatedPage>
      <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>

        <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-700 dark:bg-gray-800 sm:inline-flex">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
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
          {activeTab === 'preferences' && <PreferencesSection />}
          {activeTab === 'security' && <SecuritySection />}
        </div>
      </div>
    </AnimatedPage>
  )
}

function PersonalInfoSection() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Personal Information</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { label: 'Full Name', placeholder: 'John Doe' },
          { label: 'Email', placeholder: 'john@example.com' },
          { label: 'Phone', placeholder: '+1 (555) 000-0000' },
          { label: 'Date of Birth', placeholder: 'MM/DD/YYYY' },
        ].map((field) => (
          <div key={field.label}>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
            <input
              type="text"
              placeholder={field.placeholder}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-blue-500"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        Save Changes
      </button>
    </div>
  )
}

function BeneficiariesSection() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Beneficiaries</h2>
        <button
          type="button"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Add Beneficiary
        </button>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">No beneficiaries added yet. Add a beneficiary to ensure your retirement savings are distributed according to your wishes.</p>
    </div>
  )
}

function PreferencesSection() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Preferences</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Language</label>
          <select className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-white">
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4 dark:border-gray-700">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Email Notifications</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Receive updates about your account</p>
          </div>
          <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-blue-600" />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4 dark:border-gray-700">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Statement Alerts</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Get notified when statements are ready</p>
          </div>
          <input type="checkbox" defaultChecked className="h-4 w-4 rounded text-blue-600" />
        </div>
      </div>
    </div>
  )
}

function SecuritySection() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Security</h2>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
        </div>
        <button
          type="button"
          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Update Password
        </button>
      </div>
    </div>
  )
}

export default ProfilePage
