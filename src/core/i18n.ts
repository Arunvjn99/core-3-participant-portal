import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '../locales/en.json'
import es from '../locales/es.json'
import fr from '../locales/fr.json'

export const SUPPORTED_LANGS = ['en', 'es', 'fr'] as const
export type SupportedLang = (typeof SUPPORTED_LANGS)[number]

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGS as unknown as string[],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
    },
  })

export default i18n
