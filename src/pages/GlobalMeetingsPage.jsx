import { useState, useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import { DARK_THEME } from '../lib/constants'
import { getMeetings, createMeeting, updateMeeting, deleteMeeting } from '../lib/db/meetings'
import MeetingCard from '../components/MeetingCard'
import { Icon, Btn, Modal } from '../components/UI'
import { format } from 'date-fns'

const C = DARK_THEME

export default function GlobalMeetingsPage({ toast }) {
  const { projects, workspace } = useData()
  const [allMeetings, setAllMeetings] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [filterProj,  setFilterProj]  = useState('all')
  const [showNew,     setShowNew]     = useState(false)

  useEffect(() => {
    if (!projects.length) { setLoading(false); return }
    Promise.all(projects.map(p => getMeetings(p.id).then(ms => ms.map(m => ({ ...m, projectName: p.name, projectColor: p.color })))))
      .then(results => {
        const flat = results.flat().sort((a, b) => (b.meeting_date || '').localeCompare(a.meeting_date || ''))
        setAllMeetings(flat)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [projects])

  const filtered = allMeetings.filter(m => {
    if (filterProj !== 'all' && m.project_id !== filterProj) return false
    if (search && !m.title?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Group by month
  const grouped = filtered.reduce((acc, m) => {
    const key = m.meeting_date ? m.meeting_date.substring(0, 7) : 'No date'
    if (!acc[key]) acc[key] = []
    acc[key].push(m)
    return acc
  }, {})

  function formatMonth(key) {
    if (key === 'No date') return 'No Date'
    try {
      return format(new Date(key + '-01'), 'MMMM yyyy')
    } catch { return key }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 24, color: '#fff', margin: 0 }}>Meetings</h1>
          <p style={{ color: C.textMuted, fontSize: 13, marginTop: 4 }}>{allMeetings.length} total meetings</p>
        </div>
        <Btn onClick={() => setShowNew(true)} icon={<Icon name="plus" size={14} />}>New Meeting</Btn>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Icon name="search" size={14} color={C.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search meetings…"
            style={{
              width: '100%', paddingLeft: 36, padding: '9px 12px 9px 36px',
              background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8,
              color: '#fff', fontSize: 13, outline: 'none',
            }}
          />
        </div>
        <select value={filterProj} onChange={e => setFilterProj(e.target.value)} style={{
          background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 8,
          padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none', cursor: 'pointer',
        }}>
          <option value="all">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: C.textMuted }}>Loading meetings…</div>
      ) : Object.keys(grouped).length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 14 }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>◎</div>
          <p style={{ color: C.textMuted, fontSize: 14 }}>No meetings found</p>
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => b.localeCompare(a))
          .map(([month, meetings]) => (
            <div key={month} style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: C.textMuted, textTransform: 'uppercase', marginBottom: 12 }}>
                {formatMonth(month)}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {meetings.map(m => (
                  <MeetingCard key={m.id} meeting={m} projectName={m.projectName} toast={toast}
                    onUpdated={updated => setAllMeetings(prev => prev.map(x => x.id === updated.id ? { ...updated, projectName: m.projectName } : x))}
                    onDeleted={id => setAllMeetings(prev => prev.filter(x => x.id !== id))}
                  />
                ))}
              </div>
            </div>
          ))
      )}

      {showNew && (
        <NewMeetingModal
          projects={projects}
          workspace={workspace}
          onClose={() => setShowNew(false)}
          onCreated={m => {
            const proj = projects.find(p => p.id === m.project_id)
            setAllMeetings(prev => [{ ...m, projectName: proj?.name, projectColor: proj?.color }, ...prev])
            setShowNew(false)
            toast?.('Meeting created', 'success')
          }}
          toast={toast}
        />
      )}
    </div>
  )
}

function NewMeetingModal({ projects, workspace, onClose, onCreated, toast }) {
  const [title,    setTitle]    = useState('')
  const [projId,   setProjId]   = useState(projects[0]?.id || '')
  const [date,     setDate]     = useState('')
  const [loading,  setLoading]  = useState(false)
  const { user } = { user: null } // will be populated from auth if needed

  async function handle() {
    if (!title.trim() || !projId) return
    setLoading(true)
    try {
      const m = await createMeeting({ projectId: projId, workspaceId: workspace.id, userId: null, title: title.trim(), meeting_date: date || null, attendees: [], summary: '', action_items: [] })
      onCreated(m)
    } catch (e) { toast?.('Failed to create meeting', 'error') }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
    borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none',
  }

  return (
    <Modal title="New Meeting" onClose={onClose} footer={<><Btn variant="secondary" onClick={onClose}>Cancel</Btn><Btn onClick={handle} loading={loading}>Create</Btn></>}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Weekly sync" autoFocus style={inputStyle} />
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Project</label>
          <select value={projId} onChange={e => setProjId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 0.8, textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Date</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, colorScheme: 'dark' }} />
        </div>
      </div>
    </Modal>
  )
}
