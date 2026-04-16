import i18n from '@/core/i18n'

/** Locale string for `Intl` formatters: en-US (MM/DD/…) vs es-ES (DD/MM/…). */
export function getAppDateLocale(): string {
  const base = (i18n.language || 'en').split('-')[0]?.toLowerCase() || 'en'
  return base === 'es' ? 'es-ES' : 'en-US'
}
