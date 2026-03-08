import { useState, useEffect } from 'react'
import { supabase, configError } from '../lib/supabase'
import { Spinner } from '../components/UI'

// ─── Micro atoms ──────────────────────────────────────────────────────────────
function GInput({ type='text', value, onChange, placeholder, autoFocus, onKeyDown, icon }) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      {icon && <div style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', opacity:focused?0.7:0.30, transition:'opacity 0.2s', color:'#A0A0C0' }}>{icon}</div>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} autoFocus={autoFocus} onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width:'100%', display:'block', boxSizing:'border-box',
          background: focused ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: focused ? '1px solid rgba(79,142,247,0.55)' : '1px solid rgba(255,255,255,0.09)',
          borderRadius:10, padding: icon ? '12px 14px 12px 40px' : '12px 14px',
          color:'#F0F0F2', fontSize:14, fontFamily:"'DM Sans',sans-serif", lineHeight:1.5,
          boxShadow: focused ? '0 0 0 3px rgba(79,142,247,0.12)' : 'none',
          transition:'background 0.2s,border-color 0.2s,box-shadow 0.2s', outline:'none',
        }} />
    </div>
  )
}
function Label({ children, right }) {
  return (
    <div style={{ display:'flex', justifyContent:right?'space-between':'flex-start', alignItems:'baseline', marginBottom:7 }}>
      <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'rgba(160,160,190,0.60)' }}>{children}</span>
      {right}
    </div>
  )
}
function PrimaryBtn({ loading, onClick, disabled, children }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:'100%', padding:'13px 20px', borderRadius:10,
      background:'linear-gradient(135deg,#4F8EF7,#6B5EF0)',
      color:'#fff', border:'none', fontWeight:700, fontSize:14,
      fontFamily:"'DM Sans',sans-serif", letterSpacing:'-0.01em',
      opacity:disabled?0.45:1, cursor:disabled?'not-allowed':'pointer',
      display:'flex', alignItems:'center', justifyContent:'center', gap:8,
      transition:'filter 0.15s,box-shadow 0.2s,opacity 0.15s',
      boxShadow:'0 4px 20px rgba(79,142,247,0.35), 0 1px 4px rgba(0,0,0,0.3)',
    }}
    onMouseEnter={e=>{ if(!disabled){ e.currentTarget.style.filter='brightness(1.12)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(79,142,247,0.50),0 2px 8px rgba(0,0,0,0.35)' }}}
    onMouseLeave={e=>{ e.currentTarget.style.filter=''; e.currentTarget.style.boxShadow='0 4px 20px rgba(79,142,247,0.35),0 1px 4px rgba(0,0,0,0.3)' }}>
      {loading ? <Spinner size={16} /> : children}
    </button>
  )
}
function GhostBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      width:'100%', padding:'12px 18px', borderRadius:10,
      background:'rgba(255,255,255,0.05)', color:'#C8C8E0',
      border:'1px solid rgba(255,255,255,0.09)', fontWeight:500, fontSize:14,
      fontFamily:"'DM Sans',sans-serif", cursor:'pointer',
      display:'flex', alignItems:'center', justifyContent:'center', gap:10,
      transition:'background 0.15s,border-color 0.15s',
    }}
    onMouseEnter={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.09)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.16)' }}
    onMouseLeave={e=>{ e.currentTarget.style.background='rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.09)' }}>
      {children}
    </button>
  )
}
function ErrMsg({ msg }) {
  if (!msg) return null
  return <div style={{ background:'rgba(239,68,68,0.10)', border:'1px solid rgba(239,68,68,0.22)', borderRadius:9, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#FCA5A5', lineHeight:1.5, display:'flex', gap:8 }}><span>⚠</span><span>{msg}</span></div>
}
function OkMsg({ msg }) {
  if (!msg) return null
  return <div style={{ background:'rgba(34,197,94,0.10)', border:'1px solid rgba(34,197,94,0.22)', borderRadius:9, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#86EFAC', lineHeight:1.5 }}>✓ {msg}</div>
}
function OrLine() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, margin:'18px 0' }}>
      <div style={{ flex:1, height:1, background:'linear-gradient(90deg,transparent,rgba(255,255,255,0.07))' }} />
      <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.12em', color:'rgba(255,255,255,0.18)' }}>OR</span>
      <div style={{ flex:1, height:1, background:'linear-gradient(270deg,transparent,rgba(255,255,255,0.07))' }} />
    </div>
  )
}
function Lnk({ onClick, children }) {
  return <span onClick={onClick} style={{ color:'#4F8EF7', cursor:'pointer', fontWeight:600, transition:'color 0.15s' }}
    onMouseEnter={e=>e.currentTarget.style.color='#7EB3FF'} onMouseLeave={e=>e.currentTarget.style.color='#4F8EF7'}>{children}</span>
}
function Note({ children }) {
  return <p style={{ fontSize:13, color:'rgba(160,160,190,0.45)', textAlign:'center', marginTop:24, lineHeight:1.6 }}>{children}</p>
}
function GoogleIcon() {
  return <svg width="17" height="17" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
}
function MailIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg> }
function LockIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> }

// ── Branding panel ────────────────────────────────────────────────────────────
function LeftPanel() {
  const [qIdx, setQIdx] = useState(0)
  useEffect(() => { const t = setInterval(() => setQIdx(p => p+1), 4500); return () => clearInterval(t) }, [])

  const quotes = [
    { text: 'Finally a tool that connects intent to execution.', role: 'VP Operations' },
    { text: 'No more status meetings — everyone has one source of truth.', role: 'Program Director' },
    { text: 'We cut delivery cycles by 4× in the first quarter.', role: 'Head of Engineering' },
  ]
  const q = quotes[qIdx % quotes.length]

  return (
    <div style={{ flex:'0 0 52%', position:'relative', overflow:'hidden', display:'flex', flexDirection:'column' }}>
      {/* Layered dark blue background */}
      <div style={{ position:'absolute', inset:0, background:'#030509' }} />
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 85% 65% at 10% 85%, rgba(10,35,110,0.90) 0%, transparent 60%)' }} />
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 50% 40% at 80% 15%, rgba(55,15,130,0.35) 0%, transparent 55%)' }} />
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 40% 30% at 65% 70%, rgba(0,65,180,0.20) 0%, transparent 60%)' }} />
      {/* Top edge line */}
      <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1, background:'linear-gradient(90deg,transparent,rgba(79,142,247,0.55),rgba(107,94,240,0.30),transparent)' }} />
      {/* Grain */}
      <div style={{ position:'absolute', inset:0, pointerEvents:'none', opacity:0.040, mixBlendMode:'overlay',
        backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      {/* Bottom vignette */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'45%', background:'linear-gradient(to top, rgba(3,5,9,0.95),transparent)', pointerEvents:'none' }} />

      <div style={{ position:'relative', zIndex:1, flex:1, display:'flex', flexDirection:'column', padding:'clamp(28px,4vw,52px)' }}>
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:11 }}>
          <div style={{ width:30, height:30, borderRadius:9, background:'rgba(79,142,247,0.14)', border:'1px solid rgba(79,142,247,0.30)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, color:'#6BA8F5' }}>✦</div>
          <span style={{ fontFamily:'Syne', fontWeight:900, fontSize:14, letterSpacing:'0.22em', color:'rgba(235,238,255,0.88)' }}>PULSE</span>
          <span style={{ fontSize:10, color:'rgba(255,255,255,0.20)', letterSpacing:'0.04em', paddingLeft:8, borderLeft:'1px solid rgba(255,255,255,0.10)', marginLeft:4 }}>Homzmart</span>
        </div>

        {/* Hero — centered */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', paddingBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
            <div style={{ width:26, height:1, background:'rgba(79,142,247,0.45)' }} />
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.20em', textTransform:'uppercase', color:'rgba(79,142,247,0.65)' }}>Program Management</span>
          </div>

          <h2 style={{ fontFamily:'Syne', fontWeight:900, fontSize:'clamp(40px,4.6vw,68px)', lineHeight:0.96, letterSpacing:'-0.045em', margin:'0 0 22px' }}>
            <span style={{ color:'rgba(235,238,255,0.97)' }}>Every team.</span><br />
            <span style={{ background:'linear-gradient(135deg,#7EB3FF 0%,#A78BFA 60%,#C084FC 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>One truth.</span>
          </h2>

          <p style={{ fontSize:13, fontWeight:300, lineHeight:1.80, color:'rgba(200,208,235,0.36)', maxWidth:310, margin:'0 0 40px', letterSpacing:'0.01em' }}>
            The single operating layer where programs, tasks, meetings, and decisions converge.
          </p>

          {/* Stat cards row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:40 }}>
            {[['4×','Faster delivery','⚡'],['100%','Task visibility','👁'],['0','Missed actions','✓']].map(([v,l,ic]) => (
              <div key={l} style={{ background:'rgba(255,255,255,0.035)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'16px 14px', backdropFilter:'blur(6px)' }}>
                <div style={{ fontSize:11, marginBottom:8, opacity:0.40 }}>{ic}</div>
                <div style={{ fontFamily:'Syne', fontWeight:900, fontSize:26, letterSpacing:'-0.03em', color:'rgba(235,238,255,0.95)', lineHeight:1, marginBottom:6 }}>{v}</div>
                <div style={{ fontSize:9, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', color:'rgba(200,208,235,0.26)', lineHeight:1.4 }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Rotating testimonial */}
          <div key={qIdx} style={{ padding:'16px 20px', background:'rgba(255,255,255,0.030)', border:'1px solid rgba(255,255,255,0.06)', borderLeft:'2px solid rgba(79,142,247,0.45)', borderRadius:'0 10px 10px 0', animation:'fadeIn 0.5s ease' }}>
            <p style={{ fontSize:13, color:'rgba(200,208,235,0.45)', lineHeight:1.65, margin:'0 0 10px', fontWeight:300, fontStyle:'italic' }}>"{q.text}"</p>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:16, height:1, background:'rgba(79,142,247,0.40)' }} />
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'rgba(79,142,247,0.55)' }}>{q.role}</span>
              <span style={{ fontSize:10, color:'rgba(255,255,255,0.16)' }}>· Homzmart</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div>
          <div style={{ width:24, height:1, background:'rgba(255,255,255,0.07)', marginBottom:12 }} />
          <p style={{ fontSize:10, color:'rgba(255,255,255,0.16)', letterSpacing:'0.05em' }}>Internal platform · Authorised access only · © {new Date().getFullYear()} Homzmart</p>
        </div>
      </div>
    </div>
  )
}

function RightPanel({ children }) {
  return (
    <div style={{ flex:'0 0 48%', display:'flex', alignItems:'center', justifyContent:'center', padding:'clamp(24px,5vw,56px)', overflowY:'auto', background:'linear-gradient(180deg,#06070C 0%,#050609 50%,#040508 100%)', borderLeft:'1px solid rgba(255,255,255,0.055)', position:'relative' }}>
      <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:'linear-gradient(90deg,transparent,rgba(79,142,247,0.20),transparent)', pointerEvents:'none' }} />
      <div style={{ width:'100%', maxWidth:360 }}>{children}</div>
    </div>
  )
}
function Shell({ children }) {
  return <div style={{ minHeight:'100vh', display:'flex', fontFamily:"'DM Sans',system-ui,sans-serif", background:'#030509' }}><LeftPanel /><RightPanel>{children}</RightPanel></div>
}
function FormHead({ title, sub }) {
  return (
    <div style={{ marginBottom:28 }}>
      <div style={{ display:'inline-flex', alignItems:'center', gap:7, marginBottom:20, padding:'4px 11px 4px 9px', background:'rgba(79,142,247,0.10)', border:'1px solid rgba(79,142,247,0.18)', borderRadius:20 }}>
        <span style={{ color:'#4F8EF7', fontSize:12 }}>✦</span>
        <span style={{ fontFamily:'Syne', fontWeight:700, fontSize:10, letterSpacing:'0.18em', color:'rgba(79,142,247,0.80)' }}>PULSE</span>
      </div>
      <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.03em', color:'rgba(235,238,255,0.97)', margin:'0 0 7px', lineHeight:1.15, fontFamily:'Syne' }}>{title}</h1>
      <p style={{ fontSize:13, color:'rgba(160,165,195,0.50)', fontWeight:400, lineHeight:1.55, margin:0 }}>{sub}</p>
    </div>
  )
}

export default function LoginPage({ onGoSignup, onGoReset }) {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  async function login() {
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setError(null); setLoading(true)
    const { error: e } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (e) { setError(e.message); setLoading(false) }
  }
  async function google() {
    setError(null)
    const { error: e } = await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.origin } })
    if (e) setError(e.message)
  }

  return (
    <Shell>
      <FormHead title="Welcome back" sub="Sign in to your Pulse workspace" />
      {configError && <div style={{ background:'rgba(245,158,11,0.10)', border:'1px solid rgba(245,158,11,0.22)', borderRadius:9, padding:'10px 14px', marginBottom:16, fontSize:12, color:'#FCD34D', lineHeight:1.5 }}>{configError}</div>}
      <ErrMsg msg={error} />
      <GhostBtn onClick={google}><GoogleIcon /> Continue with Google</GhostBtn>
      <OrLine />
      <div style={{ display:'flex', flexDirection:'column', gap:14, marginBottom:6 }}>
        <div>
          <Label>Work email</Label>
          <GInput type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@homzmart.com" autoFocus icon={<MailIcon />} onKeyDown={e=>e.key==='Enter'&&login()} />
        </div>
        <div>
          <Label right={<span onClick={onGoReset} style={{ color:'rgba(79,142,247,0.65)', cursor:'pointer', fontSize:11, fontWeight:600, letterSpacing:'0.03em' }}>Forgot?</span>}>Password</Label>
          <GInput type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" icon={<LockIcon />} onKeyDown={e=>e.key==='Enter'&&login()} />
        </div>
      </div>
      <div style={{ marginTop:18 }}><PrimaryBtn loading={loading} onClick={login} disabled={loading||!!configError}>Sign in →</PrimaryBtn></div>
      <Note>No account? <Lnk onClick={onGoSignup}>Create one</Lnk></Note>
    </Shell>
  )
}

export function SignupPage({ onGoLogin }) {
  const [name,setName]=useState(''); const [email,setEmail]=useState('')
  const [pw,setPw]=useState(''); const [pw2,setPw2]=useState('')
  const [loading,setLoading]=useState(false); const [err,setErr]=useState(null); const [done,setDone]=useState(false)
  async function go() {
    if(!name.trim()){setErr('Enter your full name.');return}; if(!email){setErr('Enter your work email.');return}
    if(pw.length<6){setErr('Password must be 6+ characters.');return}; if(pw!==pw2){setErr('Passwords do not match.');return}
    setErr(null);setLoading(true)
    const{error:e}=await supabase.auth.signUp({email:email.trim(),password:pw,options:{data:{full_name:name.trim()}}})
    if(e){setErr(e.message);setLoading(false)}else{setDone(true);setLoading(false)}
  }
  if(done) return <Shell><div style={{textAlign:'center',padding:'40px 0'}}><div style={{width:60,height:60,borderRadius:18,background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.22)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:26}}>✉</div><h2 style={{fontSize:22,fontWeight:800,color:'rgba(235,238,255,0.97)',marginBottom:10,fontFamily:'Syne'}}>Check your inbox</h2><p style={{color:'rgba(160,165,195,0.50)',fontSize:13,marginBottom:28,lineHeight:1.7}}>Confirmation sent to<br/><strong style={{color:'rgba(235,238,255,0.70)'}}>{email}</strong></p><PrimaryBtn onClick={onGoLogin}>Back to sign in</PrimaryBtn></div></Shell>
  return (
    <Shell>
      <FormHead title="Create account" sub="Join your team on Pulse" />
      <ErrMsg msg={err} />
      <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:18}}>
        <div><Label>Full name</Label><GInput value={name} onChange={e=>setName(e.target.value)} placeholder="Your name" autoFocus /></div>
        <div><Label>Work email</Label><GInput type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@homzmart.com" /></div>
        <div><Label>Password</Label><GInput type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="At least 6 characters" /></div>
        <div><Label>Confirm</Label><GInput type="password" value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="Same as above" onKeyDown={e=>e.key==='Enter'&&go()} /></div>
      </div>
      <PrimaryBtn loading={loading} onClick={go} disabled={loading}>Create account →</PrimaryBtn>
      <Note>Have an account? <Lnk onClick={onGoLogin}>Sign in</Lnk></Note>
    </Shell>
  )
}
export function ResetPage({ onGoLogin }) {
  const [email,setEmail]=useState(''); const [loading,setLoading]=useState(false)
  const [err,setErr]=useState(null); const [ok,setOk]=useState(null)
  async function go() {
    if(!email.trim()){setErr('Enter your email.');return}; setErr(null);setLoading(true)
    const{error:e}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/reset-password`})
    if(e){setErr(e.message);setLoading(false)}else{setOk(`Reset link sent to ${email}.`);setLoading(false)}
  }
  return (
    <Shell>
      <FormHead title="Reset password" sub="We'll email you a secure reset link." />
      <ErrMsg msg={err} /><OkMsg msg={ok} />
      {!ok && <><div style={{marginBottom:18}}><Label>Work email</Label><GInput type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@homzmart.com" autoFocus onKeyDown={e=>e.key==='Enter'&&go()} /></div><PrimaryBtn loading={loading} onClick={go} disabled={loading}>Send reset link →</PrimaryBtn></>}
      <Note><Lnk onClick={onGoLogin}>← Back to sign in</Lnk></Note>
    </Shell>
  )
}
export function NewPasswordPage({ onGoLogin }) {
  const [pw,setPw]=useState(''); const [pw2,setPw2]=useState('')
  const [loading,setLoading]=useState(false); const [err,setErr]=useState(null); const [done,setDone]=useState(false)
  async function go() {
    if(pw.length<6){setErr('Password must be 6+ characters.');return}; if(pw!==pw2){setErr('Passwords do not match.');return}
    setErr(null);setLoading(true)
    const{error:e}=await supabase.auth.updateUser({password:pw})
    if(e){setErr(e.message);setLoading(false)}else{setDone(true);setLoading(false)}
  }
  if(done) return <Shell><div style={{textAlign:'center',padding:'40px 0'}}><div style={{width:60,height:60,borderRadius:18,background:'rgba(34,197,94,0.12)',border:'1px solid rgba(34,197,94,0.22)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 20px',fontSize:26}}>✓</div><h2 style={{fontSize:22,fontWeight:800,color:'rgba(235,238,255,0.97)',marginBottom:10,fontFamily:'Syne'}}>Password updated</h2><p style={{color:'rgba(160,165,195,0.50)',fontSize:13,marginBottom:28}}>Sign in to continue.</p><PrimaryBtn onClick={onGoLogin}>Sign in →</PrimaryBtn></div></Shell>
  return (
    <Shell>
      <FormHead title="New password" sub="Choose something strong." />
      <ErrMsg msg={err} />
      <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:18}}>
        <div><Label>New password</Label><GInput type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="At least 6 characters" autoFocus /></div>
        <div><Label>Confirm</Label><GInput type="password" value={pw2} onChange={e=>setPw2(e.target.value)} placeholder="Same as above" onKeyDown={e=>e.key==='Enter'&&go()} /></div>
      </div>
      <PrimaryBtn loading={loading} onClick={go} disabled={loading}>Update password →</PrimaryBtn>
    </Shell>
  )
}
