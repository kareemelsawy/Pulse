import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { configError } from '../lib/supabase'
import { COLORS } from '../lib/constants'
import { Spinner } from '../components/UI'

const C = COLORS

function Logo() {
  return (
    <>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16, boxShadow: '0 8px 24px rgba(79,142,247,0.3)' }}>◈</div>
      <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 30, letterSpacing: '-0.04em', marginBottom: 6, color: C.text }}>Pulse</h1>
      <p style={{ color: C.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>Project management for teams that ship fast.</p>
    </>
  )
}

function Glows() {
  return (
    <>
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,142,247,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
    </>
  )
}

function ErrorBox({ msg }) {
  if (!msg) return null
  return (
    <div style={{ background: '#450a0a', border: `1px solid ${C.red}55`, borderRadius: 10, padding: 14, width: '100%', marginBottom: 16, fontSize: 13, color: C.red }}>
      ✕ {msg}
    </div>
  )
}

const cardStyle = {
  background: C.surface, border: `1px solid ${C.border}`,
  borderRadius: 20, padding: '44px 40px', width: 420, maxWidth: '100%',
  boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
  display: 'flex', flexDirection: 'column', alignItems: 'center',
}

const wrapStyle = {
  minHeight: '100vh', background: C.bg,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: 20,
}

const inputStyle = {
  width: '100%', background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 8, padding: '10px 14px', color: C.text, fontSize: 14,
  outline: 'none', marginBottom: 12,
}

const btnStyle = {
  width: '100%', padding: '12px 20px',
  background: C.accent, color: '#fff',
  border: 'none', borderRadius: 10,
  fontWeight: 700, fontSize: 14, cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
  boxShadow: '0 2px 12px rgba(79,142,247,0.35)',
}

// ─── Login Page ───────────────────────────────────────────────
export default function LoginPage({ onGoSignup }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  async function handleLogin() {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.signInWithPassword({ email, password })
    if (e) { setError(e.message); setLoading(false) }
    // on success, AuthContext picks up the session automatically
  }

  return (
    <div style={wrapStyle}>
      <Glows />
      <div style={cardStyle}>
        <Logo />
        {configError && <div style={{ background: '#1c0a00', border: `1px solid ${C.amber}55`, borderRadius: 10, padding: 14, width: '100%', marginBottom: 20, fontSize: 12, color: '#d97706' }}>⚠ {configError}</div>}
        <ErrorBox msg={error} />
        <div style={{ width: '100%' }}>
          <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Email</label>
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com" autoFocus
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={inputStyle}
          />
          <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Password</label>
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ ...inputStyle, marginBottom: 20 }}
          />
          <button onClick={handleLogin} disabled={loading || !!configError} style={{ ...btnStyle, opacity: loading || configError ? 0.7 : 1, cursor: loading || configError ? 'not-allowed' : 'pointer' }}>
            {loading ? <Spinner size={18} /> : 'Sign In'}
          </button>
        </div>
        <p style={{ color: C.textMuted, fontSize: 13, marginTop: 20 }}>
          Don't have an account?{' '}
          <span onClick={onGoSignup} style={{ color: C.accent, cursor: 'pointer', fontWeight: 600 }}>Sign up</span>
        </p>
      </div>
    </div>
  )
}

// ─── Signup Page ──────────────────────────────────────────────
export function SignupPage({ onGoLogin }) {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [done,     setDone]     = useState(false)

  async function handleSignup() {
    if (!name.trim())            { setError('Please enter your name.'); return }
    if (!email)                  { setError('Please enter your email.'); return }
    if (password.length < 6)     { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm)    { setError('Passwords do not match.'); return }
    setError(null); setLoading(true)

    const { error: e } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() } },
    })

    if (e) { setError(e.message); setLoading(false) }
    else   { setDone(true); setLoading(false) }
  }

  if (done) return (
    <div style={wrapStyle}>
      <Glows />
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉</div>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 10 }}>Check your email</h2>
        <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          We sent a confirmation link to <strong style={{ color: C.text }}>{email}</strong>.<br />
          Click it to activate your account, then come back and sign in.
        </p>
        <button onClick={onGoLogin} style={{ ...btnStyle, width: 'auto', padding: '10px 28px' }}>Back to Sign In</button>
      </div>
    </div>
  )

  return (
    <div style={wrapStyle}>
      <Glows />
      <div style={cardStyle}>
        <Logo />
        <ErrorBox msg={error} />
        <div style={{ width: '100%' }}>
          {[
            ['Full Name',        'text',     'Alex Johnson',      name,     setName],
            ['Email',            'email',    'you@company.com',   email,    setEmail],
            ['Password',         'password', '6+ characters',     password, setPassword],
            ['Confirm Password', 'password', 'Same as above',     confirm,  setConfirm],
          ].map(([label, type, placeholder, val, setter], i, arr) => (
            <div key={label}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>{label}</label>
              <input
                type={type} value={val} onChange={e => setter(e.target.value)}
                placeholder={placeholder} autoFocus={i === 0}
                onKeyDown={e => e.key === 'Enter' && i === arr.length - 1 && handleSignup()}
                style={{ ...inputStyle, marginBottom: i === arr.length - 1 ? 20 : 12 }}
              />
            </div>
          ))}
          <button onClick={handleSignup} disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? <Spinner size={18} /> : 'Create Account'}
          </button>
        </div>
        <p style={{ color: C.textMuted, fontSize: 13, marginTop: 20 }}>
          Already have an account?{' '}
          <span onClick={onGoLogin} style={{ color: C.accent, cursor: 'pointer', fontWeight: 600 }}>Sign in</span>
        </p>
      </div>
    </div>
  )
}
