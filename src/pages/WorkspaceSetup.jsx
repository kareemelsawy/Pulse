import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { joinWorkspaceByCode } from '../lib/db'
import { COLORS } from '../lib/constants'
import { Icon } from '../components/UI'
import { Spinner } from '../components/UI'

const C = COLORS
const wrap = { minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: 20 }
const card = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: '44px 40px', width: 460, maxWidth: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }
const inp  = { width: '100%', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.text, fontSize: 14, fontFamily: 'inherit' }
const lbl  = { fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }

export default function WorkspaceSetup({ onJoined, onSignOut, defaultCode = '' }) {
  const { user } = useAuth()
  const [code,    setCode]    = useState(defaultCode)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  async function handleJoin() {
    if (!code.trim()) { setError('Please enter an invite code.'); return }
    setError(null); setLoading(true)
    try {
      const ws = await joinWorkspaceByCode(code, user.id)
      onJoined(ws)
    } catch (e) {
      setError(e.message); setLoading(false)
    }
  }

  return (
    <div style={wrap}>
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,142,247,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={card}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#fff' }}>✦</div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, letterSpacing: '-0.03em', color: C.text }}>Pulse</span>
        </div>

        <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 22, color: C.text, marginBottom: 8 }}>Join a workspace</h2>
        <p style={{ color: C.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          Enter the invite code shared by your team admin to join their workspace.
        </p>

        {error && (
          <div style={{ background: '#450a0a', border: `1px solid ${C.red}55`, borderRadius: 10, padding: 14, marginBottom: 16, fontSize: 13, color: C.red }}>
            ✕ {error}
          </div>
        )}

        <label style={lbl}>Invite Code</label>
        <input
          value={code} onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. ABC12345"
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          style={{ ...inp, fontSize: 18, fontWeight: 700, letterSpacing: '0.1em', textAlign: 'center', marginBottom: 16 }}
          autoFocus
        />

        <button onClick={handleJoin} disabled={loading} style={{
          width: '100%', padding: '12px 20px', background: C.accent, color: '#fff',
          border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontFamily: 'inherit', marginBottom: 20,
        }}>
          {loading ? <Spinner size={18} /> : 'Join Workspace'}
        </button>

        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
          <p style={{ color: C.textMuted, fontSize: 12, lineHeight: 1.6 }}>
            <strong style={{ color: C.textDim }}>Don't have a code?</strong><br />
            Ask your workspace admin to share the invite code with you. You'll find it in Workspace Settings inside Pulse.
          </p>
        </div>

        <button onClick={onSignOut} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer', marginTop: 16, fontFamily: 'inherit' }}>
          Sign out ({user?.email})
        </button>
      </div>
    </div>
  )
}
