import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { joinWorkspaceByCode, createWorkspace } from '../lib/db/workspace'
import { Spinner } from '../components/UI'

export default function WorkspaceSetup({ onJoined, onSignOut, defaultCode = '' }) {
  const { user } = useAuth()
  const { colors: C } = useTheme()
  const [tab,     setTab]     = useState(defaultCode ? 'join' : 'create')
  const [wsName,  setWsName]  = useState('')
  const [code,    setCode]    = useState(defaultCode)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const s = {
    wrap: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif", padding: 20 },
    card: { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 20, padding: '44px 40px', width: 460, maxWidth: '100%', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' },
    inp:  { width: '100%', background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: 8, padding: '10px 14px', color: C.text, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' },
    lbl:  { fontSize: 11, fontWeight: 700, color: C.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6 },
  }

  async function handleCreate() {
    if (!wsName.trim()) { setError('Please enter a workspace name.'); return }
    setError(null); setLoading(true)
    try {
      const ws = await createWorkspace(user.id, wsName)
      onJoined(ws)
    } catch (e) { setError(e.message); setLoading(false) }
  }

  async function handleJoin() {
    if (!code.trim()) { setError('Please enter an invite code.'); return }
    setError(null); setLoading(true)
    try {
      const ws = await joinWorkspaceByCode(code, user.id)
      onJoined(ws)
    } catch (e) { setError(e.message); setLoading(false) }
  }

  const tabBtn = (active) => ({
    flex: 1, padding: '9px 0', borderRadius: 8, border: 'none',
    background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
    color: active ? C.text : C.textMuted,
    fontWeight: active ? 700 : 400, fontSize: 13,
    cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
  })

  const primaryBtn = {
    width: '100%', padding: '12px 20px', background: C.accent, color: '#fff',
    border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14,
    cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    fontFamily: 'inherit', marginBottom: 0, transition: 'opacity 0.15s',
  }

  return (
    <div style={s.wrap}>
      <div style={{ position: 'fixed', top: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,142,247,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div style={s.card}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6B8EF7,#C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', boxShadow: '0 4px 16px rgba(107,142,247,0.4)' }}>✦</div>
          <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em', color: C.text }}>Pulse</span>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', gap: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: 4, marginBottom: 28 }}>
          <button style={tabBtn(tab === 'create')} onClick={() => { setTab('create'); setError(null) }}>Create workspace</button>
          <button style={tabBtn(tab === 'join')}   onClick={() => { setTab('join');   setError(null) }}>Join with code</button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: '#FCA5A5' }}>
            ⚠ {error}
          </div>
        )}

        {tab === 'create' ? (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 6, letterSpacing: '-0.02em' }}>Create your workspace</h2>
            <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>
              Set up a new Pulse workspace for your team.
            </p>
            <label style={s.lbl}>Workspace name</label>
            <input
              value={wsName} onChange={e => setWsName(e.target.value)}
              placeholder="e.g. Homzmart Programs"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              style={{ ...s.inp, marginBottom: 16 }}
              autoFocus
            />
            <button onClick={handleCreate} disabled={loading} style={primaryBtn}>
              {loading ? <Spinner size={18} /> : 'Create workspace →'}
            </button>
          </>
        ) : (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 6, letterSpacing: '-0.02em' }}>Join a workspace</h2>
            <p style={{ color: C.textMuted, fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>
              Enter the invite code shared by your workspace admin.
            </p>
            <label style={s.lbl}>Invite code</label>
            <input
              value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABC12345"
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              style={{ ...s.inp, fontSize: 18, fontWeight: 700, letterSpacing: '0.1em', textAlign: 'center', marginBottom: 16 }}
              autoFocus={!!defaultCode}
            />
            <button onClick={handleJoin} disabled={loading} style={primaryBtn}>
              {loading ? <Spinner size={18} /> : 'Join workspace →'}
            </button>
          </>
        )}

        <button onClick={onSignOut} style={{ background: 'none', border: 'none', color: C.textMuted, fontSize: 12, cursor: 'pointer', marginTop: 20, fontFamily: 'inherit', width: '100%', textAlign: 'center' }}>
          Sign out ({user?.email})
        </button>
      </div>
    </div>
  )
}
