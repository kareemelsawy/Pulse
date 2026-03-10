import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Spinner } from '../components/UI'

// ── Shared primitives (mirrors LoginPage exactly) ─────────────────────────────

function AppBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden', background: '#000' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 110% 80% at 75% 40%, rgba(0,80,255,0.52)   0%, transparent 55%),
          radial-gradient(ellipse 70%  60% at 90% 20%, rgba(0,180,255,0.30)  0%, transparent 50%),
          radial-gradient(ellipse 50%  50% at 85% 55%, rgba(0,220,240,0.18)  0%, transparent 45%),
          radial-gradient(ellipse 90%  90% at 10% 80%, rgba(0,0,0,1.00)      0%, transparent 70%),
          radial-gradient(ellipse 80%  80% at 5%  5%,  rgba(0,0,10,0.95)     0%, transparent 60%)
        `,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse 40% 35% at 80% 30%, rgba(80,200,255,0.10) 0%, transparent 55%),
          radial-gradient(ellipse 30% 25% at 65% 60%, rgba(0,120,255,0.08)  0%, transparent 50%)
        `,
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.025, mixBlendMode: 'overlay',
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      }} />
    </div>
  )
}

function Shell({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'DM Sans', system-ui, sans-serif", position: 'relative', color: '#EEF2FF' }}>
      <AppBackground />
      <div className="invite-left-panel" style={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 64px', position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6B8EF7,#C084FC)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: '#fff', fontWeight: 900, boxShadow: '0 4px 16px rgba(107,142,247,0.40)' }}>✦</div>
          <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, letterSpacing: '-0.03em', color: 'rgba(255,255,255,0.90)' }}>PULSE</div>
        </div>
        {/* Headline */}
        <div>
          <h1 style={{ fontSize: 'clamp(30px, 3.5vw, 50px)', fontWeight: 700, lineHeight: 1.10, letterSpacing: '-0.03em', color: '#FFFFFF', margin: '0 0 20px', fontFamily: "'DM Sans', sans-serif" }}>
            You've been<br />invited to join<br />your team.
          </h1>
          <p style={{ fontSize: 15, fontWeight: 300, lineHeight: 1.75, color: 'rgba(180,200,255,0.48)', maxWidth: 400, margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            Track programs, tasks and meetings — all in one place built for Homzmart.
          </p>
        </div>
        <div>
          <div style={{ width: 24, height: 1, background: 'rgba(255,255,255,0.12)', marginBottom: 14 }} />
          <p style={{ fontSize: 11, color: 'rgba(180,200,255,0.28)', letterSpacing: '0.04em', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Internal tool for Homzmart teams.</p>
        </div>
      </div>
      <div style={{ flex: '0 0 45%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', zIndex: 1, borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>{children}</div>
      </div>
      <style>{`
        @keyframes checkBounce { 0%{transform:scale(0)} 60%{transform:scale(1.2)} 100%{transform:scale(1)} }
        @media (max-width: 768px) { .invite-left-panel { display: none !important; } }
      `}</style>
    </div>
  )
}

function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      background: 'rgba(5,8,30,0.72)', backdropFilter: 'blur(32px) saturate(180%)',
      WebkitBackdropFilter: 'blur(32px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.10)', borderRadius: 20,
      boxShadow: '0 32px 80px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.07)',
      padding: '40px 40px', width: '100%', maxWidth: 380, ...style,
    }}>{children}</div>
  )
}

function Field({ label, type = 'text', value, onChange, placeholder, autoFocus, onKeyDown }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: focused ? 'rgba(80,180,255,0.9)' : 'rgba(180,200,255,0.38)', transition: 'color 0.15s' }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus} onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: `1px solid ${focused ? 'rgba(0,150,255,0.55)' : 'rgba(255,255,255,0.10)'}`, borderRadius: 10, padding: '11px 14px', color: '#EEF2FF', fontSize: 14, outline: 'none', fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, transition: 'border-color 0.15s, box-shadow 0.15s', boxShadow: focused ? '0 0 0 3px rgba(0,120,255,0.15)' : 'none' }} />
    </div>
  )
}

function PrimaryBtn({ loading, onClick, disabled, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick} disabled={disabled || loading}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ width: '100%', padding: '12px 20px', borderRadius: 10, background: disabled || loading ? 'rgba(0,100,255,0.3)' : hover ? 'rgba(0,130,255,0.95)' : 'rgba(0,110,255,0.85)', color: '#fff', border: '1px solid rgba(80,180,255,0.3)', fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: disabled || loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s', boxShadow: hover && !disabled && !loading ? '0 8px 28px rgba(0,100,255,0.45)' : '0 4px 14px rgba(0,80,255,0.20)', transform: hover && !disabled && !loading ? 'translateY(-1px)' : 'none' }}>
      {loading ? <Spinner size={16} /> : children}
    </button>
  )
}

function GoogleBtn({ onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ width: '100%', padding: '11px 20px', borderRadius: 10, background: hover ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.06)', color: '#EEF2FF', border: '1px solid rgba(255,255,255,0.14)', fontWeight: 600, fontSize: 14, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'all 0.15s' }}>
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.6 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4c-7.7 0-14.4 4.4-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.9 13.5-5l-6.2-5.2C29.4 35.5 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7L6 33.8C9.3 39.5 16.1 44 24 44z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.9 2.4-2.5 4.4-4.6 5.8l6.2 5.2C40.9 35.8 44 30.3 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
      Continue with Google
    </button>
  )
}

function ErrMsg({ msg }) {
  if (!msg) return null
  return (
    <div style={{ background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.22)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#FCA5A5', lineHeight: 1.5, display: 'flex', gap: 8 }}>
      <span>⚠</span><span>{msg}</span>
    </div>
  )
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '2px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      <span style={{ fontSize: 11, color: 'rgba(180,200,255,0.28)', fontWeight: 500, letterSpacing: '0.05em' }}>or set a password</span>
      <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
    </div>
  )
}

// ── Main InvitePage ───────────────────────────────────────────────────────────
export default function InvitePage({ inviteCode, workspaceName, onSignOut }) {
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [pw,      setPw]      = useState('')
  const [pw2,     setPw2]     = useState('')
  const [loading, setLoading] = useState(false)
  const [err,     setErr]     = useState(null)
  const [done,    setDone]    = useState(false)

  async function google() {
    setErr(null)
    const { error: e } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (e) setErr(e.message)
  }

  async function createAccount() {
    if (!name.trim()) { setErr('Enter your full name.'); return }
    if (!email.trim()) { setErr('Enter your email.'); return }
    if (pw.length < 6) { setErr('Password must be at least 6 characters.'); return }
    if (pw !== pw2) { setErr('Passwords do not match.'); return }
    setErr(null); setLoading(true)
    const { error: e } = await supabase.auth.signUp({
      email: email.trim(),
      password: pw,
      options: { data: { full_name: name.trim() } },
    })
    if (e) { setErr(e.message); setLoading(false) }
    else { setDone(true); setLoading(false) }
  }

  // ── Email confirmation sent ───────────────────────────────────────────────
  if (done) return (
    <Shell>
      <GlassCard style={{ textAlign: 'center', padding: '52px 40px' }}>
        <div style={{ fontSize: 48, marginBottom: 18, animation: 'checkBounce 0.5s ease' }}>✉</div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#EEF2FF', marginBottom: 10, letterSpacing: '-0.02em' }}>
          Check your inbox
        </h2>
        <p style={{ color: 'rgba(180,200,255,0.50)', fontSize: 13, lineHeight: 1.7, marginBottom: 20 }}>
          We sent a confirmation to{' '}
          <strong style={{ color: 'rgba(200,220,255,0.8)' }}>{email}</strong>.
          <br />Click it to activate — then you'll land straight in your workspace.
        </p>
        <div style={{ background: 'rgba(107,142,247,0.10)', border: '1px solid rgba(107,142,247,0.20)', borderRadius: 10, padding: '10px 16px', fontSize: 12, color: 'rgba(180,200,255,0.55)', lineHeight: 1.6 }}>
          Your invite code is saved. You'll join{' '}
          <strong style={{ color: '#EEF2FF' }}>{workspaceName || 'the workspace'}</strong>{' '}
          automatically after confirming your email.
        </div>
      </GlassCard>
    </Shell>
  )

  // ── Main invite card ──────────────────────────────────────────────────────
  return (
    <Shell>
      <GlassCard>

        {/* Workspace pill */}
        {workspaceName && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(107,142,247,0.12)', border: '1px solid rgba(107,142,247,0.25)', borderRadius: 20, padding: '5px 12px', marginBottom: 20 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#6B8EF7', flexShrink: 0 }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(107,142,247,0.9)', letterSpacing: '0.02em' }}>{workspaceName}</span>
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: '#EEF2FF', margin: '0 0 6px' }}>
            Join the workspace
          </h2>
          <p style={{ fontSize: 13, color: 'rgba(180,200,255,0.42)', margin: 0, lineHeight: 1.6 }}>
            Choose how you'd like to create your account.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <ErrMsg msg={err} />

          {/* Google — top and prominent */}
          <GoogleBtn onClick={google} />

          <Divider />

          {/* Email + password signup */}
          <Field label="Full name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" autoFocus onKeyDown={e => e.key === 'Enter' && createAccount()} />
          <Field label="Work email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@homzmart.com" onKeyDown={e => e.key === 'Enter' && createAccount()} />
          <Field label="Password" type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="At least 6 characters" onKeyDown={e => e.key === 'Enter' && createAccount()} />
          <Field label="Confirm password" type="password" value={pw2} onChange={e => setPw2(e.target.value)} placeholder="Same as above" onKeyDown={e => e.key === 'Enter' && createAccount()} />

          <div style={{ marginTop: 4 }}>
            <PrimaryBtn loading={loading} onClick={createAccount} disabled={loading}>
              Create account & join →
            </PrimaryBtn>
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'rgba(180,200,255,0.28)', textAlign: 'center', marginTop: 20, lineHeight: 1.6 }}>
          Wrong account?{' '}
          <button onClick={onSignOut} style={{ background: 'none', border: 'none', padding: 0, color: 'rgba(130,170,255,0.65)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', textUnderlineOffset: 3 }}>
            Sign out
          </button>
        </p>
      </GlassCard>
    </Shell>
  )
}
