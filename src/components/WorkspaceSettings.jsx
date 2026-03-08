import { useState, useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { getWorkspaceMembers, regenerateInviteCode, updateWorkspaceName, removeMember } from '../lib/db/workspace'
import { COLORS } from '../lib/constants'
import { Modal, Btn, Avatar, iStyle, lStyle } from './UI'
import { supabase } from '../lib/supabase'

// ── Send invite email via Supabase ────────────────────────────────────────────
async function sendInviteEmail({ email, workspaceId, workspaceName, inviteCode, role, projectAccess, taskAccess, meetingAccess, inviterName }) {
  // Store the pending invite in the database for tracking
  try {
    await supabase.from('workspace_invites').insert({
      workspace_id: workspaceId,
      email: email.toLowerCase().trim(),
      role,
      project_access: projectAccess,
      task_access: taskAccess,
      meeting_access: meetingAccess,
      invited_by: inviterName,
      invite_code: inviteCode,
      created_at: new Date().toISOString(),
    }).select().single()
  } catch (e) {
    // Table might not exist yet — continue anyway
  }

  // Use Supabase Auth invite (sends a real email)
  const signupUrl = `${window.location.origin}?invite=${inviteCode}&role=${role}`
  const { error } = await supabase.auth.admin?.inviteUserByEmail?.(email, {
    redirectTo: signupUrl,
    data: { workspace_id: workspaceId, workspace_name: workspaceName, role, invite_code: inviteCode }
  }).catch(() => ({ error: null })) || { error: null }

  // Fallback: generate magic link / signup URL for manual sharing
  return {
    success: true,
    inviteUrl: signupUrl,
  }
}

export default function WorkspaceSettings({ onClose, toast }) {
  const { workspace, setWorkspace, projects } = useData()
  const { user } = useAuth()
  const [members,   setMembers]   = useState([])
  const [name,      setName]      = useState(workspace?.name || '')
  const [code,      setCode]      = useState(workspace?.invite_code || '')
  const [saving,    setSaving]    = useState(false)
  const [copying,   setCopying]   = useState(false)
  const [tab,       setTab]       = useState('members') // 'members' | 'invite'
  const isOwner = workspace?.owner_id === user?.id || workspace?.role === 'owner'

  // Invite form state
  const [inviteEmail,   setInviteEmail]   = useState('')
  const [inviteRole,    setInviteRole]    = useState('member')
  const [projAccess,    setProjAccess]    = useState('all')   // 'all' | 'specific' | 'none'
  const [taskAccess,    setTaskAccess]    = useState('full')  // 'full' | 'view' | 'none'
  const [meetAccess,    setMeetAccess]    = useState('full')  // 'full' | 'view' | 'none'
  const [selProjects,   setSelProjects]   = useState([])
  const [inviting,      setInviting]      = useState(false)
  const [inviteEmails,  setInviteEmails]  = useState([]) // multi-email list
  const [emailInput,    setEmailInput]    = useState('')

  const displayName = user?.user_metadata?.full_name || user?.email || 'Someone'

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

  function addEmail() {
    const e = emailInput.trim().toLowerCase()
    if (!e || !e.includes('@')) return
    if (inviteEmails.includes(e)) return
    setInviteEmails(prev => [...prev, e])
    setEmailInput('')
  }

  function removeEmail(e) {
    setInviteEmails(prev => prev.filter(x => x !== e))
  }

  async function handleSendInvites() {
    const emails = inviteEmails.length > 0 ? inviteEmails : [emailInput.trim().toLowerCase()]
    const valid = emails.filter(e => e && e.includes('@'))
    if (valid.length === 0) { toast?.('Enter at least one valid email.', 'error'); return }
    setInviting(true)
    let sent = 0
    for (const email of valid) {
      try {
        await sendInviteEmail({
          email,
          workspaceId: workspace.id,
          workspaceName: workspace.name,
          inviteCode: code,
          role: inviteRole,
          projectAccess: projAccess === 'specific' ? selProjects : projAccess,
          taskAccess,
          meetingAccess: meetAccess,
          inviterName: displayName,
        })
        sent++
      } catch (e) {
        toast?.(`Failed to invite ${email}: ${e.message}`, 'error')
      }
    }
    setInviting(false)
    if (sent > 0) {
      toast?.(`Invite link ready for ${sent} recipient${sent > 1 ? 's' : ''}. Share the link below or use Supabase to enable email delivery.`, 'success')
      setInviteEmails([])
      setEmailInput('')
      setTab('link')
    }
  }

  const inviteUrl = `${window.location.origin}?invite=${code}`
  const inviteUrlWithRole = `${window.location.origin}?invite=${code}&role=${inviteRole}`
  const allProjects = projects?.filter(p => !p.is_pipeline) || []

  const tabStyle = (active) => ({
    padding: '6px 16px', borderRadius: 7, fontSize: 12, fontWeight: 600,
    background: active ? COLORS.surface : 'none',
    border: active ? `1px solid ${COLORS.border}` : '1px solid transparent',
    color: active ? COLORS.text : COLORS.textMuted,
    cursor: 'pointer', transition: 'all 0.12s',
    fontFamily: 'inherit',
  })

  const AccessSelect = ({ label, value, onChange, options }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ ...lStyle, fontSize: 11 }}>{label}</label>
      <div style={{ display: 'flex', gap: 6 }}>
        {options.map(({ v, l, icon }) => (
          <button key={v} onClick={() => onChange(v)} style={{
            flex: 1, padding: '7px 6px', borderRadius: 8, fontSize: 11, fontWeight: 600,
            background: value === v ? COLORS.accentDim : COLORS.bg,
            border: `1px solid ${value === v ? COLORS.accent : COLORS.border}`,
            color: value === v ? COLORS.accentText : COLORS.textMuted,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
          }}>
            <span style={{ fontSize: 14 }}>{icon}</span>
            <span>{l}</span>
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <Modal onClose={onClose} width={540}>
      <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 17, marginBottom: 20 }}>⚙ Workspace Settings</h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 22, background: COLORS.bg, borderRadius: 10, padding: 4 }}>
        {[['members', '👥 Members'], ['invite', '✉ Invite'], ['link', '🔗 Invite Link']].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={tabStyle(tab === t)}>{l}</button>
        ))}
        <div style={{ flex: 1 }} />
        {isOwner && (
          <button onClick={() => setTab('settings')} style={tabStyle(tab === 'settings')}>⚙ General</button>
        )}
      </div>

      {/* ── Members tab ─────────────────────────────────────────────── */}
      {tab === 'members' && (
        <div>
          <label style={lStyle}>Members ({members.length})</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {members.map(m => (
              <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                <Avatar name={m.full_name || m.user_id} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text }}>{m.full_name || (m.user_id === user?.id ? 'You' : m.user_id.slice(0, 8) + '…')}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {m.email && <span>{m.email} · </span>}
                    <span style={{ textTransform: 'capitalize' }}>{m.role}</span> · joined {new Date(m.joined_at).toLocaleDateString()}
                  </div>
                </div>
                {isOwner && m.user_id !== user?.id && (
                  <Btn size="sm" variant="danger" onClick={() => handleRemoveMember(m.user_id)}>Remove</Btn>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
            <Btn onClick={() => setTab('invite')} style={{ width: '100%' }}>+ Invite teammates →</Btn>
          </div>
        </div>
      )}

      {/* ── Invite tab ──────────────────────────────────────────────── */}
      {tab === 'invite' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Email input */}
          <div>
            <label style={lStyle}>Email addresses</label>
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 10 }}>
              Type an email and press Enter or comma to add multiple recipients.
            </p>
            {/* Email chips */}
            {inviteEmails.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {inviteEmails.map(e => (
                  <div key={e} style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLORS.accentDim, border: `1px solid ${COLORS.accent}`, borderRadius: 20, padding: '3px 10px 3px 10px', fontSize: 12, color: COLORS.accentText }}>
                    {e}
                    <button onClick={() => removeEmail(e)} style={{ background: 'none', border: 'none', color: COLORS.accentText, cursor: 'pointer', padding: 0, lineHeight: 1, opacity: 0.7, marginLeft: 2 }}>✕</button>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={emailInput}
                onChange={e => setEmailInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEmail() } }}
                placeholder="colleague@company.com"
                style={{ ...iStyle, flex: 1 }}
              />
              <Btn size="sm" onClick={addEmail} variant="secondary">Add</Btn>
            </div>
          </div>

          {/* User type */}
          <div>
            <label style={lStyle}>User type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {[
                { v: 'admin',  icon: '👑', l: 'Admin',  desc: 'Full access, manage members' },
                { v: 'member', icon: '👤', l: 'Member', desc: 'Standard workspace access' },
                { v: 'viewer', icon: '👁', l: 'Viewer', desc: 'View-only, no edits' },
              ].map(({ v, icon, l, desc }) => (
                <button key={v} onClick={() => setInviteRole(v)} style={{
                  padding: '10px 8px', borderRadius: 10, textAlign: 'left',
                  background: inviteRole === v ? COLORS.accentDim : COLORS.bg,
                  border: `1px solid ${inviteRole === v ? COLORS.accent : COLORS.border}`,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
                }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: inviteRole === v ? COLORS.accentText : COLORS.text }}>{l}</div>
                  <div style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Access levels */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <label style={lStyle}>Access permissions</label>

            <AccessSelect
              label="Project access"
              value={projAccess}
              onChange={setProjAccess}
              options={[
                { v: 'all',      icon: '🌐', l: 'All' },
                { v: 'specific', icon: '📋', l: 'Specific' },
                { v: 'none',     icon: '🚫', l: 'None' },
              ]}
            />

            {projAccess === 'specific' && allProjects.length > 0 && (
              <div style={{ marginTop: -4 }}>
                <label style={{ ...lStyle, fontSize: 11 }}>Select projects</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {allProjects.map(p => (
                    <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', background: COLORS.bg, borderRadius: 7, border: `1px solid ${COLORS.border}`, cursor: 'pointer' }}>
                      <input type="checkbox" checked={selProjects.includes(p.id)} onChange={e => {
                        if (e.target.checked) setSelProjects(prev => [...prev, p.id])
                        else setSelProjects(prev => prev.filter(x => x !== p.id))
                      }} style={{ accentColor: COLORS.accent }} />
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color }} />
                      <span style={{ fontSize: 12, color: COLORS.text }}>{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <AccessSelect
              label="Task access"
              value={taskAccess}
              onChange={setTaskAccess}
              options={[
                { v: 'full', icon: '✏️', l: 'Edit' },
                { v: 'view', icon: '👁',  l: 'View' },
                { v: 'none', icon: '🚫', l: 'None' },
              ]}
            />

            <AccessSelect
              label="Meeting access"
              value={meetAccess}
              onChange={setMeetAccess}
              options={[
                { v: 'full', icon: '📅', l: 'Edit' },
                { v: 'view', icon: '👁',  l: 'View' },
                { v: 'none', icon: '🚫', l: 'None' },
              ]}
            />
          </div>

          <Btn loading={inviting} onClick={handleSendInvites} disabled={inviting || (inviteEmails.length === 0 && !emailInput.trim())}>
            {inviting ? 'Sending…' : `Send invite${inviteEmails.length > 1 ? 's' : ''}  →`}
          </Btn>

          <p style={{ fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6, marginTop: -6 }}>
            💡 Recipients will receive a signup link. To enable actual email delivery, configure Supabase SMTP settings or use a Supabase Edge Function for transactional email (Resend, Postmark, etc.).
          </p>
        </div>
      )}

      {/* ── Invite link tab ──────────────────────────────────────────── */}
      {tab === 'link' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={lStyle}>Invite Code</label>
            <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 10 }}>
              Share this code with teammates so they can join your workspace.
            </p>
            <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <code style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, letterSpacing: '0.15em', color: COLORS.accent, flex: 1 }}>{code}</code>
              <Btn size="sm" onClick={copyCode} variant="secondary">{copying ? '✓ Copied!' : 'Copy'}</Btn>
              {isOwner && <Btn size="sm" onClick={handleRegenCode} variant="secondary">↺ New</Btn>}
            </div>
          </div>

          <div>
            <label style={lStyle}>Invite URL</label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px' }}>
              <span style={{ fontSize: 11, color: COLORS.textMuted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inviteUrl}</span>
              <Btn size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(inviteUrl); toast?.('Link copied!', 'success') }}>Copy</Btn>
            </div>
          </div>
        </div>
      )}

      {/* ── General settings tab ────────────────────────────────────── */}
      {tab === 'settings' && isOwner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={lStyle}>Workspace Name</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={name} onChange={e => setName(e.target.value)} style={{ ...iStyle, flex: 1 }} />
              <Btn onClick={handleSaveName} disabled={saving || name === workspace?.name} size="sm">{saving ? '…' : 'Save'}</Btn>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <Btn variant="secondary" onClick={onClose}>Close</Btn>
      </div>
    </Modal>
  )
}
