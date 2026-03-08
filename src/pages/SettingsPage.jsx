import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { supabase } from '../lib/supabase'
import { NOTIFICATION_TRIGGERS, COLORS, PROJECT_COLORS } from '../lib/constants'
import { Toggle, Btn, Avatar, Badge, Spinner, Icon, Modal } from '../components/UI'
import { getWorkspaceMembers, regenerateInviteCode, updateWorkspaceName, removeMember } from '../lib/db/workspace'

// ── Glass primitives ──────────────────────────────────────────────────────────
const G = {
  panel: {
    background: COLORS.surface,
    backdropFilter: 'blur(24px) saturate(160%)',
    WebkitBackdropFilter: 'blur(24px) saturate(160%)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
  },
  row: {
    background: COLORS.surface,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
  },
  input: {
    width: '100%',
    background: COLORS.surfaceHover,
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: `1px solid ${COLORS.borderStrong}`,
    borderRadius: 10, padding: '9px 13px',
    color: COLORS.text, fontSize: 13, outline: 'none',
    fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
    transition: 'border-color 0.15s, box-shadow 0.15s',
  },
  label: {
    fontSize: 11, fontWeight: 700,
    color: 'rgba(200,210,240,0.45)',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    display: 'block', marginBottom: 7, lineHeight: 1.4,
  },
  divider: { height: 1, background: COLORS.surfaceHover, margin: '18px 0' },
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function Panel({ children, accent, style: xStyle }) {
  return (
    <div style={{
      ...G.panel,
      borderTop: accent ? `2px solid ${accent}` : undefined,
      padding: '22px 24px', marginBottom: 16,
      ...xStyle,
    }}>{children}</div>
  )
}

function PanelHeader({ title, desc, icon }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
        {icon && (
          <div style={{ width: 30, height: 30, borderRadius: 9, background: COLORS.surfaceHover, border: `1px solid ${COLORS.borderStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={icon} size={14} color={COLORS.textMuted} />
          </div>
        )}
        <h3 style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, margin: 0, letterSpacing: '-0.01em' }}>{title}</h3>
      </div>
      {desc && <p style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6, margin: 0, paddingLeft: icon ? 40 : 0 }}>{desc}</p>}
    </div>
  )
}

function FieldRow({ label, children, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={G.label}>{label}</label>}
      {children}
      {hint && <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 6, lineHeight: 1.5 }}>{hint}</p>}
    </div>
  )
}

function InfoRow({ children }) {
  return (
    <div style={{ ...G.row, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
      {children}
    </div>
  )
}

function Divider() {
  return <div style={G.divider} />
}

function StatusDot({ ok }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 11, fontWeight: 600,
      color: ok ? COLORS.green : COLORS.textMuted,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: ok ? COLORS.green : 'rgba(255,255,255,0.20)',
        boxShadow: ok ? `0 0 6px ${COLORS.green}` : 'none',
      }}/>
      {ok ? 'Connected' : 'Not set'}
    </span>
  )
}

// ── Account Tab ───────────────────────────────────────────────────────────────
function AccountTab({ toast }) {
  const { user } = useAuth()
  const [newName, setNewName]     = useState(user?.user_metadata?.full_name || '')
  const [newEmail, setNewEmail]   = useState('')
  const [newPass, setNewPass]     = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [saving, setSaving]       = useState(false)

  // Derive which providers this user has actually authenticated with
  // Supabase puts each linked identity in user.identities[]
  const identityProviders = new Set((user?.identities || []).map(i => i.provider))
  const hasGoogle = identityProviders.has('google')
  const hasEmail  = identityProviders.has('email')

  async function handleUpdateName() {
    if (!newName.trim()) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ data: { full_name: newName.trim() } })
    setSaving(false)
    error ? toast(error.message, 'error') : toast('Name updated', 'success')
  }
  async function handleUpdateEmail() {
    if (!newEmail.trim()) return
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() })
    setSaving(false)
    error ? toast(error.message, 'error') : toast('Confirmation sent to ' + newEmail, 'success')
  }
  async function handleUpdatePassword() {
    if (newPass.length < 6) { toast('Password must be 6+ characters', 'error'); return }
    if (newPass !== confirmPass) { toast('Passwords do not match', 'error'); return }
    setSaving(true)
    const { error } = await supabase.auth.updateUser({ password: newPass })
    setSaving(false)
    error ? toast(error.message, 'error') : (toast('Password updated', 'success'), setNewPass(''), setConfirmPass(''))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Profile */}
      <Panel>
        <PanelHeader title="Profile" desc="Your personal account details." icon="user" />

        {/* Avatar row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', ...G.row, marginBottom: 18 }}>
          <Avatar name={user?.user_metadata?.full_name || user?.email || 'U'} size={44} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>{user?.user_metadata?.full_name || '—'}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>{user?.email}</div>
          </div>
          <Badge color={COLORS.green}>Active</Badge>
        </div>

        <FieldRow label="Display Name">
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Your name" style={{ ...G.input, flex: 1 }} />
            <Btn size="sm" onClick={handleUpdateName} disabled={saving || !newName.trim() || newName === user?.user_metadata?.full_name}>Save</Btn>
          </div>
        </FieldRow>

        <Divider />

        <FieldRow label="Change Email" hint="A confirmation link will be sent to the new address.">
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="new@email.com" type="email" style={{ ...G.input, flex: 1 }} />
            <Btn size="sm" onClick={handleUpdateEmail} disabled={saving || !newEmail.trim()}>Update</Btn>
          </div>
        </FieldRow>
      </Panel>

      {/* Password */}
      <Panel>
        <PanelHeader title="Change Password" desc="Update your login password." icon="settings" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <FieldRow label="New Password">
            <input value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="6+ characters" type="password" style={G.input} />
          </FieldRow>
          <FieldRow label="Confirm Password">
            <input value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="Same as above" type="password" style={G.input} />
          </FieldRow>
        </div>
        <Btn onClick={handleUpdatePassword} disabled={saving || !newPass || !confirmPass}>Update Password</Btn>
      </Panel>

      {/* Login Methods */}
      <Panel>
        <PanelHeader title="Login Methods" icon="zap" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <InfoRow>
            <div style={{ width: 32, height: 32, background: '#4285F4', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Google</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>Sign in with your Google account</div>
            </div>
            {hasGoogle
              ? <Badge color={COLORS.green}>Active</Badge>
              : <Btn size="sm" variant="secondary" onClick={() => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin } })}>Connect</Btn>
            }
          </InfoRow>
          <InfoRow>
            <div style={{ width: 32, height: 32, background: COLORS.accent + '22', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="mail" size={15} color={COLORS.accent} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13 }}>Email + Password</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{user?.email}</div>
            </div>
            {hasEmail
              ? <Badge color={COLORS.green}>Active</Badge>
              : <Badge color={COLORS.textMuted}>Not linked</Badge>
            }
          </InfoRow>
        </div>
      </Panel>
    </div>
  )
}

// ── Workspace Tab ─────────────────────────────────────────────────────────────
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

  const roleColors = { owner: COLORS.purple, pm: COLORS.blue, user: COLORS.textMuted }
  const roleLabel  = { owner: 'Owner', pm: 'PM', user: 'Member' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Panel>
        <PanelHeader title="Workspace" desc="Manage your workspace identity." icon="folder" />
        <FieldRow label="Workspace Name">
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={name} onChange={e => setName(e.target.value)} style={{ ...G.input, flex: 1 }} disabled={!isOwner} />
            {isOwner && <Btn onClick={handleSaveName} disabled={saving || name === workspace?.name} size="sm">{saving ? '…' : 'Save'}</Btn>}
          </div>
        </FieldRow>
      </Panel>

      <Panel>
        <PanelHeader title="Invite Code" desc="Share this code with teammates to join your workspace." icon="zap" />
        {/* Code display */}
        <div style={{ ...G.row, padding: '18px 22px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
          <code style={{ fontFamily: "'DM Mono', monospace", fontSize: 28, fontWeight: 800, letterSpacing: '0.20em', color: COLORS.accent, flex: 1, lineHeight: 1 }}>
            {code}
          </code>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Btn size="sm" onClick={copyCode} variant="secondary">{copying ? '✓ Copied' : 'Copy'}</Btn>
            {isOwner && <Btn size="sm" onClick={handleRegenCode} variant="secondary">Regenerate</Btn>}
          </div>
        </div>
        {/* Invite URL */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ ...G.input, flex: 1, fontSize: 11, color: COLORS.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '8px 12px', background: COLORS.surface }}>
            {inviteUrl}
          </div>
          <Btn size="sm" variant="secondary" onClick={() => { navigator.clipboard.writeText(inviteUrl); toast('Link copied!', 'success') }}>Copy Link</Btn>
        </div>
      </Panel>

      <Panel>
        <PanelHeader title={`Members ${!loading ? `(${members.length})` : ''}`} desc="Everyone with access to this workspace." icon="user" />
        {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner /></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {members.map(m => (
              <div key={m.user_id} style={{ ...G.row, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, transition: 'background 0.15s' }}>
                <Avatar name={m.full_name || m.email || m.user_id} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{m.full_name || (m.user_id === user?.id ? 'You' : m.user_id.slice(0,8) + '…')}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>{m.email || ''}</div>
                </div>
                <Badge color={roleColors[m.role] || COLORS.textMuted}>{roleLabel[m.role] || m.role}</Badge>
                {m.user_id === user?.id && <Badge color={COLORS.accent}>You</Badge>}
                {isOwner && m.user_id !== user?.id && <Btn size="sm" variant="danger" onClick={() => handleRemoveMember(m.user_id)}>Remove</Btn>}
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  )
}

// ── Notifications Tab ─────────────────────────────────────────────────────────
function NotificationsTab({ toast }) {
  const { notifSettings, updateNotifSettings } = useData()
  const [apiKey, setApiKey]               = useState(notifSettings?.resend_api_key || notifSettings?.sendgrid_api_key || '')
  const [fromEmail, setFromEmail]         = useState(notifSettings?.from_email || notifSettings?.sendgrid_from_email || '')
  const [fromName, setFromName]           = useState(notifSettings?.from_name || notifSettings?.sendgrid_from_name || 'Pulse')
  const [triggers, setTriggers]           = useState(notifSettings?.enabled_triggers || { task_assigned: true, status_changed: true, task_completed: true, new_task: false, comment_added: false, file_added: false })
  const [notifyAssignee, setNotifyAssignee] = useState(notifSettings?.notify_assignee ?? true)
  const [extraEmails, setExtraEmails]     = useState(notifSettings?.extra_emails || '')
  const [saving, setSaving]               = useState(false)
  const [testing, setTesting]             = useState(false)
  const [showKey, setShowKey]             = useState(false)

  useEffect(() => {
    if ((notifSettings?.resend_api_key || notifSettings?.sendgrid_api_key) && !apiKey) setApiKey(notifSettings.resend_api_key || notifSettings.sendgrid_api_key)
    if ((notifSettings?.from_email || notifSettings?.sendgrid_from_email) && !fromEmail) setFromEmail(notifSettings.from_email || notifSettings.sendgrid_from_email)
    if ((notifSettings?.from_name || notifSettings?.sendgrid_from_name) && !fromName) setFromName(notifSettings.from_name || notifSettings.sendgrid_from_name)
  }, [notifSettings?.resend_api_key, notifSettings?.sendgrid_api_key, notifSettings?.from_email, notifSettings?.sendgrid_from_email])

  const isConnected = !!apiKey.trim()

  async function handleSave() {
    if (!fromEmail.trim()) { toast('From email is required', 'error'); return }
    setSaving(true)
    try {
      await updateNotifSettings({ resend_api_key: apiKey.trim(), from_email: fromEmail.trim(), from_name: fromName.trim() || 'Pulse', enabled_triggers: triggers, notify_assignee: notifyAssignee, extra_emails: extraEmails })
      toast('Settings saved', 'success')
    } catch (e) { toast(e.message, 'error') } finally { setSaving(false) }
  }

  async function handleTest() {
    if (!apiKey.trim())    { toast('Enter your API key first', 'error'); return }
    if (!fromEmail.trim()) { toast('Enter a From email first', 'error'); return }
    const testTo = extraEmails.split(',')[0]?.trim() || fromEmail.trim()
    setTesting(true)
    try {
      const { sendEmail } = await import('../lib/gmail')
      await sendEmail({ apiKey: apiKey.trim(), fromEmail: fromEmail.trim(), fromName: fromName.trim() || 'Pulse', to: testTo, subject: 'Pulse — Test email ✓', html: `<div style="font-family:sans-serif;padding:28px;background:#0D0F14;border-radius:12px;"><div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:12px;">◈ Pulse</div><p style="color:#94A3B8;font-size:14px;">Your Resend integration is working! Sent from <strong style="color:#E2E8F0;">${fromEmail.trim()}</strong>.</p></div>` })
      toast(`Test email sent to ${testTo}`, 'success')
    } catch (e) { toast(`Test failed: ${e.message}`, 'error') } finally { setTesting(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Resend config */}
      <Panel>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <PanelHeader title="Resend Integration" desc="Connect Resend to send automated emails. Get your key at resend.com/api-keys." icon="mail" />
          <StatusDot ok={isConnected} />
        </div>

        <FieldRow label="API Key">
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="re_xxxxxxxxxxxxxxxxxxxx" type={showKey ? 'text' : 'password'}
              style={{ ...G.input, flex: 1, fontFamily: "'DM Mono', monospace", fontSize: 12 }} />
            <Btn size="sm" variant="secondary" onClick={() => setShowKey(s => !s)}>{showKey ? 'Hide' : 'Show'}</Btn>
          </div>
        </FieldRow>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <FieldRow label="From Email">
            <input value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="notifications@yourdomain.com" type="email" style={G.input} />
          </FieldRow>
          <FieldRow label="From Name">
            <input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="Pulse" style={G.input} />
          </FieldRow>
        </div>

        <div style={{ padding: '10px 14px', background: 'rgba(107,142,247,0.08)', border: '1px solid rgba(107,142,247,0.18)', borderRadius: 10, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6, marginBottom: 14 }}>
          <strong style={{ color: COLORS.accent }}>Note:</strong> From email must be a verified domain in your Resend account. Emails display as <em>"{fromName || 'Pulse'} &lt;{fromEmail || 'you@domain.com'}&gt;"</em>
        </div>

        <Btn size="sm" variant="secondary" onClick={handleTest} disabled={testing || !isConnected || !fromEmail.trim()}>
          {testing ? 'Sending…' : '✉ Send test email'}
        </Btn>
      </Panel>

      {/* Triggers */}
      <Panel>
        <PanelHeader title="Notification Triggers" desc="Choose which events send an email to your team." icon="bell" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {Object.entries(NOTIFICATION_TRIGGERS).map(([k, { label, desc }]) => (
            <div key={k} style={{ ...G.row, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, transition: 'background 0.15s' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.4 }}>{label}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2, lineHeight: 1.4 }}>{desc}</div>
              </div>
              <Toggle value={!!triggers[k]} onChange={v => setTriggers(t => ({ ...t, [k]: v }))} />
            </div>
          ))}
        </div>
      </Panel>

      {/* Recipients */}
      <Panel>
        <PanelHeader title="Recipients" desc="Who receives notification emails." icon="inbox" />
        <div style={{ ...G.row, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>Notify task assignee</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>Email whoever the task is assigned to</div>
          </div>
          <Toggle value={notifyAssignee} onChange={setNotifyAssignee} />
        </div>
        <FieldRow label="Additional Emails" hint="Comma-separated list of extra recipients for all notifications.">
          <input value={extraEmails} onChange={e => setExtraEmails(e.target.value)} placeholder="manager@co.com, ceo@co.com" style={G.input} />
        </FieldRow>
      </Panel>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 8 }}>
        <Btn onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</Btn>
      </div>
    </div>
  )
}

// ── Integrations Tab ──────────────────────────────────────────────────────────
function IntegrationsTab({ toast }) {
  const [googleClientId, setGoogleClientId]         = useState(() => localStorage.getItem('pulse_google_client_id') || '')
  const [googleClientSecret, setGoogleClientSecret] = useState(() => localStorage.getItem('pulse_google_client_secret') || '')
  const [saving, setSaving]   = useState(false)
  const [testing, setTesting] = useState(false)

  async function handleSave() {
    setSaving(true)
    localStorage.setItem('pulse_google_client_id',     googleClientId.trim())
    localStorage.setItem('pulse_google_client_secret', googleClientSecret.trim())
    toast('Credentials saved locally', 'success')
    setSaving(false)
  }
  async function handleTestGoogle() {
    setTesting(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin, skipBrowserRedirect: true } })
      if (error) throw error
      toast('Google OAuth reachable ✓', 'success')
    } catch (e) {
      toast(e.message.includes('provider') ? 'Google not enabled in Supabase — see setup guide' : e.message, 'error')
    } finally { setTesting(false) }
  }

  const steps = [
    { n: 1, title: 'Create a Google Cloud project', body: 'Go to console.cloud.google.com → New Project.' },
    { n: 2, title: 'Enable OAuth consent screen', body: 'APIs & Services → OAuth consent screen → External → fill in app name, support email, and your domain.' },
    { n: 3, title: 'Create OAuth credentials', body: 'APIs & Services → Credentials → Create OAuth Client ID → Web application.' },
    { n: 4, title: 'Add redirect URI', body: 'Add your Supabase URL + /auth/v1/callback to "Authorised redirect URIs".\ne.g. https://xxxx.supabase.co/auth/v1/callback' },
    { n: 5, title: 'Add authorised origins', body: 'Add your Vercel domain and http://localhost:5173 for local dev.' },
    { n: 6, title: 'Paste into Supabase', body: 'Supabase → Authentication → Providers → Google → paste Client ID & Secret → enable → save.' },
    { n: 7, title: 'Configure redirect URLs', body: 'Supabase → Authentication → URL Configuration → add your site URL and https://yourdomain.com/**' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <Panel>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, background: '#4285F4', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px rgba(66,133,244,0.35)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>Google Sign-In</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>OAuth 2.0 via Supabase Authentication</div>
            </div>
          </div>
          <Btn size="sm" variant="secondary" onClick={handleTestGoogle} disabled={testing}>{testing ? 'Testing…' : 'Test Connection'}</Btn>
        </div>

        <div style={{ padding: '12px 16px', ...G.row, marginBottom: 18, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.65 }}>
          Google Sign-In is configured in your Supabase project. Use the fields below to keep a local reference to your credentials — they're stored in your browser only and never sent anywhere.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <FieldRow label="Client ID (reference)">
            <input value={googleClientId} onChange={e => setGoogleClientId(e.target.value)} placeholder="xxxx.apps.googleusercontent.com" style={{ ...G.input, fontFamily: "'DM Mono', monospace", fontSize: 11 }} />
          </FieldRow>
          <FieldRow label="Client Secret (reference)">
            <input value={googleClientSecret} onChange={e => setGoogleClientSecret(e.target.value)} placeholder="GOCSPX-…" type="password" style={{ ...G.input, fontFamily: "'DM Mono', monospace", fontSize: 11 }} />
          </FieldRow>
        </div>

        <Btn size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save Reference'}</Btn>
      </Panel>

      {/* Setup guide */}
      <Panel>
        <PanelHeader title="Setup Guide" desc="Follow these steps once to enable Google Sign-In for the workspace." icon="fileText" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {steps.map(step => (
            <div key={step.n} style={{ ...G.row, padding: '12px 16px', display: 'flex', gap: 14 }}>
              <div style={{ width: 24, height: 24, borderRadius: 7, background: COLORS.accent + '20', color: COLORS.accent, fontWeight: 800, fontSize: 11, fontFamily: "'DM Mono', monospace", display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, border: `1px solid ${COLORS.accent}30` }}>
                {step.n}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{step.body}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(107,142,247,0.08)', border: '1px solid rgba(107,142,247,0.18)', borderRadius: 10, fontSize: 12, color: COLORS.textMuted, lineHeight: 1.6 }}>
          <strong style={{ color: COLORS.accent }}>Note:</strong> The "Continue with Google" button on the login page works automatically once you enable the provider in Supabase. No code changes needed.
        </div>
      </Panel>
    </div>
  )
}

// ── Data Import Tab (owner only) ──────────────────────────────────────────────
const TASK_FIELDS   = ['project_name','title','status','priority','assignee_name','assignee_email','due_date']
const PROJECT_FIELDS = ['name','description','color']
const VALID_STATUSES  = ['new','inprogress','review','done']
const VALID_PRIORITIES = ['high','medium','low']

function parseCsvLine(line) {
  const vals = []; let cur = ''; let inQ = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQ = !inQ }
    else if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = '' }
    else { cur += ch }
  }
  vals.push(cur.trim())
  return vals.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'))
}

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }
  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim())
  const rows = lines.slice(1).map(line => {
    const vals = parseCsvLine(line)
    const row = {}
    headers.forEach((h, i) => { row[h] = (vals[i] || '').trim() })
    return row
  }).filter(r => Object.values(r).some(v => v))
  return { headers, rows }
}

function DownloadTemplateBtn({ mode }) {
  function download() {
    let csv
    if (mode === 'tasks') {
      csv = TASK_FIELDS.join(',') + '\n'
        + '"Website Redesign","Fix login bug","inprogress","high","Alice Smith","alice@co.com","2025-06-30"\n'
        + '"Website Redesign","Write unit tests","new","medium","Bob Lee","bob@co.com","2025-07-15"\n'
    } else {
      csv = PROJECT_FIELDS.join(',') + '\n'
        + '"Mobile App","New mobile experience","#4F8EF7"\n'
        + '"Backend API","REST API refactor","#22C55E"\n'
    }
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `pulse-${mode}-template.csv`; a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <button onClick={download} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '5px 12px', fontSize: 12, color: COLORS.textMuted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'inherit', transition: 'border-color 0.15s, color 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.color = COLORS.accent }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.color = COLORS.textMuted }}>
      <Icon name="folder" size={13} color="currentColor" />
      Download template
    </button>
  )
}

function ValidationBadge({ errors, warnings }) {
  if (errors > 0) return <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.red, background: COLORS.red + '18', border: `1px solid ${COLORS.red}33`, borderRadius: 6, padding: '2px 8px' }}>{errors} error{errors !== 1 ? 's' : ''}</span>
  if (warnings > 0) return <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', background: '#F59E0B18', border: '1px solid #F59E0B33', borderRadius: 6, padding: '2px 8px' }}>{warnings} warning{warnings !== 1 ? 's' : ''}</span>
  return <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.green, background: COLORS.green + '18', border: `1px solid ${COLORS.green}33`, borderRadius: 6, padding: '2px 8px' }}>✓ Valid</span>
}

function DataImportTab({ toast }) {
  const { workspace, projects, tasks, importProjects, importTasks, editProject, editTask } = useData()
  const { user } = useAuth()
  const fileRef = useRef()
  const [mode, setMode]           = useState('tasks')   // 'tasks' | 'projects'
  const [rawRows, setRawRows]     = useState(null)       // parsed CSV rows
  const [headers, setHeaders]     = useState([])
  const [fileName, setFileName]   = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult]       = useState(null)       // { created, updated, skipped }
  const [previewPage, setPreviewPage] = useState(0)
  const PAGE_SIZE = 8

  // Validate rows and annotate each with _errors / _warnings / _action
  const annotated = rawRows ? rawRows.map((row, i) => {
    const errors = []; const warnings = []

    if (mode === 'tasks') {
      if (!row.title) errors.push('Missing title')
      if (!row.project_name) errors.push('Missing project_name')
      else {
        const projMatch = projects.find(p => p.name.toLowerCase() === row.project_name.toLowerCase())
        if (!projMatch) errors.push(`Project "${row.project_name}" not found`)
      }
      if (row.status && !VALID_STATUSES.includes(row.status)) warnings.push(`Unknown status "${row.status}" → will use "new"`)
      if (row.priority && !VALID_PRIORITIES.includes(row.priority)) warnings.push(`Unknown priority "${row.priority}" → will use "medium"`)
      if (row.due_date && isNaN(Date.parse(row.due_date))) warnings.push(`Invalid due_date "${row.due_date}"`)

      // Detect existing task for UPDATE (match by title + project)
      const projMatch = projects.find(p => p.name.toLowerCase() === (row.project_name || '').toLowerCase())
      const existingTask = projMatch ? tasks.find(t => t.project_id === projMatch.id && t.title.toLowerCase() === (row.title || '').toLowerCase()) : null

      return { ...row, _index: i + 2, _errors: errors, _warnings: warnings, _existing: existingTask || null, _action: existingTask ? 'update' : 'create' }

    } else {
      // projects mode
      if (!row.name) errors.push('Missing name')
      const existingProj = projects.find(p => p.name.toLowerCase() === (row.name || '').toLowerCase())
      if (row.color && !/^#[0-9a-fA-F]{3,6}$/.test(row.color)) warnings.push(`Invalid color "${row.color}" → will use default`)
      return { ...row, _index: i + 2, _errors: errors, _warnings: warnings, _existing: existingProj || null, _action: existingProj ? 'update' : 'create' }
    }
  }) : null

  const errorCount   = annotated ? annotated.reduce((n, r) => n + r._errors.length, 0) : 0
  const warningCount = annotated ? annotated.reduce((n, r) => n + r._warnings.length, 0) : 0
  const createCount  = annotated ? annotated.filter(r => r._action === 'create' && r._errors.length === 0).length : 0
  const updateCount  = annotated ? annotated.filter(r => r._action === 'update' && r._errors.length === 0).length : 0
  const skipCount    = annotated ? annotated.filter(r => r._errors.length > 0).length : 0
  const totalPages   = annotated ? Math.ceil(annotated.length / PAGE_SIZE) : 0
  const pageRows     = annotated ? annotated.slice(previewPage * PAGE_SIZE, (previewPage + 1) * PAGE_SIZE) : []

  function handleFile(file) {
    if (!file) return
    setFileName(file.name)
    setResult(null)
    setPreviewPage(0)
    const r = new FileReader()
    r.onload = ev => {
      const { headers: h, rows } = parseCsv(ev.target.result)
      setHeaders(h)
      setRawRows(rows)
    }
    r.readAsText(file)
  }

  async function handleImport() {
    if (!annotated) return
    setImporting(true)
    let created = 0; let updated = 0; let skipped = 0

    try {
      if (mode === 'tasks') {
        const toCreate = annotated.filter(r => r._action === 'create' && r._errors.length === 0)
        const toUpdate = annotated.filter(r => r._action === 'update' && r._errors.length === 0)
        skipped = annotated.filter(r => r._errors.length > 0).length

        // Build project map name → id
        const projectMap = {}
        projects.forEach(p => { projectMap[p.name] = p.id })

        // Create new tasks via context importTasks
        if (toCreate.length > 0) {
          const rows = toCreate.map(r => ({
            title: r.title,
            status: VALID_STATUSES.includes(r.status) ? r.status : 'new',
            priority: VALID_PRIORITIES.includes(r.priority) ? r.priority : 'medium',
            assignee_name: r.assignee_name || '',
            assignee_email: r.assignee_email || '',
            due_date: r.due_date && !isNaN(Date.parse(r.due_date)) ? r.due_date : null,
            project_name: r.project_name,
          }))
          const newTasks = await importTasks(rows, projectMap)
          created = newTasks.length
        }

        // Update existing tasks via context editTask
        for (const r of toUpdate) {
          const fields = {}
          if (r.status && VALID_STATUSES.includes(r.status)) fields.status = r.status
          if (r.priority && VALID_PRIORITIES.includes(r.priority)) fields.priority = r.priority
          if (r.assignee_name !== undefined) fields.assignee_name = r.assignee_name
          if (r.assignee_email !== undefined) fields.assignee_email = r.assignee_email
          if (r.due_date && !isNaN(Date.parse(r.due_date))) fields.due_date = r.due_date
          if (Object.keys(fields).length > 0) {
            await editTask(r._existing.id, { ...r._existing, ...fields }, r._existing)
            updated++
          } else { skipped++ }
        }

      } else {
        // projects
        const toCreate = annotated.filter(r => r._action === 'create' && r._errors.length === 0)
        const toUpdate = annotated.filter(r => r._action === 'update' && r._errors.length === 0)
        skipped = annotated.filter(r => r._errors.length > 0).length

        if (toCreate.length > 0) {
          const rows = toCreate.map(r => ({
            name: r.name,
            description: r.description || '',
            color: /^#[0-9a-fA-F]{3,6}$/.test(r.color) ? r.color : PROJECT_COLORS[0],
          }))
          const newProjs = await importProjects(rows)
          created = newProjs.length
        }

        for (const r of toUpdate) {
          const fields = {}
          if (r.description !== undefined) fields.description = r.description
          if (r.color && /^#[0-9a-fA-F]{3,6}$/.test(r.color)) fields.color = r.color
          if (Object.keys(fields).length > 0) {
            await editProject(r._existing.id, fields)
            updated++
          } else { skipped++ }
        }
      }

      setResult({ created, updated, skipped })
      setRawRows(null); setHeaders([]); setFileName('')
      toast(`Done — ${created} created, ${updated} updated${skipped > 0 ? `, ${skipped} skipped` : ''}`, 'success')
    } catch (e) {
      toast(e.message, 'error')
    } finally {
      setImporting(false)
    }
  }

  function reset() {
    setRawRows(null); setHeaders([]); setFileName(''); setResult(null); setPreviewPage(0)
    if (fileRef.current) fileRef.current.value = ''
  }

  const modeFields = mode === 'tasks' ? TASK_FIELDS : PROJECT_FIELDS
  const statusColor = s => ({ new: COLORS.textMuted, inprogress: COLORS.blue, review: '#F59E0B', done: COLORS.green }[s] || COLORS.textMuted)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Mode selector */}
      <Panel>
        <PanelHeader title="Mass Upload & Edit via CSV" desc="Import or bulk-update projects and tasks. Existing records are matched by name and updated; new rows are created automatically." icon="folder" />

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[['tasks','Tasks'],['projects','Projects']].map(([id, label]) => (
            <button key={id} onClick={() => { setMode(id); reset() }} style={{
              padding: '8px 20px', borderRadius: 10, border: `2px solid ${mode === id ? COLORS.accent : COLORS.border}`,
              background: mode === id ? COLORS.accent + '18' : 'transparent',
              color: mode === id ? COLORS.accent : COLORS.textDim,
              fontSize: 13, fontWeight: mode === id ? 700 : 400,
              cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>{label}</button>
          ))}
          <div style={{ flex: 1 }} />
          <DownloadTemplateBtn mode={mode} />
        </div>

        {/* Schema reference */}
        <div style={{ background: 'rgba(107,142,247,0.06)', border: `1px solid ${COLORS.accent}22`, borderRadius: 10, padding: '12px 16px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
            {mode === 'tasks' ? 'Tasks CSV columns' : 'Projects CSV columns'}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {modeFields.map(f => (
              <code key={f} style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", background: COLORS.accent + '18', color: COLORS.accent, borderRadius: 5, padding: '2px 8px' }}>{f}</code>
            ))}
          </div>
          {mode === 'tasks' && (
            <div style={{ marginTop: 10, fontSize: 11, color: COLORS.textMuted, lineHeight: 1.7 }}>
              <strong style={{ color: COLORS.textDim }}>Matching:</strong> Tasks matched by <code style={{ color: COLORS.accent }}>title + project_name</code> — existing tasks are updated, new rows created.<br/>
              <strong style={{ color: COLORS.textDim }}>status:</strong> new · inprogress · review · done &nbsp;|&nbsp; <strong style={{ color: COLORS.textDim }}>priority:</strong> high · medium · low
            </div>
          )}
          {mode === 'projects' && (
            <div style={{ marginTop: 10, fontSize: 11, color: COLORS.textMuted, lineHeight: 1.7 }}>
              <strong style={{ color: COLORS.textDim }}>Matching:</strong> Projects matched by <code style={{ color: COLORS.accent }}>name</code> — existing projects are updated, new rows created.<br/>
              <strong style={{ color: COLORS.textDim }}>color:</strong> hex value e.g. <code style={{ color: COLORS.accent }}>#4F8EF7</code>
            </div>
          )}
        </div>

        {/* Drop zone */}
        {!rawRows && (
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.background = COLORS.accent + '08' }}
            onDragLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = 'transparent' }}
            onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = 'transparent'; handleFile(e.dataTransfer.files[0]) }}
            style={{ border: `2px dashed ${COLORS.border}`, borderRadius: 12, padding: '32px 20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: COLORS.accent + '18', border: `1px solid ${COLORS.accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Icon name="folder" size={20} color={COLORS.accent} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6 }}>Drop a CSV file here</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>or click to browse</div>
            <input ref={fileRef} type="file" accept=".csv" onChange={e => handleFile(e.target.files[0])} style={{ display: 'none' }} />
          </div>
        )}

        {/* Result banner */}
        {result && (
          <div style={{ background: COLORS.green + '12', border: `1px solid ${COLORS.green}33`, borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.green, marginBottom: 6 }}>Import complete</div>
            <div style={{ display: 'flex', gap: 20, fontSize: 13, color: COLORS.textDim }}>
              <span><strong style={{ color: COLORS.green }}>{result.created}</strong> created</span>
              <span><strong style={{ color: COLORS.accent }}>{result.updated}</strong> updated</span>
              {result.skipped > 0 && <span><strong style={{ color: COLORS.red }}>{result.skipped}</strong> skipped (had errors)</span>}
            </div>
            <button onClick={() => setResult(null)} style={{ marginTop: 10, background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '4px 12px', fontSize: 12, color: COLORS.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>Import another file</button>
          </div>
        )}
      </Panel>

      {/* Preview + validation */}
      {rawRows && annotated && (
        <Panel>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{fileName}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>{annotated.length} row{annotated.length !== 1 ? 's' : ''} · {createCount} to create · {updateCount} to update · {skipCount} skipped</div>
            </div>
            <ValidationBadge errors={errorCount} warnings={warningCount} />
            <Btn size="sm" variant="secondary" onClick={reset}>Clear</Btn>
          </div>

          {/* Summary chips */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            {createCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLORS.green + '14', border: `1px solid ${COLORS.green}30`, borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: COLORS.green }}>
                <Icon name="plus" size={12} color={COLORS.green} />
                {createCount} new {mode === 'tasks' ? 'task' : 'project'}{createCount !== 1 ? 's' : ''}
              </div>
            )}
            {updateCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLORS.accent + '14', border: `1px solid ${COLORS.accent}30`, borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: COLORS.accent }}>
                <Icon name="edit" size={12} color={COLORS.accent} />
                {updateCount} update{updateCount !== 1 ? 's' : ''}
              </div>
            )}
            {skipCount > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLORS.red + '14', border: `1px solid ${COLORS.red}30`, borderRadius: 8, padding: '5px 12px', fontSize: 12, fontWeight: 600, color: COLORS.red }}>
                <Icon name="x" size={12} color={COLORS.red} />
                {skipCount} skip{skipCount !== 1 ? 's' : ''} (errors)
              </div>
            )}
          </div>

          {/* Table preview */}
          <div style={{ overflowX: 'auto', borderRadius: 10, border: `1px solid ${COLORS.border}`, marginBottom: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}`, background: COLORS.surface }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: COLORS.textMuted, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', width: 60 }}>Row</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: COLORS.textMuted, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', width: 72 }}>Action</th>
                  {modeFields.map(f => (
                    <th key={f} style={{ padding: '8px 12px', textAlign: 'left', color: COLORS.textMuted, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{f}</th>
                  ))}
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: COLORS.textMuted, fontWeight: 700, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Issues</th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((row, ri) => {
                  const hasErr = row._errors.length > 0
                  const rowBg = hasErr ? COLORS.red + '08' : row._action === 'update' ? COLORS.accent + '06' : 'transparent'
                  return (
                    <tr key={ri} style={{ borderBottom: `1px solid ${COLORS.border}`, background: rowBg, transition: 'background 0.1s' }}
                      onMouseEnter={e => e.currentTarget.style.background = COLORS.surfaceHover}
                      onMouseLeave={e => e.currentTarget.style.background = rowBg}>
                      <td style={{ padding: '8px 12px', color: COLORS.textMuted, fontFamily: "'DM Mono',monospace" }}>{row._index}</td>
                      <td style={{ padding: '8px 12px' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 5, padding: '2px 7px',
                          color: hasErr ? COLORS.red : row._action === 'update' ? COLORS.accent : COLORS.green,
                          background: hasErr ? COLORS.red + '18' : row._action === 'update' ? COLORS.accent + '18' : COLORS.green + '18',
                          border: `1px solid ${hasErr ? COLORS.red + '33' : row._action === 'update' ? COLORS.accent + '33' : COLORS.green + '33'}`,
                        }}>
                          {hasErr ? 'SKIP' : row._action === 'update' ? 'UPDATE' : 'CREATE'}
                        </span>
                      </td>
                      {modeFields.map(f => (
                        <td key={f} style={{ padding: '8px 12px', color: COLORS.textDim, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {f === 'status' && row[f] ? (
                            <span style={{ fontSize: 10, fontWeight: 700, color: statusColor(row[f]), background: statusColor(row[f]) + '20', borderRadius: 5, padding: '2px 7px' }}>{row[f]}</span>
                          ) : f === 'color' && row[f] ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ width: 10, height: 10, borderRadius: 3, background: /^#[0-9a-fA-F]{3,6}$/.test(row[f]) ? row[f] : '#888', flexShrink: 0 }} />
                              {row[f]}
                            </span>
                          ) : (
                            <span title={row[f] || ''}>{row[f] || <span style={{ color: COLORS.textMuted, fontStyle: 'italic' }}>—</span>}</span>
                          )}
                        </td>
                      ))}
                      <td style={{ padding: '8px 12px', minWidth: 180 }}>
                        {[...row._errors.map(e => ({ msg: e, type: 'error' })), ...row._warnings.map(w => ({ msg: w, type: 'warning' }))].map((issue, ii) => (
                          <div key={ii} style={{ fontSize: 11, color: issue.type === 'error' ? COLORS.red : '#F59E0B', lineHeight: 1.5 }}>
                            {issue.type === 'error' ? '✕ ' : '⚠ '}{issue.msg}
                          </div>
                        ))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
              <button onClick={() => setPreviewPage(p => Math.max(0, p - 1))} disabled={previewPage === 0} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '4px 10px', cursor: previewPage === 0 ? 'not-allowed' : 'pointer', color: COLORS.textMuted, fontSize: 12, fontFamily: 'inherit', opacity: previewPage === 0 ? 0.4 : 1 }}>← Prev</button>
              <span style={{ fontSize: 12, color: COLORS.textMuted }}>Page {previewPage + 1} of {totalPages}</span>
              <button onClick={() => setPreviewPage(p => Math.min(totalPages - 1, p + 1))} disabled={previewPage === totalPages - 1} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '4px 10px', cursor: previewPage === totalPages - 1 ? 'not-allowed' : 'pointer', color: COLORS.textMuted, fontSize: 12, fontFamily: 'inherit', opacity: previewPage === totalPages - 1 ? 0.4 : 1 }}>Next →</button>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {errorCount > 0 && (
              <div style={{ fontSize: 12, color: COLORS.red, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="warning" size={13} color={COLORS.red} />
                {errorCount} row{errorCount !== 1 ? 's' : ''} with errors will be skipped
              </div>
            )}
            <div style={{ flex: 1 }} />
            <Btn variant="secondary" onClick={reset} disabled={importing}>Cancel</Btn>
            <Btn onClick={handleImport} disabled={importing || (createCount === 0 && updateCount === 0)}>
              {importing ? 'Importing…' : `Import ${createCount + updateCount} row${createCount + updateCount !== 1 ? 's' : ''}`}
            </Btn>
          </div>
        </Panel>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SettingsPage({ toast }) {
  const { workspace } = useData()
  const { user } = useAuth()
  const isOwner = workspace?.owner_id === user?.id || workspace?.role === 'owner'
  const [tab, setTab] = useState('account')

  const TABS = [
    { id: 'account',       label: 'Account',       icon: 'user'      },
    { id: 'workspace',     label: 'Workspace',     icon: 'folder'    },
    { id: 'notifications', label: 'Notifications', icon: 'bell'      },
    { id: 'integrations',  label: 'Integrations',  icon: 'zap'       },
    ...(isOwner ? [{ id: 'data-import', label: 'Data Import', icon: 'list' }] : []),
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', minHeight: 0 }}>
      {/* Sidebar nav */}
      <div style={{
        width: 200, flexShrink: 0,
        padding: '28px 14px',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
        background: COLORS.surface,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.textMuted, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 14, paddingLeft: 12 }}>Settings</div>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 9,
            padding: '9px 12px', borderRadius: 10, marginBottom: 2,
            background: tab === t.id ? 'rgba(107,142,247,0.16)' : 'transparent',
            border: `1px solid ${tab === t.id ? 'rgba(107,142,247,0.25)' : 'transparent'}`,
            color: tab === t.id ? COLORS.accent : COLORS.textDim,
            fontSize: 13, fontWeight: tab === t.id ? 600 : 400,
            cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s, opacity 0.15s',
            fontFamily: 'inherit', textAlign: 'left', width: '100%',
            letterSpacing: '-0.01em',
          }}
          onMouseEnter={e => { if(tab !== t.id){ e.currentTarget.style.background = 'rgba(255,255,255,0.07)' }}}
          onMouseLeave={e => { if(tab !== t.id){ e.currentTarget.style.background = 'transparent' }}}>
            <Icon name={t.icon} size={14} color={tab === t.id ? COLORS.accent : COLORS.textMuted} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', minWidth: 0 }}>
        <div style={{ maxWidth: 640 }}>
          <h1 style={{ fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', marginBottom: 4 }}>
            {TABS.find(t => t.id === tab)?.label}
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 24, lineHeight: 1.5 }}>
            {tab === 'account'       && 'Manage your personal profile and security.'}
            {tab === 'workspace'     && 'Configure your workspace and manage members.'}
            {tab === 'notifications' && 'Set up email alerts and notification preferences.'}
            {tab === 'integrations'  && 'Connect third-party services and authentication providers.'}
            {tab === 'data-import'   && 'Bulk create or update projects and tasks by uploading a CSV file.'}
          </p>
          {tab === 'account'       && <AccountTab       toast={toast} />}
          {tab === 'workspace'     && <WorkspaceTab     toast={toast} />}
          {tab === 'notifications' && <NotificationsTab toast={toast} />}
          {tab === 'integrations'  && <IntegrationsTab  toast={toast} />}
          {tab === 'data-import'   && isOwner && <DataImportTab toast={toast} />}
        </div>
      </div>
    </div>
  )
}
