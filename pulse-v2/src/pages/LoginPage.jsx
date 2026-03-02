import { useState } from 'react'
import { supabase, configError } from '../lib/supabase'
import { COLORS } from '../lib/constants'
import { Spinner } from '../components/UI'

const C = COLORS

// ── Shared primitives ─────────────────────────────────────────
function Glows() {
  return (
    <>
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,142,247,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
    </>
  )
}

function Logo() {
  return (
    <>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16, boxShadow: '0 8px 24px rgba(79,142,247,0.3)' }}>◈</div>
      <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 30, letterSpacing: '-0.04em', marginBottom: 6, color: C.text }}>Pulse</h1>
      <p style={{ color: C.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>Project management for teams that ship fast.</p>
    </>
  )
}

function ErrorBox({ msg }) {
  if (!msg) return null
  return <div style={{ background: '#450a0a', border: `1px solid ${C.red}55`, borderRadius: 10, padding: 14, width: '100%', marginBottom: 16, fontSize: 13, color: C.red }}>✕ {msg}</div>
}

function SuccessBox({ msg }) {
  if (!msg) return null
  return <div style={{ background: '#052e16', border: `1px solid ${C.green}55`, borderRadius: 10, padding: 14, width: '100%', marginBottom: 16, fontSize: 13, color: C.green }}>✓ {msg}</div>
}

const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '44px 40px', width: 420, maxWidth: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', alignItems: 'center' }
const wrap = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: 20 }
const inp  = { width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.text, fontSize: 14, marginBottom: 12 }
const lbl  = { fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }
const btn  = { width: '100%', padding: '12px 20px', background: C.accent, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 2px 12px rgba(79,142,247,0.35)', fontFamily: 'inherit' }

// ── Login ─────────────────────────────────────────────────────
export default function LoginPage({ onGoSignup, onGoReset }) {
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

  return (
    <div style={wrap}>
      <Glows />
      <div style={card}>
        <Logo />
        {configError && <div style={{ background: '#1c0a00', border: `1px solid ${C.amber}55`, borderRadius: 10, padding: 14, width: '100%', marginBottom: 20, fontSize: 12, color: '#d97706' }}>⚠ {configError}</div>}
        <ErrorBox msg={error} />
        <div style={{ width: '100%' }}>
          <label style={lbl}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoFocus onKeyDown={e => e.key === 'Enter' && handleLogin()} style={inp} />
          <label style={lbl}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ ...inp, marginBottom: 6 }} />
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <span onClick={onGoReset} style={{ fontSize: 12, color: C.accent, cursor: 'pointer', fontWeight: 600 }}>Forgot password?</span>
          </div>
          <button onClick={handleLogin} disabled={loading || !!configError} style={{ ...btn, opacity: loading || configError ? 0.7 : 1, cursor: loading || configError ? 'not-allowed' : 'pointer' }}>
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

// ── Signup ────────────────────────────────────────────────────
export function SignupPage({ onGoLogin }) {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [done,     setDone]     = useState(false)

  async function handleSignup() {
    if (!name.trim())         { setError('Please enter your name.'); return }
    if (!email)               { setError('Please enter your email.'); return }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } })
    if (e) { setError(e.message); setLoading(false) }
    else   { setDone(true); setLoading(false) }
  }

  if (done) return (
    <div style={wrap}>
      <Glows />
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉</div>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 10 }}>Account created!</h2>
        <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
          Your account is ready. Click below to sign in.
        </p>
        <button onClick={onGoLogin} style={{ ...btn, width: 'auto', padding: '10px 28px' }}>Go to Sign In</button>
      </div>
    </div>
  )

  return (
    <div style={wrap}>
      <Glows />
      <div style={card}>
        <Logo />
        <ErrorBox msg={error} />
        <div style={{ width: '100%' }}>
          {[
            ['Full Name', 'text', 'Alex Johnson', name, setName],
            ['Email', 'email', 'you@company.com', email, setEmail],
            ['Password', 'password', '6+ characters', password, setPassword],
            ['Confirm Password', 'password', 'Same as above', confirm, setConfirm],
          ].map(([label, type, placeholder, val, setter], i, arr) => (
            <div key={label}>
              <label style={lbl}>{label}</label>
              <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={placeholder} autoFocus={i === 0}
                onKeyDown={e => e.key === 'Enter' && i === arr.length - 1 && handleSignup()}
                style={{ ...inp, marginBottom: i === arr.length - 1 ? 20 : 12 }} />
            </div>
          ))}
          <button onClick={handleSignup} disabled={loading} style={{ ...btn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
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

// ── Password Reset ────────────────────────────────────────────
export function ResetPage({ onGoLogin }) {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleReset() {
    if (!email) { setError('Please enter your email.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (e) { setError(e.message); setLoading(false) }
    else   { setSuccess(`Reset link sent to ${email}. Check your inbox.`); setLoading(false) }
  }

  return (
    <div style={wrap}>
      <Glows />
      <div style={card}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16, boxShadow: '0 8px 24px rgba(79,142,247,0.3)' }}>🔑</div>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, letterSpacing: '-0.04em', marginBottom: 6, color: C.text }}>Reset Password</h1>
        <p style={{ color: C.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>Enter your email and we'll send you a reset link.</p>
        <ErrorBox msg={error} />
        <SuccessBox msg={success} />
        {!success && (
          <div style={{ width: '100%' }}>
            <label style={lbl}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" autoFocus onKeyDown={e => e.key === 'Enter' && handleReset()} style={{ ...inp, marginBottom: 20 }} />
            <button onClick={handleReset} disabled={loading} style={{ ...btn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? <Spinner size={18} /> : 'Send Reset Link'}
            </button>
          </div>
        )}
        <p style={{ color: C.textMuted, fontSize: 13, marginTop: 20 }}>
          <span onClick={onGoLogin} style={{ color: C.accent, cursor: 'pointer', fontWeight: 600 }}>← Back to Sign In</span>
        </p>
      </div>
    </div>
  )
}

// ── New Password (after clicking reset link) ──────────────────
export function NewPasswordPage({ onGoLogin }) {
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [done,     setDone]     = useState(false)

  async function handleUpdate() {
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.updateUser({ password })
    if (e) { setError(e.message); setLoading(false) }
    else   { setDone(true); setLoading(false) }
  }

  if (done) return (
    <div style={wrap}>
      <Glows />
      <div style={{ ...card, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 10 }}>Password updated!</h2>
        <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>You can now sign in with your new password.</p>
        <button onClick={onGoLogin} style={{ ...btn, width: 'auto', padding: '10px 28px' }}>Sign In</button>
      </div>
    </div>
  )

  return (
    <div style={wrap}>
      <Glows />
      <div style={card}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16 }}>🔑</div>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, letterSpacing: '-0.04em', marginBottom: 6, color: C.text }}>New Password</h1>
        <p style={{ color: C.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 28 }}>Choose a strong new password.</p>
        <ErrorBox msg={error} />
        <div style={{ width: '100%' }}>
          <label style={lbl}>New Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6+ characters" autoFocus style={{ ...inp, marginBottom: 12 }} />
          <label style={lbl}>Confirm Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Same as above" onKeyDown={e => e.key === 'Enter' && handleUpdate()} style={{ ...inp, marginBottom: 20 }} />
          <button onClick={handleUpdate} disabled={loading} style={{ ...btn, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? <Spinner size={18} /> : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  )
}
