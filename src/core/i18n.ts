import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '../locales/en.json'
import es from '../locales/es.json'
import fr from '../locales/fr.json'

/** Persisted key for language preference (header toggle + i18next). */
export const PREFERRED_LANGUAGE_KEY = 'preferred_language'
const LEGACY_I18N_KEY = 'i18nextLng'

function migrateLanguageStorage() {
  if (typeof window === 'undefined') return
  try {
    const hasPreferred = localStorage.getItem(PREFERRED_LANGUAGE_KEY)
    if (!hasPreferred) {
      const legacy = localStorage.getItem(LEGACY_I18N_KEY)
      if (legacy) {
        const code = legacy.split('-')[0] || 'en'
        localStorage.setItem(PREFERRED_LANGUAGE_KEY, code)
      }
    }
  } catch {
    /* ignore */
  }
}

migrateLanguageStorage()

/** Languages shown in the header language menu. */
export const LANGUAGE_MENU_LANGS = ['en', 'es', 'fr'] as const
export type LanguageMenuLang = (typeof LANGUAGE_MENU_LANGS)[number]

export const SUPPORTED_LANGS = ['en', 'es', 'fr'] as const
export type SupportedLang = (typeof SUPPORTED_LANGS)[number]

function normalizeLangCode(lng?: string): string {
  return ((lng ?? i18n.language) || 'en').split('-')[0]?.toLowerCase() || 'en'
}

/** Keep `<html lang>` aligned with i18n for accessibility and correct date/number hints. */
export function syncDocumentLang(lng?: string) {
  if (typeof document === 'undefined') return
  const code = normalizeLangCode(lng)
  const allowed = SUPPORTED_LANGS as readonly string[]
  document.documentElement.lang = allowed.includes(code) ? code : 'en'
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init(
    {
      fallbackLng: 'en',
      supportedLngs: SUPPORTED_LANGS as unknown as string[],
      interpolation: { escapeValue: false },
      returnNull: false,
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: PREFERRED_LANGUAGE_KEY,
        caches: ['localStorage'],
      },
      resources: {
        en: { translation: en },
        es: { translation: es },
        fr: { translation: fr },
      },
    },
    () => {
      syncDocumentLang()
    },
  )

i18n.on('languageChanged', (lng) => {
  syncDocumentLang(lng)
})

export default i18n
