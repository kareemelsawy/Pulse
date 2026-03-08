import { useState, useEffect } from 'react'
import { supabase, configError } from '../lib/supabase'
import { Icon, Spinner } from '../components/UI'
import { useTheme } from '../contexts/ThemeContext'

function useC() { const { colors, isDark } = useTheme(); return { C: colors, isDark } }

// ── Shared input / label styles ──────────────────────────────────────────────
function inp(isDark) {
  return {
    width: '100%',
    background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,20,80,0.04)',
    backdropFilter: 'blur(8px)',
    border: isDark ? '1px solid rgba(255,255,255,0.11)' : '1px solid rgba(0,60,200,0.14)',
    borderRadius: 12, padding: '11px 15px',
    color: isDark ? '#F0F4FF' : '#050D1A',
    fontSize: 14, outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.2s, box-shadow 0.2s',
    lineHeight: 1.5,
  }
}
function lbl(isDark) {
  return {
    fontSize: 11, fontWeight: 700,
    color: isDark ? 'rgba(180,200,255,0.40)' : 'rgba(0,40,120,0.45)',
    letterSpacing: '0.07em', textTransform: 'uppercase',
    display: 'block', marginBottom: 7,
  }
}
function primaryBtn(loading) {
  return {
    width: '100%', padding: '13px 20px',
    background: 'linear-gradient(135deg, #0055FF 0%, #0099FF 60%, #00CCFF 100%)',
    color: '#fff', border: '1px solid rgba(255,255,255,0.20)',
    borderRadius: 12, fontWeight: 700, fontSize: 14,
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    boxShadow: '0 4px 28px rgba(0,85,255,0.45), inset 0 1px 0 rgba(255,255,255,0.22)',
    fontFamily: "'DM Sans', inherit", transition: 'all 0.2s',
    letterSpacing: '-0.01em', opacity: loading ? 0.7 : 1,
  }
}
function googleBtn(isDark) {
  return {
    width: '100%', padding: '12px 20px',
    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.80)',
    backdropFilter: 'blur(12px)',
    color: isDark ? '#F0F4FF' : '#050D1A',
    border: isDark ? '1px solid rgba(255,255,255,0.14)' : '1px solid rgba(0,60,200,0.12)',
    borderRadius: 12, fontWeight: 600, fontSize: 14,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    fontFamily: "'DM Sans', inherit", transition: 'all 0.2s', marginBottom: 0,
  }
}

// ── Shared error/success boxes ────────────────────────────────────────────────
function ErrBox({ msg, isDark }) {
  if (!msg) return null
  return (
    <div style={{
      background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.25)',
      borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13,
      color: isDark ? '#FCA5A5' : '#B91C1C',
      display: 'flex', alignItems: 'flex-start', gap: 8,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>✕</span>
      <span style={{ lineHeight: 1.5 }}>{msg}</span>
    </div>
  )
}
function OkBox({ msg, isDark }) {
  if (!msg) return null
  return (
    <div style={{
      background: 'rgba(52,209,122,0.10)', border: '1px solid rgba(52,209,122,0.25)',
      borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13,
      color: isDark ? '#6EE7B7' : '#15803D',
      display: 'flex', alignItems: 'flex-start', gap: 8,
    }}>
      <span style={{ flexShrink: 0, marginTop: 1 }}>✓</span>
      <span style={{ lineHeight: 1.5 }}>{msg}</span>
    </div>
  )
}
function OrDivider({ isDark }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
      <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,60,200,0.08)' }} />
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', color: isDark ? 'rgba(180,200,255,0.30)' : 'rgba(0,40,120,0.30)' }}>OR</span>
      <div style={{ flex: 1, height: 1, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,60,200,0.08)' }} />
    </div>
  )
}
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

// ── Left panel — brand / visual ───────────────────────────────────────────────
function LeftPanel({ isDark }) {
  const white  = (o) => `rgba(255,255,255,${o})`
  const navy   = (o) => `rgba(0,10,40,${o})`
  const accent = isDark ? white : navy

  return (
    <div style={{
      flex: '0 0 52%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '52px 60px',
      overflow: 'hidden',
      background: isDark
        ? 'linear-gradient(145deg, #000 0%, #000820 30%, #001560 55%, #003fa0 72%, #0077cc 85%, #00b4d8 100%)'
        : 'linear-gradient(145deg, #fff 0%, #f0f6ff 30%, #cce0ff 55%, #80b8ff 72%, #3385ff 85%, #0055cc 100%)',
    }}>

      {/* Grain */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        opacity: 0.04,
        mixBlendMode: 'soft-light',
      }} />

      {/* Soft vignette — bottom fades to deepen depth */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: isDark
          ? 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)'
          : 'linear-gradient(to top, rgba(0,20,80,0.18) 0%, transparent 50%)',
      }} />

      {/* ── Logo — top left ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          fontFamily: 'Syne', fontWeight: 900,
          fontSize: 15, letterSpacing: '0.18em',
          color: isDark ? white(0.90) : navy(0.85),
        }}>PULSE</span>
        <span style={{
          fontSize: 10, fontWeight: 500, letterSpacing: '0.06em',
          color: isDark ? white(0.25) : navy(0.30),
          paddingLeft: 10,
          borderLeft: isDark ? `1px solid ${white(0.15)}` : `1px solid ${navy(0.15)}`,
        }}>Homzmart</span>
      </div>

      {/* ── Centre — the only words that matter ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Eyebrow line */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28,
        }}>
          <div style={{
            width: 20, height: 1,
            background: isDark ? white(0.35) : navy(0.30),
          }} />
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: isDark ? white(0.35) : navy(0.35),
          }}>Program Management</span>
        </div>

        {/* Display headline — massive, sparse */}
        <h2 style={{
          fontFamily: 'Syne',
          fontWeight: 800,
          fontSize: 'clamp(38px, 4.5vw, 64px)',
          lineHeight: 1.05,
          letterSpacing: '-0.04em',
          color: isDark ? white(0.97) : navy(0.95),
          margin: 0,
          marginBottom: 28,
        }}>
          Every team.<br />
          One truth.
        </h2>

        {/* Single sentence — nothing more */}
        <p style={{
          fontSize: 15,
          fontWeight: 300,
          lineHeight: 1.75,
          letterSpacing: '-0.01em',
          color: isDark ? white(0.40) : navy(0.45),
          maxWidth: 300,
          margin: 0,
        }}>
          Programs, actions, and meetings — tracked and closed.
        </p>
      </div>

      {/* ── Bottom — three stark numbers ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* Thin divider */}
        <div style={{
          width: 32, height: 1,
          background: isDark ? white(0.18) : navy(0.18),
          marginBottom: 24,
        }} />

        <div style={{ display: 'flex', gap: 36 }}>
          {[
            { n: '4×',  label: 'faster delivery' },
            { n: '100%', label: 'task visibility'  },
            { n: '0',   label: 'missed actions'    },
          ].map(({ n, label }) => (
            <div key={label}>
              <div style={{
                fontFamily: 'Syne',
                fontWeight: 800,
                fontSize: 22,
                letterSpacing: '-0.03em',
                color: isDark ? white(0.90) : navy(0.88),
                lineHeight: 1,
                marginBottom: 4,
              }}>{n}</div>
              <div style={{
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: isDark ? white(0.28) : navy(0.35),
              }}>{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Right panel — glass form wrapper ──────────────────────────────────────────
function RightPanel({ children, isDark }) {
  return (
    <div style={{
      flex: '0 0 48%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 56px',
      position: 'relative',
      background: isDark ? 'rgba(0,4,20,0.70)' : 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      borderLeft: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,60,200,0.08)',
      overflow: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 380, animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
        {children}
      </div>
    </div>
  )
}

// ── Split layout wrapper ──────────────────────────────────────────────────────
function SplitLayout({ children, isDark }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      <LeftPanel isDark={isDark} />
      <RightPanel isDark={isDark}>{children}</RightPanel>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPage({ onGoSignup, onGoReset }) {
  const { C, isDark } = useC()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  async function handleLogin() {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.signInWithPassword({ email, password })
    if (e) { setError(e.message); setLoading(false) }
  }
  async function handleGoogle() {
    setError(null)
    const { error: e } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })
    if (e) setError(e.message)
  }

  const textColor  = isDark ? '#F0F4FF'               : '#050D1A'
  const mutedColor = isDark ? 'rgba(180,200,255,0.40)' : 'rgba(0,40,120,0.45)'
  const accentColor = isDark ? '#60A5FA' : '#0055FF'

  return (
    <SplitLayout isDark={isDark}>
      {/* Section heading */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', color: textColor, marginBottom: 6, lineHeight: 1.2 }}>
          Welcome back
        </h1>
        <p style={{ fontSize: 14, color: mutedColor, lineHeight: 1.6, fontWeight: 300 }}>
          Sign in to your Pulse workspace
        </p>
      </div>

      {configError && (
        <div style={{ background: 'rgba(251,191,36,0.10)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 18, fontSize: 12, color: isDark ? '#FCD34D' : '#92400E', display: 'flex', gap: 8 }}>
          <Icon name="warning" size={13} color={isDark ? '#FCD34D' : '#92400E'} />
          <span style={{ lineHeight: 1.5 }}>{configError}</span>
        </div>
      )}

      <ErrBox msg={error} isDark={isDark} />

      {/* Google button */}
      <button onClick={handleGoogle} style={googleBtn(isDark)}
        onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,1)'}
        onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.80)'}>
        <GoogleIcon /> Continue with Google
      </button>

      <OrDivider isDark={isDark} />

      {/* Email/password fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 10 }}>
        <div>
          <label style={lbl(isDark)}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@homzmart.com" autoFocus
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={inp(isDark)}
            onFocus={e => { e.target.style.borderColor = isDark ? 'rgba(0,150,255,0.50)' : 'rgba(0,85,255,0.35)'; e.target.style.boxShadow = isDark ? '0 0 0 3px rgba(0,100,255,0.12)' : '0 0 0 3px rgba(0,85,255,0.08)' }}
            onBlur={e  => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
          />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
            <label style={{ ...lbl(isDark), marginBottom: 0 }}>Password</label>
            <span onClick={onGoReset} style={{ fontSize: 12, color: accentColor, cursor: 'pointer', fontWeight: 500, opacity: 0.8, transition: 'opacity 0.15s' }}
              onMouseEnter={e => e.target.style.opacity = '1'}
              onMouseLeave={e => e.target.style.opacity = '0.8'}>
              Forgot password?
            </span>
          </div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={inp(isDark)}
            onFocus={e => { e.target.style.borderColor = isDark ? 'rgba(0,150,255,0.50)' : 'rgba(0,85,255,0.35)'; e.target.style.boxShadow = isDark ? '0 0 0 3px rgba(0,100,255,0.12)' : '0 0 0 3px rgba(0,85,255,0.08)' }}
            onBlur={e  => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
          />
        </div>
      </div>

      {/* Sign in button */}
      <button onClick={handleLogin} disabled={loading || !!configError}
        style={{ ...primaryBtn(loading || !!configError), marginTop: 10, marginBottom: 0 }}
        onMouseEnter={e => { if(!loading) e.currentTarget.style.filter='brightness(1.12)' }}
        onMouseLeave={e => { e.currentTarget.style.filter='' }}>
        {loading ? <Spinner size={18} /> : 'Sign In →'}
      </button>

      <p style={{ fontSize: 13, color: mutedColor, textAlign: 'center', marginTop: 24 }}>
        Don't have an account?{' '}
        <span onClick={onGoSignup} style={{ color: accentColor, cursor: 'pointer', fontWeight: 600 }}>Sign up</span>
      </p>
    </SplitLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNUP PAGE
// ─────────────────────────────────────────────────────────────────────────────
export function SignupPage({ onGoLogin }) {
  const { C, isDark } = useC()
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [done,     setDone]     = useState(false)

  const textColor   = isDark ? '#F0F4FF'               : '#050D1A'
  const mutedColor  = isDark ? 'rgba(180,200,255,0.40)' : 'rgba(0,40,120,0.45)'
  const accentColor = isDark ? '#60A5FA' : '#0055FF'

  async function handleSignup() {
    if (!name.trim())       { setError('Please enter your name.'); return }
    if (!email)             { setError('Please enter your email.'); return }
    if (password.length < 6){ setError('Password must be at least 6 characters.'); return }
    if (password !== confirm){ setError('Passwords do not match.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } })
    if (e) { setError(e.message); setLoading(false) } else { setDone(true); setLoading(false) }
  }

  if (done) return (
    <SplitLayout isDark={isDark}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>✉</div>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: textColor, marginBottom: 10, letterSpacing: '-0.03em' }}>Account created!</h2>
        <p style={{ color: mutedColor, fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>Your account is ready. Click below to sign in.</p>
        <button onClick={onGoLogin} style={primaryBtn(false)}>Go to Sign In</button>
      </div>
    </SplitLayout>
  )

  const fields = [
    ['Full Name','text','Your full name',name,setName],
    ['Email','email','you@homzmart.com',email,setEmail],
    ['Password','password','6+ characters',password,setPassword],
    ['Confirm Password','password','Same as above',confirm,setConfirm],
  ]

  return (
    <SplitLayout isDark={isDark}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', color: textColor, marginBottom: 6 }}>Create account</h1>
        <p style={{ fontSize: 14, color: mutedColor, lineHeight: 1.6, fontWeight: 300 }}>Join your team on Pulse</p>
      </div>

      <ErrBox msg={error} isDark={isDark} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        {fields.map(([label, type, ph, val, setter], i, arr) => (
          <div key={label}>
            <label style={lbl(isDark)}>{label}</label>
            <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph}
              autoFocus={i === 0}
              onKeyDown={e => e.key === 'Enter' && i === arr.length - 1 && handleSignup()}
              style={inp(isDark)}
              onFocus={e => { e.target.style.borderColor = isDark ? 'rgba(0,150,255,0.50)' : 'rgba(0,85,255,0.35)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,100,255,0.10)' }}
              onBlur={e  => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
            />
          </div>
        ))}
      </div>

      <button onClick={handleSignup} disabled={loading} style={primaryBtn(loading)}
        onMouseEnter={e => { if(!loading) e.currentTarget.style.filter='brightness(1.12)' }}
        onMouseLeave={e => { e.currentTarget.style.filter='' }}>
        {loading ? <Spinner size={18} /> : 'Create Account →'}
      </button>

      <p style={{ fontSize: 13, color: mutedColor, textAlign: 'center', marginTop: 24 }}>
        Already have an account?{' '}
        <span onClick={onGoLogin} style={{ color: accentColor, cursor: 'pointer', fontWeight: 600 }}>Sign in</span>
      </p>
    </SplitLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RESET PAGE
// ─────────────────────────────────────────────────────────────────────────────
export function ResetPage({ onGoLogin }) {
  const { C, isDark } = useC()
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(null)

  const textColor   = isDark ? '#F0F4FF'               : '#050D1A'
  const mutedColor  = isDark ? 'rgba(180,200,255,0.40)' : 'rgba(0,40,120,0.45)'
  const accentColor = isDark ? '#60A5FA' : '#0055FF'

  async function handleReset() {
    if (!email) { setError('Please enter your email.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    if (e) { setError(e.message); setLoading(false) } else { setSuccess(`Reset link sent to ${email}.`); setLoading(false) }
  }

  return (
    <SplitLayout isDark={isDark}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', color: textColor, marginBottom: 6 }}>Reset password</h1>
        <p style={{ fontSize: 14, color: mutedColor, lineHeight: 1.6, fontWeight: 300 }}>
          Enter your email and we'll send a reset link.
        </p>
      </div>

      <ErrBox msg={error} isDark={isDark} />
      <OkBox msg={success} isDark={isDark} />

      {!success && (
        <>
          <label style={lbl(isDark)}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@homzmart.com" autoFocus
            onKeyDown={e => e.key === 'Enter' && handleReset()}
            style={{ ...inp(isDark), marginBottom: 20 }}
            onFocus={e => { e.target.style.borderColor = isDark ? 'rgba(0,150,255,0.50)' : 'rgba(0,85,255,0.35)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,100,255,0.10)' }}
            onBlur={e  => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
          />
          <button onClick={handleReset} disabled={loading} style={primaryBtn(loading)}
            onMouseEnter={e => { if(!loading) e.currentTarget.style.filter='brightness(1.12)' }}
            onMouseLeave={e => { e.currentTarget.style.filter='' }}>
            {loading ? <Spinner size={18} /> : 'Send Reset Link →'}
          </button>
        </>
      )}

      <p style={{ fontSize: 13, color: mutedColor, marginTop: 24 }}>
        <span onClick={onGoLogin} style={{ color: accentColor, cursor: 'pointer', fontWeight: 600 }}>← Back to Sign In</span>
      </p>
    </SplitLayout>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW PASSWORD PAGE
// ─────────────────────────────────────────────────────────────────────────────
export function NewPasswordPage({ onGoLogin }) {
  const { C, isDark } = useC()
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [done,     setDone]     = useState(false)

  const textColor  = isDark ? '#F0F4FF'               : '#050D1A'
  const mutedColor = isDark ? 'rgba(180,200,255,0.40)' : 'rgba(0,40,120,0.45)'

  async function handleUpdate() {
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm)  { setError('Passwords do not match.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.updateUser({ password })
    if (e) { setError(e.message); setLoading(false) } else { setDone(true); setLoading(false) }
  }

  if (done) return (
    <SplitLayout isDark={isDark}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 20 }}>✓</div>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, color: textColor, marginBottom: 10, letterSpacing: '-0.03em' }}>Password updated!</h2>
        <p style={{ color: mutedColor, fontSize: 14, marginBottom: 28 }}>You can now sign in with your new password.</p>
        <button onClick={onGoLogin} style={primaryBtn(false)}>Sign In →</button>
      </div>
    </SplitLayout>
  )

  return (
    <SplitLayout isDark={isDark}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', color: textColor, marginBottom: 6 }}>New password</h1>
        <p style={{ fontSize: 14, color: mutedColor, fontWeight: 300 }}>Choose a strong new password.</p>
      </div>

      <ErrBox msg={error} isDark={isDark} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
        <div>
          <label style={lbl(isDark)}>New Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="6+ characters" autoFocus style={inp(isDark)}
            onFocus={e => { e.target.style.borderColor = isDark ? 'rgba(0,150,255,0.50)' : 'rgba(0,85,255,0.35)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,100,255,0.10)' }}
            onBlur={e  => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
          />
        </div>
        <div>
          <label style={lbl(isDark)}>Confirm Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Same as above"
            onKeyDown={e => e.key === 'Enter' && handleUpdate()} style={inp(isDark)}
            onFocus={e => { e.target.style.borderColor = isDark ? 'rgba(0,150,255,0.50)' : 'rgba(0,85,255,0.35)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,100,255,0.10)' }}
            onBlur={e  => { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }}
          />
        </div>
      </div>

      <button onClick={handleUpdate} disabled={loading} style={primaryBtn(loading)}
        onMouseEnter={e => { if(!loading) e.currentTarget.style.filter='brightness(1.12)' }}
        onMouseLeave={e => { e.currentTarget.style.filter='' }}>
        {loading ? <Spinner size={18} /> : 'Update Password →'}
      </button>
    </SplitLayout>
  )
}
