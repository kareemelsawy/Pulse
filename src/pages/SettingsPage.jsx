import { useState } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { DARK_THEME } from '../lib/constants'
import { Btn, Icon } from '../components/UI'
import { supabase } from '../lib/supabase'
import WorkspaceSettings from '../components/WorkspaceSettings'

const C = DARK_THEME

export default function SettingsPage({ toast }) {
  const { workspace, members, notifSettings, updateNotifSettings, sendRawEmail } = useData()
  const { user } = useAuth()
  const [tab, setTab] = useState('workspace')

  const tabs = [
    { id: 'workspace',  label: 'Workspace',     icon: 'layoutDashboard' },
    { id: 'members',    label: 'Members',        icon: 'users'           },
    { id: 'notifs',     label: 'Notifications',  icon: 'bell'            },
  ]

  return (
    <div style={{ padding: '28px 32px', maxWidth: 720 }}>
      <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 24, color: '#fff', marginBottom: 24 }}>
        Settings
      </h1>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.07)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 14px', background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === t.id ? C.accent : 'transparent'}`,
            color: tab === t.id ? '#fff' : C.textMuted,
            fontSize: 13, fontWeight: tab === t.id ? 600 : 500, cursor: 'pointer',
            marginBottom: -1, transition: 'all 0.15s',
          }}>
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'workspace' && <WorkspaceTab workspace={workspace} toast={toast} />}
      {tab === 'members' && (
        <WorkspaceSettings
          workspace={workspace}
          members={members}
          toast={toast}
          sendRawEmail={sendRawEmail}
          notifSettings={notifSettings}
        />
      )}
      {tab === 'notifs' && <NotifTab notifSettings={notifSettings} updateNotifSettings={updateNotifSettings} toast={toast} />}
    </div>
  )
}

// ── Workspace tab ─────────────────────────────────────────────────────────────
function WorkspaceTab({ workspace, toast }) {
  const [name, setName] = useState(workspace?.name || '')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await supabase.from('workspaces').update({ name: name.trim() }).eq('id', workspace.id)
      toast?.('Workspace name saved', 'success')
    } catch { toast?.('Failed to save', 'error') }
    setSaving(false)
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
          Workspace Name
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
          <Btn onClick={save} loading={saving} size="md">Save</Btn>
        </div>
      </div>

      <div style={{ padding: 16, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 10 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>
          Workspace ID
        </p>
        <p style={{ fontFamily: "'DM Mono',monospace", fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          {workspace?.id}
        </p>
      </div>
    </div>
  )
}

// ── Notifications tab ─────────────────────────────────────────────────────────
function NotifTab({ notifSettings, updateNotifSettings, toast }) {
  const [settings, setSettings] = useState({
    resend_api_key: '',
    from_email: '',
    from_name: 'Pulse',
    notify_assignee: true,
    extra_emails: '',
    enabled_triggers: {
      new_task: true,
      task_assigned: true,
      task_completed: true,
      status_changed: false,
      due_soon: false,
    },
    ...notifSettings,
  })
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    try {
      await updateNotifSettings(settings)
      toast?.('Notification settings saved', 'success')
    } catch { toast?.('Failed to save', 'error') }
    setSaving(false)
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none',
  }

  const triggers = [
    { key: 'new_task',       label: 'New task created' },
    { key: 'task_assigned',  label: 'Task assigned'    },
    { key: 'task_completed', label: 'Task completed'   },
    { key: 'status_changed', label: 'Status changed'   },
    { key: 'due_soon',       label: 'Due date soon'    },
  ]

  function setTrigger(key, val) {
    setSettings(s => ({ ...s, enabled_triggers: { ...s.enabled_triggers, [key]: val } }))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
          Resend API Key
        </label>
        <input
          value={settings.resend_api_key || ''}
          onChange={e => setSettings(s => ({ ...s, resend_api_key: e.target.value }))}
          placeholder="re_xxxxxxxxxxxx"
          type="password"
          style={inputStyle}
        />
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            From Email
          </label>
          <input value={settings.from_email || ''} onChange={e => setSettings(s => ({ ...s, from_email: e.target.value }))} placeholder="notifications@yourcompany.com" style={inputStyle} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            From Name
          </label>
          <input value={settings.from_name || ''} onChange={e => setSettings(s => ({ ...s, from_name: e.target.value }))} placeholder="Pulse" style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
          Extra Recipients (comma separated)
        </label>
        <input value={settings.extra_emails || ''} onChange={e => setSettings(s => ({ ...s, extra_emails: e.target.value }))} placeholder="manager@company.com, team@company.com" style={inputStyle} />
      </div>

      <div>
        <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 12 }}>
          Notification Triggers
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {triggers.map(trig => (
            <label key={trig.key} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.enabled_triggers?.[trig.key] ?? false}
                onChange={e => setTrigger(trig.key, e.target.checked)}
                style={{ accentColor: C.accent, width: 15, height: 15 }}
              />
              <span style={{ fontSize: 13, color: '#fff' }}>{trig.label}</span>
            </label>
          ))}
        </div>
      </div>

      <Btn onClick={save} loading={saving}>Save Notification Settings</Btn>
    </div>
  )
}
