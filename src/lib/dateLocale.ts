import i18n from '@/core/i18n'

/** Locale string for `Intl` formatters (regional date/number conventions). */
export function getAppDateLocale(): string {
  const base = (i18n.language || 'en').split('-')[0]?.toLowerCase() || 'en'
  if (base === 'es') return 'es-ES'
  if (base === 'fr') return 'fr-FR'
  return 'en-US'
}
