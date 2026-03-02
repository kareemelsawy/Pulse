import { useState, useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { getWorkspaceMembers, regenerateInviteCode, updateWorkspaceName, removeMember } from '../lib/db'
import { COLORS } from '../lib/constants'
import { Modal, Btn, Avatar, iStyle, lStyle } from './UI'

export default function WorkspaceSettings({ onClose, toast }) {
  const { workspace, setWorkspace } = useData()
  const { user } = useAuth()
  const [members,  setMembers]  = useState([])
  const [name,     setName]     = useState(workspace?.name || '')
  const [code,     setCode]     = useState(workspace?.invite_code || '')
  const [saving,   setSaving]   = useState(false)
  const [copying,  setCopying]  = useState(false)
  const isOwner = workspace?.owner_id === user?.id || workspace?.role === 'owner'

  useEffect(() => {
    if (workspace?.id) getWorkspaceMembers(workspace.id).then(setMembers)
  }, [workspace?.id])

  async function handleSaveName() {
    if (!name.trim() || name === workspace.name) return
    setSaving(true)
    try {
      await updateWorkspaceName(workspace.id, name.trim())
      setWorkspace(prev => ({ ...prev, name: name.trim() }))
      toast?.('Workspace name updated', 'success')
    } catch (e) { toast?.(e.message, 'error') } finally { setSaving(false) }
  }

  async function handleRegenCode() {
    if (!confirm('This will invalidate the old invite code. Continue?')) return
    try {
      const newCode = await regenerateInviteCode(workspace.id)
      setCode(newCode)
      setWorkspace(prev => ({ ...prev, invite_code: newCode }))
      toast?.('New invite code generated', 'success')
    } catch (e) { toast?.(e.message, 'error') }
  }

  async function handleRemoveMember(userId) {
    if (!confirm('Remove this member from the workspace?')) return
    try {
      await removeMember(workspace.id, userId)
      setMembers(prev => prev.filter(m => m.user_id !== userId))
      toast?.('Member removed', 'success')
    } catch (e) { toast?.(e.message, 'error') }
  }

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  const inviteUrl = `${window.location.origin}?invite=${code}`

  return (
    <Modal onClose={onClose} width={500}>
      <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, marginBottom: 24 }}>⚙ Workspace Settings</h2>

      {/* Name */}
      <div style={{ marginBottom: 24 }}>
        <label style={lStyle}>Workspace Name</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={name} onChange={e => setName(e.target.value)} style={{ ...iStyle, flex: 1 }} disabled={!isOwner} />
          {isOwner && <Btn onClick={handleSaveName} disabled={saving || name === workspace?.name} size="sm">{saving ? '…' : 'Save'}</Btn>}
        </div>
      </div>

      {/* Invite code */}
      <div style={{ marginBottom: 24 }}>
        <label style={lStyle}>Invite Code</label>
        <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 10 }}>
          Share this code with teammates so they can join your workspace.
        </p>
        <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <code style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, letterSpacing: '0.15em', color: COLORS.accent, flex: 1 }}>{code}</code>
          <Btn size="sm" onClick={copyCode} variant="secondary">{copying ? '✓ Copied!' : 'Copy'}</Btn>
          {isOwner && <Btn size="sm" onClick={handleRegenCode} variant="secondary">↺ New</Btn>}
        </div>
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: COLORS.textMuted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inviteUrl}</span>
          <Btn size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(inviteUrl); toast?.('Link copied!', 'success') }}>Copy Link</Btn>
        </div>
      </div>

      {/* Members */}
      <div>
        <label style={lStyle}>Members ({members.length})</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {members.map(m => (
            <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
              <Avatar name={m.user_id} size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{m.user_id === user?.id ? 'You' : m.user_id.slice(0, 8) + '…'}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{m.role} · joined {new Date(m.joined_at).toLocaleDateString()}</div>
              </div>
              {isOwner && m.user_id !== user?.id && (
                <Btn size="sm" variant="danger" onClick={() => handleRemoveMember(m.user_id)}>Remove</Btn>
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <Btn variant="secondary" onClick={onClose}>Close</Btn>
      </div>
    </Modal>
  )
}
