import { createContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import type { AuthContextValue } from '../types/auth.types'
import { getSession, signInWithPassword, signUpWithPassword, signOut as authSignOut, subscribeAuthStateChange } from './authService'
import { ENV } from '../../lib/constants'

export const AuthContext = createContext<AuthContextValue | null>(null)

/** Fake participant used only by the local demo bypass. */
const DEMO_USER = {
  id: 'demo-user',
  email: 'demo.participant@example.com',
  aud: 'authenticated',
  app_metadata: {},
  user_metadata: { full_name: 'Demo Participant' },
  created_at: new Date(0).toISOString(),
} as User

/** Remembers a demo log-out across reloads, so the login page stays up until the participant comes back in. */
const DEMO_SIGNED_OUT_KEY = 'demo_signed_out'
const demoSignedOut = () => {
  try {
    return localStorage.getItem(DEMO_SIGNED_OUT_KEY) === '1'
  } catch {
    return false
  }
}
const setDemoSignedOut = (out: boolean) => {
  try {
    if (out) localStorage.setItem(DEMO_SIGNED_OUT_KEY, '1')
    else localStorage.removeItem(DEMO_SIGNED_OUT_KEY)
  } catch {
    /* storage unavailable: the log-out still holds for this visit */
  }
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(ENV.LOCAL_DEMO_BYPASS && !demoSignedOut() ? DEMO_USER : null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(!ENV.LOCAL_DEMO_BYPASS)

  useEffect(() => {
    // Local demo bypass: dev server, no Supabase, VITE_DEBUG_BYPASS_AUTH=true. See ENV.LOCAL_DEMO_BYPASS.
    if (ENV.LOCAL_DEMO_BYPASS) return

    getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = subscribeAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await signInWithPassword(email, password)
    return { error: error as Error | null }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await signUpWithPassword(email, password)
    return { error: error as Error | null }
  }

  const signOut = async () => {
    // Demo bypass has no real session: drop the demo participant and remember it until they continue again.
    if (ENV.LOCAL_DEMO_BYPASS) {
      setDemoSignedOut(true)
      setUser(null)
      return
    }
    await authSignOut()
    setUser(null)
    setSession(null)
  }

  /** Demo bypass only: brings the demo participant back after a log-out. */
  const signInDemo = () => {
    if (!ENV.LOCAL_DEMO_BYPASS) return
    setDemoSignedOut(false)
    setUser(DEMO_USER)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, signInDemo }}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider
