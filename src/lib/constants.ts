export const APP_NAME = 'Participant Portal'
export const APP_VERSION = 'v1'
export const DEFAULT_VERSION = 'v1'

export const ROUTES = {
  LOGIN: `/${APP_VERSION}/login`,
  SIGNUP: `/${APP_VERSION}/signup`,
  VERIFY_OTP: `/${APP_VERSION}/verify`,
  FORGOT_PASSWORD: `/${APP_VERSION}/forgot-password`,
  RESET_PASSWORD: `/${APP_VERSION}/reset-password`,
  DASHBOARD: '/dashboard',
  ENROLLMENT: '/enrollment',
  TRANSACTIONS: '/transactions',
} as const

export const ENV = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL as string | undefined,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined,
  DEBUG_BYPASS_AUTH: import.meta.env.VITE_DEBUG_BYPASS_AUTH === 'true',
  DEMO_MODE: !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY,
} as const

export const STORAGE_KEYS = {
  OTP_VERIFIED: 'otp_verified',
  ENROLLMENT_DRAFT: 'enrollment_draft',
  THEME: 'theme',
  BRAND: 'brand',
} as const
