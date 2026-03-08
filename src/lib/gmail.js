/**
 * gmail.js — Email sending + template builders
 * Uses Resend (primary) via a Supabase Edge Function proxy
 */

// ─── Send via Supabase Edge Function (keeps API key server-side) ──────────────
export async function sendEmail({ apiKey, fromEmail, fromName, functionSecret, to, subject, html }) {
  // Try edge function first (recommended — keeps key server-side)
  if (functionSecret) {
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${functionSecret}`,
        },
        body: JSON.stringify({ to, subject, html, fromEmail, fromName }),
      })
      if (res.ok) return await res.json()
    } catch { /* fall through to direct */ }
  }

  // Direct Resend call (apiKey exposed in browser — acceptable for internal tools)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: `${fromName} <${fromEmail}>`,
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message || `Email send failed: ${res.status}`)
  }

  return res.json()
}

// ─── Shared email wrapper ─────────────────────────────────────────────────────
function emailWrapper(content) {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
    <body style="margin:0;padding:0;background:#060a14;font-family:'DM Sans',system-ui,sans-serif;color:#fff;">
      <div style="max-width:520px;margin:40px auto;padding:0 16px;">
        <div style="background:rgba(10,15,30,0.95);border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <div style="padding:28px 32px;border-bottom:1px solid rgba(255,255,255,0.06);">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#4F8EF7,#1e4fff);display:flex;align-items:center;justify-content:center;font-size:15px;color:#fff;font-weight:900;">✦</div>
              <span style="font-size:17px;font-weight:800;color:#fff;letter-spacing:-0.5px;">Pulse</span>
            </div>
          </div>
          <!-- Body -->
          <div style="padding:32px;">
            ${content}
          </div>
          <!-- Footer -->
          <div style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.2);letter-spacing:0.5px;">PULSE · PROJECT MANAGEMENT</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// ─── Notification email ───────────────────────────────────────────────────────
export function buildNotificationEmail({ trigger, task, projectName, actorName, extraInfo, appUrl }) {
  const triggerLabels = {
    new_task:       'New Task Created',
    task_assigned:  'Task Assigned to You',
    task_completed: 'Task Completed',
    status_changed: 'Task Status Changed',
    due_soon:       'Task Due Soon',
  }

  const label = triggerLabels[trigger] || 'Task Update'
  const subject = `[Pulse] ${label}: ${task.title}`

  const html = emailWrapper(`
    <h2 style="margin:0 0 6px;font-size:18px;font-weight:700;color:#fff;">${label}</h2>
    <p style="margin:0 0 24px;font-size:13px;color:rgba(255,255,255,0.45);">
      ${actorName} · ${projectName || 'Unknown project'}
    </p>

    <div style="padding:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#fff;">${task.title}</p>
      ${extraInfo ? `<p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.45);">${extraInfo}</p>` : ''}
    </div>

    <a href="${appUrl}" style="display:inline-block;padding:11px 22px;background:linear-gradient(135deg,#4F8EF7,#2563eb);color:#fff;font-weight:700;font-size:13px;border-radius:9px;text-decoration:none;">
      Open Pulse
    </a>
  `)

  return { subject, html }
}

// ─── Guest invite email ───────────────────────────────────────────────────────
export function buildGuestInviteEmail({ assigneeName, assignerName, taskTitle, projectName, appUrl }) {
  const subject = `${assignerName} assigned you a task in Pulse`

  const html = emailWrapper(`
    <h2 style="margin:0 0 6px;font-size:18px;font-weight:700;color:#fff;">You've been assigned a task</h2>
    <p style="margin:0 0 24px;font-size:13px;color:rgba(255,255,255,0.45);">From ${assignerName}</p>

    <div style="padding:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin-bottom:24px;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.3);letter-spacing:0.8px;text-transform:uppercase;">Task</p>
      <p style="margin:0;font-size:15px;font-weight:600;color:#fff;">${taskTitle}</p>
      ${projectName ? `<p style="margin:6px 0 0;font-size:12px;color:rgba(255,255,255,0.45);">Project: ${projectName}</p>` : ''}
    </div>

    <a href="${appUrl}" style="display:inline-block;padding:11px 22px;background:linear-gradient(135deg,#4F8EF7,#2563eb);color:#fff;font-weight:700;font-size:13px;border-radius:9px;text-decoration:none;">
      View Task
    </a>
  `)

  return { subject, html }
}

// ─── Meeting invite email ─────────────────────────────────────────────────────
export function buildMeetingInviteEmail({ inviterName, meetingTitle, meetingDate, projectName, attendeeList, summary, actionItems, appUrl }) {
  const subject = `Meeting: ${meetingTitle} — ${meetingDate}`

  const actionItemsHtml = actionItems?.length
    ? `<div style="margin-top:16px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.3);letter-spacing:0.8px;text-transform:uppercase;">Action Items</p>
        ${actionItems.map(item => `
          <div style="display:flex;align-items:flex-start;gap:8px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);">
            <span style="color:#4F8EF7;font-size:14px;margin-top:1px;">→</span>
            <span style="font-size:13px;color:rgba(255,255,255,0.75);">${item.title || item}</span>
          </div>
        `).join('')}
      </div>`
    : ''

  const html = emailWrapper(`
    <h2 style="margin:0 0 6px;font-size:18px;font-weight:700;color:#fff;">${meetingTitle}</h2>
    <p style="margin:0 0 24px;font-size:13px;color:rgba(255,255,255,0.45);">
      ${meetingDate} · ${projectName} · Invited by ${inviterName}
    </p>

    ${summary ? `
      <div style="padding:16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;margin-bottom:20px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:rgba(255,255,255,0.3);letter-spacing:0.8px;text-transform:uppercase;">Summary</p>
        <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.75);line-height:1.6;">${summary}</p>
        ${actionItemsHtml}
      </div>
    ` : ''}

    <a href="${appUrl}" style="display:inline-block;padding:11px 22px;background:linear-gradient(135deg,#4F8EF7,#2563eb);color:#fff;font-weight:700;font-size:13px;border-radius:9px;text-decoration:none;">
      Open Pulse
    </a>
  `)

  return { subject, html }
}
