import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { Pencil, Trash2 } from 'lucide-react'

function getStatusBadge(status) {
  switch (status) {
    case 'pending':
      return <Badge variant="warning">Pending</Badge>
    case 'shipped':
      return <Badge variant="info">Shipped</Badge>
    case 'delivered':
      return <Badge variant="success">Delivered</Badge>
    default:
      return <Badge variant="neutral">{status}</Badge>
  }
}

export function getColumns({ onEdit, onDelete, onRowClick }) {
  return [
    {
      key: 'shipment_number',
      label: 'Shipment #',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRowClick(row)
          }}
          className="font-medium text-(--color-primary) hover:underline cursor-pointer"
        >
          {row.shipment_number}
        </button>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => getStatusBadge(row.status),
    },
    {
      key: 'order_count',
      label: 'Orders',
      render: (row) => (
        <span className="tabular-nums">{row.order_count}</span>
      ),
    },
    {
      key: 'customer_count',
      label: 'Customers',
      render: (row) => (
        <span className="tabular-nums">{row.customer_count}</span>
      ),
    },
    {
      key: 'total_weight_kg',
      label: 'Weight (kg)',
      render: (row) => (
        <span className="tabular-nums">
          {Number(row.total_weight_kg).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'total_orders_uzs',
      label: 'Orders (UZS)',
      render: (row) => (
        <span className="tabular-nums">
          {Number(row.total_orders_uzs).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'shipment_fee',
      label: 'Fee ($)',
      render: (row) => (
        <span className="tabular-nums">
          ${Number(row.shipment_fee).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'shipment_fee_uzs',
      label: 'Fee (UZS)',
      render: (row) => (
        <span className="tabular-nums">
          {Number(row.shipment_fee_uzs).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'grand_total_uzs',
      label: 'Grand Total (UZS)',
      render: (row) => (
        <span className="tabular-nums font-medium">
          {Number(row.grand_total_uzs).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Date',
      render: (row) => (
        <span className="text-(--color-text-subtle) tabular-nums">
          {row.created_at
            ? new Date(row.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : '—'}
        </span>
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
