import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGS, type LanguageMenuLang, type SupportedLang } from '@/core/i18n'

export type AppLanguage = SupportedLang

type LanguageContextValue = {
  /** Resolved UI language code (matches i18n active language). */
  currentLanguage: AppLanguage
  setLanguage: (lang: LanguageMenuLang) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function resolveAppLanguage(code: string | undefined): AppLanguage {
  const base = (code || 'en').split('-')[0]?.toLowerCase() || 'en'
  return (SUPPORTED_LANGS as readonly string[]).includes(base) ? (base as AppLanguage) : 'en'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const [currentLanguage, setCurrentLanguage] = useState<AppLanguage>(() =>
    resolveAppLanguage(i18n.language),
  )

  useEffect(() => {
    const onChange = (lng: string) => setCurrentLanguage(resolveAppLanguage(lng))
    i18n.on('languageChanged', onChange)
    return () => {
      i18n.off('languageChanged', onChange)
    }
  }, [i18n])

  const setLanguage = useCallback(
    (lang: LanguageMenuLang) => {
      void i18n.changeLanguage(lang)
    },
    [i18n],
  )

  const value = useMemo(
    () => ({ currentLanguage, setLanguage }),
    [currentLanguage, setLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return ctx
}
