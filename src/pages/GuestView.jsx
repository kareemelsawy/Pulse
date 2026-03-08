import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { StatusBadge, PriorityBadge, Avatar } from '../components/UI'

export default function GuestView() {
  const { user, signOut } = useAuth()
  const [tasks,   setTasks]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) return
    supabase
      .from('tasks')
      .select('*, projects(name, color)')
      .eq('assignee_email', user.email)
      .neq('status', 'done')
      .order('due_date', { nullsFirst: false })
      .then(({ data }) => { setTasks(data || []); setLoading(false) })
  }, [user])

  return (
    <div style={{
      minHeight: '100vh', background: '#060a14', color: '#fff',
      fontFamily: "'DM Sans',sans-serif",
    }}>
      {/* Header */}
      <header style={{
        padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(6,10,20,0.85)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg,#4F8EF7,#1e4fff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14, fontWeight: 900,
          }}>✦</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17 }}>Pulse</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginLeft: 4 }}>Guest View</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar name={user?.user_metadata?.full_name} email={user?.email} size={30} />
          <button onClick={signOut} style={{
            background: 'none', border: '1px solid rgba(255,255,255,0.10)',
            borderRadius: 7, padding: '5px 12px', color: 'rgba(255,255,255,0.5)',
            cursor: 'pointer', fontSize: 12,
          }}>Sign out</button>
        </div>
      </header>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px' }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 4 }}>
          My Tasks
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 28 }}>
          {user?.email}
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: 'rgba(255,255,255,0.3)' }}>Loading…</div>
        ) : tasks.length === 0 ? (
          <div style={{
            padding: 48, textAlign: 'center',
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14,
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>No open tasks assigned to you</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {tasks.map(t => (
              <div key={t.id} className="task-card" style={{
                padding: '16px 18px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600 }}>{t.title}</p>
                    {t.projects?.name && (
                      <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                        {t.projects.name}
                      </p>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <StatusBadge status={t.status} />
                    {t.priority && <PriorityBadge priority={t.priority} />}
                  </div>
                </div>
                {t.due_date && (
                  <p style={{ margin: '8px 0 0', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    Due {new Date(t.due_date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
