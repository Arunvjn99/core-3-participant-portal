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
import type { LanguageMenuLang } from '@/core/i18n'

export type AppLanguage = 'en' | 'es'

type LanguageContextValue = {
  /** Resolved UI language code (`en` or `es`). */
  currentLanguage: AppLanguage
  setLanguage: (lang: LanguageMenuLang) => void
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

function resolveAppLanguage(code: string | undefined): AppLanguage {
  const base = (code || 'en').split('-')[0]?.toLowerCase() || 'en'
  return base === 'es' ? 'es' : 'en'
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
