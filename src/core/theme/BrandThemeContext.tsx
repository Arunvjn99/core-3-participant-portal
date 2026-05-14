import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/core/supabase'

export interface BrandTheme {
  primaryColor: string
  primaryHover: string
  primaryLight: string
  primaryRing: string
  companyName: string
  companyLogo: string | null
  fontFamily: string
  borderRadius: string
  tagline: string
  supportEmail: string
  supportPhone: string
}

/** Fallback theme values (hex required for JS color manipulation utilities) */
export const DEFAULT_THEME: BrandTheme = {
  primaryColor: '#2563EB', // --color-primary fallback
  primaryHover: '#1d4ed8', // --color-primary-hover fallback
  primaryLight: '#eff6ff', // --color-primary-light fallback
  primaryRing: 'rgba(37,99,235,0.25)', // derived from primaryColor
  companyName: 'Participant Portal',
  companyLogo: null,
  fontFamily: 'Inter, sans-serif',
  borderRadius: '0.75rem',
  tagline: 'Retirement Intelligence Platform',
  supportEmail: 'support@congruentsolutions.com',
  supportPhone: '1-800-CORE',
}

interface BrandThemeContextValue {
  theme: BrandTheme
  loading: boolean
  refreshTheme: () => Promise<void>
}

const BrandThemeContext = createContext<BrandThemeContextValue>({
  theme: DEFAULT_THEME,
  loading: true,
  refreshTheme: async () => {},
})

export function useBrandTheme() {
  return useContext(BrandThemeContext)
}

function applyToCSSVars(theme: BrandTheme) {
  const root = document.documentElement
  root.style.setProperty('--brand-primary', theme.primaryColor)
  root.style.setProperty('--brand-primary-hover', theme.primaryHover)
  root.style.setProperty('--brand-primary-light', theme.primaryLight)
  root.style.setProperty('--brand-primary-ring', theme.primaryRing)
  root.style.setProperty('--brand-font', theme.fontFamily)
  root.style.setProperty('--brand-radius', theme.borderRadius)
  root.style.setProperty('--color-brand', theme.primaryColor)
  root.style.setProperty('--color-brand-hover', theme.primaryHover)
  root.style.setProperty('--font-sans', theme.fontFamily)
}

function normalizeHex(hex: string): string | null {
  const t = hex.trim()
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) {
    return `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`.toLowerCase()
  }
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t.toLowerCase()
  return null
}

function hexToRgba(hex: string, alpha: number): string {
  const n = normalizeHex(hex)
  if (!n) return DEFAULT_THEME.primaryRing
  const r = Number.parseInt(n.slice(1, 3), 16)
  const g = Number.parseInt(n.slice(3, 5), 16)
  const b = Number.parseInt(n.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function darken(hex: string, pct: number): string {
  const n = normalizeHex(hex)
  if (!n) return DEFAULT_THEME.primaryHover
  const num = Number.parseInt(n.slice(1), 16)
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * pct))
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(2.55 * pct))
  const b = Math.max(0, (num & 0xff) - Math.round(2.55 * pct))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function lighten(hex: string, pct: number): string {
  const n = normalizeHex(hex)
  if (!n) return DEFAULT_THEME.primaryLight
  const num = Number.parseInt(n.slice(1), 16)
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * pct))
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(2.55 * pct))
  const b = Math.min(255, (num & 0xff) + Math.round(2.55 * pct))
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function parseBranding(raw: unknown): Record<string, string> {
  if (!raw) return {}
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as Record<string, string>
    } catch {
      return {}
    }
  }
  if (typeof raw === 'object' && raw !== null) {
    return raw as Record<string, string>
  }
  return {}
}

async function fetchCompanyTheme(userId: string): Promise<BrandTheme> {
  if (!supabase) return DEFAULT_THEME

  const { data: uc } = await supabase
    .from('user_companies')
    .select('company_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!uc?.company_id) return DEFAULT_THEME

  const { data: company } = await supabase
    .from('companies')
    .select('name, logo_url, primary_color, branding_json')
    .eq('id', uc.company_id)
    .maybeSingle()

  if (!company) return DEFAULT_THEME

  const branding = parseBranding(company.branding_json)
  const primary =
    branding.primary_color ||
    (typeof company.primary_color === 'string' ? company.primary_color : null) ||
    DEFAULT_THEME.primaryColor

  return {
    primaryColor: primary,
    primaryHover: branding.primary_hover || darken(primary, 15),
    primaryLight: branding.primary_light || lighten(primary, 85),
    primaryRing: hexToRgba(primary, 0.25),
    companyName: company.name || DEFAULT_THEME.companyName,
    companyLogo: company.logo_url ?? null,
    fontFamily: branding.font_family || DEFAULT_THEME.fontFamily,
    borderRadius: branding.border_radius || DEFAULT_THEME.borderRadius,
    tagline: branding.company_tagline || DEFAULT_THEME.tagline,
    supportEmail: branding.support_email || DEFAULT_THEME.supportEmail,
    supportPhone: branding.support_phone || DEFAULT_THEME.supportPhone,
  }
}

export function BrandThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<BrandTheme>(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)

  const refreshTheme = useCallback(async () => {
    if (!supabase) {
      applyToCSSVars(DEFAULT_THEME)
      setTheme(DEFAULT_THEME)
      setLoading(false)
      return
    }
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      applyToCSSVars(DEFAULT_THEME)
      setTheme(DEFAULT_THEME)
      setLoading(false)
      return
    }
    const t = await fetchCompanyTheme(user.id)
    applyToCSSVars(t)
    setTheme(t)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refreshTheme()

    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        applyToCSSVars(DEFAULT_THEME)
        setTheme(DEFAULT_THEME)
        setLoading(false)
        return
      }
      // INITIAL_SESSION: session restored from storage after refresh — refreshTheme() may have run before hydration
      if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
        void fetchCompanyTheme(session.user.id).then((t) => {
          applyToCSSVars(t)
          setTheme(t)
          setLoading(false)
        })
      } else if (event === 'INITIAL_SESSION' && !session?.user) {
        applyToCSSVars(DEFAULT_THEME)
        setTheme(DEFAULT_THEME)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [refreshTheme])

  return (
    <BrandThemeContext.Provider value={{ theme, loading, refreshTheme }}>
      {children}
    </BrandThemeContext.Provider>
  )
}
