const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'received', label: 'Received' },
  { value: 'completed', label: 'Completed' },
]

const statusColors = {
  pending: 'text-amber-600 bg-amber-50 ring-amber-200',
  shipped: 'text-gray-600 bg-gray-50 ring-gray-200',
  received: 'text-blue-600 bg-blue-50 ring-blue-200',
  completed: 'text-green-600 bg-green-50 ring-green-200',
}

const checkboxClass = 'rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer'

export function getColumns({ onRowClick, onStatusChange, selectedIds, onToggleSelect, onToggleAll, allSelected }) {
  return [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
          className={checkboxClass}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      width: '40px',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.shipment_id)}
          onChange={() => onToggleSelect(row.shipment_id)}
          onClick={(e) => e.stopPropagation()}
          className={checkboxClass}
        />
      ),
    },
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
      render: (row) => (
        <select
          value={row.status}
          onChange={(e) => {
            e.stopPropagation()
            if (e.target.value !== row.status) {
              onStatusChange(row.shipment_id, e.target.value)
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className={`text-xs font-medium rounded-full px-2.5 py-1 ring-1 cursor-pointer appearance-none pr-6 bg-size-12px bg-position-[right_6px_center] bg-no-repeat ${statusColors[row.status] || ''}`}
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}
        >
          {statusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ),
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
  ]
}
