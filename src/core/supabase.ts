import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { hasValidSupabaseEnv } from '../lib/constants'

let supabase: SupabaseClient | null = null

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('[Supabase] Invalid URL format — must start with https://')
}

if (hasValidSupabaseEnv() && supabaseUrl && supabaseAnonKey) {
  // Trimmed values — matches import.meta.env.VITE_SUPABASE_* (see hasValidSupabaseEnv).
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
} else {
  console.info('[Supabase] Running in demo mode — set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local (real project values).')
}

export { supabase }
export default supabase
