import { NOTIFICATION_TRIGGERS, STATUS, PRIORITY } from './constants'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL

// ─── Email sender via Supabase Edge Function ──────────────────────────────────
// Resend blocks direct browser requests (CORS), so we proxy through
// a Supabase Edge Function. The Resend API key is passed from the
// app's notif_settings stored in the DB.
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

// ─── Email templates ──────────────────────────────────────────────────────────

export function buildNotificationEmail({ trigger, task, projectName, actorName, extraInfo, appUrl }) {
  const triggerLabel = NOTIFICATION_TRIGGERS[trigger]?.label || trigger
  const statusColor = STATUS[task.status]?.color || '#888'
  const statusLabel = STATUS[task.status]?.label || task.status
  const priColor    = PRIORITY[task.priority]?.color || '#888'
  const priIcon     = PRIORITY[task.priority]?.icon || ''

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:540px;margin:0 auto;background:#0D0F14;border-radius:16px;overflow:hidden;border:1px solid #252A3A;">
    <div style="background:linear-gradient(135deg,#4F8EF7,#A78BFA);padding:22px 26px;">
      <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-1px;">◈ Pulse</span>
    </div>
    <div style="padding:26px;">
      <p style="color:#94A3B8;font-size:13px;margin:0 0 6px;">
        <strong style="color:#E2E8F0;">${actorName}</strong> — ${projectName}
      </p>
      <p style="color:#94A3B8;font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin:0 0 6px;">${triggerLabel}</p>
      <h2 style="color:#E2E8F0;font-size:19px;margin:0 0 20px;font-weight:700;">${task.title}</h2>
      <table style="width:100%;border-collapse:collapse;background:#141720;border-radius:10px;overflow:hidden;border:1px solid #252A3A;">
        <tr>
          <td style="padding:11px 15px;color:#64748B;font-size:12px;font-weight:600;width:110px;border-bottom:1px solid #252A3A;">Status</td>
          <td style="padding:11px 15px;border-bottom:1px solid #252A3A;">
            <span style="background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44;border-radius:4px;padding:2px 9px;font-size:12px;font-weight:600;">${statusLabel}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:11px 15px;color:#64748B;font-size:12px;font-weight:600;border-bottom:1px solid #252A3A;">Priority</td>
          <td style="padding:11px 15px;color:${priColor};font-weight:700;font-size:13px;border-bottom:1px solid #252A3A;">${priIcon} ${task.priority}</td>
        </tr>
        <tr>
          <td style="padding:11px 15px;color:#64748B;font-size:12px;font-weight:600;${task.due_date ? 'border-bottom:1px solid #252A3A;' : ''}">Assignee</td>
          <td style="padding:11px 15px;color:#E2E8F0;font-size:13px;${task.due_date ? 'border-bottom:1px solid #252A3A;' : ''}">${task.assignee_name || '—'}</td>
        </tr>
        ${task.due_date ? `<tr>
          <td style="padding:11px 15px;color:#64748B;font-size:12px;font-weight:600;">Due</td>
          <td style="padding:11px 15px;color:#E2E8F0;font-size:13px;">${task.due_date}</td>
        </tr>` : ''}
      </table>
      ${extraInfo ? `<p style="margin:14px 0 0;color:#94A3B8;font-size:12px;">${extraInfo}</p>` : ''}
      <div style="margin-top:22px;">
        <a href="${appUrl || '#'}" style="display:inline-block;background:rgba(79,142,247,0.15);color:#4F8EF7;text-decoration:none;padding:7px 16px;border-radius:8px;font-weight:600;font-size:12px;border:1px solid rgba(79,142,247,0.30);margin-bottom:12px;">Open Pulse →</a>
        <p style="color:#475569;font-size:11px;margin:0;">Sent by ◈ Pulse</p>
      </div>
    </div>
  </div>
</body>
</html>`

  return { subject: `${triggerLabel}: ${task.title}`, html }
}

export function buildGuestInviteEmail({ assigneeName, assignerName, taskTitle, projectName, appUrl }) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:540px;margin:0 auto;background:#0D0F14;border-radius:16px;overflow:hidden;border:1px solid #252A3A;">
    <div style="background:linear-gradient(135deg,#4F8EF7,#A78BFA);padding:22px 26px;">
      <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-1px;">◈ Pulse</span>
    </div>
    <div style="padding:26px;">
      <p style="color:#94A3B8;font-size:13px;margin:0 0 6px;">You've been assigned a task</p>
      <h2 style="color:#E2E8F0;font-size:19px;margin:0 0 20px;font-weight:700;">${taskTitle}</h2>
      <table style="width:100%;border-collapse:collapse;background:#141720;border-radius:10px;overflow:hidden;border:1px solid #252A3A;">
        <tr>
          <td style="padding:11px 15px;color:#64748B;font-size:12px;font-weight:600;border-bottom:1px solid #252A3A;">Project</td>
          <td style="padding:11px 15px;color:#E2E8F0;font-size:13px;border-bottom:1px solid #252A3A;">${projectName}</td>
        </tr>
        <tr>
          <td style="padding:11px 15px;color:#64748B;font-size:12px;font-weight:600;">Assigned by</td>
          <td style="padding:11px 15px;color:#E2E8F0;font-size:13px;">${assignerName}</td>
        </tr>
      </table>
      <div style="margin-top:22px;">
        <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#4F8EF7,#A78BFA);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">View Your Tasks →</a>
      </div>
      <div style="margin-top:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <p style="color:#475569;font-size:11px;margin:0;">Sent by ◈ Pulse</p>
        <p style="color:#475569;font-size:11px;margin:0;">Sign in with your Google account to view your tasks.</p>
      </div>
    </div>
  </div>
</body>
</html>`
  return { subject: `You've been assigned: ${taskTitle}`, html }
}

export function buildMeetingInviteEmail({ inviterName, meetingTitle, meetingDate, projectName, attendeeList, summary, actionItems, appUrl }) {
  const priorityColor = { high: '#EF4444', medium: '#F59E0B', low: '#6366F1' }
  const actionsHtml = actionItems?.length ? `
    <div style="margin-top:22px;">
      <div style="font-size:11px;font-weight:800;color:#64748B;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;">Action Items</div>
      <div style="display:flex;flex-direction:column;gap:6px;">
        ${actionItems.map(a => `
          <div style="background:#141720;border:1px solid #252A3A;border-radius:8px;padding:10px 14px;display:flex;align-items:flex-start;gap:10px;">
            <div style="width:6px;height:6px;border-radius:50%;background:${priorityColor[a.priority] || '#888'};flex-shrink:0;margin-top:5px;"></div>
            <div style="flex:1;">
              <div style="color:#E2E8F0;font-size:13px;font-weight:500;">${a.title}</div>
              ${a.assignee ? `<div style="color:#64748B;font-size:11px;margin-top:3px;">→ ${a.assignee}${a.due_date ? ` · Due ${a.due_date}` : ''}</div>` : ''}
            </div>
            <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;background:${priorityColor[a.priority] || '#888'}22;color:${priorityColor[a.priority] || '#888'};white-space:nowrap;">${a.priority}</span>
          </div>`).join('')}
      </div>
    </div>` : ''

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#0D0F14;border-radius:16px;overflow:hidden;border:1px solid #252A3A;">
    <div style="background:linear-gradient(135deg,#4F8EF7,#A78BFA);padding:22px 26px;display:flex;align-items:center;">
      <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-1px;flex:1;">◈ Pulse</span>
      <span style="background:rgba(255,255,255,0.2);color:#fff;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:600;">Meeting Minutes</span>
    </div>
    <div style="padding:26px;">
      <p style="color:#94A3B8;font-size:13px;margin:0 0 6px;"><strong style="color:#E2E8F0;">${inviterName}</strong> shared meeting minutes</p>
      <h2 style="color:#E2E8F0;font-size:19px;margin:0 0 20px;font-weight:700;">${meetingTitle}</h2>
      <table style="width:100%;border-collapse:collapse;background:#141720;border-radius:10px;overflow:hidden;border:1px solid #252A3A;">
        <tr>
          <td style="padding:11px 15px;color:#64748B;font-size:12px;font-weight:600;border-bottom:1px solid #252A3A;white-space:nowrap;">Date</td>
          <td style="padding:11px 15px;color:#E2E8F0;font-size:13px;border-bottom:1px solid #252A3A;">${meetingDate}</td>
        </tr>
        <tr>
          <td style="padding:11px 15px;color:#64748B;font-size:12px;font-weight:600;border-bottom:1px solid #252A3A;white-space:nowrap;">Project</td>
          <td style="padding:11px 15px;color:#E2E8F0;font-size:13px;border-bottom:1px solid #252A3A;">${projectName}</td>
        </tr>
        <tr>
          <td style="padding:11px 15px;color:#64748B;font-size:12px;font-weight:600;${summary ? 'border-bottom:1px solid #252A3A;' : ''}white-space:nowrap;">Attendees</td>
          <td style="padding:11px 15px;color:#E2E8F0;font-size:13px;${summary ? 'border-bottom:1px solid #252A3A;' : ''}">${attendeeList}</td>
        </tr>
        ${summary ? `<tr>
          <td style="padding:11px 15px;color:#64748B;font-size:12px;font-weight:600;vertical-align:top;white-space:nowrap;">Minutes</td>
          <td style="padding:11px 15px;color:#94A3B8;font-size:13px;line-height:1.7;white-space:pre-line;">${summary}</td>
        </tr>` : ''}
      </table>
      ${actionsHtml}
      <div style="margin-top:22px;">
        <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#4F8EF7,#A78BFA);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">Open in Pulse →</a>
      </div>
      <div style="margin-top:18px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
        <p style="color:#475569;font-size:11px;margin:0;">Sent by ◈ Pulse</p>
      </div>
    </div>
  </div>
</body>
</html>`
  return { subject: `Meeting minutes: ${meetingTitle}`, html }
}
