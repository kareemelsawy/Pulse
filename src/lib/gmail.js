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
      <div style="margin-top:22px;text-align:center;">
        <a href="${appUrl}" style="display:inline-block;background:linear-gradient(135deg,#4F8EF7,#A78BFA);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:700;font-size:14px;">Open in Pulse →</a>
      </div>
      <p style="margin:18px 0 0;color:#475569;font-size:11px;text-align:center;">Sent via ◈ Pulse</p>
    </div>
  </div>
</body>
</html>`
  return {
    subject: `[Pulse] Meeting minutes: ${meetingTitle}`,
    html,
  }
}

// Kick off the Gmail OAuth popup (implicit flow)
export function startGmailOAuth(clientId, { silent = false } = {}) {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: window.location.origin + '/',
    response_type: 'token',
    scope: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email',
    prompt: silent ? 'none' : 'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

// Parse token from URL hash after OAuth redirect — returns { token, expiresAt } or null
export function parseOAuthToken() {
  if (!window.location.hash.includes('access_token=')) return null
  const params = new URLSearchParams(window.location.hash.replace('#', '?'))
  const token = params.get('access_token')
  const expiresIn = parseInt(params.get('expires_in') || '3600', 10)
  const expiresAt = Date.now() + (expiresIn - 120) * 1000 // 2 min buffer
  window.history.replaceState({}, document.title, window.location.pathname)
  return { token, expiresAt }
}

// Silently refresh the Gmail token using a hidden popup
export function refreshGmailToken(clientId) {
  return new Promise((resolve, reject) => {
    const popup = window.open(
      startGmailOAuth(clientId, { silent: true, redirectUri: window.location.origin + '/oauth-callback.html' }),
      'gmail_refresh',
      'width=1,height=1,top=-100,left=-100'
    )

    // Fallback: use same-origin redirect in an iframe instead
    const CALLBACK_PATH = window.location.pathname
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-999px;left:-999px;width:1px;height:1px;opacity:0;pointer-events:none;'
    iframe.src = startGmailOAuth(clientId, { silent: true, redirectUri: window.location.origin + CALLBACK_PATH })
    document.body.appendChild(iframe)

    if (popup) popup.close()

    const timeout = setTimeout(() => {
      document.body.removeChild(iframe)
      reject(new Error('Token refresh timed out'))
    }, 8000)

    function onMessage(e) {
      if (e.origin !== window.location.origin) return
      if (e.data?.type === 'gmail_token') {
        clearTimeout(timeout)
        window.removeEventListener('message', onMessage)
        document.body.removeChild(iframe)
        resolve(e.data)
      }
    }
    window.addEventListener('message', onMessage)

    // Also poll iframe URL for hash (same-origin)
    const poll = setInterval(() => {
      try {
        const hash = iframe.contentWindow?.location?.hash
        if (hash?.includes('access_token=')) {
          clearInterval(poll)
          clearTimeout(timeout)
          window.removeEventListener('message', onMessage)
          const params = new URLSearchParams(hash.replace('#', '?'))
          const token = params.get('access_token')
          const expiresIn = parseInt(params.get('expires_in') || '3600', 10)
          document.body.removeChild(iframe)
          resolve({ token, expiresAt: Date.now() + (expiresIn - 120) * 1000 })
        }
      } catch(e) { /* cross-origin not yet loaded */ }
    }, 200)

    setTimeout(() => clearInterval(poll), 8000)
  })
}

// Look up the gmail address for this token
export async function getGmailAddress(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  const data = await res.json()
  return data.email
}

