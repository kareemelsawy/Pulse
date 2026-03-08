import { useState } from 'react'
import { supabase, configError } from '../lib/supabase'
import { Spinner } from '../components/UI'
import { useTheme } from '../contexts/ThemeContext'

const useD = () => useTheme().isDark

// ── Form atoms ─────────────────────────────────────────────────────────────────
function Input({ type='text', value, onChange, placeholder, autoFocus, onKeyDown, d }) {
  return (
    <input
      type={type} value={value} onChange={onChange}
      placeholder={placeholder} autoFocus={autoFocus} onKeyDown={onKeyDown}
      style={{
        width:'100%', display:'block', boxSizing:'border-box',
        background: d ? '#1C1C22' : '#FFFFFF',
        border: d ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.13)',
        borderRadius: 8, padding: '10px 13px',
        color: d ? '#F0F0F2' : '#111113', fontSize: 13,
        fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5,
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}
    />
  )
}

function Label({ d, children, right }) {
  return (
    <div style={{ display:'flex', justifyContent: right ? 'space-between' : 'flex-start', alignItems:'baseline', marginBottom: 6 }}>
      <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase', color: d ? '#5A5A68' : '#888898' }}>{children}</span>
      {right}
    </div>
  )
}

function PrimaryBtn({ loading, onClick, disabled, d, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:'100%', padding:'11px 18px', borderRadius:8,
      background: d ? '#4F8EF7' : '#2563EB',
      color:'#fff', border:'none',
      fontWeight:600, fontSize:13,
      fontFamily:"'DM Sans',sans-serif", letterSpacing:'-0.01em',
      opacity: disabled ? 0.55 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      transition:'opacity 0.12s, filter 0.12s',
      boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
    }}
    onMouseEnter={e => { if(!disabled) e.currentTarget.style.filter='brightness(1.08)' }}
    onMouseLeave={e => e.currentTarget.style.filter=''}>
      {loading ? <Spinner size={15} /> : children}
    </button>
  )
}

function GhostBtn({ onClick, d, children }) {
  return (
    <button onClick={onClick} style={{
      width:'100%', padding:'10px 18px', borderRadius:8,
      background: d ? '#1C1C22' : '#F4F4F6',
      color: d ? '#C8C8D0' : '#3C3C48',
      border: d ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(0,0,0,0.10)',
      fontWeight:500, fontSize:13,
      fontFamily:"'DM Sans',sans-serif",
      cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:9,
      transition:'background 0.12s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = d ? '#26262E' : '#EBEBEE'}
    onMouseLeave={e => e.currentTarget.style.background = d ? '#1C1C22' : '#F4F4F6'}>
      {children}
    </button>
  )
}

function ErrBox({ msg, d }) {
  if (!msg) return null
  return <div style={{ background: d?'rgba(239,68,68,0.10)':'#FEF2F2', border:`1px solid ${d?'rgba(239,68,68,0.22)':'#FECACA'}`, borderRadius:7, padding:'9px 12px', marginBottom:14, fontSize:12, color:d?'#FCA5A5':'#B91C1C', lineHeight:1.5 }}>✕ {msg}</div>
}
function OkBox({ msg, d }) {
  if (!msg) return null
  return <div style={{ background: d?'rgba(34,197,94,0.10)':'#F0FDF4', border:`1px solid ${d?'rgba(34,197,94,0.22)':'#BBF7D0'}`, borderRadius:7, padding:'9px 12px', marginBottom:14, fontSize:12, color:d?'#86EFAC':'#15803D', lineHeight:1.5 }}>✓ {msg}</div>
}
function OrDivider({ d }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, margin:'14px 0' }}>
      <div style={{ flex:1, height:1, background: d?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.08)' }} />
      <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.10em', color: d?'#3C3C48':'#BBBBC8' }}>OR</span>
      <div style={{ flex:1, height:1, background: d?'rgba(255,255,255,0.07)':'rgba(0,0,0,0.08)' }} />
    </div>
  )
}
function Lnk({ onClick, d, children }) {
  return <span onClick={onClick} style={{ color: d?'#7EB3FF':'#2563EB', cursor:'pointer', fontWeight:600, fontSize:12 }}>{children}</span>
}
function Note({ d, children }) {
  return <p style={{ fontSize:12, color: d?'#5A5A68':'#888898', textAlign:'center', marginTop:20, lineHeight:1.6 }}>{children}</p>
}
function GoogleIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
}

// ── Layout ─────────────────────────────────────────────────────────────────────
function LeftPanel({ d }) {
  const features = [
    { icon:'📋', title:'Unified Programs', desc:'All projects, actions, and milestones in one workspace.' },
    { icon:'📊', title:'Real-time Visibility', desc:'Live status across every team — no more status meetings.' },
    { icon:'🔔', title:'Smart Notifications', desc:'Automated alerts keep owners accountable without the noise.' },
    { icon:'📅', title:'Meeting Intelligence', desc:'Decisions and action items captured, linked, and tracked.' },
  ]

  return (
    <div style={{
      flex:'0 0 52%', position:'relative', overflow:'hidden',
      display:'flex', flexDirection:'column',
      background: d
        ? 'linear-gradient(155deg, #0A0A0E 0%, #0D1528 35%, #0F2060 65%, #1050B0 83%, #1480D8 96%, #10A0E0 100%)'
        : 'linear-gradient(155deg, #EBF2FF 0%, #D4E6FF 30%, #A8CCFF 58%, #5EA0FF 78%, #1E6FFF 93%, #0050D0 100%)',
    }}>
      {/* Grain */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity: d?0.04:0.025, mixBlendMode:'overlay',
        backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E\")" }} />
      {/* Bottom vignette */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'35%', pointerEvents:'none',
        background: d ? 'linear-gradient(to top, rgba(0,0,10,0.65),transparent)' : 'linear-gradient(to top, rgba(0,30,120,0.20),transparent)' }} />

      {/* Content */}
      <div style={{ position:'relative', zIndex:1, flex:1, display:'flex', flexDirection:'column', padding:'48px 52px' }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'auto' }}>
          <div style={{ width:28, height:28, borderRadius:8, background: d?'rgba(255,255,255,0.14)':'rgba(255,255,255,0.70)', border: d?'1px solid rgba(255,255,255,0.20)':'1px solid rgba(255,255,255,0.85)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>✦</div>
          <span style={{ fontFamily:'Syne', fontWeight:800, fontSize:14, letterSpacing:'0.18em', color: d?'rgba(255,255,255,0.88)':'rgba(5,20,80,0.82)' }}>PULSE</span>
          <div style={{ width:1, height:13, background: d?'rgba(255,255,255,0.14)':'rgba(5,20,80,0.14)', margin:'0 4px' }} />
          <span style={{ fontSize:11, color: d?'rgba(255,255,255,0.30)':'rgba(5,20,80,0.36)', letterSpacing:'0.03em' }}>Homzmart</span>
        </div>

        {/* Hero text */}
        <div style={{ margin:'auto 0', paddingBottom:8 }}>
          {/* Eyebrow */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
            <div style={{ width:20, height:1, background: d?'rgba(255,255,255,0.28)':'rgba(5,20,80,0.28)' }} />
            <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.16em', textTransform:'uppercase', color: d?'rgba(255,255,255,0.35)':'rgba(5,20,80,0.40)' }}>Program Management</span>
          </div>

          {/* Headline */}
          <h2 style={{ fontFamily:'Syne', fontWeight:800, fontSize:'clamp(34px,4vw,56px)', lineHeight:1.06, letterSpacing:'-0.04em', color: d?'rgba(255,255,255,0.96)':'rgba(5,20,80,0.93)', margin:'0 0 18px' }}>
            Every team.<br />One truth.
          </h2>

          <p style={{ fontSize:13, fontWeight:300, lineHeight:1.75, color: d?'rgba(255,255,255,0.38)':'rgba(5,20,80,0.44)', maxWidth:300, margin:'0 0 40px', letterSpacing:'0.01em' }}>
            The operating layer where Homzmart's programs, actions, and meetings converge into a single source of truth.
          </p>

          {/* Feature list */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {features.map(({ icon, title, desc }) => (
              <div key={title} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
                <div style={{ width:32, height:32, borderRadius:9, flexShrink:0, background: d?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.50)', border: d?'1px solid rgba(255,255,255,0.12)':'1px solid rgba(255,255,255,0.70)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, marginTop:1 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color: d?'rgba(255,255,255,0.80)':'rgba(5,20,80,0.82)', marginBottom:2, letterSpacing:'-0.01em' }}>{title}</div>
                  <div style={{ fontSize:12, color: d?'rgba(255,255,255,0.32)':'rgba(5,20,80,0.40)', lineHeight:1.55, fontWeight:300 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div>
          <div style={{ width:24, height:1, background: d?'rgba(255,255,255,0.14)':'rgba(5,20,80,0.14)', marginBottom:20 }} />
          <div style={{ display:'flex', gap:32 }}>
            {[['4×','Faster delivery'],['100%','Task visibility'],['0','Missed actions']].map(([n,l]) => (
              <div key={l}>
                <div style={{ fontFamily:'Syne', fontWeight:800, fontSize:20, letterSpacing:'-0.03em', color: d?'rgba(255,255,255,0.90)':'rgba(5,20,80,0.88)', lineHeight:1, marginBottom:5 }}>{n}</div>
                <div style={{ fontSize:10, fontWeight:500, letterSpacing:'0.08em', textTransform:'uppercase', color: d?'rgba(255,255,255,0.26)':'rgba(5,20,80,0.32)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function RightPanel({ d, children }) {
  return (
    <div style={{
      flex:'0 0 48%', display:'flex', alignItems:'center', justifyContent:'center',
      padding:'48px 56px', overflowY:'auto',
      background: d ? '#111113' : '#FFFFFF',
      borderLeft: d ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
    }}>
      <div style={{ width:'100%', maxWidth:340 }}>{children}</div>
    </div>
  )
}

function Shell({ d, children }) {
  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'DM Sans',system-ui,sans-serif" }}>
      <LeftPanel d={d} />
      <RightPanel d={d}>{children}</RightPanel>
    </div>
  )
}

function Head({ title, sub, d }) {
  return (
    <div style={{ marginBottom:26 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
        <div style={{ width:22, height:22, borderRadius:7, background: d?'#4F8EF7':'#2563EB', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#fff' }}>✦</div>
        <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:12, letterSpacing:'0.14em', color: d?'#5A5A68':'#BBBBC8' }}>PULSE</span>
      </div>
      <h1 style={{ fontSize:22, fontWeight:700, letterSpacing:'-0.025em', color: d?'#F0F0F2':'#111113', margin:'14px 0 5px', lineHeight:1.2 }}>{title}</h1>
      <p style={{ fontSize:13, color: d?'#5A5A68':'#888898', fontWeight:400, lineHeight:1.55 }}>{sub}</p>
    </div>
  )
}

// ── Auth screens ───────────────────────────────────────────────────────────────
export default function LoginPage({ onGoSignup, onGoReset }) {
  const d = useD()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function login() {
    if (!email || !password) { setError('Enter your email and password.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.signInWithPassword({ email, password })
    if (e) { setError(e.message); setLoading(false) }
  }
  async function google() {
    setError(null)
    const { error: e } = await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.origin } })
    if (e) setError(e.message)
  }

  return (
    <Shell d={d}>
      <Head d={d} title="Welcome back" sub="Sign in to your Pulse workspace" />
      {configError && <div style={{ background: d?'rgba(245,158,11,0.10)':'#FFFBEB', border:`1px solid ${d?'rgba(245,158,11,0.22)':'#FDE68A'}`, borderRadius:7, padding:'9px 12px', marginBottom:14, fontSize:12, color:d?'#FCD34D':'#92400E', lineHeight:1.5 }}>{configError}</div>}
      <ErrBox msg={error} d={d} />

      <GhostBtn d={d} onClick={google}><GoogleIcon /> Continue with Google</GhostBtn>
      <OrDivider d={d} />

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div>
          <Label d={d}>Work email</Label>
          <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@homzmart.com" autoFocus d={d} onKeyDown={e=>e.key==='Enter'&&login()} />
        </div>
        <div>
          <Label d={d} right={<Lnk d={d} onClick={onGoReset}>Forgot password?</Lnk>}>Password</Label>
          <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" d={d} onKeyDown={e=>e.key==='Enter'&&login()} />
        </div>
      </div>

      <div style={{ marginTop:18 }}>
        <PrimaryBtn d={d} loading={loading} onClick={login} disabled={loading||!!configError}>Sign in</PrimaryBtn>
      </div>
      <Note d={d}>No account? <Lnk d={d} onClick={onGoSignup}>Create one</Lnk></Note>
    </Shell>
  )
}

export function SignupPage({ onGoLogin }) {
  const d = useD()
  const [name,setName]=useState(''); const [email,setEmail]=useState('')
  const [pw,setPw]=useState(''); const [pw2,setPw2]=useState('')
  const [loading,setLoading]=useState(false); const [err,setErr]=useState(null); const [done,setDone]=useState(false)

  async function go() {
    if(!name.trim()){setErr('Enter your name.');return}
    if(!email){setErr('Enter your email.');return}
    if(pw.length<6){setErr('Password must be at least 6 characters.');return}
    if(pw!==pw2){setErr('Passwords do not match.');return}
    setErr(null);setLoading(true)
    const{error:e}=await supabase.auth.signUp({email,password:pw,options:{data:{full_name:name.trim()}}})
    if(e){setErr(e.message);setLoading(false)}else{setDone(true);setLoading(false)}
  }

  if(done) return <Shell d={d}><div style={{textAlign:'center'}}><div style={{fontSize:44,marginBottom:16}}>✉</div><h2 style={{fontSize:20,fontWeight:700,color:d?'#F0F0F2':'#111113',marginBottom:8,letterSpacing:'-0.02em'}}>Check your inbox</h2><p style={{color:d?'#5A5A68':'#888898',fontSize:13,marginBottom:24,lineHeight:1.6}}>We sent a confirmation link to <strong>{email}</strong>. Open it to activate your account.</p><PrimaryBtn d={d} onClick={onGoLogin}>Back to sign in</PrimaryBtn></div></Shell>

  return (
    <Shell d={d}>
      <Head d={d} title="Create account" sub="Start managing programs with your team" />
      <ErrBox msg={err} d={d} />
      <div style={{display:'flex',flexDirection:'column',gap:11,marginBottom:16}}>
        {[['Full name','text','Your name',name,setName],['Work email','email','you@homzmart.com',email,setEmail],['Password','password','At least 6 characters',pw,setPw],['Confirm password','password','Same as above',pw2,setPw2]].map(([lbl,type,ph,val,set],i,arr)=>(
          <div key={lbl}><Label d={d}>{lbl}</Label><Input type={type} value={val} onChange={e=>set(e.target.value)} placeholder={ph} autoFocus={i===0} d={d} onKeyDown={e=>e.key==='Enter'&&i===arr.length-1&&go()} /></div>
        ))}
      </div>
      <PrimaryBtn d={d} loading={loading} onClick={go} disabled={loading}>Create account</PrimaryBtn>
      <Note d={d}>Have an account? <Lnk d={d} onClick={onGoLogin}>Sign in</Lnk></Note>
    </Shell>
  )
}

export function ResetPage({ onGoLogin }) {
  const d = useD()
  const [email,setEmail]=useState(''); const [loading,setLoading]=useState(false)
  const [err,setErr]=useState(null); const [ok,setOk]=useState(null)

  async function go() {
    if(!email){setErr('Enter your email.');return}
    setErr(null);setLoading(true)
    const{error:e}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:`${window.location.origin}/reset-password`})
    if(e){setErr(e.message);setLoading(false)}else{setOk(`Reset link sent to ${email}.`);setLoading(false)}
  }

  return (
    <Shell d={d}>
      <Head d={d} title="Reset password" sub="We'll send a secure link to your email." />
      <ErrBox msg={err} d={d} /><OkBox msg={ok} d={d} />
      {!ok && <>
        <Label d={d}>Work email</Label>
        <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@homzmart.com" autoFocus d={d} onKeyDown={e=>e.key==='Enter'&&go()} />
        <div style={{marginTop:16}}><PrimaryBtn d={d} loading={loading} onClick={go} disabled={loading}>Send reset link</PrimaryBtn></div>
      </>}
      <Note d={d}><Lnk d={d} onClick={onGoLogin}>← Back to sign in</Lnk></Note>
    </Shell>
  )
}

export function NewPasswordPage({ onGoLogin }) {
  const d = useD()
  const [pw,setPw]=useState(''); const [pw2,setPw2]=useState('')
  const [loading,setLoading]=useState(false); const [err,setErr]=useState(null); const [done,setDone]=useState(false)

  async function go() {
    if(pw.length<6){setErr('Password must be at least 6 characters.');return}
    if(pw!==pw2){setErr('Passwords do not match.');return}
    setErr(null);setLoading(true)
    const{error:e}=await supabase.auth.updateUser({password:pw})
    if(e){setErr(e.message);setLoading(false)}else{setDone(true);setLoading(false)}
  }

  if(done) return <Shell d={d}><div style={{textAlign:'center'}}><div style={{fontSize:44,marginBottom:16}}>✓</div><h2 style={{fontSize:20,fontWeight:700,color:d?'#F0F0F2':'#111113',marginBottom:8}}>Password updated</h2><p style={{color:d?'#5A5A68':'#888898',fontSize:13,marginBottom:24}}>Your new password is set. Sign in to continue.</p><PrimaryBtn d={d} onClick={onGoLogin}>Sign in</PrimaryBtn></div></Shell>

  return (
    <Shell d={d}>
      <Head d={d} title="Choose new password" sub="Make it strong and unique." />
      <ErrBox msg={err} d={d} />
      <div style={{display:'flex',flexDirection:'column',gap:11,marginBottom:16}}>
        <div><Label d={d}>New password</Label><Input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="At least 6 characters" autoFocus d={d} /></div>
        <div><Label d={d}>Confirm password</Label><Input type="password" value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="Same as above" d={d} onKeyDown={e=>e.key==='Enter'&&go()} /></div>
      </div>
      <PrimaryBtn d={d} loading={loading} onClick={go} disabled={loading}>Update password</PrimaryBtn>
    </Shell>
  )
}
