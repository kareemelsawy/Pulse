import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { apiKey, fromEmail, fromName, to, subject, html } = await req.json()

    if (!apiKey) throw new Error('Missing API key')
    if (!to)     throw new Error('Missing recipient email')
    if (!subject) throw new Error('Missing subject')
    if (!html)   throw new Error('Missing email body')

    const from = fromEmail
      ? `${fromName || 'Pulse'} <${fromEmail}>`
      : 'Pulse <onboarding@resend.dev>'

    // Try Resend first (key starts with re_)
    if (apiKey.startsWith('re_')) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from, to, subject, html }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || `Resend error ${res.status}`)

      return new Response(JSON.stringify({ success: true, id: data.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fallback: SendGrid (key starts with SG.)
    if (apiKey.startsWith('SG.')) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: fromEmail || 'noreply@pulse.app', name: fromName || 'Pulse' },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.errors?.[0]?.message || `SendGrid error ${res.status}`)
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Unrecognized API key format. Use a Resend key (re_...) or SendGrid key (SG....)')

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
