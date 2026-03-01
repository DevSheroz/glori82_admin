import Badge from '../../components/Badge'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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

function getStockBadge(row, t) {
  switch (row.stock_status) {
    case 'out_of_stock':
      return <Badge variant="danger">{t('inventory.stock_status.out_of_stock')}</Badge>
    case 'pre_order':
      return <Badge variant="warning">{t('inventory.stock_status.pre_order')}</Badge>
    case 'purchased':
      return <Badge variant="neutral">{t('inventory.stock_status.purchased')}</Badge>
    default:
      return <Badge variant="success">{t('inventory.stock_status.in_stock')}</Badge>
  }
}

export function getColumns({ categories, usdToUzs, sortBy, sortDir, onSort, selectedIds, onToggleSelect, onToggleAll, allSelected }) {
  const { t } = useTranslation()
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
      label: <SortHeader label={t('inventory.col_name')} sortKey="product_name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
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
      label: <SortHeader label={t('inventory.col_brand')} sortKey="brand" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {row.brand ?? '—'}
        </span>
      ),
    },
    {
      key: 'category',
      label: <SortHeader label={t('inventory.col_category')} sortKey="category_name" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
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
      label: t('inventory.col_cost'),
      render: (row) => (
        <span className="tabular-nums">
          {row.cost_price != null ? Number(row.cost_price).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      key: 'total_uzs',
      label: t('inventory.col_total'),
      minWidth: '140px',
      render: (row) => {
        if (row.selling_price == null || row.packaged_weight_grams == null || !usdToUzs) return <span className="text-(--color-text-muted)">—</span>
        const sellingUsd = Number(row.selling_price)
        const customerCargo = (row.packaged_weight_grams / 1000) * 13
        const totalUsd = sellingUsd + 3 + customerCargo
        const totalUzs = totalUsd * usdToUzs
        return (
          <span className="tabular-nums font-medium">
            {Math.round(totalUzs).toLocaleString()}
          </span>
        )
      },
    },
    {
      key: 'selling_price',
      label: t('inventory.col_selling'),
      render: (row) => (
        <span className="tabular-nums">
          {row.selling_price != null ? `$${Number(row.selling_price).toFixed(2)}` : '—'}
        </span>
      ),
    },
    {
      key: 'selling_price_uzs',
      label: t('inventory.col_selling_uzs'),
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
      label: <SortHeader label={t('inventory.col_weight')} sortKey="packaged_weight_grams" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
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
      label: t('inventory.col_cargo'),
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
      label: t('inventory.col_cust_cargo'),
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
      label: t('inventory.col_ordered'),
      render: (row) => (
        <span className="tabular-nums">{row.times_ordered ?? 0}</span>
      ),
    },
    {
      key: 'stock_quantity',
      label: <SortHeader label={t('inventory.col_stock')} sortKey="stock_quantity" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
      render: (row) => (
        <span className="tabular-nums">{row.stock_quantity}</span>
      ),
    },
    {
      key: 'status',
      label: <SortHeader label={t('common.status')} sortKey="stock_status" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />,
      render: (row) => (
        <div className="flex flex-col gap-1">
          {getStockBadge(row, t)}
          {row.in_shipment_qty > 0 && (
            <Badge variant="info">{t('inventory.in_shipment', { qty: row.in_shipment_qty })}</Badge>
          )}
        </div>
      ),
    },
  ]
}
