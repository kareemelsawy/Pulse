import { useState } from 'react'
import { supabase, configError } from '../lib/supabase'
import { Spinner } from '../components/UI'
import { useTheme } from '../contexts/ThemeContext'

function useC() { const { isDark } = useTheme(); return isDark }

// ─── Shared atoms ─────────────────────────────────────────────────────────────
function inp(d) {
  return {
    width: '100%', boxSizing: 'border-box',
    background: d ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.90)',
    border: d ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(15,30,80,0.14)',
    borderRadius: 10, padding: '11px 14px',
    color: d ? '#EEF2FF' : '#0A0F1E',
    fontSize: 14, outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    transition: 'border-color 0.15s, box-shadow 0.15s',
    lineHeight: 1.5, display: 'block',
  }
}
function lbl(d) {
  return {
    fontSize: 11, fontWeight: 600,
    color: d ? 'rgba(180,200,255,0.38)' : 'rgba(10,30,80,0.42)',
    letterSpacing: '0.07em', textTransform: 'uppercase',
    display: 'block', marginBottom: 6,
  }
}
function onFocus(e, d) {
  e.target.style.borderColor = d ? 'rgba(80,160,255,0.55)' : 'rgba(26,86,255,0.40)'
  e.target.style.boxShadow   = d ? '0 0 0 3px rgba(0,120,255,0.10)' : '0 0 0 3px rgba(26,86,255,0.08)'
}
function onBlur(e)  { e.target.style.borderColor = ''; e.target.style.boxShadow = '' }

function PrimaryBtn({ loading, onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        width: '100%', padding: '12px 20px',
        background: 'linear-gradient(135deg, #0050EE 0%, #0099FF 100%)',
        color: '#fff', border: 'none',
        borderRadius: 10, fontWeight: 600, fontSize: 14,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        boxShadow: '0 2px 20px rgba(0,80,238,0.40)',
        fontFamily: "'DM Sans', sans-serif",
        letterSpacing: '-0.01em', opacity: disabled ? 0.65 : 1,
        transition: 'opacity 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.boxShadow = '0 4px 28px rgba(0,80,238,0.60)' }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 20px rgba(0,80,238,0.40)' }}>
      {loading ? <Spinner size={16} /> : children}
    </button>
  )
}

function GhostBtn({ onClick, children, isDark }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', padding: '11px 20px',
      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)',
      color: isDark ? '#C8D8FF' : '#1A1A2E',
      border: isDark ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(15,30,80,0.12)',
      borderRadius: 10, fontWeight: 500, fontSize: 14,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      fontFamily: "'DM Sans', sans-serif",
      transition: 'background 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,1)'}
    onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.85)'}>
      {children}
    </button>
  )
}

function ErrBox({ msg, d }) {
  if (!msg) return null
  return <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 8, padding: '9px 13px', marginBottom: 14, fontSize: 13, color: d ? '#FCA5A5' : '#B91C1C', lineHeight: 1.5 }}>✕ {msg}</div>
}
function OkBox({ msg, d }) {
  if (!msg) return null
  return <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', borderRadius: 8, padding: '9px 13px', marginBottom: 14, fontSize: 13, color: d ? '#86EFAC' : '#15803D', lineHeight: 1.5 }}>✓ {msg}</div>
}
function OrLine({ d }) {
  const c = d ? 'rgba(255,255,255,0.07)' : 'rgba(15,30,80,0.08)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
      <div style={{ flex: 1, height: 1, background: c }} />
      <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', color: d ? 'rgba(180,200,255,0.25)' : 'rgba(10,30,80,0.28)' }}>OR</span>
      <div style={{ flex: 1, height: 1, background: c }} />
    </div>
  )
}
function GoogleIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

// ─── Left Panel — immersive brand side ───────────────────────────────────────
function LeftPanel({ d }) {
  const w = o => `rgba(255,255,255,${o})`
  const n = o => `rgba(4,12,48,${o})`
  const fg  = d ? w : n
  const bg  = d
    ? 'linear-gradient(160deg, #000308 0%, #000d2e 35%, #001f6e 62%, #0055bb 80%, #0088d4 93%, #00aee8 100%)'
    : 'linear-gradient(160deg, #f8fbff 0%, #ddeeff 30%, #a8d4ff 55%, #5aa8ff 75%, #1a6dff 90%, #0044cc 100%)'

  const stats = [
    { n: '4×',   l: 'Faster delivery'  },
    { n: '100%', l: 'Task visibility'   },
    { n: '0',    l: 'Missed actions'    },
  ]

  return (
    <div style={{
      flex: '0 0 50%', position: 'relative',
      display: 'flex', flexDirection: 'column',
      padding: '48px 56px', overflow: 'hidden', background: bg,
    }}>

      {/* Film grain */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")",
        opacity: d ? 0.045 : 0.028, mixBlendMode: 'overlay',
      }} />

      {/* Deep vignette bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '45%', pointerEvents: 'none',
        background: d ? 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' : 'linear-gradient(to top, rgba(0,30,100,0.22), transparent)',
      }} />

      {/* ── Wordmark ── */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, marginBottom: 'auto' }}>
        <div style={{
          width: 30, height: 30, borderRadius: 9,
          background: d ? w(0.12) : 'rgba(255,255,255,0.65)',
          border: d ? `1px solid ${w(0.18)}` : '1px solid rgba(255,255,255,0.80)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
        }}>✦</div>
        <span style={{
          fontFamily: 'Syne', fontWeight: 900, fontSize: 14,
          letterSpacing: '0.20em', color: fg(0.88),
        }}>PULSE</span>
        <div style={{ width: 1, height: 14, background: fg(0.15), margin: '0 2px' }} />
        <span style={{ fontSize: 11, fontWeight: 400, letterSpacing: '0.04em', color: fg(0.35) }}>Homzmart</span>
      </div>

      {/* ── Centred hero text ── */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: 16 }}>

        {/* Micro label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
          <div style={{ width: 24, height: 1, background: fg(0.30) }} />
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: fg(0.38) }}>Program Management</span>
        </div>

        {/* Headline — only 4 words */}
        <h2 style={{
          fontFamily: 'Syne', fontWeight: 800,
          fontSize: 'clamp(40px, 4.8vw, 68px)',
          lineHeight: 1.02, letterSpacing: '-0.04em',
          color: fg(0.96), margin: 0, marginBottom: 24,
        }}>
          Every team.<br />One truth.
        </h2>

        {/* Subline */}
        <p style={{
          fontSize: 14, fontWeight: 300, lineHeight: 1.8,
          color: fg(0.38), maxWidth: 280, margin: 0,
          letterSpacing: '0.01em',
        }}>
          Programs, actions, meetings —<br />tracked and closed.
        </p>
      </div>

      {/* ── Stats row ── */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ width: 28, height: 1, background: fg(0.16), marginBottom: 22 }} />
        <div style={{ display: 'flex', gap: 32 }}>
          {stats.map(({ n, l }) => (
            <div key={l}>
              <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em', color: fg(0.90), lineHeight: 1, marginBottom: 5 }}>{n}</div>
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.09em', textTransform: 'uppercase', color: fg(0.28) }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Right Panel — clean form side ───────────────────────────────────────────
function RightPanel({ children, d }) {
  return (
    <div style={{
      flex: '0 0 50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '48px 56px', overflowY: 'auto',
      background: d ? 'rgba(2,5,22,0.80)' : 'rgba(248,251,255,0.85)',
      borderLeft: d ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(15,30,100,0.08)',
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>{children}</div>
    </div>
  )
}

function SplitWrap({ children, d }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <LeftPanel d={d} />
      <RightPanel d={d}>{children}</RightPanel>
    </div>
  )
}

// ─── Heading block ────────────────────────────────────────────────────────────
function FormHead({ title, sub, d }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', color: d ? '#EEF2FF' : '#0A0F1E', marginBottom: 5, lineHeight: 1.2 }}>{title}</h1>
      <p style={{ fontSize: 13, color: d ? 'rgba(180,200,255,0.42)' : 'rgba(10,30,80,0.45)', fontWeight: 300, lineHeight: 1.6 }}>{sub}</p>
    </div>
  )
}

function FootNote({ d, children }) {
  return <p style={{ fontSize: 13, color: d ? 'rgba(180,200,255,0.38)' : 'rgba(10,30,80,0.42)', textAlign: 'center', marginTop: 22, lineHeight: 1.6 }}>{children}</p>
}
function Link({ onClick, children, d }) {
  return <span onClick={onClick} style={{ color: d ? '#60A5FA' : '#1A56FF', cursor: 'pointer', fontWeight: 600 }}>{children}</span>
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────────────────────────────────
export default function LoginPage({ onGoSignup, onGoReset }) {
  const d = useC()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

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

  return (
    <SplitWrap d={d}>
      <FormHead d={d} title="Welcome back" sub="Sign in to your Pulse workspace" />
      {configError && <div style={{ background: 'rgba(251,191,36,0.09)', border: '1px solid rgba(251,191,36,0.22)', borderRadius: 8, padding: '9px 13px', marginBottom: 14, fontSize: 12, color: d ? '#FCD34D' : '#92400E' }}>{configError}</div>}
      <ErrBox msg={error} d={d} />

      <GhostBtn isDark={d} onClick={handleGoogle}><GoogleIcon /> Continue with Google</GhostBtn>
      <OrLine d={d} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 6 }}>
        <div>
          <label style={lbl(d)}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@homzmart.com" autoFocus
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={inp(d)} onFocus={e => onFocus(e, d)} onBlur={onBlur} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <label style={{ ...lbl(d), marginBottom: 0 }}>Password</label>
            <span onClick={onGoReset} style={{ fontSize: 12, color: d ? '#60A5FA' : '#1A56FF', cursor: 'pointer', fontWeight: 500 }}>Forgot?</span>
          </div>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={inp(d)} onFocus={e => onFocus(e, d)} onBlur={onBlur} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <PrimaryBtn loading={loading} onClick={handleLogin} disabled={loading || !!configError}>Sign in →</PrimaryBtn>
      </div>

      <FootNote d={d}>No account? <Link d={d} onClick={onGoSignup}>Sign up</Link></FootNote>
    </SplitWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SIGNUP
// ─────────────────────────────────────────────────────────────────────────────
export function SignupPage({ onGoLogin }) {
  const d = useC()
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [done, setDone]         = useState(false)

  async function handleSignup() {
    if (!name.trim())        { setError('Please enter your name.'); return }
    if (!email)              { setError('Please enter your email.'); return }
    if (password.length < 6) { setError('Password must be 6+ characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } })
    if (e) { setError(e.message); setLoading(false) } else { setDone(true); setLoading(false) }
  }

  if (done) return (
    <SplitWrap d={d}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 18 }}>✉</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: d ? '#EEF2FF' : '#0A0F1E', marginBottom: 10, letterSpacing: '-0.02em' }}>Account created</h2>
        <p style={{ color: d ? 'rgba(180,200,255,0.42)' : 'rgba(10,30,80,0.45)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>You're all set. Sign in to get started.</p>
        <PrimaryBtn loading={false} onClick={onGoLogin}>Go to sign in →</PrimaryBtn>
      </div>
    </SplitWrap>
  )

  const fields = [
    ['Full Name', 'text', 'Your name', name, setName],
    ['Email', 'email', 'you@homzmart.com', email, setEmail],
    ['Password', 'password', '6+ characters', password, setPassword],
    ['Confirm', 'password', 'Same as above', confirm, setConfirm],
  ]

  return (
    <SplitWrap d={d}>
      <FormHead d={d} title="Create account" sub="Join your team on Pulse" />
      <ErrBox msg={error} d={d} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 18 }}>
        {fields.map(([label, type, ph, val, setter], i, arr) => (
          <div key={label}>
            <label style={lbl(d)}>{label}</label>
            <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph}
              autoFocus={i === 0}
              onKeyDown={e => e.key === 'Enter' && i === arr.length - 1 && handleSignup()}
              style={inp(d)} onFocus={e => onFocus(e, d)} onBlur={onBlur} />
          </div>
        ))}
      </div>
      <PrimaryBtn loading={loading} onClick={handleSignup} disabled={loading}>Create account →</PrimaryBtn>
      <FootNote d={d}>Have an account? <Link d={d} onClick={onGoLogin}>Sign in</Link></FootNote>
    </SplitWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// RESET
// ─────────────────────────────────────────────────────────────────────────────
export function ResetPage({ onGoLogin }) {
  const d = useC()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleReset() {
    if (!email) { setError('Please enter your email.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    if (e) { setError(e.message); setLoading(false) } else { setSuccess(`Reset link sent to ${email}.`); setLoading(false) }
  }

  return (
    <SplitWrap d={d}>
      <FormHead d={d} title="Reset password" sub="We'll send a link to your email." />
      <ErrBox msg={error} d={d} />
      <OkBox msg={success} d={d} />
      {!success && <>
        <label style={lbl(d)}>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="you@homzmart.com" autoFocus
          onKeyDown={e => e.key === 'Enter' && handleReset()}
          style={{ ...inp(d), marginBottom: 18 }} onFocus={e => onFocus(e, d)} onBlur={onBlur} />
        <PrimaryBtn loading={loading} onClick={handleReset} disabled={loading}>Send reset link →</PrimaryBtn>
      </>}
      <FootNote d={d}><Link d={d} onClick={onGoLogin}>← Back to sign in</Link></FootNote>
    </SplitWrap>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW PASSWORD
// ─────────────────────────────────────────────────────────────────────────────
export function NewPasswordPage({ onGoLogin }) {
  const d = useC()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [done, setDone]         = useState(false)

  async function handleUpdate() {
    if (password.length < 6)  { setError('Password must be 6+ characters.'); return }
    if (password !== confirm)  { setError('Passwords do not match.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.updateUser({ password })
    if (e) { setError(e.message); setLoading(false) } else { setDone(true); setLoading(false) }
  }

  if (done) return (
    <SplitWrap d={d}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 44, marginBottom: 18 }}>✓</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: d ? '#EEF2FF' : '#0A0F1E', marginBottom: 10, letterSpacing: '-0.02em' }}>Password updated</h2>
        <p style={{ color: d ? 'rgba(180,200,255,0.42)' : 'rgba(10,30,80,0.45)', fontSize: 14, marginBottom: 24 }}>You can now sign in with your new password.</p>
        <PrimaryBtn loading={false} onClick={onGoLogin}>Sign in →</PrimaryBtn>
      </div>
    </SplitWrap>
  )

  return (
    <SplitWrap d={d}>
      <FormHead d={d} title="New password" sub="Choose something strong." />
      <ErrBox msg={error} d={d} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 18 }}>
        <div>
          <label style={lbl(d)}>New Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="6+ characters" autoFocus style={inp(d)} onFocus={e => onFocus(e, d)} onBlur={onBlur} />
        </div>
        <div>
          <label style={lbl(d)}>Confirm</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
            placeholder="Same as above"
            onKeyDown={e => e.key === 'Enter' && handleUpdate()}
            style={inp(d)} onFocus={e => onFocus(e, d)} onBlur={onBlur} />
        </div>
      </div>
      <PrimaryBtn loading={loading} onClick={handleUpdate} disabled={loading}>Update password →</PrimaryBtn>
    </SplitWrap>
  )
}
