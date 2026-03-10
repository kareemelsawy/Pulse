// v3 - with email sending + pending invites tab
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { supabase } from '../lib/supabase'
import { COLORS } from '../lib/constants'
import { Avatar, Btn, Spinner } from '../components/UI'
import { getWorkspaceMembers, removeMember } from '../lib/db/workspace'
import { sendEmail } from '../lib/gmail'

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

  async function handleRole(e) {
    setChanging(true)
    await onRoleChange(m.user_id, e.target.value)
    setChanging(false)
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 14px', borderRadius: 12,
      background: COLORS.surface, border: `1px solid ${COLORS.border}`,
    }}>
      <Avatar name={m.full_name || m.email} size={36} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {m.full_name || m.email} {isMe && <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 400 }}>(you)</span>}
        </div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</div>
      </div>

      {isAdmin && !isMe && m.role !== 'owner' ? (
        <select value={m.role} onChange={handleRole} disabled={changing} style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`,
          color: COLORS.textDim, borderRadius: 8, padding: '5px 10px',
          fontSize: 12, outline: 'none', cursor: 'pointer',
          fontFamily: 'inherit', opacity: changing ? 0.5 : 1,
        }}>
          <option value="admin">Admin</option>
          <option value="pm">Program Manager</option>
          <option value="user">User</option>
        </select>
      ) : (
        <RoleTag role={m.role} />
      )}

      {isAdmin && !isMe && m.role !== 'owner' && (
        <button onClick={() => onRemove(m.user_id)} style={{
          background: 'none', border: `1px solid ${COLORS.border}`,
          borderRadius: 7, padding: '5px 12px',
          color: COLORS.red, fontSize: 11, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
        }}>Remove</button>
      )}
    </div>
  )
}

export default function UsersPage({ toast }) {
  const { workspace, projects, notifSettings } = useData()
  const { user } = useAuth()

  const isAdmin = workspace?.owner_id === user?.id ||
    ['owner', 'admin'].includes(workspace?.role)

  const [members,        setMembers]        = useState([])
  const [pendingInvites, setPendingInvites] = useState([])
  const [loading,        setLoading]        = useState(true)
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [view,           setView]           = useState('members')
  const [inviting,       setInviting]       = useState(false)
  const [copied,         setCopied]         = useState(false)
  const [emails,         setEmails]         = useState([])
  const [emailInput,     setEmailInput]     = useState('')
  const [role,           setRole]           = useState('user')
  const [selProjects,    setSelProjects]    = useState([])
  const [inviteResult,   setInviteResult]   = useState(null)
  const [cancellingId,   setCancellingId]   = useState(null)

  const allProjects    = projects?.filter(p => !p.is_pipeline) || []
  const code           = workspace?.invite_code || ''
  const inviteUrl      = `${window.location.origin}?invite=${code}`
  const emailConfigured = !!(notifSettings?.resend_api_key || notifSettings?.sendgrid_api_key)

  useEffect(() => {
    if (!workspace?.id) return
    setLoading(true)
    getWorkspaceMembers(workspace.id)
      .then(m => { setMembers(m); setLoading(false) })
      .catch(() => setLoading(false))
  }, [workspace?.id])

  const loadPendingInvites = useCallback(async () => {
    if (!workspace?.id) return
    setLoadingInvites(true)
    try {
      const { data } = await supabase
        .from('workspace_invites')
        .select('*')
        .eq('workspace_id', workspace.id)
        .is('accepted_at', null)
        .order('created_at', { ascending: false })
      setPendingInvites(data || [])
    } catch (_) {}
    setLoadingInvites(false)
  }, [workspace?.id])

  useEffect(() => {
    if (view === 'pending') loadPendingInvites()
  }, [view, loadPendingInvites])

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
    let emailsSent = 0
    try {
      for (const email of valid) {
        // Save to DB — delete existing then insert fresh
        try {
          await supabase.from('workspace_invites')
            .delete()
            .eq('workspace_id', workspace.id)
            .eq('email', email)
          await supabase.from('workspace_invites').insert({
            workspace_id: workspace.id,
            email,
            role,
            project_ids: selProjects.length ? selProjects : null,
            invite_code: code,
            invited_by: user?.email,
            created_at: new Date().toISOString(),
          })
        } catch (_) {}

        // Send email if configured
        if (emailConfigured) {
          try {
            const roleLabel   = ROLE_DEFS.find(r => r.v === role)?.label || role
            const inviterName = user?.user_metadata?.full_name || user?.email || 'Your admin'
            const html = buildInviteEmailHtml({
              email, inviterName,
              workspaceName: workspace?.name || 'Pulse',
              roleLabel, inviteUrl,
            })
            await sendEmail({
              apiKey:         notifSettings?.resend_api_key || notifSettings?.sendgrid_api_key,
              functionSecret: notifSettings?.function_secret,
              fromEmail:      notifSettings?.from_email || notifSettings?.sendgrid_from_email,
              fromName:       notifSettings?.from_name || 'Pulse',
              to:             email,
              subject:        `You've been invited to ${workspace?.name || 'Pulse'}`,
              html,
            })
            emailsSent++
          } catch (_) {}
        }
      }

      setInviteResult({ emails: valid, url: inviteUrl, emailsSent })
      setEmails([])
      setEmailInput('')
      toast(
        emailConfigured
          ? `Invite email sent to ${valid.length} recipient${valid.length > 1 ? 's' : ''}`
          : `Invite link ready — copy and share it manually`,
        'success'
      )
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setInviting(false)
    }
  }

  async function handleResendInvite(inv) {
    if (!emailConfigured) { toast('Email not configured — go to Settings → Integrations', 'error'); return }
    try {
      const roleLabel   = ROLE_DEFS.find(r => r.v === inv.role)?.label || inv.role
      const inviterName = user?.user_metadata?.full_name || user?.email || 'Your admin'
      const html = buildInviteEmailHtml({
        email: inv.email, inviterName,
        workspaceName: workspace?.name || 'Pulse',
        roleLabel, inviteUrl,
      })
      await sendEmail({
        apiKey:         notifSettings?.resend_api_key || notifSettings?.sendgrid_api_key,
        functionSecret: notifSettings?.function_secret,
        fromEmail:      notifSettings?.from_email || notifSettings?.sendgrid_from_email,
        fromName:       notifSettings?.from_name || 'Pulse',
        to:             inv.email,
        subject:        `You've been invited to ${workspace?.name || 'Pulse'}`,
        html,
      })
      toast(`Invite resent to ${inv.email}`, 'success')
    } catch (e) {
      toast('Failed to resend: ' + e.message, 'error')
    }
  }

  async function handleCancelInvite(inviteId) {
    if (!confirm('Cancel this invitation?')) return
    setCancellingId(inviteId)
    try {
      await supabase.from('workspace_invites').delete().eq('id', inviteId)
      setPendingInvites(prev => prev.filter(i => i.id !== inviteId))
      toast('Invitation cancelled', 'success')
    } catch (e) {
      toast(e.message, 'error')
    }
    setCancellingId(null)
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

  const tabs = [
    { v: 'members', l: '👥  Members' },
    { v: 'pending', l: pendingInvites.length ? `⏳  Pending (${pendingInvites.length})` : '⏳  Pending' },
    { v: 'invite',  l: '✉  Invite User' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', minHeight: 0 }}>
      <div style={{ maxWidth: 700 }}>

        <h1 style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 4, color: COLORS.text }}>Users</h1>
        <p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
          Invite teammates and manage their roles and access.
        </p>

        {/* Sub-nav */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: COLORS.surface, borderRadius: 12, padding: 4, width: 'fit-content', border: `1px solid ${COLORS.border}` }}>
          {tabs.map(({ v, l }) => (
            <button key={v} onClick={() => { setView(v); setInviteResult(null) }} style={{
              padding: '7px 18px', borderRadius: 9, fontSize: 12, fontWeight: 600,
              background: view === v ? COLORS.surfaceHover : 'transparent',
              border: view === v ? `1px solid ${COLORS.borderStrong}` : '1px solid transparent',
              color: view === v ? COLORS.text : COLORS.textMuted,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s',
            }}>{l}</button>
          ))}
        </div>

        {/* ── Members ── */}
        {view === 'members' && (
          <div style={G.panel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, margin: 0 }}>
                  {loading ? 'Members' : `Members (${members.length})`}
                </h3>
                <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '4px 0 0' }}>Everyone with active access to this workspace.</p>
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
                  <MemberRow key={m.user_id} m={m} currentUserId={user?.id} isAdmin={isAdmin} onRoleChange={handleChangeRole} onRemove={handleRemove} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Pending invites ── */}
        {view === 'pending' && (
          <div style={G.panel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, margin: 0 }}>Pending Invitations</h3>
                <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '4px 0 0' }}>Invited users who haven't joined yet.</p>
              </div>
              <Btn size="sm" variant="secondary" onClick={loadPendingInvites}>↻ Refresh</Btn>
            </div>

            {loadingInvites ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}><Spinner /></div>
            ) : pendingInvites.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: COLORS.textMuted, fontSize: 13 }}>No pending invitations.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {pendingInvites.map(inv => {
                  const roleInfo  = ROLE_DEFS.find(r => r.v === inv.role) || { label: inv.role || 'User', color: '#34D17A', icon: '👤' }
                  const invDate   = inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
                  return (
                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 12, background: COLORS.surface, border: `1px solid ${COLORS.border}` }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: COLORS.surfaceHover, border: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, color: COLORS.textMuted }}>✉</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.text, marginBottom: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inv.email}</div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted }}>Invited {invDate}{inv.invited_by ? ` by ${inv.invited_by}` : ''}</div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: roleInfo.color + '18', color: roleInfo.color, border: `1px solid ${roleInfo.color}33`, whiteSpace: 'nowrap' }}>
                        {roleInfo.icon} {roleInfo.label}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 20, background: '#FBBF2418', color: '#FBBF24', border: '1px solid #FBBF2433', whiteSpace: 'nowrap' }}>⏳ Pending</span>
                      {isAdmin && (
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button onClick={() => handleResendInvite(inv)} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: COLORS.accent, cursor: 'pointer', fontFamily: 'inherit' }}>Resend</button>
                          <button onClick={() => handleCancelInvite(inv.id)} disabled={cancellingId === inv.id} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '5px 10px', fontSize: 11, fontWeight: 600, color: COLORS.red, cursor: 'pointer', fontFamily: 'inherit', opacity: cancellingId === inv.id ? 0.5 : 1 }}>Cancel</button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {!emailConfigured && (
              <div style={{ marginTop: 16, padding: '12px 16px', background: '#FBBF2408', border: '1px solid #FBBF2433', borderRadius: 10 }}>
                <p style={{ fontSize: 12, color: '#FBBF24', margin: 0 }}>
                  ⚠️ Email not configured — invites are link-only. Set up your API key in <strong>Settings → Integrations</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Invite form ── */}
        {view === 'invite' && (
          <>
            {!emailConfigured && (
              <div style={{ padding: '12px 16px', background: '#FBBF2408', border: '1px solid #FBBF2433', borderRadius: 10, marginBottom: 16 }}>
                <p style={{ fontSize: 12, color: '#FBBF24', margin: 0 }}>
                  ⚠️ Email sending is not configured — invites will be link-only. Set up in <strong>Settings → Integrations</strong>.
                </p>
              </div>
            )}

            {/* Quick link */}
            <div style={G.panel}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, margin: '0 0 4px' }}>Share Invite Link</h3>
              <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 14px' }}>Anyone with this link can join your workspace.</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <div style={{ flex: 1, fontSize: 12, color: COLORS.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '9px 12px', background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10 }}>
                  {inviteUrl}
                </div>
                <Btn size="sm" onClick={copyInviteUrl}>{copied ? '✓ Copied' : 'Copy Link'}</Btn>
              </div>
            </div>

            {/* Email invite form */}
            <div style={{ ...G.panel, borderTop: `2px solid ${COLORS.accent}` }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, margin: '0 0 4px' }}>
                {emailConfigured ? 'Send Invite by Email' : 'Invite by Email (link only)'}
              </h3>
              <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 18px' }}>
                {emailConfigured
                  ? 'Set a role and send — recipients get a branded invite email with the link.'
                  : 'Set a role before sharing — the link will grant that role automatically.'}
              </p>

              {/* Email chips */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,210,240,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Email Addresses</label>
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
                  <input value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addEmail() } }} placeholder="colleague@company.com" style={G.input} />
                  <Btn size="sm" variant="secondary" onClick={addEmail}>Add</Btn>
                </div>
              </div>

              <div style={{ height: 1, background: COLORS.surfaceHover, margin: '18px 0' }} />

              {/* Role picker */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,210,240,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Assign Role</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ROLE_DEFS.map(r => (
                    <button key={r.v} onClick={() => setRole(r.v)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderRadius: 12, textAlign: 'left', width: '100%', background: role === r.v ? `${r.color}10` : COLORS.surface, border: `1px solid ${role === r.v ? r.color + '55' : COLORS.border}`, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.12s' }}>
                      <span style={{ fontSize: 22, flexShrink: 0 }}>{r.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: role === r.v ? r.color : COLORS.text }}>{r.label}</span>
                          {role === r.v && <span style={{ fontSize: 9, fontWeight: 800, background: r.color + '22', color: r.color, borderRadius: 4, padding: '1px 7px', letterSpacing: '0.06em' }}>SELECTED</span>}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5 }}>{r.desc}</div>
                      </div>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', flexShrink: 0, border: `2px solid ${role === r.v ? r.color : COLORS.border}`, background: role === r.v ? r.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'rgba(200,210,240,0.45)', letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 7 }}>Assign Programs</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {allProjects.map(p => (
                      <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, cursor: 'pointer', background: selProjects.includes(p.id) ? COLORS.accent + '08' : COLORS.surface, border: `1px solid ${selProjects.includes(p.id) ? COLORS.accent + '55' : COLORS.border}`, transition: 'all 0.12s' }}>
                        <input type="checkbox" checked={selProjects.includes(p.id)} onChange={e => { if (e.target.checked) setSelProjects(prev => [...prev, p.id]); else setSelProjects(prev => prev.filter(x => x !== p.id)) }} style={{ accentColor: COLORS.accent, width: 14, height: 14, flexShrink: 0 }} />
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
                    ✓ {inviteResult.emailsSent > 0 ? `Email sent to ${inviteResult.emails.join(', ')}` : `Invite configured for ${inviteResult.emails.join(', ')}`}
                  </div>
                  <p style={{ fontSize: 12, color: COLORS.textMuted, margin: '0 0 10px', lineHeight: 1.5 }}>
                    {inviteResult.emailsSent > 0 ? "They'll receive an email with the invite link and join with the assigned role." : 'Share this link — they\'ll join automatically with the assigned role.'}
                  </p>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: '9px 12px' }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Mono', monospace" }}>{inviteResult.url}</span>
                    <Btn size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(inviteResult.url); toast('Copied!', 'success') }}>Copy</Btn>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 18 }}>
                <Btn onClick={handleInvite} disabled={inviting || (emails.length === 0 && !emailInput.trim())}>
                  {inviting ? 'Sending…' : emailConfigured ? 'Send Invite Email →' : 'Generate Invite Link →'}
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

// ── Invite email HTML ──────────────────────────────────────────────────────────
function buildInviteEmailHtml({ email, inviterName, workspaceName, roleLabel, inviteUrl }) {
  const border  = 'rgba(255,255,255,0.09)'
  const surface = '#111420'
  const textDim = 'rgba(200,210,240,0.75)'
  const muted   = 'rgba(200,210,240,0.40)'
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="26" height="26" style="display:block;"><rect width="512" height="512" rx="115" ry="115" fill="rgba(255,255,255,0.22)"/><path d="M 256,90 C 242,180 180,242 90,256 C 180,270 242,332 256,422 C 270,332 332,270 422,256 C 332,242 270,180 256,90 Z" fill="#ffffff"/></svg>`

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td style="background:linear-gradient(135deg,#6B8EF7,#C084FC);border-radius:14px 14px 0 0;padding:18px 24px;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td><table cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;padding-right:9px;">${logoSvg}</td>
            <td style="vertical-align:middle;"><span style="font-size:19px;font-weight:900;color:#fff;letter-spacing:-0.5px;">Pulse</span></td>
          </tr></table></td>
          <td align="right"><span style="background:rgba(255,255,255,0.20);color:#fff;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;">Workspace Invite</span></td>
        </tr></table>
      </td></tr>
      <tr><td style="background:${surface};border:1px solid ${border};border-top:none;border-radius:0 0 14px 14px;padding:26px 24px;">
        <p style="color:${textDim};font-size:13px;margin:0 0 4px;"><strong style="color:#F0F4FF;">${inviterName}</strong> invited you to join</p>
        <h2 style="color:#F0F4FF;font-size:22px;margin:0 0 20px;font-weight:800;">${workspaceName}</h2>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0E1019;border:1px solid ${border};border-radius:10px;overflow:hidden;margin-bottom:22px;">
          <tr>
            <td style="padding:10px 14px;color:${muted};font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;white-space:nowrap;width:100px;border-bottom:1px solid ${border};">Your Role</td>
            <td style="padding:10px 14px;border-bottom:1px solid ${border};"><span style="background:#6B8EF733;color:#6B8EF7;border:1px solid #6B8EF755;border-radius:5px;padding:2px 9px;font-size:11px;font-weight:700;">${roleLabel}</span></td>
          </tr>
          <tr>
            <td style="padding:10px 14px;color:${muted};font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;white-space:nowrap;">Sent to</td>
            <td style="padding:10px 14px;color:${textDim};font-size:13px;">${email}</td>
          </tr>
        </table>
        <div style="text-align:center;margin-bottom:22px;">
          <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#6B8EF7,#C084FC);color:#fff;text-decoration:none;padding:13px 32px;border-radius:10px;font-weight:700;font-size:14px;">Accept Invitation →</a>
        </div>
        <p style="color:${muted};font-size:11px;margin:0 0 4px;text-align:center;">Or copy this link:</p>
        <p style="color:#6B8EF7;font-size:11px;margin:0;text-align:center;word-break:break-all;">${inviteUrl}</p>
        <div style="margin-top:28px;padding-top:16px;border-top:1px solid ${border};">
          <p style="color:${muted};font-size:11px;margin:0;">Sent by Pulse &nbsp;&middot;&nbsp; ${inviterName} invited you to ${workspaceName}.</p>
        </div>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}
