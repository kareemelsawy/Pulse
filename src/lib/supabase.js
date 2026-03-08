import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Detect missing config and show a clear error
export const configError = (!supabaseUrl || supabaseUrl.includes('your-project') ||
  !supabaseAnonKey || supabaseAnonKey.includes('your-anon'))
  ? 'Missing Supabase config. Copy .env.example to .env and fill in your project URL and anon key.'
  : null

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      detectSessionInUrl: true,  // required — reads OAuth token from URL hash on redirect
      persistSession: true,
      autoRefreshToken: true,
      storageKey: 'pulse_auth',
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
)
