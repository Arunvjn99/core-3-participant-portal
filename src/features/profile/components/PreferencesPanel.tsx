import { useMemo, useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Select } from '../../../design-system/components/Select'
import { Checkbox } from '../../../design-system/components/Checkbox'
import { Button } from '../../../design-system/components/Button'
import { useTheme } from '../../../core/hooks/useTheme'
import { useBrandTheme } from '../../../core/theme/BrandThemeContext'
import { getAllCompanies, type Company } from '../../../lib/supabaseIntegration'
import type { ThemeMode } from '../../../core/types/theme.types'
import { SUPPORTED_LANGS } from '@/core/i18n'
import { Building2, RotateCcw, Palette } from 'lucide-react'

export function PreferencesPanel() {
  const { t, i18n } = useTranslation()
  const { mode, setMode } = useTheme()
  const { sessionCompanyId, applyCompanyTheme, resetTheme, loading: themeLoading } = useBrandTheme()

  const [companies, setCompanies] = useState<Company[]>([])
  const [companiesLoading, setCompaniesLoading] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(sessionCompanyId ?? '')
  const [themeApplied, setThemeApplied] = useState(false)

  useEffect(() => {
    setCompaniesLoading(true)
    getAllCompanies()
      .then((data) => setCompanies(data))
      .catch(() => setCompanies([]))
      .finally(() => setCompaniesLoading(false))
  }, [])

  // Keep local selection in sync if another part of the app resets the theme
  useEffect(() => {
    setSelectedCompanyId(sessionCompanyId ?? '')
  }, [sessionCompanyId])

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

  const companyOptions = useMemo(
    () => [
      { value: '', label: 'Congruent (Default)' },
      ...companies.map((c) => ({ value: c.id, label: c.name })),
    ],
    [companies],
  )

  const handleApplyTheme = async () => {
    if (!selectedCompanyId) {
      await resetTheme()
    } else {
      await applyCompanyTheme(selectedCompanyId)
    }
    setThemeApplied(true)
    setTimeout(() => setThemeApplied(false), 2000)
  }

  const handleResetTheme = async () => {
    setSelectedCompanyId('')
    await resetTheme()
    setThemeApplied(true)
    setTimeout(() => setThemeApplied(false), 2000)
  }

  const isThemeModified = sessionCompanyId !== null && sessionCompanyId !== ''

  return (
    <div className="flex max-w-lg flex-col gap-6">
      {/* Language */}
      <div>
        <p className="mb-3 text-sm font-semibold text-text-primary">{t('profile.preferences_editor.language')}</p>
        <Select
          options={languageOptions}
          value={resolvedLang}
          label={t('profile.preferences_editor.display_language')}
          onChange={(e) => void i18n.changeLanguage(e.target.value)}
        />
      </div>

      {/* Light/dark theme */}
      <div>
        <p className="mb-3 text-sm font-semibold text-text-primary">{t('profile.preferences_editor.theme')}</p>
        <Select
          options={themeOptions}
          value={mode}
          onChange={(e) => setMode(e.target.value as ThemeMode)}
          label={t('profile.preferences_editor.color_theme')}
        />
      </div>

      {/* Portal brand theme */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <Palette className="h-4 w-4 text-text-secondary" />
          <p className="text-sm font-semibold text-text-primary">Portal Theme</p>
          {isThemeModified && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
              Custom
            </span>
          )}
        </div>

        <p className="mb-3 text-xs text-text-secondary">
          Choose a company theme to preview. This applies only for your current session and resets on sign-out.
        </p>

        {companiesLoading ? (
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Loading companies…
          </div>
        ) : companies.length === 0 ? (
          <div className="rounded-xl border border-border-default bg-surface-elevated px-4 py-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-text-muted" />
              <p className="text-sm text-text-secondary">
                No companies available. Connect Supabase to enable theme switching.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Select
              options={companyOptions}
              value={selectedCompanyId}
              label="Select company theme"
              onChange={(e) => setSelectedCompanyId(e.target.value)}
            />

            <div className="flex items-center gap-2">
              <Button
                onClick={() => void handleApplyTheme()}
                disabled={themeLoading}
                className="flex items-center gap-2 text-sm"
              >
                {themeLoading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Applying…
                  </>
                ) : themeApplied ? (
                  '✓ Applied'
                ) : (
                  'Apply Theme'
                )}
              </Button>

              {isThemeModified && (
                <button
                  type="button"
                  onClick={() => void handleResetTheme()}
                  disabled={themeLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-border-default px-3 py-2 text-sm text-text-secondary transition-colors hover:bg-surface-elevated disabled:opacity-50"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset to Default
                </button>
              )}
            </div>

            {isThemeModified && (
              <p className="text-xs text-text-muted">
                Showing theme for: <span className="font-medium text-text-secondary">{companies.find((c) => c.id === sessionCompanyId)?.name ?? sessionCompanyId}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
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
