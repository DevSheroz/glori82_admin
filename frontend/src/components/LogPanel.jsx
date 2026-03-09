import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { logsApi } from '../lib/api'

function formatLog(log) {
  const actor = `${log.user_name} (${log.user_role})`
  if (log.action === 'status_changed') {
    return `${actor} changed order status: "${log.old_value}" → "${log.new_value}"`
  }
  if (log.action === 'payment_status_changed') {
    return `${actor} changed payment status: "${log.old_value}" → "${log.new_value}"`
  }
  if (log.action === 'payment_amount_changed') {
    const fieldLabel = log.field === 'paid_card' ? 'card payment' : 'cash payment'
    return `${actor} changed ${fieldLabel}: ${log.old_value} → ${log.new_value} UZS`
  }
  return `${actor} made a change`
}

function LogEntry({ log }) {
  const time = new Date(log.created_at).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-(--color-text-base) leading-relaxed">{formatLog(log)}</p>
          {log.order_number && (
            <p className="text-xs text-(--color-text-muted) mt-0.5">Order #{log.order_number}</p>
          )}
        </div>
        <span className="text-[10px] text-(--color-text-muted) tabular-nums shrink-0 mt-0.5">{time}</span>
      </div>
    </div>
  )
}

export default function LogPanel() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.role !== 'admin') return
    logsApi.getUnreadCount()
      .then((res) => setUnreadCount(res.data.count))
      .catch(() => {})
  }, [user])

  const handleToggle = async () => {
    if (open) {
      setOpen(false)
      return
    }
    setOpen(true)
    setLoading(true)
    try {
      const [logsRes] = await Promise.all([
        logsApi.getLogs(),
        logsApi.markSeen(),
      ])
      setLogs(logsRes.data)
      setUnreadCount(0)
    } catch {
      // silently fail — panel still opens
    } finally {
      setLoading(false)
    }
  }

  if (user?.role !== 'admin') return null

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 rounded-md text-(--color-text-subtle) hover:bg-(--color-bg-subtle) hover:text-(--color-text-base) transition-colors"
        title="Activity log"
      >
        <Bell className="w-4 h-4" strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="fixed right-2 top-15 z-20 md:absolute md:right-0 md:top-full md:mt-1 bg-white border border-(--color-border-base) rounded-lg shadow-lg w-80 max-h-120 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-(--color-border-base) shrink-0">
              <span className="text-sm font-semibold text-(--color-text-base)">Activity Log</span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded text-(--color-text-muted) hover:text-(--color-text-base) transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 bg-(--color-bg-component) rounded animate-pulse" />
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="p-8 text-center text-sm text-(--color-text-muted)">No activity yet</div>
              ) : (
                <div className="divide-y divide-(--color-border-base)">
                  {logs.map((log) => (
                    <LogEntry key={log.log_id} log={log} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
