import { useState, useEffect, useRef } from 'react'
import { supabase, configError } from '../lib/supabase'
import { Spinner } from '../components/UI'

// ── Animated background canvas ────────────────────────────────────────────────
function AnimatedBg() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w = canvas.width = window.innerWidth
    let h = canvas.height = window.innerHeight
    let animId
    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.5 + 0.3,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      o: Math.random() * 0.5 + 0.1,
    }))
    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    window.addEventListener('resize', resize)
    const draw = () => {
      ctx.clearRect(0, 0, w, h)
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0) p.x = w; if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h; if (p.y > h) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(79,142,247,${p.o})`
        ctx.fill()
      })
      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 100) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(79,142,247,${0.06 * (1 - d / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }} />
}

// ── Floating orbs ─────────────────────────────────────────────────────────────
function Orbs() {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79,142,247,0.12) 0%, transparent 70%)',
        top: '-15%', left: '-10%', animation: 'orbFloat1 20s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(147,51,234,0.08) 0%, transparent 70%)',
        bottom: '-10%', right: '-5%', animation: 'orbFloat2 25s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.07) 0%, transparent 70%)',
        top: '40%', right: '20%', animation: 'orbFloat3 18s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes orbFloat1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,20px) scale(1.05)} 66%{transform:translate(-20px,40px) scale(0.95)} }
        @keyframes orbFloat2 { 0%,100%{transform:translate(0,0) scale(1)} 40%{transform:translate(-30px,-20px) scale(1.08)} 70%{transform:translate(20px,-40px) scale(0.92)} }
        @keyframes orbFloat3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-40px,30px) scale(1.1)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        @keyframes shimmer { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes pulse { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
        @keyframes spinIn { from{opacity:0;transform:rotate(-10deg) scale(0.9)} to{opacity:1;transform:rotate(0) scale(1)} }
        @keyframes checkBounce { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
      `}</style>
    </div>
  )
}

// ── Grid overlay ──────────────────────────────────────────────────────────────
function GridOverlay() {
  return (
    <div style={{
      position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px',
      maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 0%, transparent 100%)',
    }} />
  )
}

// ── Logo mark ─────────────────────────────────────────────────────────────────
function Logo({ size = 32 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: Math.round(size * 0.28),
      background: 'linear-gradient(135deg, #4F8EF7 0%, #7B5CF0 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.5, color: '#fff', flexShrink: 0,
      boxShadow: '0 0 0 1px rgba(79,142,247,0.3), 0 8px 24px rgba(79,142,247,0.25)',
    }}>✦</div>
  )
}

// ── Input field ───────────────────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, autoFocus, onKeyDown, hint, icon }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
        color: focused ? '#7EB3FF' : 'rgba(255,255,255,0.35)',
        transition: 'color 0.15s',
      }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            fontSize: 14, pointerEvents: 'none', opacity: 0.4,
          }}>{icon}</div>
        )}
        <input
          type={type} value={value} onChange={onChange}
          placeholder={placeholder} autoFocus={autoFocus} onKeyDown={onKeyDown}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', display: 'block', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${focused ? 'rgba(79,142,247,0.6)' : 'rgba(255,255,255,0.09)'}`,
            borderRadius: 10, padding: `12px ${icon ? '14px 12px 40px' : '14px 14px'}`,
            paddingLeft: icon ? 42 : 14,
            color: '#F0F0F2', fontSize: 14,
            fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
            transition: 'border-color 0.15s, background 0.15s, box-shadow 0.15s',
            boxShadow: focused ? '0 0 0 3px rgba(79,142,247,0.15), inset 0 1px 0 rgba(255,255,255,0.05)' : 'inset 0 1px 0 rgba(255,255,255,0.03)',
          }}
        />
      </div>
      {hint && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{hint}</span>}
    </div>
  )
}

// ── Primary button ────────────────────────────────────────────────────────────
function PrimaryBtn({ loading, onClick, disabled, children, style = {} }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick} disabled={disabled || loading}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', padding: '13px 20px', borderRadius: 10,
        background: disabled || loading
          ? 'rgba(79,142,247,0.3)'
          : hover
            ? 'linear-gradient(135deg, #5B9BF8 0%, #8B6FF2 100%)'
            : 'linear-gradient(135deg, #4F8EF7 0%, #7B5CF0 100%)',
        color: '#fff', border: 'none',
        fontWeight: 700, fontSize: 14,
        fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em',
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        transition: 'all 0.15s ease',
        boxShadow: hover && !disabled && !loading
          ? '0 8px 32px rgba(79,142,247,0.4), 0 2px 8px rgba(0,0,0,0.3)'
          : '0 4px 16px rgba(79,142,247,0.2), 0 1px 4px rgba(0,0,0,0.3)',
        transform: hover && !disabled && !loading ? 'translateY(-1px)' : 'translateY(0)',
        ...style,
      }}>
      {loading ? <Spinner size={16} /> : children}
    </button>
  )
}

// ── Ghost button ──────────────────────────────────────────────────────────────
function GhostBtn({ onClick, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        width: '100%', padding: '12px 20px', borderRadius: 10,
        background: hover ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
        color: hover ? '#F0F0F2' : 'rgba(255,255,255,0.7)',
        border: `1px solid ${hover ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.10)'}`,
        fontWeight: 500, fontSize: 14,
        fontFamily: "'DM Sans', sans-serif",
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        transition: 'all 0.15s',
        boxShadow: hover ? 'inset 0 1px 0 rgba(255,255,255,0.1)' : 'none',
      }}>
      {children}
    </button>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.2)' }}>OR</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
    </div>
  )
}

function ErrMsg({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
      borderRadius: 8, padding: '10px 14px',
      fontSize: 13, color: '#FCA5A5', lineHeight: 1.5,
      display: 'flex', gap: 8, alignItems: 'flex-start',
    }}>
      <span style={{ flexShrink: 0 }}>⚠</span>
      <span>{msg}</span>
    </div>
  )
}

function OkMsg({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)',
      borderRadius: 8, padding: '10px 14px',
      fontSize: 13, color: '#86EFAC', lineHeight: 1.5,
      display: 'flex', gap: 8, alignItems: 'flex-start',
      animation: 'fadeIn 0.3s ease',
    }}>
      <span style={{ flexShrink: 0, animation: 'checkBounce 0.4s ease' }}>✓</span>
      <span>{msg}</span>
    </div>
  )
}

function Lnk({ onClick, children }) {
  const [h, setH] = useState(false)
  return (
    <span onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ color: h ? '#92C5FF' : '#7EB3FF', cursor: 'pointer', fontWeight: 600, fontSize: 13, transition: 'color 0.15s', textDecoration: h ? 'underline' : 'none' }}>
      {children}
    </span>
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

// ── Feature card ──────────────────────────────────────────────────────────────
function FeatureCard({ icon, title, desc, delay = 0 }) {
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'flex-start',
      animation: `fadeUp 0.6s ${delay}ms ease both`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: 'rgba(79,142,247,0.12)', border: '1px solid rgba(79,142,247,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, marginTop: 1,
        boxShadow: '0 4px 12px rgba(79,142,247,0.12)',
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.82)', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.30)', lineHeight: 1.6, fontWeight: 300 }}>{desc}</div>
      </div>
    </div>
  )
}

// ── Glass card ────────────────────────────────────────────────────────────────
function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      background: 'rgba(15,15,18,0.75)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      border: '1px solid rgba(255,255,255,0.09)',
      borderRadius: 20,
      boxShadow: '0 40px 120px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.07)',
      padding: '40px 40px',
      width: '100%',
      maxWidth: 380,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Left panel ────────────────────────────────────────────────────────────────
function LeftPanel() {
  const features = [
    { icon: '◈', title: 'Unified Programs', desc: 'All projects, actions, and milestones in one workspace.' },
    { icon: '⊙', title: 'Real-time Visibility', desc: 'Live status across every team — no more status meetings.' },
    { icon: '◎', title: 'Smart Notifications', desc: 'Automated alerts keep owners accountable without noise.' },
    { icon: '⊛', title: 'Meeting Intelligence', desc: 'Decisions and actions captured, linked, and tracked.' },
  ]
  return (
    <div style={{
      flex: '0 0 52%', display: 'flex', flexDirection: 'column',
      justifyContent: 'center', padding: '60px 72px',
      position: 'relative', zIndex: 1,
      '@media (max-width: 768px)': { display: 'none' },
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64, animation: 'fadeUp 0.5s ease both' }}>
        <Logo size={36} />
        <div>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.90)' }}>PULSE</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.05em', marginTop: -1 }}>Homzmart</div>
        </div>
      </div>

      {/* Headline */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, animation: 'fadeUp 0.5s 50ms ease both' }}>
          <div style={{ width: 24, height: 1, background: 'rgba(79,142,247,0.5)' }} />
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.20em', textTransform: 'uppercase', color: 'rgba(79,142,247,0.8)' }}>Program Management</span>
        </div>
        <h1 style={{
          fontFamily: 'Syne', fontWeight: 800, fontSize: 'clamp(40px, 4.5vw, 62px)',
          lineHeight: 1.05, letterSpacing: '-0.04em',
          color: '#FFFFFF', margin: '0 0 20px',
          animation: 'fadeUp 0.6s 100ms ease both',
        }}>
          Every team.<br />
          <span style={{
            background: 'linear-gradient(135deg, #4F8EF7 0%, #A78BFA 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>One truth.</span>
        </h1>
        <p style={{
          fontSize: 14, fontWeight: 300, lineHeight: 1.8, color: 'rgba(255,255,255,0.36)',
          maxWidth: 360, margin: 0,
          animation: 'fadeUp 0.6s 150ms ease both',
        }}>
          The operating layer where Homzmart's programs, actions, and meetings converge into a single source of truth.
        </p>
      </div>

      {/* Features */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 56 }}>
        {features.map((f, i) => <FeatureCard key={f.title} {...f} delay={200 + i * 60} />)}
      </div>

      {/* Stats */}
      <div style={{ animation: 'fadeUp 0.6s 500ms ease both' }}>
        <div style={{ width: 32, height: 1, background: 'rgba(255,255,255,0.10)', marginBottom: 24 }} />
        <div style={{ display: 'flex', gap: 40 }}>
          {[['4×', 'Faster delivery'], ['100%', 'Task visibility'], ['0', 'Missed actions']].map(([n, l]) => (
            <div key={l}>
              <div style={{
                fontFamily: 'Syne', fontWeight: 800, fontSize: 24,
                letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6,
                background: 'linear-gradient(135deg, #FFFFFF 0%, rgba(255,255,255,0.6) 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>{n}</div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.22)' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────
function Shell({ children }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      background: '#080810',
      fontFamily: "'DM Sans', system-ui, sans-serif",
      position: 'relative',
    }}>
      <AnimatedBg />
      <Orbs />
      <GridOverlay />
      {/* Left panel — hidden on mobile */}
      <div style={{ flex: '0 0 52%', display: 'flex', alignItems: 'center' }}
        className="login-left-panel">
        <LeftPanel />
      </div>
      {/* Right panel */}
      <div style={{
        flex: '0 0 48%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 24px', position: 'relative', zIndex: 1,
        borderLeft: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ width: '100%', maxWidth: 380, animation: 'fadeUp 0.7s 80ms ease both' }}>
          {children}
        </div>
      </div>
      <style>{`
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
          .login-right-panel { flex: 1 !important; border-left: none !important; }
        }
      `}</style>
    </div>
  )
}

// ── Login Page ─────────────────────────────────────────────────────────────────
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
      provider: 'google',
      options: { redirectTo: window.location.origin }
    })
    if (e) setError(e.message)
  }

  return (
    <Shell>
      <GlassCard>
        {/* Mobile logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }} className="mobile-logo">
          <Logo size={28} />
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 13, letterSpacing: '0.16em', color: 'rgba(255,255,255,0.85)' }}>PULSE</span>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h2 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em',
            color: '#FFFFFF', margin: '0 0 6px', lineHeight: 1.2,
          }}>Welcome back</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 400, margin: 0, lineHeight: 1.6 }}>
            Sign in to your Pulse workspace
          </p>
        </div>

        {configError && (
          <div style={{
            background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            fontSize: 12, color: '#FCD34D', lineHeight: 1.5,
          }}>{configError}</div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ErrMsg msg={error} />
          <GhostBtn onClick={google}>
            <GoogleIcon /> Continue with Google
          </GhostBtn>
          <Divider />
          <Field
            label="Work email" type="email" value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@homzmart.com" autoFocus
            icon="✉" onKeyDown={e => e.key === 'Enter' && login()}
          />
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Password</label>
              <Lnk onClick={onGoReset}>Forgot password?</Lnk>
            </div>
            <Field
              type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" icon="🔒"
              onKeyDown={e => e.key === 'Enter' && login()}
            />
          </div>
          <div style={{ marginTop: 4 }}>
            <PrimaryBtn loading={loading} onClick={login} disabled={loading || !!configError}>
              Sign in →
            </PrimaryBtn>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 22, lineHeight: 1.6 }}>
          No account? <Lnk onClick={onGoSignup}>Create one</Lnk>
        </p>
      </GlassCard>
    </Shell>
  )
}

// ── Signup Page ────────────────────────────────────────────────────────────────
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
    const { error: e } = await supabase.auth.signUp({
      email, password: pw,
      options: { data: { full_name: name.trim() } }
    })
    if (e) { setErr(e.message); setLoading(false) } else { setDone(true); setLoading(false) }
  }

  if (done) return (
    <Shell>
      <GlassCard style={{ textAlign: 'center', padding: '56px 40px' }}>
        <div style={{ fontSize: 56, marginBottom: 20, animation: 'checkBounce 0.5s ease' }}>✉</div>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em' }}>Check your inbox</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28, lineHeight: 1.7 }}>
          We sent a confirmation link to <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{email}</strong>. Open it to activate your account.
        </p>
        <PrimaryBtn onClick={onGoLogin}>Back to sign in</PrimaryBtn>
      </GlassCard>
    </Shell>
  )

  return (
    <Shell>
      <GlassCard>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', color: '#FFFFFF', margin: '0 0 6px' }}>Create account</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Start managing programs with your team</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ErrMsg msg={err} />
          <Field label="Full name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoFocus icon="👤" onKeyDown={e => e.key === 'Enter' && go()} />
          <Field label="Work email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@homzmart.com" icon="✉" onKeyDown={e => e.key === 'Enter' && go()} />
          <Field label="Password" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="At least 6 characters" icon="🔒" hint="Minimum 6 characters" onKeyDown={e => e.key === 'Enter' && go()} />
          <Field label="Confirm password" type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Same as above" icon="🔒" onKeyDown={e => e.key === 'Enter' && go()} />
          <div style={{ marginTop: 4 }}>
            <PrimaryBtn loading={loading} onClick={go} disabled={loading}>Create account →</PrimaryBtn>
          </div>
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 22 }}>
          Already have an account? <Lnk onClick={onGoLogin}>Sign in</Lnk>
        </p>
      </GlassCard>
    </Shell>
  )
}

// ── Reset Page ─────────────────────────────────────────────────────────────────
export function ResetPage({ onGoLogin }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [ok, setOk] = useState(null)

  async function go() {
    if (!email) { setErr('Enter your email.'); return }
    setErr(null); setLoading(true)
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    })
    if (e) { setErr(e.message); setLoading(false) }
    else { setOk(`Reset link sent to ${email}.`); setLoading(false) }
  }

  return (
    <Shell>
      <GlassCard>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', color: '#FFFFFF', margin: '0 0 6px' }}>Reset password</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>We'll send a secure link to your email.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ErrMsg msg={err} />
          <OkMsg msg={ok} />
          {!ok && <>
            <Field label="Work email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@homzmart.com" autoFocus icon="✉" onKeyDown={e => e.key === 'Enter' && go()} />
            <PrimaryBtn loading={loading} onClick={go} disabled={loading}>Send reset link →</PrimaryBtn>
          </>}
        </div>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: 22 }}>
          <Lnk onClick={onGoLogin}>← Back to sign in</Lnk>
        </p>
      </GlassCard>
    </Shell>
  )
}

// ── New Password Page ──────────────────────────────────────────────────────────
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
      <GlassCard style={{ textAlign: 'center', padding: '56px 40px' }}>
        <div style={{ fontSize: 56, marginBottom: 20, animation: 'checkBounce 0.5s ease' }}>✓</div>
        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: '#fff', marginBottom: 10 }}>Password updated</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28 }}>Your new password is set. Sign in to continue.</p>
        <PrimaryBtn onClick={onGoLogin}>Sign in →</PrimaryBtn>
      </GlassCard>
    </Shell>
  )

  return (
    <Shell>
      <GlassCard>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 26, letterSpacing: '-0.03em', color: '#FFFFFF', margin: '0 0 6px' }}>Choose new password</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', margin: 0 }}>Make it strong and unique.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <ErrMsg msg={err} />
          <Field label="New password" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="At least 6 characters" autoFocus icon="🔒" hint="Minimum 6 characters" />
          <Field label="Confirm password" type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Same as above" icon="🔒" onKeyDown={e => e.key === 'Enter' && go()} />
          <div style={{ marginTop: 4 }}>
            <PrimaryBtn loading={loading} onClick={go} disabled={loading}>Update password →</PrimaryBtn>
          </div>
        </div>
      </GlassCard>
    </Shell>
  )
}
