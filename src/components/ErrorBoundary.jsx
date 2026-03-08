import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('Pulse error:', error, info) }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans', system-ui, sans-serif",
        padding: 24,
      }}>
        {/* Glass card */}
        <div style={{
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(40px) saturate(200%)',
          WebkitBackdropFilter: 'blur(40px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 24,
          padding: '48px 44px',
          maxWidth: 480, width: '100%',
          boxShadow: '0 32px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)',
          textAlign: 'center',
          animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}>

          {/* Icon */}
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 24px',
            background: 'linear-gradient(135deg, rgba(248,113,113,0.25), rgba(239,68,68,0.15))',
            border: '1px solid rgba(248,113,113,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(239,68,68,0.20)',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(248,113,113,0.9)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>

          {/* Wordmark */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 20,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg,#6B8EF7,#C084FC)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#fff', fontWeight: 900,
              boxShadow: '0 4px 12px rgba(107,142,247,0.40)',
            }}>✦</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: 'rgba(240,244,255,0.9)' }}>Pulse</span>
          </div>

          <h2 style={{
            fontFamily: 'Syne', fontWeight: 800, fontSize: 22,
            color: 'rgba(240,244,255,0.95)',
            marginBottom: 10, letterSpacing: '-0.02em',
          }}>Something went wrong</h2>

          <p style={{
            color: 'rgba(200,210,240,0.55)', fontSize: 14, lineHeight: 1.65,
            marginBottom: 28,
          }}>
            An unexpected error occurred. Your data is safe — just reload the page.
          </p>

          {/* Error code box */}
          <div style={{
            background: 'rgba(248,113,113,0.07)',
            border: '1px solid rgba(248,113,113,0.22)',
            borderRadius: 12, padding: '11px 16px',
            marginBottom: 28, textAlign: 'left',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(248,113,113,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 5 }}>Error</div>
            <code style={{ fontSize: 12, color: 'rgba(248,113,113,0.85)', wordBreak: 'break-all', fontFamily: "'DM Mono', monospace", lineHeight: 1.5 }}>
              {this.state.error?.message || 'Unknown error'}
            </code>
          </div>

          {/* Reload button */}
          <button
            onClick={() => window.location.reload()}
            style={{
              background: 'linear-gradient(135deg, #6B8EF7, #C084FC)',
              color: '#fff', border: '1px solid rgba(255,255,255,0.20)',
              borderRadius: 12, padding: '12px 32px',
              fontWeight: 700, fontSize: 14,
              cursor: 'pointer', fontFamily: "'DM Sans', inherit",
              boxShadow: '0 4px 20px rgba(107,142,247,0.45), inset 0 1px 0 rgba(255,255,255,0.20)',
              transition: 'all 0.18s', letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => { e.currentTarget.style.filter='brightness(1.12)'; e.currentTarget.style.transform='translateY(-1px)' }}
            onMouseLeave={e => { e.currentTarget.style.filter=''; e.currentTarget.style.transform='' }}
          >
            Reload Page
          </button>

          <p style={{ marginTop: 18, fontSize: 11, color: 'rgba(200,210,240,0.30)', lineHeight: 1.5 }}>
            If this keeps happening, check the browser console for details.
          </p>
        </div>
      </div>
    )
  }
}
