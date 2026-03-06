import { useState, useEffect, useRef } from 'react'
import { COLORS } from '../lib/constants'
import { Icon } from './UI'
import { getAttachments, uploadAttachment, deleteAttachment } from '../lib/db/tasks'

export default function AttachmentsSection({ taskId, toast }) {
  const [attachments, setAttachments] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [uploading,   setUploading]   = useState(false)
  const [storageOk,   setStorageOk]   = useState(true)
  const fileRef = useRef(null)

  useEffect(() => {
    getAttachments(taskId)
      .then(data => { setAttachments(data); setLoading(false) })
      .catch(e => {
        if (e?.message?.includes('does not exist') || e?.code === '42P01') setStorageOk(false)
        setLoading(false)
      })
  }, [taskId])

  async function handleUpload(e) {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const rec = await uploadAttachment(taskId, file)
      setAttachments(prev => [...prev, rec])
      toast?.('File uploaded', 'success')
    } catch(err) {
      if (err?.message?.includes('Bucket') || err?.message?.includes('bucket')) setStorageOk(false)
      else toast?.(err.message, 'error')
    } finally { setUploading(false); e.target.value = '' }
  }

  async function handleDelete(att) {
    try {
      await deleteAttachment(att.id, att.file_path)
      setAttachments(prev => prev.filter(a => a.id !== att.id))
    } catch(err) { toast?.(err.message, 'error') }
  }

  function fmt(bytes) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1048576) return `${Math.round(bytes/1024)}KB`
    return `${(bytes/1048576).toFixed(1)}MB`
  }

  if (!storageOk) return (
    <div style={{ border: `1px dashed ${COLORS.border}`, borderRadius: 10, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <Icon name="paperclip" size={18} color={COLORS.textMuted} />
      <div style={{ fontSize: 12, color: COLORS.textMuted, lineHeight: 1.5 }}>
        Run <code style={{ background: COLORS.border, padding: '1px 5px', borderRadius: 3, fontSize: 10 }}>create-storage-bucket.sql</code> in Supabase to enable attachments.
      </div>
    </div>
  )

  return (
    <div>
      {loading ? (
        <div style={{ fontSize: 12, color: COLORS.textMuted }}>Loading…</div>
      ) : (
        <>
          {attachments.length > 0 && (
            <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {attachments.map(att => (
                <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                  <Icon name="paperclip" size={14} color={COLORS.textMuted} />
                  <a href={att.file_url} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: 12, color: COLORS.accent, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{att.file_name}</a>
                  <span style={{ fontSize: 11, color: COLORS.textMuted, flexShrink: 0 }}>{fmt(att.file_size)}</span>
                  <button onClick={() => handleDelete(att)} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}><Icon name="x" size={13} color={COLORS.textMuted} /></button>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', background: 'none', border: `1px dashed ${COLORS.border}`, borderRadius: 8, color: COLORS.textMuted, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}>
            <Icon name="upload" size={13} color={COLORS.textMuted} />
            {uploading ? 'Uploading…' : 'Attach file'}
          </button>
          <input ref={fileRef} type="file" onChange={handleUpload} style={{ display: 'none' }} />
        </>
      )}
    </div>
  )
}
