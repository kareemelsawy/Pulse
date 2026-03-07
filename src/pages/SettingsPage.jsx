import { useState, useEffect } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useData } from '../contexts/DataContext'
import { supabase } from '../lib/supabase'
import { NOTIFICATION_TRIGGERS } from '../lib/constants'
import { Toggle, Btn, Avatar, Badge, Spinner } from '../components/UI'
import { startGmailOAuth, parseOAuthToken, getGmailAddress } from '../lib/gmail'
import { getWorkspaceMembers, regenerateInviteCode, updateWorkspaceName, removeMember } from '../lib/db/workspace'

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
  const [expiresAt,      setExpiresAt]      = useState(notifSettings?.gmail_expires_at || null)
  const [email,          setEmail]          = useState(notifSettings?.gmail_email || null)
  const [triggers,       setTriggers]       = useState(notifSettings?.enabled_triggers || { task_assigned: true, status_changed: true, task_completed: true, new_task: false })
  const [notifyAssignee, setNotifyAssignee] = useState(notifSettings?.notify_assignee ?? true)
  const [extraEmails,    setExtraEmails]    = useState(notifSettings?.extra_emails || '')
  const [saving,         setSaving]         = useState(false)

  const tokenExpired = expiresAt && Date.now() > expiresAt

  // Sync clientId if notifSettings loads after mount
  useEffect(() => {
    if (notifSettings?.gmail_client_id && !clientId) setClientId(notifSettings.gmail_client_id)
    if (notifSettings?.gmail_expires_at && !expiresAt) setExpiresAt(notifSettings.gmail_expires_at)
  }, [notifSettings?.gmail_client_id, notifSettings?.gmail_expires_at])

  useEffect(() => {
    const result = parseOAuthToken()
    if (result?.token) {
      getGmailAddress(result.token).then(addr => {
        setToken(result.token)
        setExpiresAt(result.expiresAt)
        setEmail(addr)
        toast(`Gmail connected: ${addr}`, 'success')
      })
    }
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await updateNotifSettings({ gmail_client_id: clientId, gmail_access_token: token, gmail_expires_at: expiresAt, gmail_email: email, enabled_triggers: triggers, notify_assignee: notifyAssignee, extra_emails: extraEmails })
      toast('Saved', 'success')
    } catch (e) { toast(e.message, 'error') } finally { setSaving(false) }
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
            <button onClick={() => { if (!clientId.trim()) { toast('Enter Client ID first', 'error'); return } window.location.href = startGmailOAuth(clientId.trim()) }}
              style={{ background: '#4285F4', color: '#fff', border: 'none', borderRadius: 10, padding: '11px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', lineHeight: 1.4 }}>
              Sign in with Google
            </button>
          </>
        ) : (
          <div style={{ background: colors.bg, border: `1px solid ${tokenExpired ? colors.red : colors.green}44`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 6, lineHeight: 1.4 }}>
              {tokenExpired ? '⚠ Token expired — ' : '✉ Connected: '}{email}
            </div>
            {tokenExpired && (
              <div style={{ fontSize: 12, color: colors.red, marginBottom: 10, lineHeight: 1.5 }}>
                Gmail tokens expire after ~1 hour. Click <strong>Reconnect</strong> to get a fresh token — emails won't send until you do.
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => {
                const id = clientId || notifSettings?.gmail_client_id
                if (!id) { toast('Client ID missing — please disconnect and re-enter it', 'error'); return }
                window.location.href = startGmailOAuth(id)
              }}
                style={{ background: '#4285F4', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {tokenExpired ? '⟳ Reconnect Gmail' : 'Reconnect'}
              </button>
              <Btn size="sm" variant="danger" onClick={() => { setToken(null); setExpiresAt(null); setEmail(null) }}>Disconnect</Btn>
            </div>
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


function IntegrationsTab({ toast }) {
  const { colors } = useTheme()
  const { iStyle, lStyle } = useS()
  const [googleClientId,     setGoogleClientId]     = useState(() => localStorage.getItem('pulse_google_client_id') || '')
  const [googleClientSecret, setGoogleClientSecret] = useState(() => localStorage.getItem('pulse_google_client_secret') || '')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      localStorage.setItem('pulse_google_client_id',     googleClientId.trim())
      localStorage.setItem('pulse_google_client_secret', googleClientSecret.trim())
      toast('Google config saved', 'success')
    } catch (e) { toast(e.message, 'error') } finally { setSaving(false) }
  }

  async function handleTestGoogle() {
    setTesting(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin, skipBrowserRedirect: true }
      })
      if (error) throw error
      toast('Google OAuth reachable ✓', 'success')
    } catch (e) {
      toast(e.message.includes('provider') ? 'Google not enabled in Supabase — see setup guide below' : e.message, 'error')
    } finally { setTesting(false) }
  }

  const steps = [
    { n: 1, title: 'Create a Google Cloud project', body: 'Go to console.cloud.google.com → New Project.' },
    { n: 2, title: 'Enable OAuth consent screen', body: 'APIs & Services → OAuth consent screen → External → fill in app name, support email, and your domain.' },
    { n: 3, title: 'Create OAuth credentials', body: 'APIs & Services → Credentials → Create Credentials → OAuth Client ID → Web application.' },
    { n: 4, title: 'Add redirect URI', body: `Add this to "Authorised redirect URIs": your Supabase project URL + /auth/v1/callback\ne.g. https://xxxx.supabase.co/auth/v1/callback` },
    { n: 5, title: 'Add your site to Authorised origins', body: `Add your Vercel domain (e.g. https://pulse.vercel.app) and http://localhost:5173 for local dev.` },
    { n: 6, title: 'Copy credentials into Supabase', body: 'In Supabase → Authentication → Providers → Google → paste Client ID and Client Secret, enable the provider, and save.' },
    { n: 7, title: 'Add redirect URL in Supabase', body: 'Supabase → Authentication → URL Configuration → add your site URL and https://yourdomain.com/** to Redirect URLs.' },
  ]

  return (
    <div>
      <Section>
        <SectionTitle>Google Sign-In</SectionTitle>
        <SectionDesc>Configure Google OAuth so team members can sign in with their Google accounts. The setup happens in Supabase — credentials are never stored in the app itself.</SectionDesc>

        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, background: '#4285F4', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.4 }}>Google OAuth 2.0</div>
              <div style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.4 }}>Enabled via Supabase Authentication → Providers</div>
            </div>
            <Btn size="sm" variant="secondary" onClick={handleTestGoogle} disabled={testing} style={{ marginLeft: 'auto' }}>{testing ? 'Testing…' : 'Test Connection'}</Btn>
          </div>
          <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.6 }}>
            Google Sign-In is configured directly in your Supabase project, not here. Paste the credentials in Supabase and they apply automatically. Use the reference fields below to keep track of your credentials locally (stored in browser only, never sent anywhere).
          </div>
        </div>

        <label style={lStyle}>Google Client ID (reference only)</label>
        <input value={googleClientId} onChange={e => setGoogleClientId(e.target.value)} placeholder="xxxxxx.apps.googleusercontent.com" style={{ ...iStyle, marginBottom: 12, fontFamily: 'monospace', fontSize: 12 }} />
        <label style={lStyle}>Google Client Secret (reference only)</label>
        <input value={googleClientSecret} onChange={e => setGoogleClientSecret(e.target.value)} placeholder="GOCSPX-…" type="password" style={{ ...iStyle, marginBottom: 16, fontFamily: 'monospace', fontSize: 12 }} />
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn onClick={handleSave} disabled={saving} size="sm">{saving ? 'Saving…' : 'Save Reference'}</Btn>
          <span style={{ fontSize: 11, color: colors.textMuted, lineHeight: 1.4 }}>Stored in your browser only. Does not affect authentication.</span>
        </div>
      </Section>

      <Section>
        <SectionTitle>Setup Guide</SectionTitle>
        <SectionDesc>Follow these steps once to enable Google Sign-In for the whole workspace.</SectionDesc>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {steps.map(step => (
            <div key={step.n} style={{ display: 'flex', gap: 14, padding: '12px 14px', background: colors.bg, borderRadius: 10, border: `1px solid ${colors.border}` }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', background: colors.accent + '22', color: colors.accent, fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{step.n}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, lineHeight: 1.4 }}>{step.title}</div>
                <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{step.body}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16, padding: '10px 14px', background: colors.accent + '12', border: `1px solid ${colors.accent}33`, borderRadius: 10, fontSize: 12, color: colors.textMuted, lineHeight: 1.6 }}>
          <strong style={{ color: colors.accent }}>Important:</strong> The "Continue with Google" button on the login page will work automatically once you enable the Google provider in Supabase. No code changes needed.
        </div>
      </Section>
    </div>
  )
}

// ─── Main SettingsPage ────────────────────────────────────────────────────────
const TABS = [
  { id: 'account',       label: '👤 Account' },
  { id: 'workspace',     label: '🏢 Workspace' },
  { id: 'notifications', label: '🔔 Notifications' },
  { id: 'integrations',  label: '🔗 Integrations' },
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
        {tab === 'integrations'  && <IntegrationsTab  toast={toast} />}
      </div>
    </div>
  )
}
