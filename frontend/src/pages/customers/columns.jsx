import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { Pencil, Trash2 } from 'lucide-react'

export function getColumns({ onEdit, onDelete }) {
  return [
    {
      key: 'customer_name',
      label: 'Name',
      render: (row) => (
        <span className="font-medium text-(--color-text-base)">
          {row.customer_name}
        </span>
      ),
    },
    {
      key: 'contact_phone',
      label: 'Phone',
      render: (row) => (
        <span className="text-(--color-text-subtle) tabular-nums">
          {row.contact_phone || '—'}
        </span>
      ),
    },
    {
      key: 'telegram_id',
      label: 'Telegram',
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {row.telegram_id || '—'}
        </span>
      ),
    },
    {
      key: 'location',
      label: 'Location',
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {row.location || '—'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) =>
        row.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="neutral">Inactive</Badge>
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
