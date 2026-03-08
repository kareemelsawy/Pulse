import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { createWorkspace, joinWorkspace } from '../lib/db/workspace'
import { Spinner } from '../components/UI'

export default function WorkspaceSetup({ onJoined, onSignOut, defaultCode = '' }) {
  const { user } = useAuth()
  const [tab,     setTab]     = useState(defaultCode ? 'join' : 'create')
  const [name,    setName]    = useState('')
  const [code,    setCode]    = useState(defaultCode)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleCreate() {
    if (!name.trim()) return setError('Workspace name is required')
    setError(''); setLoading(true)
    try {
      const ws = await createWorkspace(name.trim(), user.id)
      onJoined(ws)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  async function handleJoin() {
    if (!code.trim()) return setError('Enter an invite code')
    setError(''); setLoading(true)
    try {
      const ws = await joinWorkspace(code.trim(), user.id)
      onJoined(ws)
    } catch (e) { setError(e.message) }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#060a14', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'rgba(10,15,30,0.80)', backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)', border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: 20, padding: '40px 36px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg,#4F8EF7,#1e4fff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 900, color: '#fff',
          }}>✦</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: '#fff' }}>Pulse</span>
        </div>

        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 22, color: '#fff', marginBottom: 4 }}>
          Set up your workspace
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 28 }}>
          Create a new workspace or join an existing one
        </p>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: 3 }}>
          {['create', 'join'].map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }} style={{
              flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
              background: tab === t ? 'rgba(255,255,255,0.10)' : 'transparent',
              color: tab === t ? '#fff' : 'rgba(255,255,255,0.4)',
              fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
            }}>
              {t === 'create' ? 'Create' : 'Join'}
            </button>
          ))}
        </div>

        {tab === 'create' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.38)', letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Workspace Name
              </label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Acme Corp" autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                style={inputStyle}
              />
            </div>
            {error && <p style={{ color: '#fca5a5', fontSize: 13 }}>{error}</p>}
            <button onClick={handleCreate} disabled={loading} style={{
              padding: '13px 0', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#4F8EF7,#2563eb)',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s',
            }}>
              {loading ? 'Creating…' : 'Create Workspace'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.38)', letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                Invite Code
              </label>
              <input
                value={code} onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX" autoFocus
                onKeyDown={e => e.key === 'Enter' && handleJoin()}
                style={{ ...inputStyle, fontFamily: "'DM Mono',monospace", letterSpacing: 3 }}
              />
            </div>
            {error && <p style={{ color: '#fca5a5', fontSize: 13 }}>{error}</p>}
            <button onClick={handleJoin} disabled={loading} style={{
              padding: '13px 0', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg,#4F8EF7,#2563eb)',
              color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}>
              {loading ? 'Joining…' : 'Join Workspace'}
            </button>
          </div>
        )}

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <button onClick={onSignOut} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: 12 }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
