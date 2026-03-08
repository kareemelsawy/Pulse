/**
 * WorkspaceSettings.jsx
 * 
 * Workspace member management with:
 *  - Email invite (sends signup invitation)
 *  - User role selection (Admin / Member / Viewer)
 *  - Access scope: Projects / Tasks / Meetings
 *  - Member list with role management
 */

import { useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

// ─── Constants ─────────────────────────────────────────────────────────────────
const ROLES = [
  { value: 'admin',  label: 'Admin',  desc: 'Full workspace access' },
  { value: 'member', label: 'Member', desc: 'Can create and edit' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access' },
]

const ACCESS_MODULES = [
  { key: 'projects',  label: 'Projects',  icon: '◈' },
  { key: 'tasks',     label: 'Tasks',     icon: '✓' },
  { key: 'meetings',  label: 'Meetings',  icon: '◎' },
]

const DEFAULT_ACCESS = { projects: true, tasks: true, meetings: true }

// ─── Shared styles ─────────────────────────────────────────────────────────────
const C = {
  bg:         'rgba(10,15,30,0.0)',
  card:       'rgba(255,255,255,0.04)',
  border:     'rgba(255,255,255,0.08)',
  borderHov:  'rgba(255,255,255,0.15)',
  accent:     '#4F8EF7',
  accentBg:   'rgba(79,142,247,0.12)',
  text:       '#ffffff',
  muted:      'rgba(255,255,255,0.45)',
  danger:     '#ef4444',
  dangerBg:   'rgba(239,68,68,0.12)',
  success:    '#22c55e',
  successBg:  'rgba(34,197,94,0.12)',
  warn:       '#f59e0b',
}

const fieldStyle = {
  background: 'rgba(255,255,255,0.05)',
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: '10px 14px',
  color: C.text,
  fontSize: 13,
  width: '100%',
  outline: 'none',
  transition: 'border-color 0.2s, background 0.2s',
}

// ─── Email validation ──────────────────────────────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

// ─── Email Tag Input ───────────────────────────────────────────────────────────
function EmailTagInput({ emails, onChange }) {
  const [inputValue, setInputValue] = useState('')
  const [focused, setFocused] = useState(false)

  function addEmail(val) {
    const trimmed = val.trim().toLowerCase()
    if (!trimmed) return
    if (!isValidEmail(trimmed)) return
    if (emails.includes(trimmed)) return
    onChange([...emails, trimmed])
    setInputValue('')
  }

  function handleKey(e) {
    if (['Enter', ',', ' ', 'Tab'].includes(e.key)) {
      e.preventDefault()
      addEmail(inputValue)
    }
    if (e.key === 'Backspace' && !inputValue && emails.length) {
      onChange(emails.slice(0, -1))
    }
  }

  function removeEmail(email) {
    onChange(emails.filter(e => e !== email))
  }

  return (
    <div
      onClick={() => document.getElementById('email-tag-input')?.focus()}
      style={{
        ...fieldStyle,
        display: 'flex', flexWrap: 'wrap', gap: 6,
        minHeight: 44, cursor: 'text', padding: '8px 10px',
        borderColor: focused ? C.accent : C.border,
        background: focused ? 'rgba(79,142,247,0.05)' : 'rgba(255,255,255,0.05)',
      }}>
      {emails.map(email => (
        <span key={email} style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          background: C.accentBg, border: `1px solid rgba(79,142,247,0.25)`,
          borderRadius: 6, padding: '2px 8px',
          color: '#7eaaff', fontSize: 12, fontWeight: 500,
        }}>
          {email}
          <button onClick={() => removeEmail(email)} style={{
            background: 'none', border: 'none', color: 'rgba(126,170,255,0.6)',
            cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1,
          }}>×</button>
        </span>
      ))}
      <input
        id="email-tag-input"
        value={inputValue}
        onChange={e => setInputValue(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { setFocused(false); addEmail(inputValue) }}
        onFocus={() => setFocused(true)}
        placeholder={emails.length === 0 ? 'Type email and press Enter…' : ''}
        style={{
          background: 'none', border: 'none', outline: 'none',
          color: C.text, fontSize: 13, minWidth: 180, flex: 1,
        }}
      />
    </div>
  )
}

// ─── Role selector ─────────────────────────────────────────────────────────────
function RoleSelect({ value, onChange, compact = false }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {ROLES.map(r => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          title={r.desc}
          style={{
            padding: compact ? '4px 10px' : '6px 14px',
            borderRadius: 7,
            border: `1px solid ${value === r.value ? C.accent : C.border}`,
            background: value === r.value ? C.accentBg : 'transparent',
            color: value === r.value ? '#7eaaff' : C.muted,
            fontSize: compact ? 11 : 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.15s',
          }}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

// ─── Access module toggles ─────────────────────────────────────────────────────
function AccessToggles({ access, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {ACCESS_MODULES.map(m => {
        const on = access[m.key]
        return (
          <button
            key={m.key}
            onClick={() => onChange({ ...access, [m.key]: !on })}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7,
              border: `1px solid ${on ? 'rgba(34,197,94,0.35)' : C.border}`,
              background: on ? 'rgba(34,197,94,0.08)' : 'transparent',
              color: on ? '#86efac' : C.muted,
              fontSize: 11, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <span>{m.icon}</span>
            {m.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function WorkspaceSettings({
  workspace, members, toast,
  sendRawEmail, notifSettings,
}) {
  // Invite form state
  const [emails,     setEmails]     = useState([])
  const [role,       setRole]       = useState('member')
  const [access,     setAccess]     = useState(DEFAULT_ACCESS)
  const [sending,    setSending]    = useState(false)
  const [inviteMsg,  setInviteMsg]  = useState(null) // { type: 'success'|'error', text }

  // Invite code (read-only display)
  const inviteCode = workspace?.invite_code || '—'
  const [codeCopied, setCodeCopied] = useState(false)

  function copyCode() {
    navigator.clipboard.writeText(inviteCode).then(() => {
      setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000)
    })
  }

  // ── Send invitations ────────────────────────────────────────────────────────
  const sendInvitations = useCallback(async () => {
    if (!emails.length) return setInviteMsg({ type: 'error', text: 'Add at least one email address.' })

    const invalid = emails.filter(e => !isValidEmail(e))
    if (invalid.length) return setInviteMsg({ type: 'error', text: `Invalid email(s): ${invalid.join(', ')}` })

    setSending(true); setInviteMsg(null)

    const appUrl  = window.location.origin
    const wsName  = workspace?.name || 'Pulse'
    const roleLabel = ROLES.find(r => r.value === role)?.label || 'Member'
    const accessList = ACCESS_MODULES.filter(m => access[m.key]).map(m => m.label).join(', ') || 'None'
    const inviteLink = `${appUrl}/?invite=${inviteCode}`

    // Build invitation email HTML
    function buildInviteHTML(recipientEmail) {
      return `
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;background:#060a14;font-family:'DM Sans',sans-serif;">
          <div style="max-width:480px;margin:40px auto;padding:40px;background:rgba(10,15,30,0.95);border:1px solid rgba(255,255,255,0.08);border-radius:16px;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
              <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#4F8EF7,#1e4fff);display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;font-weight:900;">✦</div>
              <span style="font-size:18px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Pulse</span>
            </div>
            <h1 style="color:#fff;font-size:20px;font-weight:700;margin:0 0 8px;">You're invited to ${wsName}</h1>
            <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0 0 24px;">
              You've been invited as a <strong style="color:#7eaaff;">${roleLabel}</strong> with access to: <strong style="color:rgba(255,255,255,0.75);">${accessList}</strong>
            </p>
            <a href="${inviteLink}" style="display:block;text-align:center;padding:14px 24px;background:linear-gradient(135deg,#4F8EF7,#2563eb);color:#fff;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none;">
              Accept Invitation
            </a>
            <p style="color:rgba(255,255,255,0.25);font-size:12px;margin:20px 0 0;text-align:center;">
              Or use workspace code: <strong style="color:rgba(255,255,255,0.5);">${inviteCode}</strong>
            </p>
          </div>
        </body>
        </html>
      `
    }

    let successes = 0; let failures = []

    // Store invitations in Supabase if the table exists
    for (const email of emails) {
      try {
        await supabase.from('workspace_invitations').upsert({
          workspace_id: workspace.id,
          email:        email.toLowerCase(),
          role,
          access_projects:  access.projects,
          access_tasks:     access.tasks,
          access_meetings:  access.meetings,
          invited_at:       new Date().toISOString(),
          status:           'pending',
        }, { onConflict: 'workspace_id,email' }).throwOnError()
      } catch {
        // Table may not exist yet — non-fatal, continue
      }

      // Send email if configured
      if (sendRawEmail && notifSettings?.resend_api_key) {
        try {
          await sendRawEmail({
            to:      email,
            subject: `You're invited to ${wsName} on Pulse`,
            html:    buildInviteHTML(email),
          })
          successes++
        } catch {
          failures.push(email)
        }
      } else {
        // No email provider — count as invite saved (show code instead)
        successes++
      }
    }

    setSending(false)

    if (!notifSettings?.resend_api_key) {
      setInviteMsg({
        type: 'success',
        text: `${emails.length} invitation${emails.length > 1 ? 's' : ''} saved. Share the invite code above — email sending requires Resend setup in Notifications.`,
      })
    } else if (failures.length === 0) {
      setInviteMsg({ type: 'success', text: `Invitation${emails.length > 1 ? 's' : ''} sent to ${emails.join(', ')}.` })
    } else {
      setInviteMsg({ type: 'error', text: `Sent to ${successes} — failed: ${failures.join(', ')}` })
    }

    if (failures.length < emails.length) setEmails([])
    toast?.(`Invited ${successes} member${successes !== 1 ? 's' : ''}`, 'success')
  }, [emails, role, access, workspace, inviteCode, sendRawEmail, notifSettings, toast])

  // ── Member role update ──────────────────────────────────────────────────────
  async function updateMemberRole(memberId, newRole) {
    try {
      await supabase.from('workspace_members').update({ role: newRole }).eq('id', memberId)
      toast?.('Role updated', 'success')
    } catch {
      toast?.('Failed to update role', 'error')
    }
  }

  // ── Remove member ───────────────────────────────────────────────────────────
  async function removeMember(memberId) {
    if (!confirm('Remove this member from the workspace?')) return
    try {
      await supabase.from('workspace_members').delete().eq('id', memberId)
      toast?.('Member removed', 'success')
    } catch {
      toast?.('Failed to remove member', 'error')
    }
  }

  // ── Section header ──────────────────────────────────────────────────────────
  function SectionTitle({ children }) {
    return (
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, color: C.muted, textTransform: 'uppercase', marginBottom: 12 }}>
        {children}
      </p>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* ── Invite code ──────────────────────────────────────────────────────── */}
      <div>
        <SectionTitle>Workspace Invite Code</SectionTitle>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px',
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
        }}>
          <span style={{ flex: 1, fontFamily: "'DM Mono', monospace", fontSize: 15, color: '#7eaaff', letterSpacing: 2 }}>
            {inviteCode}
          </span>
          <button
            onClick={copyCode}
            style={{
              padding: '6px 14px', borderRadius: 7,
              border: `1px solid ${codeCopied ? 'rgba(34,197,94,0.4)' : C.border}`,
              background: codeCopied ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
              color: codeCopied ? C.success : C.muted,
              fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {codeCopied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* ── Invite by email ───────────────────────────────────────────────────── */}
      <div>
        <SectionTitle>Invite by Email</SectionTitle>
        <div style={{
          padding: '20px',
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 12,
          display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          {/* Email input */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
              EMAIL ADDRESSES
            </label>
            <EmailTagInput emails={emails} onChange={setEmails} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 5 }}>
              Press Enter or comma after each email
            </p>
          </div>

          {/* Role */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
              USER TYPE
            </label>
            <RoleSelect value={role} onChange={setRole} />
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 5 }}>
              {ROLES.find(r => r.value === role)?.desc}
            </p>
          </div>

          {/* Access */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: 0.8, display: 'block', marginBottom: 8 }}>
              MODULE ACCESS
            </label>
            <AccessToggles access={access} onChange={setAccess} />
          </div>

          {/* Status messages */}
          {inviteMsg && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, fontSize: 13,
              background: inviteMsg.type === 'success' ? C.successBg : C.dangerBg,
              border: `1px solid ${inviteMsg.type === 'success' ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
              color: inviteMsg.type === 'success' ? '#86efac' : '#fca5a5',
            }}>
              {inviteMsg.text}
            </div>
          )}

          {/* Send button */}
          <button
            onClick={sendInvitations}
            disabled={sending || emails.length === 0}
            style={{
              padding: '11px 0', borderRadius: 9,
              border: 'none',
              background: emails.length === 0
                ? 'rgba(79,142,247,0.2)'
                : 'linear-gradient(135deg,#4F8EF7 0%,#2563eb 100%)',
              color: '#fff', fontWeight: 700, fontSize: 13,
              cursor: emails.length === 0 || sending ? 'not-allowed' : 'pointer',
              opacity: emails.length === 0 || sending ? 0.6 : 1,
              transition: 'all 0.2s',
              boxShadow: emails.length > 0 ? '0 4px 16px rgba(79,142,247,0.3)' : 'none',
            }}
          >
            {sending ? 'Sending…' : `Send Invitation${emails.length > 1 ? 's' : ''}`}
            {emails.length > 0 && !sending && ` (${emails.length})`}
          </button>
        </div>
      </div>

      {/* ── Member list ───────────────────────────────────────────────────────── */}
      <div>
        <SectionTitle>Members ({members?.length || 0})</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(!members || members.length === 0) && (
            <p style={{ color: C.muted, fontSize: 13, padding: '16px 0' }}>No members yet.</p>
          )}
          {members?.map(m => (
            <div key={m.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 16px',
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
            }}>
              {/* Avatar */}
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: `linear-gradient(135deg, hsl(${(m.email?.charCodeAt(0) || 0) * 13 % 360}, 60%, 45%), hsl(${(m.email?.charCodeAt(0) || 0) * 13 % 360 + 40}, 70%, 35%))`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
              }}>
                {(m.full_name || m.email || '?')[0].toUpperCase()}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.text, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.full_name || m.email}
                </p>
                {m.full_name && (
                  <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>{m.email}</p>
                )}
              </div>

              {/* Role badge */}
              <div style={{ flexShrink: 0 }}>
                <RoleSelect
                  value={m.role || 'member'}
                  onChange={role => updateMemberRole(m.id, role)}
                  compact
                />
              </div>

              {/* Remove */}
              <button
                onClick={() => removeMember(m.id)}
                title="Remove member"
                style={{
                  background: 'none', border: 'none',
                  color: 'rgba(239,68,68,0.4)', cursor: 'pointer',
                  fontSize: 16, padding: '4px 6px', borderRadius: 6,
                  transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = C.danger; e.currentTarget.style.background = C.dangerBg }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(239,68,68,0.4)'; e.currentTarget.style.background = 'none' }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
