import { NOTIFICATION_TRIGGERS, STATUS, PRIORITY } from './constants'

// Build a base64-encoded RFC 2822 email for the Gmail API
function buildRawEmail({ to, subject, html }) {
  const lines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    html,
  ].join('\r\n')
  return btoa(unescape(encodeURIComponent(lines)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function sendGmail(accessToken, { to, subject, html }) {
  const res = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw: buildRawEmail({ to, subject, html }) }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `Gmail API error ${res.status}`)
  }
  return res.json()
}

export function buildNotificationEmail({ trigger, task, projectName, actorName, extraInfo }) {
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
    <div style="background:linear-gradient(135deg,#4F8EF7,#A78BFA);padding:22px 26px;display:flex;align-items:center;">
      <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-1px;flex:1;">◈ Pulse</span>
      <span style="background:rgba(255,255,255,0.2);color:#fff;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:600;">${triggerLabel}</span>
    </div>
    <div style="padding:26px;">
      <p style="color:#94A3B8;font-size:13px;margin:0 0 6px;">
        <strong style="color:#E2E8F0;">${actorName}</strong> — ${projectName}
      </p>
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
      <p style="margin:22px 0 0;color:#475569;font-size:11px;text-align:center;">Sent by ◈ Pulse</p>
    </div>
  </div>
</body>
</html>`

  return {
    subject: `[Pulse] ${triggerLabel}: ${task.title}`,
    html,
  }
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
      <div style="margin-top:22px;text-align:center;">
        <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#4F8EF7,#A78BFA);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">View Your Tasks →</a>
      </div>
      <p style="margin:20px 0 0;color:#475569;font-size:11px;text-align:center;">Sign in with your @homzmart.com Google account to see your assigned tasks and meetings.</p>
    </div>
  </div>
</body>
</html>`
  return {
    subject: `[Pulse] You've been assigned: ${taskTitle}`,
    html,
  }
}

export function buildMeetingInviteEmail({ inviterName, meetingTitle, meetingDate, projectName, attendeeList, summary, appUrl }) {
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:20px;background:#f1f5f9;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:540px;margin:0 auto;background:#0D0F14;border-radius:16px;overflow:hidden;border:1px solid #252A3A;">
    <div style="background:linear-gradient(135deg,#4F8EF7,#A78BFA);padding:22px 26px;display:flex;align-items:center;">
      <span style="font-size:20px;font-weight:900;color:#fff;letter-spacing:-1px;flex:1;">◈ Pulse</span>
      <span style="background:rgba(255,255,255,0.2);color:#fff;border-radius:20px;padding:3px 12px;font-size:11px;font-weight:600;">Meeting Invite</span>
    </div>
    <div style="padding:26px;">
      <p style="color:#94A3B8;font-size:13px;margin:0 0 6px;"><strong style="color:#E2E8F0;">${inviterName}</strong> invited you to a meeting</p>
      <h2 style="color:#E2E8F0;font-size:19px;margin:0 0 20px;font-weight:700;">${meetingTitle}</h2>
      <table style="width:100%;border-collapse:collapse;background:#141720;border-radius:10px;overflow:hidden;border:1px solid #252A3A;">
        <tr>
          <td style="padding:11px 15px;color:#64748B;font-size:12px;font-weight:600;border-bottom:1px solid #252A3A;">Date</td>
          <td style="padding:11px 15px;color:#E2E8F0;font-size:13px;border-bottom:1px solid #252A3A;">${meetingDate}</td>
        </tr>
        <tr>
          <td style="padding:11px 15px;color:#64748B;font-size:12px;font-weight:600;border-bottom:1px solid #252A3A;">Project</td>
          <td style="padding:11px 15px;color:#E2E8F0;font-size:13px;border-bottom:1px solid #252A3A;">${projectName}</td>
        </tr>
        <tr>
          <td style="padding:11px 15px;color:#64748B;font-size:12px;font-weight:600;${summary ? 'border-bottom:1px solid #252A3A;' : ''}">Attendees</td>
          <td style="padding:11px 15px;color:#E2E8F0;font-size:13px;${summary ? 'border-bottom:1px solid #252A3A;' : ''}">${attendeeList}</td>
        </tr>
        ${summary ? `<tr>
          <td style="padding:11px 15px;color:#64748B;font-size:12px;font-weight:600;">Notes</td>
          <td style="padding:11px 15px;color:#94A3B8;font-size:12px;line-height:1.6;">${summary}</td>
        </tr>` : ''}
      </table>
      <div style="margin-top:22px;text-align:center;">
        <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#4F8EF7,#A78BFA);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">Open in Pulse →</a>
      </div>
    </div>
  </div>
</body>
</html>`
  return {
    subject: `[Pulse] Meeting invite: ${meetingTitle}`,
    html,
  }
}

// Kick off the Gmail OAuth popup (implicit flow)
export function startGmailOAuth(clientId) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: window.location.origin + window.location.pathname,
    response_type: 'token',
    scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
    prompt: 'select_account',
  })
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// Parse token from URL hash after OAuth redirect
export function parseOAuthToken() {
  if (!window.location.hash.includes('access_token=')) return null
  const params = new URLSearchParams(window.location.hash.replace('#', '?'))
  const token = params.get('access_token')
  window.history.replaceState({}, document.title, window.location.pathname)
  return token
}

// Look up the gmail address for this token
export async function getGmailAddress(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  return data.email
}
