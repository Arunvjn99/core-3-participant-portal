/**
 * supabaseIntegration.ts
 * Helper functions for white-label auth system using Supabase.
 * All functions gracefully handle the case where supabase client is null (demo mode).
 */

import { supabase } from '../core/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SignUpData {
  fullName: string
  email: string
  password: string
  stateProvince: string
  country: string
  companyId: string
}

export interface UserProfile {
  id: string
  user_id: string
  name: string
  email: string
  company_id: string
  state: string
  country: string
  status: string
  created_at: string
}

export interface Company {
  id: string
  name: string
  logo?: string
  primary_color: string
  secondary_color: string
  accent_color: string
  font_family?: string
  status: string
}

export interface ThemeContext {
  companyId: string
  companyName: string
  primary: string
  secondary: string
  accent: string
  logo?: string
}

// ─── Auth Helpers ─────────────────────────────────────────────────────────────

/**
 * Sign up a new user and create their profile row.
 */
export async function signUpUser(data: SignUpData) {
  if (!supabase) {
    console.info('[Demo] signUpUser called — no Supabase connection')
    return { data: null, error: null }
  }

  // 1. Create auth user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        full_name: data.fullName,
        company_id: data.companyId,
      },
    },
  })

  if (authError) return { data: null, error: authError }

  // 2. Insert profile row (if auth succeeded)
  if (authData.user) {
    const { error: profileError } = await supabase
      .from('user_profile')
      .insert({
        user_id: authData.user.id,
        name: data.fullName,
        email: data.email,
        company_id: data.companyId,
        state: data.stateProvince,
        country: data.country,
        status: 'active',
      })

    if (profileError) {
      console.error('[supabaseIntegration] Profile insert failed:', profileError)
      // Don't block — auth user was created, profile can be created on next login
    }

    // 3. Write audit log
    supabase.from('audit_log').insert({
      user_id: authData.user.id,
      event_type: 'signup',
      metadata: { company_id: data.companyId, email: data.email },
    }).then(() => {}) // fire-and-forget
  }

  return { data: authData, error: null }
}

/**
 * Sign in with email and password.
 */
export async function signInUser(email: string, password: string) {
  if (!supabase) {
    console.info('[Demo] signInUser called — no Supabase connection')
    return { data: null, error: null }
  }

  const result = await supabase.auth.signInWithPassword({ email, password })

  // Write audit log
  if (result.data?.user) {
    supabase.from('audit_log').insert({
      user_id: result.data.user.id,
      event_type: 'login',
      metadata: { email },
    }).then(() => {}) // fire-and-forget
  }

  return result
}

/**
 * Sign out the current user.
 */
export async function signOutUser() {
  if (!supabase) return { error: null }
  return supabase.auth.signOut()
}

// ─── Profile Helpers ──────────────────────────────────────────────────────────

/**
 * Fetch a user's profile row.
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    console.error('[supabaseIntegration] getUserProfile error:', error)
    return null
  }
  return data as UserProfile
}

/**
 * Update a user's profile row.
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  if (!supabase) return { error: null }

  return supabase
    .from('user_profile')
    .update(updates)
    .eq('user_id', userId)
}

/**
 * Subscribe to real-time profile changes.
 */
export function subscribeToProfileChanges(
  userId: string,
  callback: (profile: UserProfile) => void,
) {
  if (!supabase) return () => {}

  const channel = supabase
    .channel(`profile:${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'user_profile', filter: `user_id=eq.${userId}` },
      (payload) => { callback(payload.new as UserProfile) },
    )
    .subscribe()

  return () => { supabase!.removeChannel(channel) }
}

// ─── Company Helpers ──────────────────────────────────────────────────────────

/**
 * Fetch all active companies (for the company selector).
 */
export async function getAllCompanies(): Promise<Company[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('status', 'active')
    .order('name')

  if (error) {
    console.error('[supabaseIntegration] getAllCompanies error:', error)
    return []
  }

  return (data || []) as Company[]
}

/**
 * Fetch branding for a single company.
 */
export async function getCompanyBranding(companyId: string): Promise<Company | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', companyId)
    .single()

  if (error) {
    console.error('[supabaseIntegration] getCompanyBranding error:', error)
    return null
  }
  return data as Company
}

/**
 * Get the full theme context for a logged-in user (reads their company's branding).
 */
export async function getThemeContext(userId: string): Promise<ThemeContext | null> {
  if (!supabase) return null

  const profile = await getUserProfile(userId)
  if (!profile?.company_id) return null

  const company = await getCompanyBranding(profile.company_id)
  if (!company) return null

  return {
    companyId: company.id,
    companyName: company.name,
    primary: company.primary_color,
    secondary: company.secondary_color,
    accent: company.accent_color,
    logo: company.logo,
  }
}

/**
 * Update a user's theme preference.
 */
export async function updateThemePreference(userId: string, companyId: string) {
  if (!supabase) return { error: null }

  return supabase
    .from('user_theme_preferences')
    .upsert({ user_id: userId, company_id: companyId, updated_at: new Date().toISOString() })
}
