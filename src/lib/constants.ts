export const APP_NAME = 'Participant Portal'
export const APP_VERSION = 'v1'
export const DEFAULT_VERSION = 'v1'

export const ROUTES = {
  LOGIN: `/${APP_VERSION}/login`,
  SIGNUP: `/${APP_VERSION}/signup`,
  VERIFY_OTP: `/${APP_VERSION}/verify`,
  FORGOT_PASSWORD: `/${APP_VERSION}/forgot-password`,
  RESET_PASSWORD: `/${APP_VERSION}/reset-password`,
  /** Legacy entry: redirects to pre- or post-enrollment dashboard based on status */
  DASHBOARD: '/dashboard',
  PRE_ENROLLMENT_DASHBOARD: '/pre-enrollment-dashboard',
  POST_ENROLLMENT_DASHBOARD: '/post-enrollment-dashboard',
  ENROLLMENT: '/enrollment',
  TRANSACTIONS: '/transactions',
} as const

/** Use for navigation when enrollment completion is known (e.g. after login redirect). */
export function dashboardPath(enrollmentComplete: boolean): string {
  return enrollmentComplete ? ROUTES.POST_ENROLLMENT_DASHBOARD : ROUTES.PRE_ENROLLMENT_DASHBOARD
}

function trimEnv(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

/** True when URL/key look like README placeholders or are empty — do not create a real Supabase client. */
function isPlaceholderSupabaseUrl(url: string): boolean {
  if (!url) return true
  const lower = url.toLowerCase()
  return lower.includes('your-project.supabase.co') || lower.includes('your_project.supabase.co')
}

function isPlaceholderAnonKey(key: string): boolean {
  if (!key) return true
  const k = key.trim().toLowerCase()
  return k === 'your-anon-key' || k.startsWith('your-anon')
}

/** Non-empty env vars that are not template placeholders; required to enable live Supabase. */
export function hasValidSupabaseEnv(): boolean {
  const url = trimEnv(import.meta.env.VITE_SUPABASE_URL)
  const key = trimEnv(import.meta.env.VITE_SUPABASE_ANON_KEY)
  if (!url || !key) return false
  if (isPlaceholderSupabaseUrl(url)) return false
  if (isPlaceholderAnonKey(key)) return false
  if (!url.startsWith('https://')) return false
  return true
}

export const ENV = {
  SUPABASE_URL: trimEnv(import.meta.env.VITE_SUPABASE_URL) || undefined,
  SUPABASE_ANON_KEY: trimEnv(import.meta.env.VITE_SUPABASE_ANON_KEY) || undefined,
  DEBUG_BYPASS_AUTH: import.meta.env.VITE_DEBUG_BYPASS_AUTH === 'true',
  DEMO_MODE: !hasValidSupabaseEnv(),
} as const

export const STORAGE_KEYS = {
  OTP_VERIFIED: 'otp_verified',
  ENROLLMENT_DRAFT: 'enrollment_draft',
  THEME: 'theme',
  BRAND: 'brand',
} as const
