import { useState } from 'react'
import { supabase, configError } from '../lib/supabase'
import { Spinner } from '../components/UI'

// ── Same gradient background the app uses (mirrors index.css #gradient-bg) ────
function AppBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', background: '#000' }}>
      {/* Primary gradient layer — matches [data-theme="dark"] #gradient-bg::before */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 110% 80% at 75% 40%, rgba(0,80,255,0.52)   0%, transparent 55%),
          radial-gradient(ellipse 70%  60% at 90% 20%, rgba(0,180,255,0.30)  0%, transparent 50%),
          radial-gradient(ellipse 50%  50% at 85% 55%, rgba(0,220,240,0.18)  0%, transparent 45%),
          radial-gradient(ellipse 90%  90% at 10% 80%, rgba(0,0,0,1.00)      0%, transparent 70%),
          radial-gradient(ellipse 80%  80% at 5%  5%,  rgba(0,0,10,0.95)     0%, transparent 60%)
        `,
      }} />
      {/* Secondary accent layer — matches ::after */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 40% 35% at 80% 30%, rgba(80,200,255,0.10) 0%, transparent 55%),
          radial-gradient(ellipse 30% 25% at 65% 60%, rgba(0,120,255,0.08)  0%, transparent 50%)
        `,
      }} />
      {/* Grain overlay — same as .grain in index.css */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025, mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />
    </div>
  )
}

// ── Input ─────────────────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, autoFocus, onKeyDown }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
        color: focused ? 'rgba(80,180,255,0.9)' : 'rgba(180,200,255,0.38)',
        transition: 'color 0.15s',
      }}>{label}</label>
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoFocus={autoFocus} onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${focused ? 'rgba(0,150,255,0.55)' : 'rgba(255,255,255,0.10)'}`,
          borderRadius: 10, padding: '11px 14px',
          color: '#EEF2FF', fontSize: 14, outline: 'none',
          fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: focused ? '0 0 0 3px rgba(0,120,255,0.15)' : 'none',
        }}
      />
    </div>
  )
}

// ── Buttons ───────────────────────────────────────────────────────────────────
function PrimaryBtn({ loading, onClick, disabled, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled || loading}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', padding: '12px 20px', borderRadius: 10,
        background: disabled || loading
          ? 'rgba(0,100,255,0.3)'
          : hover ? 'rgba(0,130,255,0.95)' : 'rgba(0,110,255,0.85)',
        color: '#fff',
        border: '1px solid rgba(80,180,255,0.3)',
        fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.15s',
        boxShadow: hover && !disabled && !loading
          ? '0 8px 28px rgba(0,100,255,0.45)' : '0 4px 14px rgba(0,80,255,0.20)',
        transform: hover && !disabled && !loading ? 'translateY(-1px)' : 'none',
      }}>
      {loading ? <Spinner size={16} /> : children}
    </button>
  )
}

function GhostBtn({ onClick, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', padding: '11px 20px', borderRadius: 10,
        background: hover ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)',
        color: hover ? '#EEF2FF' : 'rgba(200,215,255,0.75)',
        border: `1px solid ${hover ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.10)'}`,
        fontWeight: 500, fontSize: 14, fontFamily: "'DM Sans', sans-serif",
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'all 0.15s',
      }}>
      {children}
    </button>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.22)' }}>OR</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
    </div>
  )
}

function ErrMsg({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#FCA5A5', lineHeight: 1.5,
      display: 'flex', gap: 8,
    }}>
      <span>⚠</span><span>{msg}</span>
    </div>
  )
}

function OkMsg({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.22)',
      borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#86EFAC', lineHeight: 1.5,
      display: 'flex', gap: 8,
    }}>
      <span>✓</span><span>{msg}</span>
    </div>
  )
}

function Lnk({ onClick, children }) {
  const [h, setH] = useState(false)
  return (
    <span onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ color: h ? 'rgba(120,200,255,1)' : 'rgba(80,170,255,0.9)', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'color 0.15s' }}>
      {children}
    </span>
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

// ── Glass card (right side) ───────────────────────────────────────────────────
function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      background: 'rgba(5,8,30,0.72)',
      backdropFilter: 'blur(32px) saturate(180%)',
      WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.10)',
      borderRadius: 20,
      boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)',
      padding: '40px 40px',
      width: '100%', maxWidth: 380,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Left panel — branding & copy ──────────────────────────────────────────────
function LeftPanel() {
  return (
    <div style={{
      flex: '0 0 55%', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '52px 64px', position: 'relative', zIndex: 1,
    }}>
      {/* Top: logo — matches sidebar exactly */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg,#6B8EF7,#C084FC)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: '#fff', fontWeight: 900,
          boxShadow: '0 4px 16px rgba(107,142,247,0.40)',
        }}>✦</div>
        <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:16, letterSpacing:'-0.03em', color:'rgba(255,255,255,0.90)' }}>PULSE</div>
      </div>

      {/* Middle: headline + sub */}
      <div>
        <h1 style={{
          fontSize: 'clamp(30px, 3.5vw, 50px)', fontWeight: 700,
          lineHeight: 1.10, letterSpacing: '-0.03em',
          color: '#FFFFFF', margin: '0 0 20px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Track, update and<br />execute internal<br />programs in one place.
        </h1>
        <p style={{
          fontSize: 15, fontWeight: 300, lineHeight: 1.75,
          color: 'rgba(180,200,255,0.48)',
          maxWidth: 400, margin: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Align teams, monitor meeting actions, and keep initiatives moving forward with a centralized workspace built for Homzmart.
        </p>
      </div>

      {/* Bottom: footnote */}
      <div>
        <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.12)', marginBottom: 14 }} />
        <p style={{
          fontSize: 11, color: 'rgba(180,200,255,0.28)',
          letterSpacing: '0.04em', margin: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}>Internal tool for Homzmart teams.</p>
      </div>
    </div>
  )
}

// ── Page shell ────────────────────────────────────────────────────────────────
function Shell({ children }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: 'relative', color: '#EEF2FF',
    }}>
      <AppBackground />

      {/* Left panel */}
      <div className="login-left-panel" style={{ flex: '0 0 55%', display: 'flex', alignItems: 'stretch', position: 'relative', zIndex: 1 }}>
        <LeftPanel />
      </div>

      {/* Right panel */}
      <div style={{
        flex: '0 0 45%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', position: 'relative', zIndex: 1,
        borderLeft: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {children}
        </div>
      </div>

      <style>{`
        @keyframes checkBounce { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}

// ── Login ─────────────────────────────────────────────────────────────────────
export default function LoginPage({ onGoSignup, onGoReset }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function login() {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.signInWithPassword({ email, password })
    if (e) { setError(e.message); setLoading(false) }
  }

  async function google() {
    setError(null)
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo: window.location.origin }
    })
    if (e) setError(e.message)
  }

  return (
    <Shell>
      <GlassCard>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{
            fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em',
            color: '#EEF2FF', margin: '0 0 6px',
          }}>Welcome back</h2>
          <p style={{ fontSize: 13, color: 'rgba(180,200,255,0.42)', margin: 0, lineHeight: 1.6 }}>
            Sign in to your Pulse workspace
          </p>
        </div>

        {configError && (
          <div style={{
            background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.22)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 12, color: '#FCD34D', lineHeight: 1.5,
          }}>{configError}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ErrMsg msg={error} />
          <GhostBtn onClick={google}><GoogleIcon /> Continue with Google</GhostBtn>
          <Divider />
          <Field label="Work email" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@homzmart.com" autoFocus
            onKeyDown={e => e.key === 'Enter' && login()} />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'rgba(180,200,255,0.38)' }}>Password</label>
              <Lnk onClick={onGoReset}>Forgot password?</Lnk>
            </div>
            <Field type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              onKeyDown={e => e.key === 'Enter' && login()} />
          </div>
          <div style={{ marginTop: 2 }}>
            <PrimaryBtn loading={loading} onClick={login} disabled={loading || !!configError}>
              Sign in
            </PrimaryBtn>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'rgba(180,200,255,0.28)', textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
          No account? <Lnk onClick={onGoSignup}>Create one</Lnk>
        </p>
      </GlassCard>
    </Shell>
  )
}

// ── Signup ────────────────────────────────────────────────────────────────────
export function SignupPage({ onGoLogin }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [done, setDone] = useState(false)

  async function go() {
    if (!name.trim()) { setErr('Enter your name.'); return }
    if (!email) { setErr('Enter your email.'); return }
    if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return }
    if (pw !== pw2) { setErr('Passwords do not match.'); return }
    setErr(null); setLoading(true)
    const { error: e } = await supabase.auth.signUp({ email, password: pw, options: { data: { full_name: name.trim() } } })
    if (e) { setErr(e.message); setLoading(false) } else { setDone(true); setLoading(false) }
  }

  if (done) return (
    <Shell>
      <GlassCard style={{ textAlign: 'center', padding: '52px 40px' }}>
        <div style={{ fontSize: 48, marginBottom: 18, animation: 'checkBounce 0.5s ease' }}>✉</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#EEF2FF', marginBottom: 8, letterSpacing: '-0.02em' }}>Check your inbox</h2>
        <p style={{ color: 'rgba(180,200,255,0.42)', fontSize: 13, marginBottom: 28, lineHeight: 1.7 }}>
          We sent a confirmation to <strong style={{ color: 'rgba(200,220,255,0.7)' }}>{email}</strong>. Open it to activate your account.
        </p>
        <PrimaryBtn onClick={onGoLogin}>Back to sign in</PrimaryBtn>
      </GlassCard>
    </Shell>
  )

  return (
    <Shell>
      <GlassCard>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#EEF2FF', margin: '0 0 6px' }}>Create account</h2>
          <p style={{ fontSize: 13, color: 'rgba(180,200,255,0.42)', margin: 0 }}>Start managing programs with your team</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ErrMsg msg={err} />
          <Field label="Full name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoFocus onKeyDown={e => e.key === 'Enter' && go()} />
          <Field label="Work email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@homzmart.com" onKeyDown={e => e.key === 'Enter' && go()} />
          <Field label="Password" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="At least 6 characters" onKeyDown={e => e.key === 'Enter' && go()} />
          <Field label="Confirm password" type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Same as above" onKeyDown={e => e.key === 'Enter' && go()} />
          <div style={{ marginTop: 2 }}>
            <PrimaryBtn loading={loading} onClick={go} disabled={loading}>Create account</PrimaryBtn>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(180,200,255,0.28)', textAlign: 'center', marginTop: 22 }}>
          Already have an account? <Lnk onClick={onGoLogin}>Sign in</Lnk>
        </p>
      </GlassCard>
    </Shell>
  )
}

// ── Reset ─────────────────────────────────────────────────────────────────────
export function ResetPage({ onGoLogin }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [ok, setOk] = useState(null)

  async function go() {
    if (!email) { setErr('Enter your email.'); return }
    setErr(null); setLoading(true)
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    if (e) { setErr(e.message); setLoading(false) }
    else { setOk(`Reset link sent to ${email}.`); setLoading(false) }
  }

  return (
    <Shell>
      <GlassCard>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#EEF2FF', margin: '0 0 6px' }}>Reset password</h2>
          <p style={{ fontSize: 13, color: 'rgba(180,200,255,0.42)', margin: 0 }}>We'll send a secure link to your email.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ErrMsg msg={err} /><OkMsg msg={ok} />
          {!ok && <>
            <Field label="Work email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@homzmart.com" autoFocus onKeyDown={e => e.key === 'Enter' && go()} />
            <PrimaryBtn loading={loading} onClick={go} disabled={loading}>Send reset link</PrimaryBtn>
          </>}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(180,200,255,0.28)', textAlign: 'center', marginTop: 22 }}>
          <Lnk onClick={onGoLogin}>← Back to sign in</Lnk>
        </p>
      </GlassCard>
    </Shell>
  )
}

// ── New Password ──────────────────────────────────────────────────────────────
export function NewPasswordPage({ onGoLogin }) {
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [done, setDone] = useState(false)

  async function go() {
    if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return }
    if (pw !== pw2) { setErr('Passwords do not match.'); return }
    setErr(null); setLoading(true)
    const { error: e } = await supabase.auth.updateUser({ password: pw })
    if (e) { setErr(e.message); setLoading(false) } else { setDone(true); setLoading(false) }
  }

  if (done) return (
    <Shell>
      <GlassCard style={{ textAlign: 'center', padding: '52px 40px' }}>
        <div style={{ fontSize: 48, marginBottom: 18, animation: 'checkBounce 0.5s ease' }}>✓</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#EEF2FF', marginBottom: 8 }}>Password updated</h2>
        <p style={{ color: 'rgba(180,200,255,0.42)', fontSize: 13, marginBottom: 28 }}>Your new password is set. Sign in to continue.</p>
        <PrimaryBtn onClick={onGoLogin}>Sign in</PrimaryBtn>
      </GlassCard>
    </Shell>
  )

  return (
    <Shell>
      <GlassCard>
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#EEF2FF', margin: '0 0 6px' }}>Choose new password</h2>
          <p style={{ fontSize: 13, color: 'rgba(180,200,255,0.42)', margin: 0 }}>Make it strong and unique.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ErrMsg msg={err} />
          <Field label="New password" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="At least 6 characters" autoFocus />
          <Field label="Confirm password" type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Same as above" onKeyDown={e => e.key === 'Enter' && go()} />
          <div style={{ marginTop: 2 }}>
            <PrimaryBtn loading={loading} onClick={go} disabled={loading}>Update password</PrimaryBtn>
          </div>
        </div>
      </GlassCard>
    </Shell>
  )
}
