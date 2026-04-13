import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { ThemeMode, ThemeContextValue, BrandTheme } from '../types/theme.types'
import {
  applyTheme,
  applyBrand,
  resolveMode,
  persistMode,
  persistBrand,
  loadPersistedMode,
  loadPersistedBrand,
  getBrandBySlug,
} from './themeManager'

export const ThemeContext = createContext<ThemeContextValue | null>(null)

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [mode, setModeState] = useState<ThemeMode>(loadPersistedMode)
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>(() => resolveMode(loadPersistedMode()))
  const [companyTheme, setCompanyThemeState] = useState<BrandTheme | null>(() => {
    const slug = loadPersistedBrand()
    return getBrandBySlug(slug) ?? null
  })

  useEffect(() => {
    const resolved = resolveMode(mode)
    setResolvedMode(resolved)
    applyTheme(resolved)

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = (e: MediaQueryListEvent) => {
        const r = e.matches ? 'dark' : 'light'
        setResolvedMode(r)
        applyTheme(r)
      }
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [mode])

  useEffect(() => {
    if (companyTheme) {
      applyBrand(companyTheme.slug)
    } else {
      applyBrand('default')
    }
  }, [companyTheme])

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
    persistMode(newMode)
  }

  const setCompanyTheme = (slug: string) => {
    const brand = getBrandBySlug(slug) ?? null
    setCompanyThemeState(brand)
    persistBrand(slug)
  }

  return (
    <ThemeContext.Provider value={{ mode, resolvedMode, companyTheme, setMode, setCompanyTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export default ThemeProvider
