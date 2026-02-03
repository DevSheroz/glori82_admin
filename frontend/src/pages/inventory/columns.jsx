import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { Pencil, Trash2, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'

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
  if (row.stock_quantity === 0) {
    return <Badge variant="danger">Out of Stock</Badge>
  }
  if (row.stock_quantity <= row.reorder_level) {
    return <Badge variant="warning">Low Stock</Badge>
  }
  return <Badge variant="success">In Stock</Badge>
}

export function getColumns({ categories, onEdit, onDelete, sortBy, sortDir, onSort }) {
  return [
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
          {Number(row.cost_price).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'selling_price',
      label: 'Price (USD)',
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
      key: 'packaged_weight_grams',
      label: <SortHeader label="Weight (g)" sortKey="packaged_weight_grams" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
      render: (row) => (
        <span className="tabular-nums text-(--color-text-subtle)">
          {row.packaged_weight_grams ?? '—'}
        </span>
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
      label: <SortHeader label="Status" sortKey="stock_quantity" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
      render: (row) => getStockBadge(row),
    },
    {
      key: 'actions',
      label: '',
      width: '100px',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(row)}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(row)}
          >
            <Trash2 className="w-3.5 h-3.5 text-(--color-danger)" />
          </Button>
        </div>
      ),
    },
  ]
}
