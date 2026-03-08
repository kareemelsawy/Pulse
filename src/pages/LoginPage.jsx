import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'

// ─── Particle System ──────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf, w, h
    const particles = []
    const PARTICLE_COUNT = 60

    function resize() {
      w = canvas.width  = canvas.offsetWidth
      h = canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        dx: (Math.random() - 0.5) * 0.25,
        dy: (Math.random() - 0.5) * 0.25,
        o: Math.random() * 0.4 + 0.05,
      })
    }

    function draw() {
      ctx.clearRect(0, 0, w, h)
      particles.forEach(p => {
        p.x += p.dx; p.y += p.dy
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(100,160,255,${p.o})`
        ctx.fill()
      })
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx*dx + dy*dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(80,140,255,${0.06 * (1 - dist/100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
}

// ─── Shared field style ───────────────────────────────────────────────────────
const fieldStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 10,
  padding: '13px 16px',
  color: '#fff',
  fontSize: 14,
  letterSpacing: 0.2,
  transition: 'border-color 0.2s, background 0.2s',
  outline: 'none',
}
const fieldFocusStyle = { borderColor: 'rgba(79,142,247,0.6)', background: 'rgba(79,142,247,0.07)' }

function Field({ label, type = 'text', value, onChange, placeholder, autoFocus }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ ...fieldStyle, ...(focused ? fieldFocusStyle : {}) }}
      />
    </div>
  )
}

// ─── Primary button ───────────────────────────────────────────────────────────
function PrimaryBtn({ children, onClick, loading, disabled }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={loading || disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        padding: '13px 0',
        borderRadius: 10,
        border: 'none',
        background: hover && !loading ? 'linear-gradient(135deg,#3a6ef5 0%,#1e4fff 100%)' : 'linear-gradient(135deg,#4F8EF7 0%,#2563eb 100%)',
        color: '#fff',
        fontWeight: 700,
        fontSize: 14,
        letterSpacing: 0.5,
        cursor: loading || disabled ? 'not-allowed' : 'pointer',
        opacity: loading || disabled ? 0.7 : 1,
        transition: 'background 0.2s, opacity 0.2s, transform 0.1s',
        transform: hover && !loading ? 'translateY(-1px)' : 'none',
        boxShadow: hover && !loading ? '0 8px 32px rgba(79,142,247,0.45)' : '0 4px 16px rgba(79,142,247,0.25)',
      }}
    >
      {loading ? <span style={{ opacity: 0.8 }}>●●●</span> : children}
    </button>
  )
}

// ─── Ghost link button ────────────────────────────────────────────────────────
function GhostBtn({ children, onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: 'none', border: 'none', color: hover ? '#7eaaff' : 'rgba(255,255,255,0.40)', cursor: 'pointer', fontSize: 13, padding: 0, transition: 'color 0.15s' }}>
      {children}
    </button>
  )
}

// ─── Shared card wrapper ──────────────────────────────────────────────────────
function Card({ children }) {
  return (
    <div style={{
      position: 'relative', zIndex: 2,
      width: '100%', maxWidth: 400,
      background: 'rgba(10,15,30,0.75)',
      backdropFilter: 'blur(40px) saturate(180%)',
      WebkitBackdropFilter: 'blur(40px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 20,
      padding: '40px 36px',
      boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset',
      animation: 'cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both',
    }}>
      {children}
    </div>
  )
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'linear-gradient(135deg, #4F8EF7 0%, #1e4fff 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(79,142,247,0.5)',
        fontSize: 18, fontWeight: 900, color: '#fff',
        fontFamily: "'Syne', sans-serif",
      }}>✦</div>
      <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: -0.5 }}>
        Pulse
      </span>
    </div>
  )
}

// ─── Error message ────────────────────────────────────────────────────────────
function Err({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8,
      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
      color: '#fca5a5', fontSize: 13,
    }}>{msg}</div>
  )
}

function Success({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      padding: '10px 14px', borderRadius: 8,
      background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
      color: '#86efac', fontSize: 13,
    }}>{msg}</div>
  )
}

// ─── Layout wrapper ───────────────────────────────────────────────────────────
function AuthLayout({ children }) {
  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      position: 'relative', overflow: 'hidden',
      padding: '24px 16px',
    }}>
      {/* Background orbs */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse 80% 60% at 70% 30%, rgba(37,99,235,0.35) 0%, transparent 60%),
          radial-gradient(ellipse 50% 50% at 20% 70%, rgba(0,0,0,0.8) 0%, transparent 70%),
          #060a14
        `,
      }} />
      <ParticleCanvas />
      {/* Horizontal light streak */}
      <div style={{
        position: 'absolute', top: '38%', left: 0, right: 0, height: 1, zIndex: 1,
        background: 'linear-gradient(90deg, transparent 0%, rgba(79,142,247,0.12) 30%, rgba(79,142,247,0.18) 50%, rgba(79,142,247,0.12) 70%, transparent 100%)',
      }} />
      {children}
    </div>
  )
}

// ─── LOGIN PAGE ───────────────────────────────────────────────────────────────
export default function LoginPage({ onGoSignup, onGoReset }) {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin() {
    setError(''); setLoading(true)
    const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password: pass })
    setLoading(false)
    if (e) setError(e.message)
  }

  return (
    <AuthLayout>
      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
      <Card>
        <Logo />
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 4, letterSpacing: -0.5 }}>
          Welcome back
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28 }}>
          Sign in to your workspace
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" autoFocus />
          <Field label="Password" type="password" value={pass} onChange={setPass} placeholder="••••••••" />
          <Err msg={error} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -4 }}>
            <GhostBtn onClick={onGoReset}>Forgot password?</GhostBtn>
          </div>
          <PrimaryBtn onClick={handleLogin} loading={loading}>Sign In</PrimaryBtn>
        </div>

        <div style={{ marginTop: 24, textAlign: 'center', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          No account?{' '}
          <GhostBtn onClick={onGoSignup}>
            <span style={{ color: '#4F8EF7', fontWeight: 600 }}>Create workspace</span>
          </GhostBtn>
        </p>
      </Card>

      {/* Bottom badge */}
      <p style={{ position: 'relative', zIndex: 2, marginTop: 24, fontSize: 11, color: 'rgba(255,255,255,0.18)', letterSpacing: 0.5 }}>
        SECURED · END-TO-END ENCRYPTED
      </p>
    </AuthLayout>
  )
}

// ─── SIGNUP PAGE ──────────────────────────────────────────────────────────────
export function SignupPage({ onGoLogin }) {
  const [name,   setName]   = useState('')
  const [email,  setEmail]  = useState('')
  const [pass,   setPass]   = useState('')
  const [pass2,  setPass2]  = useState('')
  const [error,  setError]  = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup() {
    setError('')
    if (!name.trim()) return setError('Name is required')
    if (pass.length < 8) return setError('Password must be at least 8 characters')
    if (pass !== pass2) return setError('Passwords do not match')
    setLoading(true)
    const { error: e } = await supabase.auth.signUp({
      email: email.trim(), password: pass,
      options: { data: { full_name: name.trim() } },
    })
    setLoading(false)
    if (e) setError(e.message)
  }

  return (
    <AuthLayout>
      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(24px) scale(0.97)}to{opacity:1;transform:none}}`}</style>
      <Card>
        <Logo />
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 4, letterSpacing: -0.5 }}>
          Create account
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28 }}>
          Set up your Pulse workspace
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Full name" value={name} onChange={setName} placeholder="John Smith" autoFocus />
          <Field label="Work email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
          <Field label="Password" type="password" value={pass} onChange={setPass} placeholder="Min. 8 characters" />
          <Field label="Confirm password" type="password" value={pass2} onChange={setPass2} placeholder="••••••••" />
          <Err msg={error} />
          <PrimaryBtn onClick={handleSignup} loading={loading}>Create Account</PrimaryBtn>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
          Already have an account?{' '}
          <button onClick={onGoLogin} style={{ background: 'none', border: 'none', color: '#4F8EF7', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
            Sign in
          </button>
        </p>
      </Card>
    </AuthLayout>
  )
}

// ─── RESET PAGE ───────────────────────────────────────────────────────────────
export function ResetPage({ onGoLogin }) {
  const [email,   setEmail]   = useState('')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleReset() {
    setError(''); setSuccess(''); setLoading(true)
    const { error: e } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin + '/?type=recovery',
    })
    setLoading(false)
    if (e) setError(e.message)
    else setSuccess('Check your email for a reset link.')
  }

  return (
    <AuthLayout>
      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(24px) scale(0.97)}to{opacity:1;transform:none}}`}</style>
      <Card>
        <Logo />
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 4, letterSpacing: -0.5 }}>
          Reset password
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28 }}>
          We'll send you a recovery link
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@company.com" autoFocus />
          <Err msg={error} />
          <Success msg={success} />
          <PrimaryBtn onClick={handleReset} loading={loading}>Send Reset Link</PrimaryBtn>
          <div style={{ textAlign: 'center' }}>
            <GhostBtn onClick={onGoLogin}>← Back to sign in</GhostBtn>
          </div>
        </div>
      </Card>
    </AuthLayout>
  )
}

// ─── NEW PASSWORD PAGE ────────────────────────────────────────────────────────
export function NewPasswordPage({ onGoLogin }) {
  const [pass,    setPass]    = useState('')
  const [pass2,   setPass2]   = useState('')
  const [error,   setError]   = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleUpdate() {
    setError(''); setSuccess('')
    if (pass.length < 8) return setError('Password must be at least 8 characters')
    if (pass !== pass2)  return setError('Passwords do not match')
    setLoading(true)
    const { error: e } = await supabase.auth.updateUser({ password: pass })
    setLoading(false)
    if (e) setError(e.message)
    else { setSuccess('Password updated successfully.'); setTimeout(onGoLogin, 2000) }
  }

  return (
    <AuthLayout>
      <style>{`@keyframes cardIn{from{opacity:0;transform:translateY(24px) scale(0.97)}to{opacity:1;transform:none}}`}</style>
      <Card>
        <Logo />
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 4, letterSpacing: -0.5 }}>
          New password
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28 }}>
          Choose a strong password
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="New password" type="password" value={pass} onChange={setPass} placeholder="Min. 8 characters" autoFocus />
          <Field label="Confirm password" type="password" value={pass2} onChange={setPass2} placeholder="••••••••" />
          <Err msg={error} />
          <Success msg={success} />
          <PrimaryBtn onClick={handleUpdate} loading={loading}>Update Password</PrimaryBtn>
        </div>
      </Card>
    </AuthLayout>
  )
}
