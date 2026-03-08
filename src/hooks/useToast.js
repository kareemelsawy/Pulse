import { useState, useCallback } from 'react'

let id = 0

export function useToast() {
  const [toasts, setToasts] = useState([])

  const toast = useCallback((message, type = 'info', duration = 4000) => {
    const tid = ++id
    setToasts(prev => [...prev, { id: tid, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== tid)), duration)
  }, [])

  const removeToast = useCallback((tid) => {
    setToasts(prev => prev.filter(t => t.id !== tid))
  }, [])

  return { toasts, toast, removeToast }
}
