import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { ENV } from '../lib/constants'

let supabase: SupabaseClient | null = null

const supabaseUrl = ENV.SUPABASE_URL

if (supabaseUrl && !supabaseUrl.startsWith('https://')) {
  console.error('[Supabase] Invalid URL format — must start with https://')
}

if (!ENV.DEMO_MODE && supabaseUrl && ENV.SUPABASE_ANON_KEY) {
  supabase = createClient(supabaseUrl, ENV.SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  })
} else {
  console.info('[Supabase] Running in demo mode — no real Supabase connection.')
}

export { supabase }
export default supabase
