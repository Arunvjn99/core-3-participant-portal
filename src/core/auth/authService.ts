import supabase from '../supabase'
import type { AuthChangeEvent, EmailOtpType, Session } from '@supabase/supabase-js'
import { ROUTES } from '../../lib/constants'

export async function signInWithPassword(email: string, password: string) {
  if (!supabase) return { data: null, error: new Error('Demo mode: no Supabase client') }
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUpWithPassword(email: string, password: string) {
  if (!supabase) return { data: null, error: new Error('Demo mode: no Supabase client') }
  return supabase.auth.signUp({ email, password })
}

export async function signOut() {
  if (!supabase) return
  await supabase.auth.signOut()
}

export async function getSession() {
  if (!supabase) return { data: { session: null }, error: null }
  return supabase.auth.getSession()
}

export function subscribeAuthStateChange(
  callback: (event: AuthChangeEvent, session: Session | null) => void
) {
  if (!supabase) {
    return { data: { subscription: { unsubscribe: () => {} } } }
  }
  return supabase.auth.onAuthStateChange(callback)
}

export async function verifyOtp(email: string, token: string, type: EmailOtpType = 'email') {
  if (!supabase) return { data: null, error: new Error('Demo mode: no Supabase client') }
  return supabase.auth.verifyOtp({ email, token, type })
}

export async function resetPasswordForEmail(email: string) {
  if (!supabase) {
    return { data: null, error: null, demoMode: true as const }
  }
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}${ROUTES.RESET_PASSWORD}`,
  })
  return { data, error, demoMode: false as const }
}

export async function updatePassword(newPassword: string) {
  if (!supabase) return { data: null, error: new Error('Demo mode: no Supabase client') }
  return supabase.auth.updateUser({ password: newPassword })
}
