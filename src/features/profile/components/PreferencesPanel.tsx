import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '../../../design-system/components/Select'
import { Checkbox } from '../../../design-system/components/Checkbox'
import { Button } from '../../../design-system/components/Button'
import { useTheme } from '../../../core/hooks/useTheme'
import type { ThemeMode } from '../../../core/types/theme.types'
import { SUPPORTED_LANGS } from '@/core/i18n'

export function PreferencesPanel() {
  const { t, i18n } = useTranslation()
  const { mode, setMode } = useTheme()

  const languageOptions = useMemo(
    () =>
      (SUPPORTED_LANGS as readonly string[]).map((value) => ({
        value,
        label: t(`lang.${value}`),
      })),
    [t],
  )

  const themeOptions = useMemo(
    (): { value: ThemeMode; label: string }[] => [
      { value: 'light', label: t('profile.preferences_editor.theme_light') },
      { value: 'dark', label: t('profile.preferences_editor.theme_dark') },
      { value: 'system', label: t('profile.preferences_editor.theme_system') },
    ],
    [t],
  )

  const langValue = (i18n.language?.split('-')[0] || 'en').toLowerCase()
  const resolvedLang = (SUPPORTED_LANGS as readonly string[]).includes(langValue) ? langValue : 'en'

  return (
    <div className="flex max-w-lg flex-col gap-6">
      <div>
        <p className="mb-3 text-sm font-semibold text-text-primary">{t('profile.preferences_editor.language')}</p>
        <Select
          options={languageOptions}
          value={resolvedLang}
          label={t('profile.preferences_editor.display_language')}
          onChange={(e) => void i18n.changeLanguage(e.target.value)}
        />
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-text-primary">{t('profile.preferences_editor.theme')}</p>
        <Select
          options={themeOptions}
          value={mode}
          onChange={(e) => setMode(e.target.value as ThemeMode)}
          label={t('profile.preferences_editor.color_theme')}
        />
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-text-primary">{t('profile.preferences_editor.notifications')}</p>
        <div className="flex flex-col gap-3">
          <Checkbox
            label={t('profile.preferences_editor.notif_email')}
            description={t('profile.preferences_editor.notif_email_desc')}
            defaultChecked
          />
          <Checkbox
            label={t('profile.preferences_editor.notif_contrib')}
            description={t('profile.preferences_editor.notif_contrib_desc')}
            defaultChecked
          />
          <Checkbox
            label={t('profile.preferences_editor.notif_market')}
            description={t('profile.preferences_editor.notif_market_desc')}
          />
          <Checkbox
            label={t('profile.preferences_editor.notif_enrolment')}
            description={t('profile.preferences_editor.notif_enrolment_desc')}
            defaultChecked
          />
        </div>
      </div>

      <Button className="w-fit">{t('profile.preferences_editor.save_prefs')}</Button>
    </div>
  )
}

export default PreferencesPanel
