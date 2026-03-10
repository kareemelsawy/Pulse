import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { joinWorkspaceByCode } from '../lib/db/workspace'
import { Spinner } from '../components/UI'

// ── Shared background / layout — mirrors LoginPage exactly ───────────────────
function AppBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', background: '#000' }}>
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
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 40% 35% at 80% 30%, rgba(80,200,255,0.10) 0%, transparent 55%),
          radial-gradient(ellipse 30% 25% at 65% 60%, rgba(0,120,255,0.08)  0%, transparent 50%)
        `,
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025, mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />
    </div>
  )
}

function LeftPanel() {
  return (
    <div style={{
      flex: '0 0 55%', display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '52px 64px', position: 'relative', zIndex: 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg,#6B8EF7,#C084FC)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: '#fff', fontWeight: 900,
          boxShadow: '0 4px 16px rgba(107,142,247,0.40)',
        }}>✦</div>
        <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.90)' }}>PULSE</div>
      </div>

      <div>
        <h1 style={{
          fontSize: 'clamp(30px, 3.5vw, 50px)', fontWeight: 700,
          lineHeight: 1.10, letterSpacing: '-0.03em',
          color: '#FFFFFF', margin: '0 0 20px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          You've been<br />invited to join<br />your team.
        </h1>
        <p style={{
          fontSize: 15, fontWeight: 300, lineHeight: 1.75,
          color: 'rgba(180,200,255,0.48)',
          maxWidth: 400, margin: 0,
          fontFamily: "'DM Sans', sans-serif",
        }}>
          Track programs, tasks and meetings — all in one place built for Homzmart.
        </p>
      </div>

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

// ── Shell — identical structure to LoginPage Shell ────────────────────────────
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
        @media (max-width: 768px) {
          .login-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}

// ── Glass card — identical to LoginPage GlassCard ─────────────────────────────
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

// ── Invite code input — styled like LoginPage Field ───────────────────────────
function CodeField({ value, onChange, onKeyDown, disabled }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
        color: focused ? 'rgba(80,180,255,0.9)' : 'rgba(180,200,255,0.38)',
        transition: 'color 0.15s',
      }}>Invite Code</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value.toUpperCase())}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="e.g. ABC12345"
        disabled={disabled}
        autoFocus
        style={{
          width: '100%', boxSizing: 'border-box',
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${focused ? 'rgba(0,150,255,0.55)' : 'rgba(255,255,255,0.10)'}`,
          borderRadius: 10, padding: '11px 14px',
          color: '#EEF2FF', fontSize: 22, fontWeight: 700,
          letterSpacing: '0.14em', textAlign: 'center',
          fontFamily: "'DM Mono', 'Fira Code', monospace",
          outline: 'none',
          boxShadow: focused ? '0 0 0 3px rgba(0,120,255,0.15)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          opacity: disabled ? 0.5 : 1,
        }}
      />
    </div>
  )
}

// ── Primary button — identical to LoginPage PrimaryBtn ────────────────────────
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

// ── Main ──────────────────────────────────────────────────────────────────────
export default function WorkspaceSetup({ onJoined, onSignOut, defaultCode = '' }) {
  const { user } = useAuth()
  const [code,    setCode]    = useState(defaultCode)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  // Auto-join silently when a pre-filled invite code comes in via link
  useEffect(() => {
    if (defaultCode && defaultCode.trim()) {
      setLoading(true)
      setError(null)
      joinWorkspaceByCode(defaultCode.trim(), user.id)
        .then(ws => onJoined(ws))
        .catch(e => { setError(e.message); setLoading(false) })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleJoin() {
    if (!code.trim()) { setError('Please enter an invite code.'); return }
    setError(null); setLoading(true)
    try {
      const ws = await joinWorkspaceByCode(code.trim(), user.id)
      onJoined(ws)
    } catch (e) { setError(e.message); setLoading(false) }
  }

  // Auto-joining via link: show full-screen spinner with same branding
  if (loading && defaultCode && !error) return (
    <Shell>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 16, minHeight: 200,
      }}>
        <div style={{ fontSize: 40, color: '#6B8EF7', fontWeight: 900, lineHeight: 1 }}>✦</div>
        <Spinner size={28} />
        <span style={{ color: 'rgba(180,200,255,0.5)', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
          Joining workspace…
        </span>
      </div>
    </Shell>
  )

  return (
    <Shell>
      <GlassCard>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#EEF2FF', margin: '0 0 6px' }}>
            Join your workspace
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(180,200,255,0.42)', margin: 0, lineHeight: 1.6 }}>
            Enter the invite code shared by your admin.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16,
            fontSize: 12, color: '#FCA5A5', lineHeight: 1.5,
            display: 'flex', gap: 8,
          }}><span>⚠</span><span>{error}</span></div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <CodeField
            value={code}
            onChange={setCode}
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            disabled={loading}
          />
          <div style={{ marginTop: 2 }}>
            <PrimaryBtn loading={loading} onClick={handleJoin} disabled={loading}>
              Join workspace →
            </PrimaryBtn>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'rgba(180,200,255,0.28)', textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
          Wrong account?{' '}
          <button onClick={onSignOut} style={{
            background: 'none', border: 'none', padding: 0,
            color: 'rgba(130,170,255,0.65)', fontSize: 12, cursor: 'pointer',
            fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3,
          }}>Sign out</button>
          <span style={{ color: 'rgba(180,200,255,0.18)', margin: '0 6px' }}>·</span>
          <span style={{ color: 'rgba(180,200,255,0.28)' }}>{user?.email}</span>
        </p>
      </GlassCard>
    </Shell>
  )
}
