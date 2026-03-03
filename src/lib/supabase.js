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
      // Prevent Supabase from firing onAuthStateChange on tab focus/visibility change.
      // Without this, switching tabs triggers a session refresh → setUser → DataContext
      // re-runs its useEffect → full app reload (loading spinner shows again).
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: true,
      // Disable the visibility-change listener that causes the tab-switch reload
      storageKey: 'pulse_auth',
    },
    realtime: {
      // Keep realtime alive across tab switches
      params: { eventsPerSecond: 10 },
    },
  }
)
