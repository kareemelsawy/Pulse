import { useState, useEffect } from 'react'
import { useData } from '../contexts/DataContext'
import { useAuth } from '../contexts/AuthContext'
import { COLORS, STATUS, STATUS_FLOW, PRIORITY } from '../lib/constants'
import { Avatar, Modal, Btn, Icon, lStyle, iStyle } from './UI'
import { getComments, addComment, deleteComment } from '../lib/db/tasks'
import { getWorkspaceMembers } from '../lib/db/workspace'
import AttachmentsSection from './AttachmentsSection'

export default function TaskModal({ task, projectId, isAdmin, onClose, toast }) {
  const { addTask, editTask, removeTask, members: ctxMembers, workspace, projects, fireNotification } = useData()
  const { user } = useAuth()
  const [title,      setTitle]      = useState(task?.title || '')
  const [status,     setStatus]     = useState(task?.status || 'new')
  const [priority,   setPriority]   = useState(task?.priority || 'medium')
  const [assigneeId,    setAssigneeId]    = useState('')
  const [guestEmail,    setGuestEmail]    = useState('')  // for external @homzmart.com
  const [useGuestEmail, setUseGuestEmail] = useState(false)
  const today = new Date().toISOString().split('T')[0]
  const [due,        setDue]        = useState(task?.due_date || today)
  const [saving,     setSaving]     = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [localMembers,    setLocalMembers]    = useState([])
  const [comments,        setComments]        = useState([])
  const [commentText,     setCommentText]     = useState('')
  const [loadingComments, setLoadingComments] = useState(false)
  const [savingComment,   setSavingComment]   = useState(false)

  useEffect(() => {
    if (ctxMembers?.length > 0) {
      setLocalMembers(ctxMembers)
      if (task?.assignee_email) {
        const match = ctxMembers.find(m => m.email === task.assignee_email)
        if (match) setAssigneeId(match.user_id)
        else if (task.assignee_email) { setUseGuestEmail(true); setGuestEmail(task.assignee_email) }
      }
    } else if (workspace?.id) {
      getWorkspaceMembers(workspace.id).then(ms => {
        setLocalMembers(ms)
        if (task?.assignee_email) {
          const match = ms.find(m => m.email === task.assignee_email)
          if (match) setAssigneeId(match.user_id)
          else if (task.assignee_email) { setUseGuestEmail(true); setGuestEmail(task.assignee_email) }
        }
      }).catch(() => {})
    }
  }, [])

  useEffect(() => {
    if (task) {
      setLoadingComments(true)
      getComments(task.id).then(c => { setComments(c); setLoadingComments(false) }).catch(() => setLoadingComments(false))
    }
  }, [task?.id])

  const selectedMember  = localMembers.find(m => m.user_id === assigneeId)
  const allowedStatuses = task
    ? (isAdmin ? STATUS_FLOW : STATUS_FLOW.slice(0, STATUS_FLOW.indexOf(task.status) + 2))
    : ['new']

  async function handleSave() {
    if (!title.trim()) return
    if (!due) { toast?.('Due date is required', 'error'); return }
    setSaving(true)
    try {
      const assignee_name  = useGuestEmail ? (guestEmail.split('@')[0]) : (selectedMember?.full_name || selectedMember?.email || '')
      const assignee_email = useGuestEmail ? guestEmail.trim() : (selectedMember?.email || '')
      const safeStatus     = task ? (status || task.status || 'new') : 'new'
      const data = { title: title.trim(), status: safeStatus, priority: priority || 'medium', assignee_name, assignee_email, due_date: due || null }
      if (task) { await editTask(task.id, data, task); toast?.('Task updated', 'success') }
      else      { await addTask(projectId, data);      toast?.('Task created', 'success') }
      onClose()
    } catch(e) { toast?.(e.message, 'error') } finally { setSaving(false) }
  }

  async function handleDelete() {
    setSaving(true)
    try { await removeTask(task.id); toast?.('Task deleted'); onClose() }
    catch(e) { toast?.(e.message, 'error') } finally { setSaving(false) }
  }

  async function handleAddComment() {
    if (!commentText.trim()) return
    setSavingComment(true)
    try {
      const c = await addComment(task.id, user.id, commentText.trim())
      setComments(prev => [...prev, { ...c, author_name: user?.user_metadata?.full_name || user?.email || 'You' }])
      setCommentText('')
      const proj = projects?.find(p => p.id === task.project_id)
      fireNotification?.({ trigger: 'comment_added', task, projectName: proj?.name || '', actorName: user?.user_metadata?.full_name || user?.email || 'Someone' })
    } catch(e) { toast?.(e.message, 'error') } finally { setSavingComment(false) }
  }

  async function handleDeleteComment(id) {
    try { await deleteComment(id); setComments(prev => prev.filter(c => c.id !== id)) }
    catch(e) { toast?.(e.message, 'error') }
  }

  const S = {
    divider:      { height: 1, background: COLORS.border, margin: '20px 0' },
    sectionLabel: { fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: COLORS.textMuted, marginBottom: 12 },
    row:          { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    field:        { display: 'flex', flexDirection: 'column', gap: 6 },
  }

  return (
    <Modal onClose={onClose} width={580}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em', paddingBottom: 2 }}>{task ? 'Edit Task' : 'New Task'}</h2>
          {task && <span style={{ fontSize: 11, color: COLORS.textMuted }}>#{task.id.slice(0,8)}</span>}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: 4, marginTop: -2, display: 'flex', alignItems: 'center' }}><Icon name="x" size={18} color={COLORS.textMuted} /></button>
      </div>

      <div style={{ paddingRight: 4 }}>
        {/* Title */}
        <div style={{ marginBottom: 16 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Task title…" autoFocus
            onKeyDown={e => e.key === 'Enter' && e.metaKey && handleSave()}
            style={{ width: '100%', background: 'none', border: 'none', borderBottom: `2px solid ${COLORS.border}`, borderRadius: 0, padding: '6px 0', color: COLORS.text, fontSize: 17, fontWeight: 700, outline: 'none', lineHeight: 1.4, transition: 'border-color 0.15s' }}
            onFocus={e => e.target.style.borderBottomColor = COLORS.accent}
            onBlur={e => e.target.style.borderBottomColor = COLORS.border}
          />
        </div>

        {/* Details */}
        <div style={S.sectionLabel}>Details</div>
        <div style={S.row}>
          {task ? (
            <div style={S.field}>
              <label style={lStyle}>Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} style={{ ...iStyle, background: COLORS.inputBg }}>
                {allowedStatuses.map(k => <option key={k} value={k}>{STATUS[k].label}</option>)}
              </select>
              {!isAdmin && <p style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 2 }}>Sequential flow only</p>}
            </div>
          ) : (
            <div style={{ ...S.field, justifyContent: 'flex-end' }}>
              <div style={{ background: COLORS.accent + '15', border: `1px solid ${COLORS.accent}30`, borderRadius: 8, padding: '8px 10px', fontSize: 11, color: COLORS.textMuted, lineHeight: 1.6 }}>
                Starts as <strong style={{ color: COLORS.accent }}>New</strong><br/>New → In Progress → Review → Done
              </div>
            </div>
          )}
          <div style={S.field}>
            <label style={lStyle}>Due Date <span style={{color:COLORS.red}}>*</span></label>
            <input type="date" value={due} onChange={e => setDue(e.target.value)} style={{ ...iStyle, background: COLORS.inputBg }} required />
          </div>
        </div>

        {/* Priority */}
        <div style={{ marginTop: 12 }}>
          <label style={lStyle}>Priority</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(PRIORITY).map(([k, v]) => {
              const iconName = k === 'high' ? 'priorityHigh' : k === 'medium' ? 'priorityMed' : 'priorityLow'
              const active = priority === k
              return (
                <button key={k} onClick={() => setPriority(k)} style={{ flex: 1, padding: '10px 8px', borderRadius: 10, border: `2px solid ${active ? v.color : COLORS.border}`, background: active ? v.color + '25' : 'rgba(255,255,255,0.06)', color: active ? v.color : COLORS.textMuted, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s' }}>
                  <Icon name={iconName} size={14} color={active ? v.color : COLORS.textMuted} />
                  {v.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Assignee */}
        <div style={{ marginTop: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ ...lStyle, marginBottom: 0 }}>Assignee</label>
            <button onClick={() => { setUseGuestEmail(v => !v); setAssigneeId(''); setGuestEmail('') }}
              style={{ background: 'none', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, color: useGuestEmail ? COLORS.accent : COLORS.textMuted, cursor: 'pointer', fontFamily: 'inherit' }}>
              {useGuestEmail ? '← Team member' : 'Guest email →'}
            </button>
          </div>
          {!useGuestEmail ? (
            localMembers.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[{ user_id: '', display: 'Unassigned', isUnassigned: true },
                  ...localMembers.map(m => ({ user_id: m.user_id, display: m.full_name || m.email || 'Team Member', isUnassigned: false }))
                ].map(m => {
                  const active = assigneeId === m.user_id
                  return (
                    <button key={m.user_id} onClick={() => setAssigneeId(m.user_id)} style={{ padding: '6px 14px', borderRadius: 20, border: `2px solid ${active ? COLORS.accent : COLORS.border}`, background: active ? COLORS.accent + '25' : 'rgba(255,255,255,0.07)', color: active ? COLORS.accent : COLORS.textDim, cursor: 'pointer', fontFamily: 'inherit', fontWeight: active ? 700 : 400, fontSize: 12, transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {!m.isUnassigned && <Avatar name={m.display} size={16} />}
                      {m.display}
                    </button>
                  )
                })}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: COLORS.textMuted, padding: '8px 0' }}>
                Loading members…
              </div>
            )
          ) : (
            <div>
              <input
                value={guestEmail}
                onChange={e => setGuestEmail(e.target.value)}
                placeholder="guest@homzmart.com"
                style={{ ...iStyle, background: COLORS.inputBg }}
              />
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
                They'll receive an email invite and can view their assigned tasks after signing in.
              </div>
            </div>
          )}
        </div>

        {/* Comments */}
        <div style={S.divider} />
        <div style={S.sectionLabel}>
          Comments {task && comments.length > 0 && <span style={{ color: COLORS.accent, marginLeft: 4 }}>{comments.length}</span>}
        </div>
        {task ? (
          <div>
            {loadingComments ? (
              <div style={{ padding: '16px 0', textAlign: 'center', color: COLORS.textMuted, fontSize: 13 }}>Loading…</div>
            ) : comments.length === 0 ? (
              <div style={{ padding: '12px 0 6px', color: COLORS.textMuted, fontSize: 13 }}>No comments yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
                {comments.map(c => (
                  <div key={c.id} style={{ display: 'flex', gap: 10 }}>
                    <Avatar name={c.author_name} size={28} />
                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 10, padding: '9px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: 700, fontSize: 12 }}>{c.author_name}</span>
                        <span style={{ fontSize: 10, color: COLORS.textMuted }}>{new Date(c.created_at).toLocaleString()}</span>
                        {(c.user_id === user?.id || isAdmin) && (
                          <button onClick={() => handleDeleteComment(c.id)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1 }}>✕</button>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: COLORS.textDim, lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>{c.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <Avatar name={user?.user_metadata?.full_name || user?.email || '?'} size={28} />
              <div style={{ flex: 1, position: 'relative' }}>
                <textarea value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Write a comment…" rows={2}
                  onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) handleAddComment() }}
                  style={{ ...iStyle, resize: 'none', lineHeight: 1.5, background: COLORS.inputBg, paddingRight: 60 }}
                />
                <button onClick={handleAddComment} disabled={savingComment || !commentText.trim()}
                  style={{ position: 'absolute', right: 8, bottom: 8, background: commentText.trim() ? COLORS.accent : COLORS.border, border: 'none', color: '#fff', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: commentText.trim() ? 'pointer' : 'default', fontFamily: 'inherit', transition: 'background 0.15s' }}>
                  Post
                </button>
              </div>
            </div>
            <p style={{ fontSize: 10, color: COLORS.textMuted, marginTop: 5 }}>⌘ + Enter to post</p>
          </div>
        ) : (
          <p style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>Save this task first to add comments.</p>
        )}

        {/* Attachments */}
        <div style={S.divider} />
        <div style={S.sectionLabel}>Attachments</div>
        {task ? <AttachmentsSection taskId={task.id} task={task} toast={toast} /> : (
          <p style={{ fontSize: 13, color: COLORS.textMuted }}>Save the task first, then you can add attachments.</p>
        )}
        <div style={{ height: 8 }} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 16, borderTop: `1px solid ${COLORS.border}` }}>
        {task && isAdmin && !confirmDel && <Btn variant="danger" onClick={() => setConfirmDel(true)}>Delete</Btn>}
        {task && isAdmin && confirmDel  && <Btn variant="danger" onClick={handleDelete} disabled={saving}>Confirm?</Btn>}
        <div style={{ flex: 1 }} />
        <Btn variant="secondary" onClick={onClose} disabled={saving}>Cancel</Btn>
        <Btn onClick={handleSave} disabled={saving || !title.trim() || !due}>{saving ? 'Saving…' : task ? 'Save Changes' : 'Create Task'}</Btn>
      </div>
    </Modal>
  )
}
