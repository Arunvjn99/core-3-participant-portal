/** Matches public.profiles (extended) */
export interface UserProfile {
  id: string
  email: string
  full_name: string
  date_of_birth?: string | null
  phone?: string | null
  state?: string | null
  created_at: string
  updated_at?: string | null
}

/** Matches public.companies */
export interface Company {
  id: string
  name: string
  slug: string
  plan_name?: string | null
  employer_match_percent?: number | null
  branding_json?: unknown
  logo_url?: string | null
  primary_color?: string | null
  created_at?: string
}

/** Enrollment lifecycle for routing and dashboard split */
export type EnrollmentStatus = 'none' | 'in_progress' | 'complete' | 'pending_review'

/** Latest enrollment row from public.enrollments */
export interface EnrollmentRow {
  id: string
  user_id: string
  status: string
  plan_data?: unknown
  contribution_data?: unknown
  source_data?: unknown
  auto_increase_data?: unknown
  investment_data?: unknown
  readiness_data?: unknown
  review_data?: unknown
  current_step?: number | null
  highest_completed_step?: number | null
  completed_at?: string | null
  created_at?: string
  updated_at?: string | null
}

export interface UserContextValue {
  profile: UserProfile | null
  company: Company | null
  enrollmentStatus: EnrollmentStatus
  loading: boolean
  refetchProfile: () => Promise<void>
}
