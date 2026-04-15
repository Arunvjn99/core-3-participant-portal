import type { User } from '@supabase/supabase-js'
import type { UserProfile } from '@/core/types/user.types'

/**
 * First name for greetings: profile full_name, then auth user_metadata, then email local-part.
 */
export function getAuthenticatedFirstName(
  profile: UserProfile | null | undefined,
  user: User | null | undefined
): string {
  if (profile?.full_name?.trim()) {
    const first = profile.full_name.trim().split(/\s+/)[0]
    if (first) return first
  }

  const meta = user?.user_metadata as Record<string, unknown> | undefined
  if (meta) {
    if (typeof meta.first_name === 'string' && meta.first_name.trim()) {
      return meta.first_name.trim().split(/\s+/)[0]!
    }
    if (typeof meta.full_name === 'string' && meta.full_name.trim()) {
      return meta.full_name.trim().split(/\s+/)[0]!
    }
    if (typeof meta.name === 'string' && meta.name.trim()) {
      return meta.name.trim().split(/\s+/)[0]!
    }
  }

  if (profile?.email?.includes('@')) {
    return profile.email.split('@')[0]!
  }
  if (user?.email?.includes('@')) {
    return user.email.split('@')[0]!
  }

  return 'there'
}

export function formatFirstNameForDisplay(raw: string): string {
  if (!raw?.trim() || raw === 'there') return 'there'
  const t = raw.trim()
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
}
