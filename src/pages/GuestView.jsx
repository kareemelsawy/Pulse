import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'
import { COLORS, STATUS, PRIORITY } from '../lib/constants'
import { Avatar, Badge, Icon, Spinner } from '../components/UI'

// ─── Guest View ────────────────────────────────────────────────────────────────
// Shown to @homzmart.com users who were invited via task/meeting assignment
// but are NOT full workspace members. They can only see their assigned items.
export default function GuestView({ toast }) {
  const { user, signOut } = useAuth()
  const { isDark } = useTheme()
  const [myTasks,    setMyTasks]    = useState([])
  const [myMeetings, setMyMeetings] = useState([])
  const [loading,    setLoading]    = useState(true)
  const [activeTab,  setActiveTab]  = useState('tasks')

  const email = user?.email || ''
  const name  = user?.user_metadata?.full_name || email.split('@')[0]

  useEffect(() => {
    async function load() {
      try {
        // Fetch tasks assigned to this email across all workspaces
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*, projects(name, color)')
          .eq('assignee_email', email)
          .order('created_at', { ascending: false })

        // Fetch meetings where this email is in attendees
        const { data: meetings } = await supabase
          .from('project_meetings')
          .select('*, projects(name, color)')
          .ilike('attendees', `%${email}%`)
          .order('meeting_date', { ascending: false })

        setMyTasks(tasks || [])
        setMyMeetings(meetings || [])
      } catch(e) {
        console.warn('Guest load error:', e)
      } finally {
        setLoading(false)
      }
    }
    if (email) load()
  }, [email])

  const overdue = myTasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date())
  const active  = myTasks.filter(t => t.status !== 'done' && (!t.due_date || new Date(t.due_date) >= new Date()))
  const done    = myTasks.filter(t => t.status === 'done')

  const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background: COLORS.surface, borderBottom: `1px solid ${COLORS.border}`, padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: 'linear-gradient(135deg,#4F8EF7,#A78BFA)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, color: '#fff', fontWeight: 900 }}>✦</div>
        <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 16, letterSpacing: '-0.02em', color: COLORS.accent }}>Pulse</span>
        <div style={{ height: 16, width: 1, background: COLORS.border }} />
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>Guest Access</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={name} size={28} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{name}</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted }}>{email}</div>
          </div>
        </div>
        <button onClick={signOut} style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 7, padding: '5px 10px', cursor: 'pointer', color: COLORS.red, fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>Sign out</button>
      </div>

      <div style={{ maxWidth: 820, margin: '0 auto', padding: '32px 24px' }}>
        {/* Welcome */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', marginBottom: 6 }}>
            Hey {name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: COLORS.textMuted, fontSize: 13 }}>
            You have guest access to Pulse. You can view tasks and meetings you've been assigned to.
          </p>
        </div>

        {/* Stats row */}
        {!loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 28 }}>
            {[
              { label: 'Active Tasks',  value: active.length,  color: COLORS.accent },
              { label: 'Overdue',       value: overdue.length, color: COLORS.red    },
              { label: 'Meetings',      value: myMeetings.length, color: COLORS.purple },
            ].map(s => (
              <div key={s.label} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '16px 18px', borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 28, fontWeight: 800, marginBottom: 4, lineHeight: 1.2 }}>{s.value}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textMuted, letterSpacing: '0.04em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Guest access banner */}
        <div style={{ background: COLORS.accent + '10', border: `1px solid ${COLORS.accent}30`, borderRadius: 10, padding: '10px 16px', marginBottom: 22, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icon name="info" size={15} color={COLORS.accent} />
          <span style={{ fontSize: 12, color: COLORS.textDim, lineHeight: 1.5 }}>
            You have <strong>view-only</strong> guest access. To join this workspace as a full member, ask a workspace owner to invite you.
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 4, marginBottom: 20, width: 'fit-content' }}>
          {[['tasks', 'My Tasks', myTasks.length], ['meetings', 'My Meetings', myMeetings.length]].map(([id, label, count]) => (
            <button key={id} onClick={() => setActiveTab(id)}
              style={{ padding: '7px 18px', borderRadius: 8, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', background: activeTab === id ? COLORS.surface : 'none', color: activeTab === id ? COLORS.text : COLORS.textMuted, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6, boxShadow: activeTab === id ? `0 1px 4px ${COLORS.shadow}` : 'none' }}>
              {label}
              {count > 0 && <span style={{ fontSize: 10, fontWeight: 800, background: activeTab === id ? COLORS.accent : COLORS.border, color: activeTab === id ? '#fff' : COLORS.textMuted, borderRadius: 10, padding: '1px 6px' }}>{count}</span>}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={28} /></div>
        ) : activeTab === 'tasks' ? (
          <TasksSection overdue={overdue} active={active} done={done} />
        ) : (
          <MeetingsSection meetings={myMeetings} fmt={fmt} />
        )}
      </div>
    </div>
  )
}

function TasksSection({ overdue, active, done }) {
  if (overdue.length === 0 && active.length === 0 && done.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted }}>
        <Icon name="check" size={36} color={COLORS.green} style={{ marginBottom: 12 }} />
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No tasks assigned to you yet</div>
        <div style={{ fontSize: 13 }}>When someone assigns you a task, it will appear here.</div>
      </div>
    )
  }

  return (
    <div>
      {[['🔴 Overdue', overdue, true], ['📋 Active', active, false], ['✅ Done', done, false]].map(([label, list, isOverdue]) =>
        list.length === 0 ? null : (
          <div key={label} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isOverdue ? COLORS.red : COLORS.textMuted, marginBottom: 10 }}>{label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {list.map(t => <GuestTaskRow key={t.id} task={t} isOverdue={isOverdue} />)}
            </div>
          </div>
        )
      )}
    </div>
  )
}

function GuestTaskRow({ task: t, isOverdue }) {
  const proj = t.projects
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${isOverdue ? COLORS.red + '44' : COLORS.border}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      {proj && <div style={{ width: 10, height: 10, borderRadius: '50%', background: proj.color, flexShrink: 0 }} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: t.status === 'done' ? COLORS.textMuted : COLORS.text, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</div>
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2, display: 'flex', gap: 10 }}>
          {proj && <span>{proj.name}</span>}
          {t.due_date && <span style={{ color: isOverdue ? COLORS.red : COLORS.textMuted }}>Due {t.due_date}</span>}
        </div>
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 5, background: PRIORITY[t.priority]?.color + '22', color: PRIORITY[t.priority]?.color }}>{PRIORITY[t.priority]?.label}</span>
      <Badge color={STATUS[t.status]?.color || '#888'}>{STATUS[t.status]?.label}</Badge>
    </div>
  )
}

function MeetingsSection({ meetings, fmt }) {
  if (meetings.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: COLORS.textMuted }}>
        <Icon name="messageCircle" size={36} color={COLORS.border} style={{ marginBottom: 12 }} />
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 6 }}>No meetings found</div>
        <div style={{ fontSize: 13 }}>Meetings where your email appears in the attendees list will show here.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {meetings.map(m => {
        const proj = m.projects
        return (
          <div key={m.id} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '14px 18px', borderLeft: `3px solid ${proj?.color || COLORS.purple}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: (proj?.color || COLORS.purple) + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="messageCircle" size={16} color={proj?.color || COLORS.purple} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{m.title}</span>
                  {m.meeting_date && <span style={{ fontSize: 11, color: COLORS.textMuted, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '2px 8px' }}>{fmt(m.meeting_date)}</span>}
                  {proj && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: proj.color, background: proj.color + '15', border: `1px solid ${proj.color}30`, borderRadius: 20, padding: '2px 8px' }}>
                      {proj.name}
                    </span>
                  )}
                </div>
                {m.attendees && <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>👥 {m.attendees}</div>}
                {m.summary && <p style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.6, margin: 0 }}>{m.summary}</p>}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
