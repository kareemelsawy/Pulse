import { useState } from 'react'
import { supabase, configError } from '../lib/supabase'
import { Icon, Spinner } from '../components/UI'
import { useTheme } from '../contexts/ThemeContext'

function useC() { const { colors } = useTheme(); return colors }
function mkS(C) {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light'
  return {
    wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 },
    card: {
      background: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(255,255,255,0.07)',
      backdropFilter: 'blur(40px) saturate(200%)',
      WebkitBackdropFilter: 'blur(40px) saturate(200%)',
      border: `1px solid ${isLight ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.15)'}`,
      borderRadius: 24, padding: '44px 40px', width: 420, maxWidth: '100%',
      boxShadow: isLight
        ? '0 24px 80px rgba(60,50,120,0.16), inset 0 1px 0 rgba(255,255,255,1)'
        : '0 24px 80px rgba(0,0,0,0.60), inset 0 1px 0 rgba(255,255,255,0.10)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1)',
    },
    inp:  {
      width: '100%',
      background: isLight ? 'rgba(255,255,255,0.70)' : 'rgba(255,255,255,0.07)',
      backdropFilter: 'blur(8px)',
      border: `1px solid ${isLight ? 'rgba(120,100,200,0.22)' : 'rgba(255,255,255,0.13)'}`,
      borderRadius: 10, padding: '10px 14px',
      color: C.text, fontSize: 14, marginBottom: 12,
      outline: 'none', fontFamily: 'inherit',
      transition: 'border-color 0.15s, box-shadow 0.15s',
    },
    lbl:  { fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 },
    btn:  {
      width: '100%', padding: '12px 20px',
      background: 'linear-gradient(135deg, #6B8EF7, #C084FC)',
      color: '#fff', border: '1px solid rgba(255,255,255,0.20)',
      borderRadius: 12, fontWeight: 700, fontSize: 14,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      boxShadow: '0 4px 20px rgba(107,142,247,0.45), inset 0 1px 0 rgba(255,255,255,0.20)',
      fontFamily: 'inherit', transition: 'all 0.18s',
    },
    gBtn: {
      width: '100%', padding: '11px 20px',
      background: isLight ? 'rgba(255,255,255,0.60)' : 'rgba(255,255,255,0.08)',
      backdropFilter: 'blur(12px)',
      color: C.text,
      border: `1px solid ${isLight ? 'rgba(255,255,255,0.80)' : 'rgba(255,255,255,0.15)'}`,
      borderRadius: 12, fontWeight: 600, fontSize: 14,
      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      fontFamily: 'inherit', marginBottom: 12, transition: 'all 0.18s',
    },
  }
}

function Glows() { return null }

function Logo({ C }) {
  return (
    <>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#6B8EF7,#C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18, boxShadow: '0 8px 32px rgba(107,142,247,0.50), inset 0 1px 0 rgba(255,255,255,0.25)', fontSize: 28, color: '#fff' }}>✦</div>
      <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 30, letterSpacing: '-0.04em', marginBottom: 4, color: C.accent }}>Pulse</h1>
      <p style={{ color: C.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 4, lineHeight: 1.6 }}>Project management, built for Homzmart.</p>
      <p style={{ color: C.textMuted, fontSize: 11, textAlign: 'center', marginBottom: 28, fontStyle: 'italic', opacity: 0.7 }}>Internal tool — authorised access only</p>
    </>
  )
}
function ErrBox({ msg, C }) {
  if (!msg) return null
  return <div style={{ background: C.red + '18', border: `1px solid ${C.red}44`, borderRadius: 10, padding: 14, width: '100%', marginBottom: 16, fontSize: 13, color: C.red }}>✕ {msg}</div>
}
function OkBox({ msg, C }) {
  if (!msg) return null
  return <div style={{ background: C.green + '18', border: `1px solid ${C.green}44`, borderRadius: 10, padding: 14, width: '100%', marginBottom: 16, fontSize: 13, color: C.green }}>✓ {msg}</div>
}
function Divider({ C }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0 16px', width: '100%' }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 600 }}>OR</span>
      <div style={{ flex: 1, height: 1, background: C.border }} />
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

export default function LoginPage({ onGoSignup, onGoReset }) {
  const C = useC(); const S = mkS(C)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
    <div style={S.wrap}><Glows />
      <div style={S.card}>
        <Logo C={C} />
        {configError && <div style={{ background: C.amber + '18', border: `1px solid ${C.amber}44`, borderRadius: 10, padding: 14, width: '100%', marginBottom: 20, fontSize: 12, color: C.amber }}><Icon name="warning" size={13} color={C.amber} /> {configError}</div>}
        <ErrBox msg={error} C={C} />
        <div style={{ width: '100%' }}>
          <button onClick={handleGoogle} style={S.gBtn}><GoogleIcon />Continue with Google</button>
          <Divider C={C} />
          <label style={S.lbl}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@homzmart.com" autoFocus onKeyDown={e => e.key === 'Enter' && handleLogin()} style={S.inp} />
          <label style={S.lbl}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key === 'Enter' && handleLogin()} style={{ ...S.inp, marginBottom: 6 }} />
          <div style={{ textAlign: 'right', marginBottom: 20 }}>
            <span onClick={onGoReset} style={{ fontSize: 12, color: C.accent, cursor: 'pointer', fontWeight: 600 }}>Forgot password?</span>
          </div>
          <button onClick={handleLogin} disabled={loading || !!configError} style={{ ...S.btn, opacity: loading || configError ? 0.7 : 1, cursor: loading || configError ? 'not-allowed' : 'pointer' }}>
            {loading ? <Spinner size={18} /> : 'Sign In'}
          </button>
        </div>
        <p style={{ color: C.textMuted, fontSize: 13, marginTop: 20 }}>Don't have an account?{' '}<span onClick={onGoSignup} style={{ color: C.accent, cursor: 'pointer', fontWeight: 600 }}>Sign up</span></p>
      </div>
    </div>
  )
}

export function SignupPage({ onGoLogin }) {
  const C = useC(); const S = mkS(C)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  async function handleSignup() {
    if (!name.trim()) { setError('Please enter your name.'); return }
    if (!email) { setError('Please enter your email.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name.trim() } } })
    if (e) { setError(e.message); setLoading(false) } else { setDone(true); setLoading(false) }
  }

  if (done) return (
    <div style={S.wrap}><Glows />
      <div style={{ ...S.card, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✉</div>
        <h2 style={{ fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 10 }}>Account created!</h2>
        <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>Your account is ready. Click below to sign in.</p>
        <button onClick={onGoLogin} style={{ ...S.btn, width: 'auto', padding: '10px 28px' }}>Go to Sign In</button>
      </div>
    </div>
  )

  return (
    <div style={S.wrap}><Glows />
      <div style={S.card}>
        <Logo C={C} />
        <ErrBox msg={error} C={C} />
        <div style={{ width: '100%' }}>
          {[['Full Name','text','Alex Johnson',name,setName],['Email','email','you@homzmart.com',email,setEmail],['Password','password','6+ characters',password,setPassword],['Confirm Password','password','Same as above',confirm,setConfirm]].map(([label,type,ph,val,setter],i,arr) => (
            <div key={label}>
              <label style={S.lbl}>{label}</label>
              <input type={type} value={val} onChange={e => setter(e.target.value)} placeholder={ph} autoFocus={i===0}
                onKeyDown={e => e.key==='Enter' && i===arr.length-1 && handleSignup()}
                style={{ ...S.inp, marginBottom: i===arr.length-1 ? 20 : 12 }} />
            </div>
          ))}
          <button onClick={handleSignup} disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>{loading ? <Spinner size={18} /> : 'Create Account'}</button>
        </div>
        <p style={{ color: C.textMuted, fontSize: 13, marginTop: 20 }}>Already have an account?{' '}<span onClick={onGoLogin} style={{ color: C.accent, cursor: 'pointer', fontWeight: 600 }}>Sign in</span></p>
      </div>
    </div>
  )
}

export function ResetPage({ onGoLogin }) {
  const C = useC(); const S = mkS(C)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  async function handleReset() {
    if (!email) { setError('Please enter your email.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
    if (e) { setError(e.message); setLoading(false) } else { setSuccess(`Reset link sent to ${email}.`); setLoading(false) }
  }

  return (
    <div style={S.wrap}><Glows />
      <div style={S.card}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16, boxShadow: '0 8px 24px rgba(79,142,247,0.3)' }}>🔑</div>
        <h1 style={{ fontWeight: 700, fontSize: 24, marginBottom: 6, color: C.text }}>Reset Password</h1>
        <p style={{ color: C.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>Enter your email and we'll send a reset link.</p>
        <ErrBox msg={error} C={C} /><OkBox msg={success} C={C} />
        {!success && (
          <div style={{ width: '100%' }}>
            <label style={S.lbl}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@homzmart.com" autoFocus onKeyDown={e => e.key==='Enter' && handleReset()} style={{ ...S.inp, marginBottom: 20 }} />
            <button onClick={handleReset} disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>{loading ? <Spinner size={18} /> : 'Send Reset Link'}</button>
          </div>
        )}
        <p style={{ color: C.textMuted, fontSize: 13, marginTop: 20 }}><span onClick={onGoLogin} style={{ color: C.accent, cursor: 'pointer', fontWeight: 600 }}>← Back to Sign In</span></p>
      </div>
    </div>
  )
}

export function NewPasswordPage({ onGoLogin }) {
  const C = useC(); const S = mkS(C)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  async function handleUpdate() {
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.updateUser({ password })
    if (e) { setError(e.message); setLoading(false) } else { setDone(true); setLoading(false) }
  }

  if (done) return (
    <div style={S.wrap}><Glows />
      <div style={{ ...S.card, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
        <h2 style={{ fontWeight: 700, fontSize: 22, color: C.text, marginBottom: 10 }}>Password updated!</h2>
        <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>You can now sign in with your new password.</p>
        <button onClick={onGoLogin} style={{ ...S.btn, width: 'auto', padding: '10px 28px' }}>Sign In</button>
      </div>
    </div>
  )

  return (
    <div style={S.wrap}><Glows />
      <div style={S.card}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 16 }}>🔑</div>
        <h1 style={{ fontWeight: 700, fontSize: 24, marginBottom: 6, color: C.text }}>New Password</h1>
        <p style={{ color: C.textMuted, fontSize: 14, textAlign: 'center', marginBottom: 28 }}>Choose a strong new password.</p>
        <ErrBox msg={error} C={C} />
        <div style={{ width: '100%' }}>
          <label style={S.lbl}>New Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="6+ characters" autoFocus style={{ ...S.inp, marginBottom: 12 }} />
          <label style={S.lbl}>Confirm Password</label>
          <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Same as above" onKeyDown={e => e.key==='Enter' && handleUpdate()} style={{ ...S.inp, marginBottom: 20 }} />
          <button onClick={handleUpdate} disabled={loading} style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}>{loading ? <Spinner size={18} /> : 'Update Password'}</button>
        </div>
      </div>
    </div>
  )
}
