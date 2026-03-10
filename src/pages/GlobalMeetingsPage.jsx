import { useState, useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { COLORS } from '../lib/constants'
import { Btn, Badge, Icon } from '../components/UI'
import MeetingModal from '../components/MeetingModal'
import MeetingCard from '../components/MeetingCard'
import { getMeetings, deleteMeeting } from '../lib/db/meetings'
import { STATUS, PRIORITY } from '../lib/constants'

// ─── Global Meetings Page ─────────────────────────────────────────────────────
export default function GlobalMeetingsPage({ toast }) {
  const { projects, members: ctxMembers, workspace, addTask, sendMeetingInvites, isAdmin, isPM, isBasicUser, myProjects } = useData()
  const { user } = useAuth()
  const activeProjects = isAdmin
    ? projects.filter(p => !p.is_pipeline)
    : isPM
      ? myProjects
      : projects.filter(p => !p.is_pipeline)

  const [allMeetings,  setAllMeetings]  = useState([])
  const [loading,      setLoading]      = useState(true)
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editing,      setEditing]      = useState(null)
  const [filterProj,   setFilterProj]   = useState('all')
  const [searchQ,      setSearchQ]      = useState('')

  // Load meetings from all projects
  useEffect(() => {
    if (!activeProjects.length) { setLoading(false); return }
    Promise.all(activeProjects.map(p => getMeetings(p.id).then(ms => ms.map(m => ({ ...m, _project: p }))).catch(() => [])))
      .then(results => {
        const flat = results.flat().sort((a, b) => {
          const da = a.meeting_date || a.created_at
          const db = b.meeting_date || b.created_at
          return db.localeCompare(da)
        })
        setAllMeetings(flat)
        setLoading(false)
      })
  }, [projects.length])

  function handleSaved(meeting, isNew, projectObj) {
    const enriched = { ...meeting, _project: projectObj }
    if (isNew) setAllMeetings(prev => [enriched, ...prev].sort((a, b) => (b.meeting_date||b.created_at).localeCompare(a.meeting_date||a.created_at)))
    else       setAllMeetings(prev => prev.map(m => m.id === meeting.id ? enriched : m))
    setModalOpen(false)
    setEditing(null)
  }

  async function handleDelete(id) {
    try {
      await deleteMeeting(id)
      setAllMeetings(prev => prev.filter(m => m.id !== id))
      toast?.('Meeting deleted')
    } catch(e) { toast?.(e.message, 'error') }
  }

  const filtered = allMeetings.filter(m => {
    // Role-based filter: basic users only see meetings they attended; PMs see all within their projects
    if (isBasicUser && user?.email) {
      const attendeeList = (m.attendees || '').split(',').map(e => e.trim().toLowerCase())
      if (!attendeeList.includes(user.email.toLowerCase()) && m.created_by !== user?.id) return false
    }
    if (filterProj !== 'all' && m.project_id !== filterProj) return false
    if (searchQ && !m.title.toLowerCase().includes(searchQ.toLowerCase())) return false
    return true
  })

  const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  // Group by month
  const groups = {}
  filtered.forEach(m => {
    const key = m.meeting_date
      ? new Date(m.meeting_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : 'Undated'
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  })

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '0 22px', height: 54, borderBottom: `1px solid ${COLORS.border}`, display: 'flex', alignItems: 'center', gap: 12, background: COLORS.surface, flexShrink: 0 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: COLORS.purple + '22', border: `1px solid ${COLORS.purple}33`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="messageCircle" size={16} color={COLORS.purple} />
        </div>
        <h1 style={{ fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>All Meetings</h1>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Across all projects</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '5px 10px', width: 180 }}>
          <span style={{ color: COLORS.textMuted, fontSize: 12 }}>⌕</span>
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search meetings…" style={{ background: 'none', border: 'none', color: COLORS.text, fontSize: 13, width: '100%', outline: 'none' }} />
        </div>
        <Btn size="sm" onClick={() => { setEditing(null); setModalOpen(true) }}>+ New Meeting</Btn>
      </div>

      {/* Filter bar */}
      <div style={{ padding: '8px 22px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, alignItems: 'center', background: COLORS.surface, flexShrink: 0, overflowX: 'auto' }}>
        <span style={{ fontSize: 12, color: COLORS.textMuted, flexShrink: 0 }}>Project:</span>
        {[{ id: 'all', name: 'All Projects', color: COLORS.textMuted }, ...activeProjects].map(p => (
          <button key={p.id} onClick={() => setFilterProj(p.id)}
            style={{ padding: '4px 12px', borderRadius: 20, border: `1.5px solid ${filterProj === p.id ? (p.color || COLORS.accent) : COLORS.border}`, background: filterProj === p.id ? (p.color || COLORS.accent) + '18' : 'none', color: filterProj === p.id ? (p.color || COLORS.accent) : COLORS.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, transition: 'background 0.15s, border-color 0.15s, opacity 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
            {p.id !== 'all' && <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />}
            {p.name}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 12, color: COLORS.textMuted, flexShrink: 0 }}>{filtered.length} meeting{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 22 }}>
        {loading ? (
          <div style={{ color: COLORS.textMuted, fontSize: 13 }}>Loading meetings…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: COLORS.purple + '18', border: `1px solid ${COLORS.purple}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Icon name="messageCircle" size={28} color={COLORS.purple} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No meetings yet</div>
            <div style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 24, maxWidth: 380, margin: '0 auto 24px' }}>
              Meetings created inside projects show up here. You can also create cross-project meetings directly from this hub.
            </div>
            <Btn onClick={() => { setEditing(null); setModalOpen(true) }}>+ New Meeting</Btn>
          </div>
        ) : (
          <div style={{ maxWidth: 900 }}>
            {Object.entries(groups).map(([month, mts]) => (
              <div key={month} style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.textMuted, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                  {month}
                  <div style={{ flex: 1, height: 1, background: COLORS.border }} />
                  <span style={{ fontSize: 10, color: COLORS.textMuted }}>{mts.length} meeting{mts.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {mts.map(m => (
                    <MeetingCard
                      key={m.id}
                      meeting={m}
                      fmt={fmt}
                      onEdit={() => { setEditing(m); setModalOpen(true) }}
                      onDelete={() => handleDelete(m.id)}
                      showProject
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <MeetingModal
          project={null}
          projects={activeProjects}
          workspace={workspace}
          user={user}
          members={ctxMembers || []}
          meeting={editing}
          onSaved={handleSaved}
          addTask={addTask}
          sendMeetingInvites={sendMeetingInvites}
          onClose={() => { setModalOpen(false); setEditing(null) }}
          toast={toast}
        />
      )}
    </div>
  )
}
