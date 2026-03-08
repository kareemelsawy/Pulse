import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { joinWorkspaceByCode } from '../lib/db/workspace'
import { Spinner } from '../components/UI'

// Join-only: workspace creation is an owner-only operation done via Supabase directly.
export default function WorkspaceSetup({ onJoined, onSignOut, defaultCode = '' }) {
  const { user } = useAuth()
  const { colors: C } = useTheme()
  const [code,    setCode]    = useState(defaultCode)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const s = {
    wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif", padding: 20 },
    card: { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '44px 40px', width: 440, maxWidth: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' },
    inp:  { width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none' },
    lbl:  { fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 },
  }

  async function handleJoin() {
    if (!code.trim()) { setError('Please enter an invite code.'); return }
    setError(null); setLoading(true)
    try {
      const ws = await joinWorkspaceByCode(code, user.id)
      onJoined(ws)
    } catch (e) { setError(e.message); setLoading(false) }
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6B8EF7,#C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#fff', boxShadow: '0 4px 14px rgba(107,142,247,0.4)' }}>✦</div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, color: C.text }}>Homzmart's Pulse</span>
        </div>

        <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 6, letterSpacing: '-0.02em' }}>Join your workspace</h2>
        <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 24 }}>
          Enter the invite code shared by your workspace admin to get started.
        </p>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#FCA5A5' }}>
            ⚠ {error}
          </div>
        )}

        <label style={s.lbl}>Invite code</label>
        <input
          value={code} onChange={e => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. ABC12345"
          onKeyDown={e => e.key === 'Enter' && handleJoin()}
          style={{ ...s.inp, fontSize: 20, fontWeight: 700, letterSpacing: '0.12em', textAlign: 'center', marginBottom: 16 }}
          autoFocus
        />

        <button onClick={handleJoin} disabled={loading} style={{
          width: '100%', padding: '12px 20px',
          background: loading ? 'rgba(0,100,255,0.3)' : 'rgba(0,110,255,0.85)',
          color: '#fff', border: '1px solid rgba(80,180,255,0.3)',
          borderRadius: 10, fontWeight: 600, fontSize: 14,
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          fontFamily: 'inherit', transition: 'all 0.15s',
        }}>
          {loading ? <Spinner size={18} /> : 'Join workspace →'}
        </button>

        <button onClick={onSignOut} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer', marginTop: 20, fontFamily: 'inherit', width: '100%', textAlign: 'center' }}>
          Sign out ({user?.email})
        </button>
      </div>
    </div>
  )
}
