import Badge from '../../components/Badge'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

const checkboxClass = 'rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer'

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

function getStockBadge(row) {
  switch (row.stock_status) {
    case 'out_of_stock':
      return <Badge variant="danger">Out of Stock</Badge>
    case 'pre_order':
      return <Badge variant="warning">Pre-order</Badge>
    default:
      return <Badge variant="success">In Stock</Badge>
  }
}

export function getColumns({ categories, sortBy, sortDir, onSort, selectedIds, onToggleSelect, onToggleAll, allSelected }) {
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
          checked={selectedIds.has(row.product_id)}
          onChange={() => onToggleSelect(row.product_id)}
          onClick={(e) => e.stopPropagation()}
          className={checkboxClass}
        />
      ),
    },
    {
      key: 'product_name',
      label: 'Name',
      render: (row) => {
        const attrs = row.attribute_values ?? []
        const attrText = attrs.map((a) => `${a.attribute_name}: ${a.value}`).join(', ')
        return (
          <div>
            <div className="font-medium text-(--color-text-base)">
              {row.product_name}
            </div>
            {attrText && (
              <div className="text-xs text-(--color-text-muted) truncate max-w-60">
                {attrText}
              </div>
            )}
            {!attrText && row.description && (
              <div className="text-xs text-(--color-text-muted) truncate max-w-50">
                {row.description}
              </div>
            )}
          </div>
        )
      },
    },
    {
      key: 'brand',
      label: 'Brand',
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {row.brand ?? '—'}
        </span>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      render: (row) => {
        const cat = categories.find((c) => c.category_id === row.category_id)
        return (
          <span className="text-(--color-text-subtle)">
            {cat?.category_name ?? '—'}
          </span>
        )
      },
    },
    {
      key: 'cost_price',
      label: 'Cost (KRW)',
      render: (row) => (
        <span className="tabular-nums">
          {row.cost_price != null ? Number(row.cost_price).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'selling_price',
      label: 'Selling (USD)',
      render: (row) => (
        <span className="tabular-nums">
          {row.selling_price != null ? `$${Number(row.selling_price).toFixed(2)}` : '—'}
        </span>
      ),
    },
    {
      key: 'selling_price_uzs',
      label: 'Price (UZS)',
      render: (row) => (
        <span className="tabular-nums">
          {row.selling_price_uzs != null
            ? Number(row.selling_price_uzs).toLocaleString()
            : '—'}
        </span>
      ),
    },
    {
      key: 'weight_kg',
      label: <SortHeader label="Weight (kg)" sortKey="packaged_weight_grams" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
      render: (row) => (
        <span className="tabular-nums">
          {row.packaged_weight_grams != null
            ? (row.packaged_weight_grams / 1000).toFixed(2)
            : '—'}
        </span>
      ),
    },
    {
      key: 'cargo',
      label: 'Cargo ($12/kg)',
      minWidth: '110px',
      render: (row) => (
        <span className="tabular-nums">
          {row.packaged_weight_grams != null
            ? `$${((row.packaged_weight_grams / 1000) * 12).toFixed(2)}`
            : '—'}
        </span>
      ),
    },
    {
      key: 'customer_cargo',
      label: 'Cust. Cargo ($13/kg)',
      minWidth: '130px',
      render: (row) => (
        <span className="tabular-nums">
          {row.packaged_weight_grams != null
            ? `$${((row.packaged_weight_grams / 1000) * 13).toFixed(2)}`
            : '—'}
        </span>
      ),
    },
    {
      key: 'times_ordered',
      label: 'Ordered',
      render: (row) => (
        <span className="tabular-nums">{row.times_ordered ?? 0}</span>
      ),
    },
    {
      key: 'stock_quantity',
      label: <SortHeader label="Stock" sortKey="stock_quantity" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
      render: (row) => (
        <span className="tabular-nums">{row.stock_quantity}</span>
      ),
    },
    {
      key: 'status',
      label: <SortHeader label="Status" sortKey="stock_status" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
      render: (row) => getStockBadge(row),
    },
  ]
}
