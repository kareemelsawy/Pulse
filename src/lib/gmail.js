import { NOTIFICATION_TRIGGERS, STATUS, PRIORITY } from './constants'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// ─── Email sender via Supabase Edge Function ──────────────────────────────────
export async function sendEmail({ apiKey, functionSecret, fromEmail, fromName = 'Pulse', to, subject, html }) {
  const headers = { 'Content-Type': 'application/json' }
  if (functionSecret) headers['Authorization'] = `Bearer ${functionSecret}`
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ apiKey, fromEmail, fromName, to, subject, html }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Email send failed (${res.status})`)
  }
  return res.json()
}

// ─── Shared design tokens (mirrors app dark theme) ───────────────────────────
const T = {
  bg:          '#0B0D16',
  surface:     '#111420',
  surfaceAlt:  '#0E1019',
  border:      'rgba(255,255,255,0.09)',
  accent:      '#6B8EF7',
  accentDim:   'rgba(107,142,247,0.18)',
  purple:      '#C084FC',
  green:       '#34D17A',
  amber:       '#FBBF24',
  red:         '#F87171',
  text:        '#F0F4FF',
  textDim:     'rgba(200,210,240,0.75)',
  textMuted:   'rgba(200,210,240,0.40)',
}

// ─── Shared layout helpers ────────────────────────────────────────────────────
function emailShell({ badge, content, appUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
</head>
<body style="margin:0;padding:0;background:#080A12;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080A12;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#6B8EF7,#C084FC);border-radius:14px 14px 0 0;padding:18px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td><span style="font-size:19px;font-weight:900;color:#fff;letter-spacing:-0.5px;">&#9672; Pulse</span></td>
              ${badge ? `<td align="right"><span style="background:rgba(255,255,255,0.20);color:#fff;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:700;letter-spacing:0.04em;">${badge}</span></td>` : '<td></td>'}
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#111420;border:1px solid rgba(255,255,255,0.09);border-top:none;border-radius:0 0 14px 14px;padding:26px 24px;">
          ${content}

          <!-- Footer -->
          <div style="margin-top:28px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.09);">
            <a href="${appUrl || '#'}" style="display:inline-block;background:rgba(107,142,247,0.18);color:#6B8EF7;text-decoration:none;padding:8px 18px;border-radius:8px;font-weight:600;font-size:12px;border:1px solid rgba(107,142,247,0.28);">Open Pulse &#8594;</a>
            <p style="color:rgba(200,210,240,0.40);font-size:11px;margin:12px 0 0;">Sent by &#9672; Pulse &nbsp;&middot;&nbsp; You're receiving this because you're part of this workspace.</p>
          </div>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function metaRow(label, valueHtml, last) {
  const border = last ? '' : `border-bottom:1px solid rgba(255,255,255,0.09);`
  return `<tr>
    <td style="padding:10px 14px;color:rgba(200,210,240,0.40);font-size:11px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;white-space:nowrap;width:100px;${border}">${label}</td>
    <td style="padding:10px 14px;${border}">${valueHtml}</td>
  </tr>`
}

function pill(text, color) {
  return `<span style="background:${color}33;color:${color};border:1px solid ${color}55;border-radius:5px;padding:2px 9px;font-size:11px;font-weight:700;">${text}</span>`
}

function sectionLabel(text) {
  return `<div style="font-size:10px;font-weight:800;color:rgba(200,210,240,0.40);letter-spacing:0.09em;text-transform:uppercase;margin:0 0 10px;">${text}</div>`
}

// ─── Task notification email ──────────────────────────────────────────────────
export function buildNotificationEmail({ trigger, task, projectName, actorName, extraInfo, appUrl }) {
  const triggerLabel = NOTIFICATION_TRIGGERS[trigger]?.label || trigger
  const statusColor  = STATUS[task.status]?.color  || '#888'
  const statusLabel  = STATUS[task.status]?.label  || task.status
  const priColor     = PRIORITY[task.priority]?.color || '#888'
  const priLabel     = PRIORITY[task.priority]?.label || task.priority
  const priIcon      = PRIORITY[task.priority]?.icon  || ''
  const isDueSoon    = trigger === 'due_soon'

  const content = `
    <p style="color:rgba(200,210,240,0.75);font-size:13px;margin:0 0 4px;">
      ${isDueSoon
        ? `<span style="color:#FBBF24;font-weight:700;">&#9200; Reminder</span> &nbsp;&middot;&nbsp; ${projectName}`
        : `<strong style="color:#F0F4FF;">${actorName}</strong> <span style="color:rgba(200,210,240,0.40);">&middot;</span> ${projectName}`
      }
    </p>
    <p style="color:rgba(200,210,240,0.40);font-size:10px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;margin:0 0 10px;">${triggerLabel}</p>
    <h2 style="color:#F0F4FF;font-size:18px;margin:0 0 20px;font-weight:700;line-height:1.3;">${task.title}</h2>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0E1019;border:1px solid rgba(255,255,255,0.09);border-radius:10px;overflow:hidden;">
      ${metaRow('Status',   pill(statusLabel, statusColor))}
      ${metaRow('Priority', pill(`${priIcon} ${priLabel}`, priColor))}
      ${metaRow('Assignee', `<span style="color:rgba(200,210,240,0.75);font-size:13px;">${task.assignee_name || '&mdash;'}</span>`, !task.due_date)}
      ${task.due_date ? metaRow('Due date', `<span style="color:${isDueSoon ? '#FBBF24' : 'rgba(200,210,240,0.75)'};font-size:13px;font-weight:${isDueSoon ? '700' : '400'};">${isDueSoon ? '&#9889; ' : ''}${task.due_date}</span>`, true) : ''}
    </table>

    ${extraInfo ? `<p style="margin:14px 0 0;color:rgba(200,210,240,0.40);font-size:12px;background:#0E1019;border:1px solid rgba(255,255,255,0.09);border-radius:8px;padding:10px 14px;">${extraInfo}</p>` : ''}
  `

  const html = emailShell({ content, appUrl })
  return { subject: `${triggerLabel}: ${task.title}`, html }
}

// ─── Due-tomorrow reminder (convenience wrapper) ─────────────────────────────
export function buildDueSoonEmail({ task, projectName, appUrl }) {
  return buildNotificationEmail({ trigger: 'due_soon', task, projectName, actorName: '', appUrl })
}

// ─── Guest task invite email ──────────────────────────────────────────────────
export function buildGuestInviteEmail({ assigneeName, assignerName, taskTitle, projectName, appUrl }) {
  const content = `
    <p style="color:rgba(200,210,240,0.75);font-size:13px;margin:0 0 4px;">You've been assigned a task</p>
    <h2 style="color:#F0F4FF;font-size:18px;margin:0 0 20px;font-weight:700;line-height:1.3;">${taskTitle}</h2>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0E1019;border:1px solid rgba(255,255,255,0.09);border-radius:10px;overflow:hidden;">
      ${metaRow('Project',     `<span style="color:rgba(200,210,240,0.75);font-size:13px;">${projectName}</span>`)}
      ${metaRow('Assigned by', `<span style="color:rgba(200,210,240,0.75);font-size:13px;">${assignerName}</span>`, true)}
    </table>

    <div style="margin-top:20px;">
      <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#6B8EF7,#C084FC);color:#fff;text-decoration:none;padding:11px 26px;border-radius:9px;font-weight:700;font-size:13px;">View Your Tasks &#8594;</a>
    </div>
    <p style="color:rgba(200,210,240,0.40);font-size:11px;margin:12px 0 0;">Sign in with your Google account to view and update your tasks.</p>
  `

  const html = emailShell({ content, appUrl })
  return { subject: `You've been assigned: ${taskTitle}`, html }
}

// ─── Meeting minutes email ────────────────────────────────────────────────────
export function buildMeetingInviteEmail({ inviterName, meetingTitle, meetingDate, projectName, attendeeList, summary, actionItems, appUrl }) {
  const priorityColor = { high: '#F87171', medium: '#FBBF24', low: '#34D17A' }

  const actionsHtml = actionItems?.length ? `
    <div style="margin-top:22px;">
      ${sectionLabel('Action Items')}
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;border-spacing:0 5px;">
        ${actionItems.filter(a => a.title).map(a => `
        <tr><td style="background:#0E1019;border:1px solid rgba(255,255,255,0.09);border-radius:9px;padding:11px 14px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;width:12px;padding-top:3px;">
                <div style="width:7px;height:7px;border-radius:50%;background:${priorityColor[a.priority] || '#888'};"></div>
              </td>
              <td style="padding-left:10px;">
                <div style="color:#F0F4FF;font-size:13px;font-weight:600;">${a.title}</div>
                ${(a.assignee || a.due_date || a.projectName) ? `<div style="color:rgba(200,210,240,0.40);font-size:11px;margin-top:3px;">
                  ${[a.assignee ? `&#8594; ${a.assignee}` : '', a.due_date ? `Due ${a.due_date}` : '', a.projectName ? `<span style="color:#6B8EF7;">${a.projectName}</span>` : ''].filter(Boolean).join(' &nbsp;&middot;&nbsp; ')}
                </div>` : ''}
              </td>
              <td align="right" style="white-space:nowrap;padding-left:10px;vertical-align:top;">
                ${pill(a.priority, priorityColor[a.priority] || '#888')}
              </td>
            </tr>
          </table>
        </td></tr>`).join('')}
      </table>
    </div>` : ''

  const content = `
    <p style="color:rgba(200,210,240,0.75);font-size:13px;margin:0 0 4px;">
      <strong style="color:#F0F4FF;">${inviterName}</strong> shared meeting minutes
    </p>
    <h2 style="color:#F0F4FF;font-size:18px;margin:0 0 20px;font-weight:700;line-height:1.3;">${meetingTitle}</h2>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0E1019;border:1px solid rgba(255,255,255,0.09);border-radius:10px;overflow:hidden;">
      ${metaRow('Date',      `<span style="color:rgba(200,210,240,0.75);font-size:13px;">${meetingDate}</span>`)}
      ${metaRow('Project',   `<span style="color:rgba(200,210,240,0.75);font-size:13px;">${projectName}</span>`)}
      ${metaRow('Attendees', `<span style="color:rgba(200,210,240,0.75);font-size:13px;">${attendeeList}</span>`, !summary)}
      ${summary ? metaRow('Minutes', `<span style="color:rgba(200,210,240,0.75);font-size:13px;line-height:1.7;white-space:pre-line;">${summary}</span>`, true) : ''}
    </table>

    ${actionsHtml}
  `

  const html = emailShell({ badge: 'Meeting Minutes', content, appUrl })
  return { subject: `Meeting minutes: ${meetingTitle}`, html }
}
