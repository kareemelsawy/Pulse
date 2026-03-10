// v2 - standalone users page
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { supabase } from '../lib/supabase'
import { COLORS } from '../lib/constants'
import { Avatar, Btn, Badge, Spinner, Icon } from '../components/UI'
import { getWorkspaceMembers, removeMember } from '../lib/db/workspace'

const G = {
  panel: {
    background: COLORS.surface,
    backdropFilter: 'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
    padding: '22px 24px',
    marginBottom: 16,
  },
  row: {
    background: COLORS.surface,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
  },
  input: {
    width: '100%',
    background: COLORS.surfaceHover,
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: 10,
    padding: '9px 13px',
    color: COLORS.text,
    fontSize: 13,
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.5,
    boxSizing: 'border-box',
  },
}

const ROLE_DEFS = [
  { v: 'admin', icon: '👑', label: 'Admin',           color: '#C084FC', desc: 'Full access — manage users, all programs, settings and config.' },
  { v: 'pm',    icon: '📋', label: 'Program Manager', color: '#6B8EF7', desc: 'Manages assigned programs and their tasks.' },
  { v: 'user',  icon: '👤', label: 'User',            color: '#34D17A', desc: 'Sees only tasks assigned to them.' },
]

function RoleTag({ role }) {
  const map = {
    owner:  { label: 'Owner',           color: '#C084FC', icon: '👑' },
    admin:  { label: 'Admin',           color: '#C084FC', icon: '👑' },
    pm:     { label: 'Program Manager', color: '#6B8EF7', icon: '📋' },
    user:   { label: 'User',            color: '#34D17A', icon: '👤' },
    member: { label: 'Member',          color: '#34D17A', icon: '👤' },
  }
  const r = map[role] || { label: role, color: COLORS.textMuted, icon: '👤' }
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20,
      background: r.color + '18', color: r.color, border: `1px solid ${r.color}33`,
      whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4,
    }}>
      {r.icon} {r.label}
    </span>
  )
}

function MemberRow({ m, currentUserId, isAdmin, onRoleChange, onRemove }) {
  const isMe = m.user_id === currentUserId
  const [changing, setChanging] = useState(false)
  const displayRole = m.role === 'owner' ? 'admin' : m.role === 'member' ? 'user' : m.role

  async function handleRole(e) {
    setChanging(true)
    await onRoleChange(m.user_id, e.target.value)
    setChanging(false)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px', borderRadius: 12,
      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
      transition: 'border-color 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.borderStrong}
      onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}>

      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
        background: `${(ROLE_DEFS.find(r => r.v === displayRole)?.color || '#888')}22`,
        border: `2px solid ${(ROLE_DEFS.find(r => r.v === displayRole)?.color || '#888')}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 15, fontWeight: 800,
        color: ROLE_DEFS.find(r => r.v === displayRole)?.color || '#888',
      }}>
        {(m.full_name || m.email || '?')[0].toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, display: 'flex', alignItems: 'center', gap: 6 }}>
          {m.full_name || m.email?.split('@')[0] || m.user_id.slice(0, 8) + '…'}
          {isMe && <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 400 }}>you</span>}
        </div>
        {m.email && <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>{m.email}</div>}
      </div>

      <RoleTag role={m.role} />

      {isAdmin && !isMe && m.role !== 'owner' && (
        <select
          value={displayRole}
          onChange={handleRole}
          disabled={changing}
          style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`,
            color: COLORS.textDim, borderRadius: 8, padding: '5px 10px',
            fontSize: 12, outline: 'none', cursor: 'pointer',
            fontFamily: 'inherit', opacity: changing ? 0.5 : 1,
          }}>
          <option value="admin">Admin</option>
          <option value="pm">Program Manager</option>
          <option value="user">User</option>
        </select>
      )}

      {isAdmin && !isMe && m.role !== 'owner' && (
        <button
          onClick={() => onRemove(m.user_id)}
          style={{
            background: 'none', border: `1px solid ${COLORS.border}`,
            borderRadius: 7, padding: '5px 12px',
            color: COLORS.red, fontSize: 11, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
            transition: 'border-color 0.15s, background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.red; e.currentTarget.style.background = COLORS.red + '12' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = 'none' }}>
          Remove
        </button>
      )}
    </div>
  )
}

export default function UsersPage({ toast }) {
  const { workspace, projects } = useData()
  const { user } = useAuth()

  // Derive admin status directly — no dependency on context isAdmin
  const isAdmin = workspace?.owner_id === user?.id ||
    ['owner', 'admin'].includes(workspace?.role)

  const [members,      setMembers]      = useState([])
  const [loading,      setLoading]      = useState(true)
  const [view,         setView]         = useState('members')
  const [inviting,     setInviting]     = useState(false)
  const [copied,       setCopied]       = useState(false)
  const [emails,       setEmails]       = useState([])
  const [emailInput,   setEmailInput]   = useState('')
  const [role,         setRole]         = useState('user')
  const [selProjects,  setSelProjects]  = useState([])
  const [inviteResult, setInviteResult] = useState(null)

  const allProjects = projects?.filter(p => !p.is_pipeline) || []
  const code        = workspace?.invite_code || ''
  const inviteUrl   = `${window.location.origin}?invite=${code}`

  useEffect(() => {
    if (!workspace?.id) return
    setLoading(true)
    getWorkspaceMembers(workspace.id)
      .then(m => { setMembers(m); setLoading(false) })
      .catch(() => setLoading(false))
  }, [workspace?.id])

  function addEmail() {
    const e = emailInput.trim().toLowerCase()
    if (!e || !e.includes('@')) return
    if (emails.includes(e)) return
    setEmails(prev => [...prev, e])
    setEmailInput('')
  }

  async function handleInvite() {
    const valid = [...emails, ...(emailInput.trim() ? [emailInput.trim().toLowerCase()] : [])].filter(e => e.includes('@'))
    if (!valid.length) { toast('Enter at least one valid email', 'error'); return }
    setInviting(true)
    try {
      for (const email of valid) {
        try {
          await supabase.from('workspace_invites').upsert({
            workspace_id: workspace.id,
            email,
            role,
            project_ids: selProjects.length ? selProjects : null,
            invite_code: code,
            invited_by: user?.email,
            created_at: new Date().toISOString(),
          }, { onConflict: 'workspace_id,email', ignoreDuplicates: false })
        } catch (_) {}
      }
      setInviteResult({ emails: valid, url: inviteUrl })
      setEmails([])
      setEmailInput('')
      toast(`Invite ready for ${valid.length} recipient${valid.length > 1 ? 's' : ''}`, 'success')
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(userId) {
    if (!confirm('Remove this member from the workspace?')) return
    try {
      await removeMember(workspace.id, userId)
      setMembers(prev => prev.filter(m => m.user_id !== userId))
      toast('Member removed', 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  async function handleChangeRole(userId, newRole) {
    try {
      await supabase.from('workspace_members').update({ role: newRole }).eq('workspace_id', workspace.id).eq('user_id', userId)
      setMembers(prev => prev.map(m => m.user_id === userId ? { ...m, role: newRole } : m))
      toast('Role updated', 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  function copyInviteUrl() {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast('Invite link copied!', 'success')
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', minHeight: 0 }}>
      <div style={{ maxWidth: 700 }}>

        {/* Page header */}
        <h1 style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 4, color: COLORS.text }}>
          Users
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
          Invite teammates and manage their roles and access.
        </p>

        {/* Sub-nav */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: COLORS.surface, borderRadius: 12, padding: 4, width: 'fit-content', border: `1px solid ${COLORS.border}` }}>
          {[['members', '👥  Members'], ['invite', '✉  Invite User']].map(([v, l]) => (
            <button key={v} onClick={() => { setView(v); setInviteResult(null) }} style={{
              padding: '7px 18px', borderRadius: 9, fontSize: 12, fontWeight: 600,
              background: view === v ? COLORS.surfaceHover : 'transparent',
              border: view === v ? `1px solid ${COLORS.borderStrong}` : '1px solid transparent',
              color: view === v ? COLORS.text : COLORS.textMuted,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
            }}>{l}</button>
          ))}
        </div>

        {/* Members list */}
        {view === 'members' && (
          <div style={G.panel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, margin: 0 }}>
                  {loading ? 'Members' : `Members (${members.length})`}
                </h3>
                <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '4px 0 0' }}>
                  Everyone with access to this workspace.
                </p>
              </div>
              <Btn size="sm" onClick={() => setView('invite')}>+ Invite</Btn>
            </div>

            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><Spinner /></div>
            ) : members.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: COLORS.textMuted, fontSize: 13 }}>No members found.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map(m => (
                  <MemberRow
                    key={m.user_id}
                    m={m}
                    currentUserId={user?.id}
                    isAdmin={isAdmin}
                    onRoleChange={handleChangeRole}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Invite form */}
        {view === 'invite' && (
          <>
            {/* Quick invite link */}
            <div style={G.panel}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, margin: '0 0 4px' }}>Share Invite Link</h3>
              <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 14px' }}>Anyone with this link can join your workspace.</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ ...G.input, flex: 1, fontSize: 12, color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '9px 12px', background: COLORS.surface, cursor: 'default' }}>
                  {inviteUrl}
                </div>
                <Btn size="sm" onClick={copyInviteUrl}>{copied ? '✓ Copied' : 'Copy Link'}</Btn>
              </div>
            </div>

            {/* Invite by email */}
            <div style={{ ...G.panel, borderTop: `2px solid ${COLORS.accent}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, margin: '0 0 4px' }}>Invite by Email</h3>
              <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 18px' }}>Set a role before sharing — the link will grant that role automatically.</p>

              {/* Email chips */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,210,240,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>
                  Email Addresses
                </label>
                {emails.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {emails.map(e => (
                      <span key={e} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: COLORS.accentDim, border: `1px solid ${COLORS.accent}44`, borderRadius: 20, padding: '3px 10px 3px 12px', fontSize: 12, color: COLORS.accent }}>
                        {e}
                        <button onClick={() => setEmails(prev => prev.filter(x => x !== e))} style={{ background: 'none', border: 'none', color: COLORS.accent, cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 14 }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEmail() } }}
                    placeholder="colleague@company.com"
                    style={G.input}
                  />
                  <Btn size="sm" variant="secondary" onClick={addEmail}>Add</Btn>
                </div>
              </div>

              <div style={{ height: 1, background: COLORS.surfaceHover, margin: '18px 0' }} />

              {/* Role picker */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,210,240,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>
                  Assign Role
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ROLE_DEFS.map(r => (
                    <button key={r.v} onClick={() => setRole(r.v)} style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '13px 16px', borderRadius: 12, textAlign: 'left', width: '100%',
                      background: role === r.v ? `${r.color}10` : COLORS.surface,
                      border: `1px solid ${role === r.v ? r.color + '55' : COLORS.border}`,
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                    }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{r.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: role === r.v ? r.color : COLORS.text }}>{r.label}</span>
                          {role === r.v && <span style={{ fontSize: 9, fontWeight: 800, background: r.color + '22', color: r.color, borderRadius: 4, padding: '1px 7px', letterSpacing: '0.06em' }}>SELECTED</span>}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5 }}>{r.desc}</div>
                      </div>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${role === r.v ? r.color : COLORS.border}`,
                        background: role === r.v ? r.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {role === r.v && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff' }} />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Program access for PMs */}
              {role === 'pm' && allProjects.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ height: 1, background: COLORS.surfaceHover, margin: '18px 0' }} />
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,210,240,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>
                    Assign Programs
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {allProjects.map(p => (
                      <label key={p.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
                        background: selProjects.includes(p.id) ? COLORS.accent + '08' : COLORS.surface,
                        border: `1px solid ${selProjects.includes(p.id) ? COLORS.accent + '55' : COLORS.border}`,
                        transition: 'all 0.12s',
                      }}>
                        <input type="checkbox" checked={selProjects.includes(p.id)} onChange={e => {
                          if (e.target.checked) setSelProjects(prev => [...prev, p.id])
                          else setSelProjects(prev => prev.filter(x => x !== p.id))
                        }} style={{ accentColor: COLORS.accent, width: 14, height: 14, flexShrink: 0 }} />
                        <div style={{ width: 9, height: 9, borderRadius: 3, background: p.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: COLORS.text }}>{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Result banner */}
              {inviteResult && (
                <div style={{ background: COLORS.green + '10', border: `1px solid ${COLORS.green}33`, borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.green, marginBottom: 6 }}>
                    ✓ Invite configured for {inviteResult.emails.join(', ')}
                  </div>
                  <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 10px', lineHeight: 1.5 }}>
                    Share this link. They'll sign up and join automatically with the <strong style={{ color: COLORS.text }}>{ROLE_DEFS.find(r => r.v === role)?.label}</strong> role.
                  </p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: '9px 12px' }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Mono', monospace" }}>{inviteResult.url}</span>
                    <Btn size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(inviteResult.url); toast('Copied!', 'success') }}>Copy</Btn>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <Btn onClick={handleInvite} disabled={inviting || (emails.length === 0 && !emailInput.trim())}>
                  {inviting ? 'Preparing…' : 'Generate Invite Link →'}
                </Btn>
                <Btn variant="secondary" onClick={() => setView('members')}>← Back</Btn>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
