import supabase from '../supabase'
import type { PostgrestError } from '@supabase/supabase-js'
import type { UserProfile, Company, EnrollmentStatus, EnrollmentRow } from '../types/user.types'

function logUnlessNoRows(context: string, error: PostgrestError) {
  if (error.code !== 'PGRST116') {
    console.error(`[userService] ${context}:`, error.message)
  }
}

export async function fetchProfile(userId: string): Promise<UserProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, date_of_birth, phone, state, created_at, updated_at')
    .eq('id', userId)
    .single()

  if (error) {
    logUnlessNoRows('fetchProfile', error)
    return null
  }
  return data as UserProfile
}

export async function upsertProfile(profile: Partial<UserProfile> & { id: string }): Promise<UserProfile | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single()

  if (error) {
    console.error('[userService] upsertProfile:', error.message)
    return null
  }
  return data as UserProfile
}

export async function fetchCompany(userId: string): Promise<Company | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('user_companies')
    .select(
      `
      company_id,
      role,
      companies (
        id,
        name,
        slug,
        plan_name,
        employer_match_percent,
        branding_json,
        logo_url,
        primary_color,
        created_at
      )
    `
    )
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    logUnlessNoRows('fetchCompany', error)
    return null
  }

  const row = data as unknown as { companies?: Company | Company[] | null } | null
  const c = row?.companies
  if (!c) return null
  return Array.isArray(c) ? c[0] ?? null : c
}

function normalizeEnrollmentStatus(raw: string | undefined | null): EnrollmentStatus {
  if (!raw) return 'none'
  if (raw === 'completed' || raw === 'complete') return 'complete'
  if (raw === 'not_started' || raw === 'none') return 'none'
  if (raw === 'in_progress' || raw === 'pending_review') return raw as EnrollmentStatus
  return 'none'
}

export async function fetchEnrollment(userId: string): Promise<EnrollmentRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('enrollments')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    logUnlessNoRows('fetchEnrollment', error)
    return null
  }
  return data as EnrollmentRow | null
}

export async function fetchEnrollmentStatus(userId: string): Promise<EnrollmentStatus> {
  const row = await fetchEnrollment(userId)
  if (!row) return 'none'
  return normalizeEnrollmentStatus(row.status)
}

const STEP_KEY_TO_COLUMN: Record<string, string> = {
  personalization: 'personalization_data',
  plan: 'plan_data',
  contribution: 'contribution_data',
  source: 'source_data',
  autoIncrease: 'auto_increase_data',
  investment: 'investment_data',
  readiness: 'readiness_data',
  review: 'review_data',
}

export async function saveEnrollmentStep(
  userId: string,
  stepKey: string,
  stepData: Record<string, unknown>,
  currentStep: number,
  highestCompletedStep: number
) {
  if (!supabase) return { data: null, error: new Error('Demo mode') }

  const column = STEP_KEY_TO_COLUMN[stepKey]
  if (!column) {
    console.error('[userService] saveEnrollmentStep: unknown stepKey', stepKey)
    return { data: null, error: new Error(`Unknown enrollment step: ${stepKey}`) }
  }

  const status =
    highestCompletedStep >= 7 ? 'complete' : 'in_progress'
  const completedAt =
    status === 'complete' ? new Date().toISOString() : null

  const { data: existing, error: existingErr } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingErr) {
    console.error('[userService] saveEnrollmentStep (select):', existingErr.message)
    return { data: null, error: existingErr }
  }

  const patch: Record<string, unknown> = {
    user_id: userId,
    status,
    current_step: currentStep,
    highest_completed_step: highestCompletedStep,
    updated_at: new Date().toISOString(),
    [column]: stepData,
  }

  if (completedAt) {
    patch.completed_at = completedAt
  }

  if (existing?.id) {
    return supabase.from('enrollments').update(patch).eq('id', existing.id).select().single()
  }

  return supabase.from('enrollments').insert(patch).select().single()
}
