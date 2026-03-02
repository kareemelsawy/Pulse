import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { supabase } from '../lib/supabase'
import { COLORS, NOTIFICATION_TRIGGERS } from '../lib/constants'
import { Toggle, Btn, Avatar, Badge, Spinner, iStyle, lStyle } from '../components/UI'
import { startGmailOAuth, parseOAuthToken, getGmailAddress } from '../lib/gmail'
import { getWorkspaceMembers, regenerateInviteCode, updateWorkspaceName, removeMember } from '../lib/db'

const C = COLORS

const section = {
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: 24,
  marginBottom: 20,
}

const sectionTitle = {
  fontFamily: 'Syne',
  fontWeight: 800,
  fontSize: 15,
  marginBottom: 4,
  color: C.text,
}

const sectionDesc = {
  fontSize: 12,
  color: C.textMuted,
  marginBottom: 20,
  lineHeight: 1.6,
}

function Divider() {
  return <div style={{ height: 1, background: C.border, margin: '18px 0' }} />
}

// ─── Tab: Account ─────────────────────────────────────────────────────────────
function AccountTab({ toast }) {
  const { user, signOut } = useAuth()
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

  const loginMethods = []
  if (user?.app_metadata?.providers?.includes('google')) loginMethods.push('Google')
  if (user?.app_metadata?.providers?.includes('email') || !user?.app_metadata?.providers?.length) loginMethods.push('Email + Password')

  return (
    <div>
      {/* Profile */}
      <div style={section}>
        <div style={sectionTitle}>Profile</div>
        <div style={sectionDesc}>Your personal account details.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
          <Avatar name={user?.user_metadata?.full_name || user?.email || 'U'} size={52} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>{user?.user_metadata?.full_name || '—'}</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{user?.email}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              {loginMethods.map(m => <Badge key={m} color={C.accent}>{m}</Badge>)}
            </div>
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
        <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 16 }}>A confirmation link will be sent to the new address.</p>
      </div>

      {/* Password */}
      <div style={section}>
        <div style={sectionTitle}>Change Password</div>
        <div style={sectionDesc}>Update your login password.</div>
        <label style={lStyle}>New Password</label>
        <input value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="6+ characters" type="password" style={{ ...iStyle, marginBottom: 12 }} />
        <label style={lStyle}>Confirm Password</label>
        <input value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Same as above" type="password" style={{ ...iStyle, marginBottom: 16 }} />
        <Btn onClick={handleUpdatePassword} disabled={saving || !newPass || !confirmPass}>Update Password</Btn>
      </div>

      {/* Google Sign-In */}
      <div style={section}>
        <div style={sectionTitle}>Login Methods</div>
        <div style={sectionDesc}>Add or manage how you sign in to Pulse.</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 10 }}>
          <div style={{ width: 32, height: 32, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GoogleColorIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Google</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>Sign in with your Google account</div>
          </div>
          {loginMethods.includes('Google')
            ? <Badge color={C.green}>Connected</Badge>
            : <Btn size="sm" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}>Connect</Btn>
          }
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
          <div style={{ width: 32, height: 32, background: C.accent + '22', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16 }}>✉</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Email + Password</div>
            <div style={{ fontSize: 11, color: C.textMuted }}>{user?.email}</div>
          </div>
          <Badge color={C.green}>Active</Badge>
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ ...section, borderColor: C.red + '44' }}>
        <div style={{ ...sectionTitle, color: C.red }}>Danger Zone</div>
        <div style={sectionDesc}>Signing out will end your current session.</div>
        <Btn variant="danger" onClick={signOut}>Sign Out</Btn>
      </div>
    </div>
  )
}

// ─── Tab: Workspace ────────────────────────────────────────────────────────────
function WorkspaceTab({ toast }) {
  const { workspace, setWorkspace } = useData()
  const { user } = useAuth()
  const [members, setMembers] = useState([])
  const [name,    setName]    = useState(workspace?.name || '')
  const [code,    setCode]    = useState(workspace?.invite_code || '')
  const [copying, setCopying] = useState(false)
  const [saving,  setSaving]  = useState(false)
  const [loading, setLoading] = useState(true)
  const isOwner = workspace?.owner_id === user?.id || workspace?.role === 'owner'

  useEffect(() => {
    if (workspace?.id) {
      getWorkspaceMembers(workspace.id).then(m => { setMembers(m); setLoading(false) }).catch(() => setLoading(false))
    }
  }, [workspace?.id])

  async function handleSaveName() {
    if (!name.trim() || name === workspace.name) return
    setSaving(true)
    try {
      await updateWorkspaceName(workspace.id, name.trim())
      setWorkspace(prev => ({ ...prev, name: name.trim() }))
      toast('Workspace name updated', 'success')
    } catch (e) { toast(e.message, 'error') } finally { setSaving(false) }
  }

  async function handleRegenCode() {
    if (!confirm('This will invalidate the old invite code. Continue?')) return
    try {
      const newCode = await regenerateInviteCode(workspace.id)
      setCode(newCode)
      setWorkspace(prev => ({ ...prev, invite_code: newCode }))
      toast('New invite code generated', 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  async function handleRemoveMember(userId) {
    if (!confirm('Remove this member from the workspace?')) return
    try {
      await removeMember(workspace.id, userId)
      setMembers(prev => prev.filter(m => m.user_id !== userId))
      toast('Member removed', 'success')
    } catch (e) { toast(e.message, 'error') }
  }

  function copyCode() {
    navigator.clipboard.writeText(code)
    setCopying(true)
    setTimeout(() => setCopying(false), 2000)
  }

  const inviteUrl = `${window.location.origin}?invite=${code}`

  return (
    <div>
      <div style={section}>
        <div style={sectionTitle}>Workspace Info</div>
        <div style={sectionDesc}>Manage your workspace name and settings.</div>
        <label style={lStyle}>Workspace Name</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 0 }}>
          <input value={name} onChange={e => setName(e.target.value)} style={{ ...iStyle, flex: 1 }} disabled={!isOwner} />
          {isOwner && <Btn onClick={handleSaveName} disabled={saving || name === workspace?.name} size="sm">{saving ? '…' : 'Save'}</Btn>}
        </div>
      </div>

      <div style={section}>
        <div style={sectionTitle}>Invite Code</div>
        <div style={sectionDesc}>Share this code with teammates so they can join your workspace.</div>
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <code style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 800, letterSpacing: '0.18em', color: C.accent, flex: 1 }}>{code}</code>
          <Btn size="sm" onClick={copyCode} variant="secondary">{copying ? '✓ Copied!' : 'Copy'}</Btn>
          {isOwner && <Btn size="sm" onClick={handleRegenCode} variant="secondary">↺ New</Btn>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: C.textMuted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{inviteUrl}</span>
          <Btn size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(inviteUrl); toast('Link copied!', 'success') }}>Copy Link</Btn>
        </div>
      </div>

      <div style={section}>
        <div style={sectionTitle}>Members {!loading && `(${members.length})`}</div>
        <div style={sectionDesc}>People with access to this workspace.</div>
        {loading ? <Spinner /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map(m => (
              <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
                <Avatar name={m.full_name || m.email || m.user_id} size={32} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.full_name || (m.user_id === user?.id ? 'You' : m.user_id.slice(0, 8) + '…')}</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>{m.email || ''} · {m.role} · joined {new Date(m.joined_at).toLocaleDateString()}</div>
                </div>
                {m.user_id === user?.id && <Badge color={C.accent}>You</Badge>}
                {isOwner && m.user_id !== user?.id && (
                  <Btn size="sm" variant="danger" onClick={() => handleRemoveMember(m.user_id)}>Remove</Btn>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tab: Notifications ───────────────────────────────────────────────────────
function NotificationsTab({ toast }) {
  const { notifSettings, updateNotifSettings } = useData()
  const [clientId,       setClientId]       = useState(notifSettings?.gmail_client_id || '')
  const [token,          setToken]          = useState(notifSettings?.gmail_access_token || null)
  const [email,          setEmail]          = useState(notifSettings?.gmail_email || null)
  const [triggers,       setTriggers]       = useState(notifSettings?.enabled_triggers || { task_assigned: true, status_changed: true, task_completed: true, new_task: false })
  const [notifyAssignee, setNotifyAssignee] = useState(notifSettings?.notify_assignee ?? true)
  const [extraEmails,    setExtraEmails]    = useState(notifSettings?.extra_emails || '')
  const [saving,         setSaving]         = useState(false)

  useEffect(() => {
    const t = parseOAuthToken()
    if (t) {
      getGmailAddress(t).then(addr => {
        setToken(t); setEmail(addr)
        toast?.(`Gmail connected: ${addr}`, 'success')
      })
    }
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await updateNotifSettings({ gmail_client_id: clientId, gmail_access_token: token, gmail_email: email, enabled_triggers: triggers, notify_assignee: notifyAssignee, extra_emails: extraEmails })
      toast('Notification settings saved', 'success')
    } catch (e) { toast(e.message, 'error') } finally { setSaving(false) }
  }

  return (
    <div>
      {/* Gmail connection */}
      <div style={section}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <GoogleColorIcon />
          <div style={sectionTitle}>Gmail Integration</div>
          {email && <Badge color={C.green} style={{ marginLeft: 'auto' }}>Connected</Badge>}
        </div>
        <div style={sectionDesc}>Connect Gmail to send automated email notifications to your team.</div>

        {!email ? (
          <>
            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: 16, fontSize: 12, color: C.textMuted, lineHeight: 1.9, marginBottom: 16 }}>
              <strong style={{ color: C.textDim }}>Setup steps:</strong>
              <ol style={{ paddingLeft: 18, marginTop: 6 }}>
                <li>Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: C.accent }}>Google Cloud Console</a></li>
                <li>Enable <strong style={{ color: C.textDim }}>Gmail API</strong></li>
                <li>Create OAuth 2.0 credentials → Web App</li>
                <li>Add <code style={{ background: C.border, padding: '1px 5px', borderRadius: 3 }}>{window.location.origin}</code> as authorized origin</li>
                <li>Paste Client ID below → Connect</li>
              </ol>
            </div>
            <label style={lStyle}>Google OAuth Client ID</label>
            <input value={clientId} onChange={e => setClientId(e.target.value)} placeholder="xxxxxx.apps.googleusercontent.com" style={{ ...iStyle, marginBottom: 14 }} />
            <button
              onClick={() => { if (!clientId.trim()) { toast('Enter Client ID first', 'error'); return } startGmailOAuth(clientId.trim()) }}
              style={{ background: '#4285F4', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}>
              <GoogleColorIcon white /> Sign in with Google
            </button>
          </>
        ) : (
          <div style={{ background: C.bg, border: `1px solid ${C.green}44`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>✉ Gmail Connected</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>{email}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn size="sm" variant="danger" onClick={() => { setToken(null); setEmail(null) }}>Disconnect</Btn>
            </div>
          </div>
        )}
      </div>

      {/* Triggers */}
      <div style={section}>
        <div style={sectionTitle}>Notification Triggers</div>
        <div style={sectionDesc}>Choose which events send an email notification.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {Object.entries(NOTIFICATION_TRIGGERS).map(([k, { label, desc }]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{label}</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{desc}</div>
              </div>
              <Toggle value={triggers[k]} onChange={v => setTriggers(t => ({ ...t, [k]: v }))} />
            </div>
          ))}
        </div>
      </div>

      {/* Recipients */}
      <div style={section}>
        <div style={sectionTitle}>Recipients</div>
        <div style={sectionDesc}>Who receives notification emails.</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: C.bg, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Notify task assignee</div>
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Email whoever the task is assigned to</div>
          </div>
          <Toggle value={notifyAssignee} onChange={setNotifyAssignee} />
        </div>
        <label style={lStyle}>Additional Emails (comma-separated)</label>
        <input value={extraEmails} onChange={e => setExtraEmails(e.target.value)} placeholder="manager@co.com, ceo@co.com" style={iStyle} />
      </div>

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
  const [tab, setTab] = useState('account')

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 28 }}>
      <div style={{ maxWidth: 680 }}>
        <h1 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 24, letterSpacing: '-0.03em', marginBottom: 6 }}>Settings</h1>
        <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 28 }}>Manage your account, workspace, and notifications.</p>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: 4 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, padding: '8px 0', borderRadius: 7, fontSize: 13, fontWeight: 600,
              background: tab === t.id ? C.bg : 'none',
              color: tab === t.id ? C.text : C.textMuted,
              border: tab === t.id ? `1px solid ${C.border}` : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s',
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

function GoogleColorIcon({ white }) {
  if (white) return <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}
