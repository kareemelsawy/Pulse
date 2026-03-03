import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { supabase } from '../lib/supabase'
import { NOTIFICATION_TRIGGERS } from '../lib/constants'
import { Toggle, Btn, Avatar, Badge, Spinner } from '../components/UI'
import { startGmailOAuth, parseOAuthToken, getGmailAddress } from '../lib/gmail'
import { getWorkspaceMembers, regenerateInviteCode, updateWorkspaceName, removeMember } from '../lib/db'

function useS() {
  const { colors } = useTheme()
  return {
    iStyle: { width: '100%', background: colors.inputBg, border: `1px solid ${colors.border}`, borderRadius: 8, padding: '8px 12px', color: colors.text, fontSize: 13, outline: 'none', lineHeight: 1.4 },
    lStyle: { fontSize: 11, fontWeight: 700, color: colors.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 6, lineHeight: 1.4 },
  }
}

function Section({ children }) {
  const { colors } = useTheme()
  return <div style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 14, padding: 24, marginBottom: 20 }}>{children}</div>
}
function SectionTitle({ children, danger }) {
  const { colors } = useTheme()
  return <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, color: danger ? colors.red : colors.text, lineHeight: 1.3 }}>{children}</div>
}
function SectionDesc({ children }) {
  const { colors } = useTheme()
  return <div style={{ fontSize: 12, color: colors.textMuted, marginBottom: 20, lineHeight: 1.6 }}>{children}</div>
}
function Divider() {
  const { colors } = useTheme()
  return <div style={{ height: 1, background: colors.border, margin: '18px 0' }} />
}

// ─── Account Tab ──────────────────────────────────────────────────────────────
function AccountTab({ toast }) {
  const { user, signOut } = useAuth()
  const { colors } = useTheme()
  const { iStyle, lStyle } = useS()
  const [newName,     setNewName]     = useState(user?.user_metadata?.full_name || '')
  const [newEmail,    setNewEmail]    = useState('')
  const [newPass,     setNewPass]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [saving,      setSaving]      = useState(false)

  async function handleUpdateName() {
    if (!newName.trim()) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: newName.trim() } })
    setSaving(false)
    if (error) toast(error.message, 'error')
    else toast('Name updated', 'success')
  }

  async function handleUpdateEmail() {
    if (!newEmail.trim()) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setSaving(false)
    if (error) toast(error.message, 'error')
    else toast('Confirmation email sent to ' + newEmail, 'success')
  }

  async function handleUpdatePassword() {
    if (newPass.length < 6) { toast('Password must be 6+ characters', 'error'); return }
    if (newPass !== confirmPass) { toast('Passwords do not match', 'error'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    setSaving(false)
    if (error) toast(error.message, 'error')
    else { toast('Password updated', 'success'); setNewPass(''); setConfirmPass('') }
  }

  return (
    <div>
      <Section>
        <SectionTitle>Profile</SectionTitle>
        <SectionDesc>Your personal account details.</SectionDesc>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <Avatar name={user?.user_metadata?.full_name || user?.email || 'U'} size={52} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.4 }}>{user?.user_metadata?.full_name || '—'}</div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 1.4 }}>{user?.email}</div>
          </div>
        </div>
        <Divider />
        <label style={lStyle}>Display Name</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Your name" style={{ ...iStyle, flex: 1 }} />
          <Btn size="sm" onClick={handleUpdateName} disabled={saving || !newName.trim() || newName === user?.user_metadata?.full_name}>Save</Btn>
        </div>
        <Divider />
        <label style={lStyle}>Change Email</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
          <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@email.com" type="email" style={{ ...iStyle, flex: 1 }} />
          <Btn size="sm" onClick={handleUpdateEmail} disabled={saving || !newEmail.trim()}>Update</Btn>
        </div>
        <p style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.4 }}>A confirmation link will be sent to the new address.</p>
      </Section>

      <Section>
        <SectionTitle>Change Password</SectionTitle>
        <SectionDesc>Update your login password.</SectionDesc>
        <label style={lStyle}>New Password</label>
        <input value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="6+ characters" type="password" style={{ ...iStyle, marginBottom: 12 }} />
        <label style={lStyle}>Confirm Password</label>
        <input value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Same as above" type="password" style={{ ...iStyle, marginBottom: 16 }} />
        <Btn onClick={handleUpdatePassword} disabled={saving || !newPass || !confirmPass}>Update Password</Btn>
      </Section>

      <Section>
        <SectionTitle>Login Methods</SectionTitle>
        <SectionDesc>Add or manage how you sign in to Pulse.</SectionDesc>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: colors.bg, borderRadius: 10, border: `1px solid ${colors.border}`, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, background: '#4285F4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontWeight: 700, fontSize: 13, lineHeight: 1 }}>G</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4 }}>Google</div>
            <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.4 }}>Sign in with your Google account</div>
          </div>
          <Btn size="sm" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>Connect</Btn>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: colors.bg, borderRadius: 10, border: `1px solid ${colors.border}` }}>
          <div style={{ width: 32, height: 32, background: colors.accent + '22', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, lineHeight: 1 }}>✉</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4 }}>Email + Password</div>
            <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.4 }}>{user?.email}</div>
          </div>
          <Badge color={colors.green}>Active</Badge>
        </div>
      </Section>

      <Section>
        <SectionTitle danger>Danger Zone</SectionTitle>
        <SectionDesc>Signing out will end your current session.</SectionDesc>
        <Btn variant="danger" onClick={signOut}>Sign Out</Btn>
      </Section>
    </div>
  )
}

// ─── Workspace Tab ────────────────────────────────────────────────────────────
function WorkspaceTab({ toast }) {
  const { workspace, setWorkspace } = useData()
  const { user } = useAuth()
  const { colors } = useTheme()
  const { iStyle, lStyle } = useS()
  const [members, setMembers] = useState([])
  const [name,    setName]    = useState(workspace?.name || '')
  const [code,    setCode]    = useState(workspace?.invite_code || '')
  const [copying, setCopying] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(true)
  const isOwner = workspace?.owner_id === user?.id || workspace?.role === 'owner'

  useEffect(() => {
    if (workspace?.id) getWorkspaceMembers(workspace.id).then(m => { setMembers(m); setLoading(false) }).catch(() => setLoading(false))
  }, [workspace?.id])

  async function handleSaveName() {
    if (!name.trim() || name === workspace.name) return
    setSaving(true)
    try { await updateWorkspaceName(workspace.id, name.trim()); setWorkspace(prev => ({ ...prev, name: name.trim() })); toast('Workspace name updated', 'success') }
    catch (e) { toast(e.message, 'error') } finally { setSaving(false) }
  }

  async function handleRegenCode() {
    if (!confirm('This will invalidate the old invite code. Continue?')) return
    try { const c = await regenerateInviteCode(workspace.id); setCode(c); setWorkspace(prev => ({ ...prev, invite_code: c })); toast('New invite code generated', 'success') }
    catch (e) { toast(e.message, 'error') }
  }

  async function handleRemoveMember(userId) {
    if (!confirm('Remove this member?')) return
    try { await removeMember(workspace.id, userId); setMembers(prev => prev.filter(m => m.user_id !== userId)); toast('Member removed', 'success') }
    catch (e) { toast(e.message, 'error') }
  }

  function copyCode() { navigator.clipboard.writeText(code); setCopying(true); setTimeout(() => setCopying(false), 2000) }
  const inviteUrl = `${window.location.origin}?invite=${code}`

  return (
    <div>
      <Section>
        <SectionTitle>Workspace Info</SectionTitle>
        <SectionDesc>Manage your workspace name.</SectionDesc>
        <label style={lStyle}>Workspace Name</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={name} onChange={e => setName(e.target.value)} style={{ ...iStyle, flex: 1 }} disabled={!isOwner} />
          {isOwner && <Btn onClick={handleSaveName} disabled={saving || name === workspace?.name} size="sm">{saving ? '…' : 'Save'}</Btn>}
        </div>
      </Section>

      <Section>
        <SectionTitle>Invite Code</SectionTitle>
        <SectionDesc>Share this code with teammates so they can join your workspace.</SectionDesc>
        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <code style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 800, letterSpacing: '0.18em', color: colors.accent, flex: 1, lineHeight: 1.3 }}>{code}</code>
          <Btn size="sm" onClick={copyCode} variant="secondary">{copying ? '✓ Copied!' : 'Copy'}</Btn>
          {isOwner && <Btn size="sm" onClick={handleRegenCode} variant="secondary">↺ New</Btn>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: colors.textMuted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4 }}>{inviteUrl}</span>
          <Btn size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(inviteUrl); toast('Link copied!', 'success') }}>Copy Link</Btn>
        </div>
      </Section>

      <Section>
        <SectionTitle>Members {!loading && `(${members.length})`}</SectionTitle>
        <SectionDesc>People with access to this workspace.</SectionDesc>
        {loading ? <Spinner /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map(m => (
              <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: colors.bg, borderRadius: 10, border: `1px solid ${colors.border}` }}>
                <Avatar name={m.full_name || m.email || m.user_id} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>{m.full_name || (m.user_id === user?.id ? 'You' : m.user_id.slice(0,8) + '…')}</div>
                  <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.4 }}>{m.email || ''} · {m.role}</div>
                </div>
                {m.user_id === user?.id && <Badge color={colors.accent}>You</Badge>}
                {isOwner && m.user_id !== user?.id && <Btn size="sm" variant="danger" onClick={() => handleRemoveMember(m.user_id)}>Remove</Btn>}
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  )
}

// ─── Notifications Tab ────────────────────────────────────────────────────────
function NotificationsTab({ toast }) {
  const { notifSettings, updateNotifSettings } = useData()
  const { colors } = useTheme()
  const { iStyle, lStyle } = useS()
  const [clientId,       setClientId]       = useState(notifSettings?.gmail_client_id || '')
  const [token,          setToken]          = useState(notifSettings?.gmail_access_token || null)
  const [email,          setEmail]          = useState(notifSettings?.gmail_email || null)
  const [triggers,       setTriggers]       = useState(notifSettings?.enabled_triggers || { task_assigned: true, status_changed: true, task_completed: true, new_task: false })
  const [notifyAssignee, setNotifyAssignee] = useState(notifSettings?.notify_assignee ?? true)
  const [extraEmails,    setExtraEmails]    = useState(notifSettings?.extra_emails || '')
  const [saving,         setSaving]         = useState(false)

  useEffect(() => {
    const t = parseOAuthToken()
    if (t) { getGmailAddress(t).then(addr => { setToken(t); setEmail(addr); toast(`Gmail connected: ${addr}`, 'success') }) }
  }, [])

  async function handleSave() {
    setSaving(true)
    try { await updateNotifSettings({ gmail_client_id: clientId, gmail_access_token: token, gmail_email: email, enabled_triggers: triggers, notify_assignee: notifyAssignee, extra_emails: extraEmails }); toast('Saved', 'success') }
    catch (e) { toast(e.message, 'error') } finally { setSaving(false) }
  }

  return (
    <div>
      <Section>
        <SectionTitle>Gmail Integration</SectionTitle>
        <SectionDesc>Connect Gmail to send automated notifications to your team.</SectionDesc>
        {!email ? (
          <>
            <label style={lStyle}>Google OAuth Client ID</label>
            <input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="xxxxxx.apps.googleusercontent.com" style={{ ...iStyle, marginBottom: 14 }} />
            <button onClick={() => { if (!clientId.trim()) { toast('Enter Client ID first', 'error'); return } startGmailOAuth(clientId.trim()) }}
              style={{ background: '#4285F4', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', lineHeight: 1.4 }}>
              Sign in with Google
            </button>
          </>
        ) : (
          <div style={{ background: colors.bg, border: `1px solid ${colors.green}44`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 4, lineHeight: 1.4 }}>✉ Connected: {email}</div>
            <Btn size="sm" variant="danger" onClick={() => { setToken(null); setEmail(null) }}>Disconnect</Btn>
          </div>
        )}
      </Section>

      <Section>
        <SectionTitle>Notification Triggers</SectionTitle>
        <SectionDesc>Choose which events send an email notification.</SectionDesc>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(NOTIFICATION_TRIGGERS).map(([k, { label, desc }]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: colors.bg, borderRadius: 10, border: `1px solid ${colors.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4 }}>{label}</div>
                <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
              </div>
              <Toggle value={triggers[k]} onChange={v => setTriggers(t => ({ ...t, [k]: v }))} />
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <SectionTitle>Recipients</SectionTitle>
        <SectionDesc>Who receives notification emails.</SectionDesc>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: colors.bg, borderRadius: 10, border: `1px solid ${colors.border}`, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4 }}>Notify task assignee</div>
            <div style={{ fontSize: 11, color: colors.textMuted, marginTop: 2, lineHeight: 1.4 }}>Email whoever the task is assigned to</div>
          </div>
          <Toggle value={notifyAssignee} onChange={setNotifyAssignee} />
        </div>
        <label style={lStyle}>Additional Emails (comma-separated)</label>
        <input value={extraEmails} onChange={e => setExtraEmails(e.target.value)} placeholder="manager@co.com, ceo@co.com" style={iStyle} />
      </Section>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Notification Settings'}</Btn>
      </div>
    </div>
  )
}

// ─── Main SettingsPage ────────────────────────────────────────────────────────
const TABS = [
  { id: 'account',       label: '👤 Account' },
  { id: 'workspace',     label: '🏢 Workspace' },
  { id: 'notifications', label: '🔔 Notifications' },
]

export default function SettingsPage({ toast }) {
  const { colors } = useTheme()
  const [tab, setTab] = useState('account')

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 680 }}>
        <h1 style={{ fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', marginBottom: 6, lineHeight: 1.2 }}>Settings</h1>
        <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 28, lineHeight: 1.4 }}>Manage your account, workspace, and notifications.</p>
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 10, padding: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '8px 0', borderRadius: 7, fontSize: 13, fontWeight: 600,
              background: tab === t.id ? colors.bg : 'none',
              color: tab === t.id ? colors.text : colors.textMuted,
              border: tab === t.id ? `1px solid ${colors.border}` : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s', lineHeight: 1.4,
            }}>{t.label}</button>
          ))}
        </div>
        {tab === 'account'       && <AccountTab       toast={toast} />}
        {tab === 'workspace'     && <WorkspaceTab     toast={toast} />}
        {tab === 'notifications' && <NotificationsTab toast={toast} />}
      </div>
    </div>
  )
}
