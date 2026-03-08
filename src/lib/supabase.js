import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const configError = (!supabaseUrl || supabaseUrl.includes('your-project') ||
  !supabaseAnonKey || supabaseAnonKey.includes('your-anon'))
  ? 'Missing Supabase config. Copy .env.example to .env and fill in your project URL and anon key.'
  : null

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
      // Do NOT use PKCE — it prevents onAuthStateChange from firing with
      // the existing session on page load, breaking the workspace redirect
      flowType: 'implicit',
    },
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  }
)
