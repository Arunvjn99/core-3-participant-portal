import { useTranslation } from 'react-i18next'
import { Select } from '../../../design-system/components/Select'
import { Checkbox } from '../../../design-system/components/Checkbox'
import { Button } from '../../../design-system/components/Button'
import { useTheme } from '../../../core/hooks/useTheme'
import type { ThemeMode } from '../../../core/types/theme.types'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
  { value: 'zh', label: '中文' },
]

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System (auto)' },
]

export function PreferencesPanel() {
  const { t, i18n } = useTranslation()
  const { mode, setMode } = useTheme()

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <p className="mb-3 text-sm font-semibold text-text-primary">Language</p>
        <Select
          options={LANGUAGE_OPTIONS}
          value={i18n.language?.split('-')[0] ?? 'en'}
          label={t('Display language', { defaultValue: 'Display language' })}
          onChange={(e) => void i18n.changeLanguage(e.target.value)}
        />
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-text-primary">Theme</p>
        <Select
          options={THEME_OPTIONS}
          value={mode}
          onChange={(e) => setMode(e.target.value as ThemeMode)}
          label="Color theme"
        />
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-text-primary">Notifications</p>
        <div className="flex flex-col gap-3">
          <Checkbox label="Email summaries" description="Monthly account performance digest" defaultChecked />
          <Checkbox label="Contribution alerts" description="Notify when payroll contributions are posted" defaultChecked />
          <Checkbox label="Market updates" description="Weekly market commentary for your funds" />
          <Checkbox label="Enrollment reminders" description="Annual open enrollment period notifications" defaultChecked />
        </div>
      </div>

      <Button className="w-fit">Save preferences</Button>
    </div>
  )
}

export default PreferencesPanel
