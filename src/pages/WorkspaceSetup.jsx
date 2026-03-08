import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { joinWorkspaceByCode } from '../lib/db/workspace'
import { Spinner } from '../components/UI'

// ── Same gradient background as LoginPage ─────────────────────────────────────
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

export default function WorkspaceSetup({ onJoined, onSignOut, defaultCode = '' }) {
  const { user } = useAuth()
  const [code,    setCode]    = useState(defaultCode)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)
  const [focused, setFocused] = useState(false)

  async function handleJoin() {
    if (!code.trim()) { setError('Please enter an invite code.'); return }
    setError(null); setLoading(true)
    try {
      const ws = await joinWorkspaceByCode(code, user.id)
      onJoined(ws)
    } catch (e) { setError(e.message); setLoading(false) }
  }

  return (
    <>
      <AppBackground />
      <div style={{
        position: 'relative', zIndex: 1,
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: 20,
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.06)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 20, padding: '44px 40px',
          width: 420, maxWidth: '100%',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: 'linear-gradient(135deg,#6B8EF7,#C084FC)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, color: '#fff',
              boxShadow: '0 4px 14px rgba(107,142,247,0.45)',
            }}>✦</div>
            <span style={{ fontWeight: 800, fontSize: 15, color: '#EEF2FF', letterSpacing: '-0.01em' }}>
              Homzmart's Pulse
            </span>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#EEF2FF', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            Join your workspace
          </h2>
          <p style={{ color: 'rgba(180,200,255,0.42)', fontSize: 13, lineHeight: 1.6, margin: '0 0 28px' }}>
            Enter the invite code shared by your workspace admin to get started.
          </p>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.10)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '10px 14px',
              marginBottom: 18, fontSize: 13, color: '#FCA5A5',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>⚠</span> {error}
            </div>
          )}

          {/* Invite code label */}
          <label style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase',
            color: focused ? 'rgba(80,180,255,0.9)' : 'rgba(180,200,255,0.38)',
            display: 'block', marginBottom: 8, transition: 'color 0.15s',
          }}>
            Invite Code
          </label>

          <input
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. ABC12345"
            onKeyDown={e => e.key === 'Enter' && handleJoin()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoFocus
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid ${focused ? 'rgba(0,150,255,0.55)' : 'rgba(255,255,255,0.10)'}`,
              borderRadius: 10, padding: '12px 14px',
              color: '#EEF2FF', fontSize: 22, fontWeight: 700,
              letterSpacing: '0.14em', textAlign: 'center',
              fontFamily: "'DM Mono', 'Fira Code', monospace",
              outline: 'none', marginBottom: 16,
              boxShadow: focused ? '0 0 0 3px rgba(0,120,255,0.15)' : 'none',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          />

          <button
            onClick={handleJoin}
            disabled={loading}
            style={{
              width: '100%', padding: '12px 20px', borderRadius: 10,
              background: loading ? 'rgba(0,100,255,0.3)' : 'rgba(0,110,255,0.85)',
              color: '#fff', border: '1px solid rgba(80,180,255,0.3)',
              fontWeight: 600, fontSize: 14, fontFamily: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(0,130,255,0.95)' }}
            onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'rgba(0,110,255,0.85)' }}
          >
            {loading ? <Spinner size={18} /> : 'Join workspace →'}
          </button>

          <button
            onClick={onSignOut}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(180,200,255,0.35)', fontSize: 12,
              cursor: 'pointer', marginTop: 20,
              fontFamily: 'inherit', width: '100%', textAlign: 'center',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(180,200,255,0.65)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(180,200,255,0.35)'}
          >
            Sign out ({user?.email})
          </button>
        </div>
      </div>
    </>
  )
}
