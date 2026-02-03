import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { Pencil, Trash2 } from 'lucide-react'

function getStatusBadge(status) {
  switch (status) {
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    case 'shipped':
      return <Badge variant="neutral">Shipped</Badge>
    case 'received':
      return <Badge variant="info">Received</Badge>
    case 'completed':
      return <Badge variant="success">Completed</Badge>
    default:
      return <Badge variant="neutral">{status}</Badge>
  }
}

function ItemsCell({ items }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const btnRef = useRef(null)

  const updatePos = useCallback(() => {
    if (!btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    if (spaceBelow < 200) {
      setPos({ top: rect.top + window.scrollY, left: rect.left + window.scrollX, openUp: true })
    } else {
      setPos({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, openUp: false })
    }
  }, [])

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleToggle = (e) => {
    e.stopPropagation()
    if (!open) updatePos()
    setOpen(!open)
  }

  if (!items || items.length === 0) {
    return <span className="text-(--color-text-muted)">—</span>
  }

  const first = items[0].product_name
  const rest = items.length > 1 ? ` +${items.length - 1}` : ''

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        className="text-(--color-text-subtle) hover:text-(--color-primary) underline decoration-dashed underline-offset-2 cursor-pointer text-left"
      >
        {items.length} — {first}{rest}
      </button>

      {open && createPortal(
        <div
          className="fixed z-50 bg-white rounded-lg ring-1 ring-(--color-border-base) shadow-lg p-3 w-64"
          style={pos.openUp
            ? { bottom: window.innerHeight - pos.top + 4, left: pos.left }
            : { top: pos.top + 4, left: pos.left }
          }
        >
          <p className="text-xs font-medium text-(--color-text-subtle) mb-2">
            Order Items ({items.length})
          </p>
          <ul className="space-y-1.5">
            {items.map((it, i) => (
              <li
                key={it.item_id ?? i}
                className="flex items-start justify-between gap-2 text-sm"
              >
                <span className="text-(--color-text-base)">
                  {it.product_name}
                  {it.product_attributes && (
                    <span className="text-(--color-text-muted) text-xs ml-1">
                      ({it.product_attributes})
                    </span>
                  )}
                </span>
                <span className="text-(--color-text-muted) tabular-nums shrink-0">
                  x{it.quantity}
                </span>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </>
  )
}

const statusOptions = [
  { value: 'pending', label: 'Pending', variant: 'warning' },
  { value: 'shipped', label: 'Shipped', variant: 'neutral' },
  { value: 'received', label: 'Received', variant: 'info' },
  { value: 'completed', label: 'Completed', variant: 'success' },
]

const statusColors = {
  pending: 'text-amber-600 bg-amber-50 ring-amber-200',
  shipped: 'text-gray-600 bg-gray-50 ring-gray-200',
  received: 'text-blue-600 bg-blue-50 ring-blue-200',
  completed: 'text-green-600 bg-green-50 ring-green-200',
}

export function getColumns({ onEdit, onDelete, onStatusChange }) {
  return [
    {
      key: 'order_number',
      label: 'Order #',
      render: (row) => (
        <span className="font-medium text-(--color-text-base)">
          {row.order_number}
        </span>
      ),
    },
    {
      key: 'customer_name',
      label: 'Customer',
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {row.customer_name || 'TBA'}
        </span>
      ),
    },
    {
      key: 'items',
      label: 'Items',
      render: (row) => <ItemsCell items={row.items} />,
    },
    {
      key: 'total_cost',
      label: 'Cost (KRW)',
      render: (row) => (
        <span className="tabular-nums">
          {row.total_cost != null
            ? Number(row.total_cost).toLocaleString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'total_amount',
      label: 'Total (USD)',
      render: (row) => (
        <span className="tabular-nums">
          {row.total_amount != null ? `$${Number(row.total_amount).toFixed(2)}` : '—'}
        </span>
      ),
    },
    {
      key: 'total_amount_uzs',
      label: 'Total (UZS)',
      render: (row) => (
        <span className="tabular-nums">
          {row.total_amount_uzs != null
            ? Number(row.total_amount_uzs).toLocaleString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'total_weight_kg',
      label: 'Weight (kg)',
      render: (row) => (
        <span className="tabular-nums">
          {row.total_weight_kg != null
            ? Number(row.total_weight_kg).toFixed(2)
            : '—'}
        </span>
      ),
    },
    {
      key: 'shipping_fee_uzs',
      label: 'Shipping (UZS)',
      render: (row) => (
        <span className="tabular-nums">
          {row.shipping_fee_uzs != null
            ? Number(row.shipping_fee_uzs).toLocaleString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'grand_total_uzs',
      label: 'Grand Total (UZS)',
      render: (row) => (
        <span className="tabular-nums font-medium">
          {row.grand_total_uzs != null
            ? Number(row.grand_total_uzs).toLocaleString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'order_date',
      label: 'Date',
      render: (row) => (
        <span className="text-(--color-text-subtle) tabular-nums">
          {row.order_date
            ? new Date(row.order_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => {
            e.stopPropagation()
            if (e.target.value !== row.status) {
              onStatusChange(row.order_id, e.target.value)
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className={`text-xs font-medium rounded-full px-2.5 py-1 ring-1 cursor-pointer appearance-none pr-6 bg-[length:12px] bg-[right_6px_center] bg-no-repeat ${statusColors[row.status] || ''}`}
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'actions',
      label: '',
      width: '100px',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(row)}>
            <Trash2 className="w-3.5 h-3.5 text-(--color-danger)" />
          </Button>
        </div>
      ),
    },
  ]
}
