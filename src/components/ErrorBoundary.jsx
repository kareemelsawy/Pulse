import { Component } from 'react'
import { COLORS } from '../lib/constants'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Pulse error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div style={{
        height: '100vh', background: COLORS.bg, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'DM Sans','Segoe UI',sans-serif", padding: 20,
      }}>
        <div style={{
          background: COLORS.surface, border: `1px solid ${COLORS.border}`,
          borderRadius: 16, padding: '40px 36px', maxWidth: 460, width: '100%',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠</div>
          <h2 style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: COLORS.text, marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ color: COLORS.textMuted, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            An unexpected error occurred. Your data is safe — just reload the page.
          </p>
          <div style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 14px', marginBottom: 24, textAlign: 'left' }}>
            <code style={{ fontSize: 11, color: COLORS.red, wordBreak: 'break-all' }}>
              {this.state.error?.message || 'Unknown error'}
            </code>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: COLORS.accent, color: '#fff', border: 'none',
              borderRadius: 10, padding: '11px 28px', fontWeight: 700,
              fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Reload Page
          </button>
        </div>
      </div>
    )
  }
}
