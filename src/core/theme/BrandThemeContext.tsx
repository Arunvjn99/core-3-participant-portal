import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { supabase } from '@/core/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

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

/** Fallback / Congruent default theme */
export const DEFAULT_THEME: BrandTheme = {
  primaryColor: '#2563EB',
  primaryHover: '#1d4ed8',
  primaryLight: '#eff6ff',
  primaryRing: 'rgba(37,99,235,0.25)',
  companyName: 'Participant Portal',
  companyLogo: null,
  fontFamily: 'Inter, sans-serif',
  borderRadius: '0.75rem',
  tagline: 'Retirement Intelligence Platform',
  supportEmail: 'support@congruentsolutions.com',
  supportPhone: '1-800-CORE',
}

/** sessionStorage key for the user's chosen company theme (session-only, cleared on sign-out) */
const SESSION_THEME_KEY = 'portal_theme_company_id'

/** The company slug that represents the default/Congruent theme in the DB */
const DEFAULT_COMPANY_SLUG = 'congruent'

// ─── Context ──────────────────────────────────────────────────────────────────

interface BrandThemeContextValue {
  theme: BrandTheme
  loading: boolean
  sessionCompanyId: string | null
  refreshTheme: () => Promise<void>
  /** Apply a company's theme for this session only. Persists across page refreshes in the same tab. */
  applyCompanyTheme: (companyId: string) => Promise<void>
  /** Reset to Congruent default theme and clear the session preference. */
  resetTheme: () => Promise<void>
}

const BrandThemeContext = createContext<BrandThemeContextValue>({
  theme: DEFAULT_THEME,
  loading: true,
  sessionCompanyId: null,
  refreshTheme: async () => {},
  applyCompanyTheme: async () => {},
  resetTheme: async () => {},
})

export function useBrandTheme() {
  return useContext(BrandThemeContext)
}

// ─── Color utilities ──────────────────────────────────────────────────────────

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
    try { return JSON.parse(raw) as Record<string, string> } catch { return {} }
  }
  if (typeof raw === 'object' && raw !== null) return raw as Record<string, string>
  return {}
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

// ─── Core fetch helpers ───────────────────────────────────────────────────────

/** Build a BrandTheme from a raw companies row (uses select('*'), so all columns are optional). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToBrandTheme(company: Record<string, any>): BrandTheme {
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
    // The companies table may have logo_url (newer migrations) or logo (original migration)
    companyLogo: company.logo_url ?? company.logo ?? null,
    fontFamily: branding.font_family || DEFAULT_THEME.fontFamily,
    borderRadius: branding.border_radius || DEFAULT_THEME.borderRadius,
    tagline: branding.company_tagline || DEFAULT_THEME.tagline,
    supportEmail: branding.support_email || DEFAULT_THEME.supportEmail,
    supportPhone: branding.support_phone || DEFAULT_THEME.supportPhone,
  }
}

/** Fetch theme by company ID (UUID or text id). */
async function fetchCompanyThemeById(companyId: string): Promise<BrandTheme> {
  if (!supabase) return DEFAULT_THEME
  // select('*') avoids 400 errors from columns that may not exist in every DB version
  const { data } = await supabase.from('companies').select('*').eq('id', companyId).maybeSingle()
  return data ? rowToBrandTheme(data as Record<string, unknown>) : DEFAULT_THEME
}

/** Fetch the Congruent default theme by slug (more reliable than id across migrations). */
async function fetchDefaultCompanyTheme(): Promise<BrandTheme> {
  if (!supabase) return DEFAULT_THEME
  const { data } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', DEFAULT_COMPANY_SLUG)
    .maybeSingle()
  // If slug lookup fails (column or row missing), fall back to id lookup then DEFAULT_THEME
  if (data) return rowToBrandTheme(data as Record<string, unknown>)
  const { data: byId } = await supabase
    .from('companies')
    .select('*')
    .eq('id', DEFAULT_COMPANY_SLUG)
    .maybeSingle()
  return byId ? rowToBrandTheme(byId as Record<string, unknown>) : DEFAULT_THEME
}

/** Resolve the active theme: session choice → Congruent default → hard-coded fallback */
async function resolveActiveTheme(): Promise<BrandTheme> {
  const sessionCompanyId = sessionStorage.getItem(SESSION_THEME_KEY)
  if (sessionCompanyId) return fetchCompanyThemeById(sessionCompanyId)
  return fetchDefaultCompanyTheme()
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function BrandThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<BrandTheme>(DEFAULT_THEME)
  const [loading, setLoading] = useState(true)
  const [sessionCompanyId, setSessionCompanyId] = useState<string | null>(
    () => sessionStorage.getItem(SESSION_THEME_KEY),
  )

  const refreshTheme = useCallback(async () => {
    if (!supabase) {
      applyToCSSVars(DEFAULT_THEME)
      setTheme(DEFAULT_THEME)
      setLoading(false)
      return
    }
    const t = await resolveActiveTheme()
    applyToCSSVars(t)
    setTheme(t)
    setLoading(false)
  }, [])

  const applyCompanyTheme = useCallback(async (companyId: string) => {
    sessionStorage.setItem(SESSION_THEME_KEY, companyId)
    setSessionCompanyId(companyId)
    setLoading(true)
    const t = await fetchCompanyThemeById(companyId)
    applyToCSSVars(t)
    setTheme(t)
    setLoading(false)
  }, [])

  const resetTheme = useCallback(async () => {
    sessionStorage.removeItem(SESSION_THEME_KEY)
    setSessionCompanyId(null)
    setLoading(true)
    const t = await fetchDefaultCompanyTheme()
    applyToCSSVars(t)
    setTheme(t)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refreshTheme()

    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Clear session theme preference and revert to Congruent default
        sessionStorage.removeItem(SESSION_THEME_KEY)
        setSessionCompanyId(null)
        void fetchDefaultCompanyTheme().then((t) => {
          applyToCSSVars(t)
          setTheme(t)
          setLoading(false)
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [refreshTheme])

  return (
    <BrandThemeContext.Provider
      value={{ theme, loading, sessionCompanyId, refreshTheme, applyCompanyTheme, resetTheme }}
    >
      {children}
    </BrandThemeContext.Provider>
  )
}
