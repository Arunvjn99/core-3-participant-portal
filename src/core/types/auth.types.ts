import type { Session, User } from '@supabase/supabase-js'

export type { Session, User }

export interface AuthContextValue {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  /** Local demo bypass only: signs the demo participant back in after a log-out. */
  signInDemo: () => void
}

export interface SignInCredentials {
  email: string
  password: string
}
