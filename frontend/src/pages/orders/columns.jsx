import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function SortHeader({ label, sortKey, sortBy, sortDir, onSort }) {
  const active = sortBy === sortKey
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="inline-flex items-center gap-1 cursor-pointer hover:text-(--color-text-base) transition-colors"
    >
      {label}
      {active ? (
        sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  )
}

const statusColors = {
  pending: 'text-amber-600 bg-amber-50 ring-amber-200',
  shipped: 'text-gray-600 bg-gray-50 ring-gray-200',
  arrived: 'text-teal-600 bg-teal-50 ring-teal-200',
  received: 'text-blue-600 bg-blue-50 ring-blue-200',
  completed: 'text-green-600 bg-green-50 ring-green-200',
}

const paymentColors = {
  unpaid: 'text-red-600 bg-red-50 ring-red-200',
  paid_card: 'text-green-600 bg-green-50 ring-green-200',
  paid_cash: 'text-green-600 bg-green-50 ring-green-200',
  partial: 'text-amber-600 bg-amber-50 ring-amber-200',
  prepayment: 'text-purple-600 bg-purple-50 ring-purple-200',
}

const checkboxClass = 'rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer'

function uniqueList(items, key) {
  const values = [...new Set(items.map((it) => it[key]).filter(Boolean))]
  if (values.length === 0) return '—'
  return values.map((v, i) => (
    <span key={i}>
      {v}
      {i < values.length - 1 && <br />}
    </span>
  ))
}

export function getColumns({ onStatusChange, onPaymentStatusChange, selectedIds, onToggleSelect, onToggleAll, allSelected, sortBy, sortDir, onSort }) {
  const { t } = useTranslation()

  const statusOptions = [
    { value: 'pending', label: t('orders.status.pending') },
    { value: 'shipped', label: t('orders.status.shipped') },
    { value: 'arrived', label: t('orders.status.arrived') },
    { value: 'received', label: t('orders.status.received') },
    { value: 'completed', label: t('orders.status.completed') },
  ]

  const paymentOptions = [
    { value: 'unpaid', label: t('orders.payment.unpaid') },
    { value: 'paid_card', label: t('orders.payment.paid_card') },
    { value: 'paid_cash', label: t('orders.payment.paid_cash') },
    { value: 'partial', label: t('orders.payment.partial') },
    { value: 'prepayment', label: t('orders.payment.prepayment') },
  ]

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
          checked={selectedIds.has(row.order_id)}
          onChange={() => onToggleSelect(row.order_id)}
          onClick={(e) => e.stopPropagation()}
          className={checkboxClass}
        />
      ),
    },
    {
      key: 'order_number',
      label: t('orders.order_num'),
      render: (row) => (
        <span className="font-medium text-(--color-text-base)">
          {row.order_number}
        </span>
      ),
    },
    {
      key: 'customer_name',
      label: <SortHeader label={t('common.customer')} sortKey="customer_name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
      minWidth: '120px',
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {row.customer_name || 'TBA'}
        </span>
      ),
    },
    {
      key: 'category',
      label: <SortHeader label={t('orders.category')} sortKey="category_name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
      minWidth: '120px',
      nowrap: false,
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {uniqueList(row.items || [], 'category_name')}
        </span>
      ),
    },
    {
      key: 'brand',
      label: <SortHeader label={t('orders.brand')} sortKey="brand" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
      minWidth: '110px',
      nowrap: false,
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {uniqueList(row.items || [], 'brand')}
        </span>
      ),
    },
    {
      key: 'items',
      label: t('common.items'),
      minWidth: '200px',
      nowrap: false,
      render: (row) => {
        if (!row.items || row.items.length === 0) {
          return <span className="text-(--color-text-muted)">—</span>
        }
        return (
          <ul className="space-y-1">
            {row.items.map((it, i) => {
              const inStock = it.from_stock === true
              return (
                <li
                  key={it.item_id ?? i}
                  className={`flex items-start justify-between gap-2 text-sm ${
                    inStock ? 'bg-emerald-50 ring-1 ring-emerald-200 rounded px-1.5 py-0.5 -mx-1.5' : ''
                  }`}
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
              )
            })}
          </ul>
        )
      },
    },
    {
      key: 'total_price_uzs',
      label: t('orders.total_price_uzs'),
      minWidth: '140px',
      render: (row) => (
        row.final_amount_uzs != null ? (
          <span className="tabular-nums font-medium text-emerald-700 flex items-center gap-1">
            {Number(row.final_amount_uzs).toLocaleString()}
            <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded">FINAL</span>
          </span>
        ) : (
          <span className="tabular-nums font-medium">
            {row.total_price_uzs != null
              ? Number(row.total_price_uzs).toLocaleString()
              : '—'}
          </span>
        )
      ),
    },
    {
      key: 'total_cost',
      label: t('orders.cost_krw'),
      render: (row) => (
        <span className="tabular-nums">
          {row.total_cost != null
            ? Number(row.total_cost).toLocaleString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'total_selling_usd',
      label: t('orders.selling_usd'),
      minWidth: '110px',
      render: (row) => (
        <span className="tabular-nums">
          {row.total_selling_usd != null ? `$${Number(row.total_selling_usd).toFixed(2)}` : '—'}
        </span>
      ),
    },
    {
      key: 'total_weight_kg',
      label: t('orders.weight_kg'),
      render: (row) => (
        <span className="tabular-nums">
          {row.total_weight_kg != null
            ? Number(row.total_weight_kg).toFixed(2)
            : '—'}
        </span>
      ),
    },
    {
      key: 'shipping_fee_usd',
      label: t('orders.cargo_col'),
      minWidth: '110px',
      render: (row) => (
        <span className="tabular-nums">
          {row.shipping_fee_usd != null ? `$${Number(row.shipping_fee_usd).toFixed(2)}` : '—'}
        </span>
      ),
    },
    {
      key: 'customer_cargo_usd',
      label: t('orders.cust_cargo_col'),
      minWidth: '130px',
      render: (row) => (
        <span className="tabular-nums">
          {row.customer_cargo_usd != null ? `$${Number(row.customer_cargo_usd).toFixed(2)}` : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: <SortHeader label={t('common.status')} sortKey="status" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
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
      key: 'payment_status',
      label: t('orders.payment_col'),
      render: (row) => (
        <select
          value={row.payment_status || 'unpaid'}
          onChange={(e) => {
            e.stopPropagation()
            if (e.target.value !== row.payment_status) {
              onPaymentStatusChange(row.order_id, e.target.value, row)
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className={`text-xs font-medium rounded-full px-2.5 py-1 ring-1 cursor-pointer appearance-none pr-6 bg-size-12px bg-position-[right_6px_center] bg-no-repeat ${paymentColors[row.payment_status] || paymentColors.unpaid}`}
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}
        >
          {paymentOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ),
    },
    {
      key: 'unpaid',
      label: t('orders.unpaid_uzs'),
      minWidth: '130px',
      render: (row) => (
        <div className="flex flex-col gap-0.5">
          <span className={`tabular-nums font-medium ${row.unpaid != null && Number(row.unpaid) > 0 ? 'text-red-600' : 'text-green-600'}`}>
            {row.unpaid != null ? Number(row.unpaid).toLocaleString() : '—'}
          </span>
          {Number(row.budget_applied_uzs) > 0 && (
            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200 rounded px-1.5 py-0.5 w-fit">
              budget −{Math.round(Number(row.budget_applied_uzs)).toLocaleString()}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'shipping_number',
      label: <SortHeader label={t('orders.shipping_num')} sortKey="shipping_number" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
      minWidth: '130px',
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {row.shipping_number || '—'}
        </span>
      ),
    },
    {
      key: 'order_date',
      label: t('orders.created'),
      minWidth: '110px',
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
  ]
}
