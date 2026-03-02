import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { configError } from '../lib/supabase'
import { COLORS } from '../lib/constants'
import { Spinner } from '../components/UI'

export default function LoginPage() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSignIn() {
    if (configError) return
    setError(null)
    setLoading(true)
    try {
      await signInWithGoogle()
      // Page will redirect to Google, then back — no further action needed here
    } catch (e) {
      setError(e.message)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: COLORS.bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: 20,
    }}>
      {/* Glow blobs */}
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,142,247,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={{
        background: COLORS.surface, border: `1px solid ${COLORS.border}`,
        borderRadius: 20, padding: '44px 40px', width: 420, maxWidth: '100%',
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Logo */}
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 26, marginBottom: 16, boxShadow: '0 8px 24px rgba(79,142,247,0.3)',
        }}>◈</div>

        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 30, letterSpacing: '-0.04em', marginBottom: 6 }}>
          Pulse
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
          Project management for teams that ship fast.
        </p>

        {/* Config error */}
        {configError && (
          <div style={{
            background: '#1c0a00', border: `1px solid ${COLORS.amber}55`,
            borderRadius: 10, padding: 16, width: '100%', marginBottom: 20,
          }}>
            <div style={{ fontWeight: 700, color: COLORS.amber, marginBottom: 8, fontSize: 13 }}>
              ⚠ Supabase not configured
            </div>
            <div style={{ fontSize: 12, color: '#d97706', lineHeight: 1.7 }}>
              {configError}<br /><br />
              <strong>Fix:</strong> Create a <code style={{ background: COLORS.border, padding: '1px 4px', borderRadius: 3 }}>.env</code> file in the project root with:<br />
              <code style={{ display: 'block', marginTop: 6, color: COLORS.textDim }}>
                VITE_SUPABASE_URL=https://xxx.supabase.co<br />
                VITE_SUPABASE_ANON_KEY=eyJ...
              </code><br />
              Then restart the dev server.
            </div>
          </div>
        )}

        {/* Auth error */}
        {error && (
          <div style={{
            background: '#450a0a', border: `1px solid ${COLORS.red}55`,
            borderRadius: 10, padding: 14, width: '100%', marginBottom: 16,
            fontSize: 13, color: COLORS.red,
          }}>
            ✕ {error}
          </div>
        )}

        {/* Features */}
        {!configError && (
          <div style={{
            background: COLORS.bg, border: `1px solid ${COLORS.border}`,
            borderRadius: 12, padding: '14px 18px', width: '100%', marginBottom: 24,
            display: 'flex', flexDirection: 'column', gap: 9,
          }}>
            {[
              ['⊞', 'Kanban & list views'],
              ['✉', 'Gmail email notifications'],
              ['⚡', 'Real-time sync'],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: COLORS.accent, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: 13, color: COLORS.textDim }}>{text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Sign in button */}
        <button
          onClick={handleSignIn}
          disabled={loading || !!configError}
          style={{
            width: '100%', padding: '12px 20px',
            background: configError ? COLORS.surfaceHover : '#fff',
            color: configError ? COLORS.textMuted : '#1f2937',
            border: '1px solid #e5e7eb', borderRadius: 10,
            fontWeight: 700, fontSize: 14,
            cursor: loading || configError ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            boxShadow: configError ? 'none' : '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {loading ? <Spinner size={18} /> : (
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
          )}
          {loading ? 'Redirecting to Google…' : configError ? 'Configure .env to continue' : 'Continue with Google'}
        </button>

        <p style={{ color: COLORS.textMuted, fontSize: 11, marginTop: 16, textAlign: 'center' }}>
          You'll be redirected to Google to sign in, then right back here.
        </p>
      </div>
    </div>
  )
}
