import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ShoppingBag, X, ChevronUp, ChevronDown, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Container from '../../components/Container'
import Button from '../../components/Button'
import EmptyState from '../../components/EmptyState'
import { ordersApi } from '../../lib/api'

export default function ShoppingListPage() {
  const { t } = useTranslation()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [search, setSearch] = useState('')
  const [inputValues, setInputValues] = useState({})
  const debounceTimers = useRef({})

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await ordersApi.getShoppingList()
      setItems(res.data)
    } catch (err) {
      setError(t('shopping.failed_load'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { fetchData() }, [fetchData])

  const handleReset = async () => {
    try {
      await ordersApi.resetOverrides()
      setInputValues({})
      await fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const productKey = (item) => item.product_id ?? `name:${item.product_name}`

  const handleRemoveOrder = async (pKey, itemId) => {
    setItems((prev) =>
      prev
        .map((item) =>
          productKey(item) !== pKey
            ? item
            : { ...item, orders: item.orders.filter((o) => o.item_id !== itemId) }
        )
        .filter((item) => item.orders.length > 0)
    )
    try {
      await ordersApi.saveOverride({ item_id: itemId, is_removed: true })
    } catch (err) {
      console.error(err)
      fetchData()
    }
  }

  const handleSort = (key) => {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortBy(key); setSortDir('asc') }
  }

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter((item) => {
      const inProduct = (item.product_name || '').toLowerCase().includes(q)
      const inBrand = (item.brand || '').toLowerCase().includes(q)
      const inCategory = (item.category_name || '').toLowerCase().includes(q)
      const inAttrs = (item.product_attributes || '').toLowerCase().includes(q)
      const inCustomers = item.orders.some((o) => (o.customer_name || '').toLowerCase().includes(q))
      return inProduct || inBrand || inCategory || inAttrs || inCustomers
    })
  }, [items, search])

  const sortedItems = useMemo(() => {
    if (!sortBy) return filteredItems
    return [...filteredItems].sort((a, b) => {
      const valA = (a[sortBy] || '').toLowerCase()
      const valB = (b[sortBy] || '').toLowerCase()
      if (valA < valB) return sortDir === 'asc' ? -1 : 1
      if (valA > valB) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredItems, sortBy, sortDir])

  const SortIcon = ({ col }) => (
    <span className="inline-flex flex-col ml-1 opacity-40">
      <ChevronUp className={`w-2.5 h-2.5 -mb-0.5 ${sortBy === col && sortDir === 'asc' ? 'opacity-100 text-(--color-primary)' : ''}`} />
      <ChevronDown className={`w-2.5 h-2.5 ${sortBy === col && sortDir === 'desc' ? 'opacity-100 text-(--color-primary)' : ''}`} />
    </span>
  )

  const handleQtyChange = (pKey, itemId, rawVal) => {
    // Show raw string while typing — don't touch items state yet
    setInputValues((prev) => ({ ...prev, [itemId]: rawVal }))

    clearTimeout(debounceTimers.current[itemId])
    debounceTimers.current[itemId] = setTimeout(async () => {
      const qty = parseInt(rawVal)
      if (!isNaN(qty) && qty > 0) {
        // Valid — update state and clear raw input (input now shows saved value)
        setItems((prev) =>
          prev.map((item) => {
            if (productKey(item) !== pKey) return item
            return { ...item, orders: item.orders.map((o) => (o.item_id === itemId ? { ...o, quantity: qty } : o)) }
          })
        )
        setInputValues((prev) => { const n = { ...prev }; delete n[itemId]; return n })
        try { await ordersApi.saveOverride({ item_id: itemId, quantity_override: qty, is_removed: false }) } catch (e) { console.error(e) }
      }
      // Invalid — leave inputValues alone so user can keep editing
    }, 800)
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-(--color-text-base)">
            {t('shopping.title')}
          </h1>
          <p className="text-sm text-(--color-text-subtle) mt-0.5">
            {t('shopping.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('shopping.search_placeholder')}
            className="w-full sm:w-56 rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-1.5 text-sm text-(--color-text-base) placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
          />
          <button
            onClick={handleReset}
            title={t('shopping.reset')}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-(--color-text-subtle) ring-1 ring-(--color-border-base) hover:text-(--color-danger) hover:ring-red-300 hover:bg-red-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('shopping.reset')}</span>
          </button>
        </div>
      </div>

      <Container className="p-0!">
        {loading ? (
          <div className="divide-y divide-(--color-border-base)">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="h-4 bg-(--color-bg-component) rounded animate-pulse" style={{ width: `${60 + j * 50}px` }} />
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-(--color-danger)">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchData} className="mt-3">{t('common.retry')}</Button>
          </div>
        ) : items.length === 0 ? (
          <EmptyState icon={ShoppingBag} title={t('shopping.no_items')} description={t('shopping.no_items_desc')} />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--color-border-base) bg-(--color-bg-subtle)">
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-(--color-text-subtle) uppercase tracking-wider">{t('common.product')}</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-(--color-text-subtle) uppercase tracking-wider cursor-pointer select-none hover:text-(--color-text-base) transition-colors" onClick={() => handleSort('brand')}>
                      {t('orders.brand')}<SortIcon col="brand" />
                    </th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-(--color-text-subtle) uppercase tracking-wider cursor-pointer select-none hover:text-(--color-text-base) transition-colors" onClick={() => handleSort('category_name')}>
                      {t('orders.category')}<SortIcon col="category_name" />
                    </th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-(--color-text-subtle) uppercase tracking-wider">{t('shopping.total_qty')}</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-(--color-text-subtle) uppercase tracking-wider">{t('shopping.needed_by')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--color-border-base)">
                  {sortedItems.map((item) => {
                    const pKey = productKey(item)
                    const totalQty = item.orders.reduce((s, o) => s + o.quantity, 0)
                    return (
                      <tr key={pKey} className="hover:bg-(--color-bg-subtle)/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-(--color-text-base)">{item.product_name}</div>
                          {item.product_attributes && (
                            <div className="text-xs text-(--color-text-muted) mt-0.5">{item.product_attributes}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-(--color-text-subtle)">{item.brand || '—'}</td>
                        <td className="px-4 py-3 text-(--color-text-subtle)">{item.category_name || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded-full bg-(--color-bg-component) text-(--color-text-base) font-semibold tabular-nums">
                            ×{totalQty}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {item.orders.map((o) => (
                              <span key={o.item_id} className="inline-flex items-center gap-1 text-xs bg-(--color-bg-component) ring-1 ring-(--color-border-base) px-2 py-0.5 rounded-full">
                                <span className="font-medium text-(--color-text-base)">{o.customer_name || '—'}</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={inputValues[o.item_id] ?? o.quantity}
                                  onChange={(e) => handleQtyChange(pKey, o.item_id, e.target.value)}
                                  className="w-8 text-center bg-transparent text-(--color-text-muted) tabular-nums focus:outline-none focus:text-(--color-text-base) [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveOrder(pKey, o.item_id)}
                                  className="text-(--color-text-muted) hover:text-(--color-danger) transition-colors cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-(--color-border-base)">
              <div className="flex items-center gap-2 px-4 py-2 bg-(--color-bg-subtle) border-b border-(--color-border-base)">
                <span className="text-xs text-(--color-text-muted)">{t('common.sort_by')}:</span>
                {['brand', 'category_name'].map((col) => (
                  <button
                    key={col}
                    onClick={() => handleSort(col)}
                    className={`flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded transition-colors ${sortBy === col ? 'text-(--color-primary)' : 'text-(--color-text-subtle) hover:text-(--color-text-base)'}`}
                  >
                    {col === 'brand' ? t('orders.brand') : t('orders.category')}
                    <SortIcon col={col} />
                  </button>
                ))}
              </div>
              {sortedItems.map((item) => {
                const pKey = productKey(item)
                const totalQty = item.orders.reduce((s, o) => s + o.quantity, 0)
                return (
                  <div key={pKey} className="px-4 py-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-medium text-(--color-text-base)">{item.product_name}</span>
                        {item.product_attributes && (
                          <div className="text-xs text-(--color-text-muted) mt-0.5">{item.product_attributes}</div>
                        )}
                      </div>
                      <span className="shrink-0 inline-flex items-center justify-center min-w-8 px-2 py-0.5 rounded-full bg-(--color-bg-component) text-(--color-text-base) font-semibold tabular-nums">
                        ×{totalQty}
                      </span>
                    </div>
                    {(item.brand || item.category_name) && (
                      <div className="text-xs text-(--color-text-subtle)">
                        {[item.brand, item.category_name].filter(Boolean).join(' · ')}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {item.orders.map((o) => (
                        <span key={o.item_id} className="inline-flex items-center gap-1 text-xs bg-(--color-bg-component) ring-1 ring-(--color-border-base) px-2 py-0.5 rounded-full">
                          <span className="font-medium text-(--color-text-base)">{o.customer_name || '—'}</span>
                          <input
                            type="number"
                            min="0"
                            value={inputValues[o.item_id] ?? o.quantity}
                            onChange={(e) => handleQtyChange(pKey, o.item_id, e.target.value)}
                            className="w-8 text-center bg-transparent text-(--color-text-muted) tabular-nums focus:outline-none focus:text-(--color-text-base) [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveOrder(pKey, o.item_id)}
                            className="text-(--color-text-muted) hover:text-(--color-danger) transition-colors cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </Container>
    </div>
  )
}
