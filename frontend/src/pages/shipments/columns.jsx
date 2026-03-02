import { useTranslation } from 'react-i18next'

const statusColors = {
  pending: 'text-amber-600 bg-amber-50 ring-amber-200',
  shipped: 'text-gray-600 bg-gray-50 ring-gray-200',
  arrived: 'text-teal-600 bg-teal-50 ring-teal-200',
  received: 'text-blue-600 bg-blue-50 ring-blue-200',
  completed: 'text-green-600 bg-green-50 ring-green-200',
}

const checkboxClass = 'rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer'

export function getColumns({ onRowClick, onStatusChange, selectedIds, onToggleSelect, onToggleAll, allSelected, isAdmin }) {
  const { t } = useTranslation()

  const statusOptions = [
    { value: 'pending', label: t('shipments.status.pending') },
    { value: 'shipped', label: t('shipments.status.shipped') },
    { value: 'arrived', label: t('shipments.status.arrived') },
    { value: 'received', label: t('shipments.status.received') },
    { value: 'completed', label: t('shipments.status.completed') },
  ]

  const cols = []

  if (isAdmin) {
    cols.push({
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
    })
  }

  cols.push(
    {
      key: 'shipment_number',
      label: t('shipments.col_shipment_num'),
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
      label: t('common.status'),
      render: (row) => isAdmin ? (
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
      ) : (
        <span className={`text-xs font-medium rounded-full px-2.5 py-1 ring-1 ${statusColors[row.status] || ''}`}>
          {statusOptions.find((o) => o.value === row.status)?.label ?? row.status}
        </span>
      ),
    },
    {
      key: 'order_count',
      label: t('shipments.col_orders'),
      render: (row) => (
        <span className="tabular-nums">{row.order_count}</span>
      ),
    },
    {
      key: 'customer_count',
      label: t('shipments.col_customers'),
      render: (row) => (
        <span className="tabular-nums">{row.customer_count}</span>
      ),
    },
    {
      key: 'total_weight_kg',
      label: t('shipments.col_weight'),
      render: (row) => (
        <span className="tabular-nums">
          {Number(row.total_weight_kg).toFixed(2)}
        </span>
      ),
    },
  )

  if (isAdmin) {
    cols.push(
      {
        key: 'total_orders_uzs',
        label: t('shipments.col_orders_uzs'),
        render: (row) => (
          <span className="tabular-nums">
            {Number(row.total_orders_uzs).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'shipment_fee',
        label: t('shipments.col_fee_usd'),
        render: (row) => (
          <span className="tabular-nums">
            ${Number(row.shipment_fee).toFixed(2)}
          </span>
        ),
      },
      {
        key: 'shipment_fee_uzs',
        label: t('shipments.col_fee_uzs'),
        render: (row) => (
          <span className="tabular-nums">
            {Number(row.shipment_fee_uzs).toLocaleString()}
          </span>
        ),
      },
      {
        key: 'grand_total_uzs',
        label: t('shipments.col_grand_total'),
        render: (row) => (
          <span className="tabular-nums font-medium">
            {Number(row.grand_total_uzs).toLocaleString()}
          </span>
        ),
      },
    )
  }

  cols.push({
    key: 'created_at',
    label: t('common.date'),
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
  })

  return cols
}
