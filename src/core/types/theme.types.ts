export type ThemeMode = 'light' | 'dark' | 'system'

export interface BrandTheme {
  slug: string
  label: string
  primaryColor: string
  primaryHover: string
  primaryActive: string
  primarySubtle: string
}

export interface ThemeContextValue {
  mode: ThemeMode
  resolvedMode: 'light' | 'dark'
  companyTheme: BrandTheme | null
  setMode: (mode: ThemeMode) => void
  setCompanyTheme: (slug: string) => void
}
