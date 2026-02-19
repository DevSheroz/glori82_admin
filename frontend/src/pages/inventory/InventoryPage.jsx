import { useState, useEffect, useCallback } from 'react'
import { Plus, Package, Pencil, Trash2, X } from 'lucide-react'
import Container from '../../components/Container'
import Button from '../../components/Button'
import Table from '../../components/Table'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import ProductModal from './ProductModal'
import { getColumns } from './columns'
import { productsApi, categoriesApi, currencyApi } from '../../lib/api'

const PAGE_SIZE = 20

function ProductCard({ product, categories, usdToUzs, selected, onToggleSelect, onEdit, onDelete }) {
  const attrs = product.attribute_values ?? []
  const attrText = attrs.map((a) => `${a.attribute_name}: ${a.value}`).join(', ')
  const cat = categories.find((c) => c.category_id === product.category_id)

  let totalUzs = null
  if (product.selling_price != null && product.packaged_weight_grams != null && usdToUzs) {
    const customerCargo = (product.packaged_weight_grams / 1000) * 13
    totalUzs = Math.round((Number(product.selling_price) + 3 + customerCargo) * usdToUzs)
  }

  const weightKg = product.packaged_weight_grams != null ? (product.packaged_weight_grams / 1000).toFixed(2) : null
  const cargo = product.packaged_weight_grams != null ? ((product.packaged_weight_grams / 1000) * 12).toFixed(2) : null

  let stockBadgeClass = 'text-green-700 bg-green-50 ring-1 ring-green-200'
  let stockLabel = 'In Stock'
  if (product.stock_status === 'out_of_stock') {
    stockBadgeClass = 'text-red-600 bg-red-50 ring-1 ring-red-200'
    stockLabel = 'Out of Stock'
  } else if (product.stock_status === 'pre_order') {
    stockBadgeClass = 'text-amber-600 bg-amber-50 ring-1 ring-amber-200'
    stockLabel = 'Pre-order'
  }

  return (
    <div className={`p-4 space-y-3 transition-colors ${selected ? 'bg-blue-50/40' : ''}`}>
      {/* Row 1: checkbox + name + stock badge */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(product.product_id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-(--color-text-base) leading-snug">{product.product_name}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${stockBadgeClass}`}>
              {stockLabel}
            </span>
          </div>
          {attrText && (
            <div className="text-xs text-(--color-text-muted) mt-0.5">{attrText}</div>
          )}
          {!attrText && product.description && (
            <div className="text-xs text-(--color-text-muted) mt-0.5 truncate">{product.description}</div>
          )}
          <div className="text-xs text-(--color-text-subtle) mt-1 flex items-center gap-1.5">
            {product.brand && <span>{product.brand}</span>}
            {product.brand && cat && <span className="opacity-30">·</span>}
            {cat && <span>{cat.category_name}</span>}
          </div>
        </div>
      </div>

      {/* Row 2: prices */}
      <div className="ml-7 grid grid-cols-3 gap-2">
        <div>
          <div className="text-xs text-(--color-text-muted) mb-0.5">Cost (KRW)</div>
          <span className="tabular-nums text-sm font-medium">
            {product.cost_price != null ? Number(product.cost_price).toLocaleString() : '—'}
          </span>
        </div>
        <div>
          <div className="text-xs text-(--color-text-muted) mb-0.5">Selling (USD)</div>
          <span className="tabular-nums text-sm font-medium">
            {product.selling_price != null ? `$${Number(product.selling_price).toFixed(2)}` : '—'}
          </span>
        </div>
        <div>
          <div className="text-xs text-(--color-text-muted) mb-0.5">Total (UZS)</div>
          <span className="tabular-nums text-sm font-medium">
            {totalUzs != null ? totalUzs.toLocaleString() : '—'}
          </span>
        </div>
      </div>

      {/* Row 3: weight / cargo / stock qty / times ordered */}
      <div className="ml-7 flex items-center gap-4 text-sm">
        {weightKg && (
          <div>
            <div className="text-xs text-(--color-text-muted) mb-0.5">Weight</div>
            <span className="tabular-nums">{weightKg} kg</span>
          </div>
        )}
        {cargo && (
          <div>
            <div className="text-xs text-(--color-text-muted) mb-0.5">Cargo</div>
            <span className="tabular-nums">${cargo}</span>
          </div>
        )}
        <div>
          <div className="text-xs text-(--color-text-muted) mb-0.5">Stock</div>
          <span className="tabular-nums">{product.stock_quantity}</span>
        </div>
        <div>
          <div className="text-xs text-(--color-text-muted) mb-0.5">Ordered</div>
          <span className="tabular-nums">{product.times_ordered ?? 0}</span>
        </div>
      </div>

      {/* Row 4: actions */}
      <div className="ml-7 flex justify-end gap-1">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-md text-(--color-text-subtle) hover:text-(--color-text-base) hover:bg-(--color-bg-component) transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function InventoryPage() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState([])
  const [usdToUzs, setUsdToUzs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [filterCategory, setFilterCategory] = useState('')
  const [filterActive, setFilterActive] = useState('all')

  // Sorting
  const [sortBy, setSortBy] = useState('')
  const [sortDir, setSortDir] = useState('asc')

  // Pagination
  const [page, setPage] = useState(1)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [saving, setSaving] = useState(false)

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, page_size: PAGE_SIZE }
      if (filterCategory) params.category_id = filterCategory
      if (filterActive !== 'all') params.is_active = filterActive === 'active'
      if (sortBy) {
        params.sort_by = sortBy
        params.sort_dir = sortDir
      }

      const [productsRes, categoriesRes, ratesRes] = await Promise.all([
        productsApi.getAll(params),
        categoriesApi.getAll({ page_size: 100 }),
        currencyApi.getRates(),
      ])
      setProducts(productsRes.data.data)
      setTotal(productsRes.data.total)
      setSelectedIds(new Set())
      setCategories(categoriesRes.data.data)
      setUsdToUzs(ratesRes.data.usd_to_uzs || 0)
    } catch (err) {
      setError('Failed to load data. Make sure the backend is running.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterActive, sortBy, sortDir, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [filterCategory, filterActive])

  const handleEditSelected = () => {
    const productId = [...selectedIds][0]
    const product = products.find((p) => p.product_id === productId)
    if (product) {
      setEditingProduct(product)
      setModalOpen(true)
    }
  }

  const handleCreate = () => {
    setEditingProduct(null)
    setModalOpen(true)
  }

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.product_id, data)
      } else {
        await productsApi.create(data)
      }
      setModalOpen(false)
      setEditingProduct(null)
      fetchData()
    } catch (err) {
      console.error('Save failed:', err)
      alert('Failed to save product. Check the console for details.')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!deleteTarget) return
    try {
      await Promise.all(deleteTarget.map((id) => productsApi.delete(id)))
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete products.')
    }
  }

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const toggleSelect = (productId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(products.map((p) => p.product_id)))
    }
  }

  const columns = getColumns({
    categories,
    usdToUzs,
    sortBy,
    sortDir,
    onSort: handleSort,
    selectedIds,
    onToggleSelect: toggleSelect,
    onToggleAll: toggleAll,
    allSelected: products.length > 0 && selectedIds.size === products.length,
  })

  const selectClass =
    'rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-1.5 text-sm text-(--color-text-base) focus:outline-none focus:ring-2 focus:ring-(--color-primary)'

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-(--color-text-base)">
            Inventory
          </h1>
          <p className="text-sm text-(--color-text-subtle) mt-0.5">
            {total} product{total !== 1 ? 's' : ''} in catalog
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <Container className="p-3!">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className={selectClass}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>

          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className={selectClass}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {(filterCategory || filterActive !== 'all') && (
            <button
              onClick={() => {
                setFilterCategory('')
                setFilterActive('all')
              }}
              className="text-xs text-(--color-text-subtle) hover:text-(--color-text-base) underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </Container>

      {/* Bulk Actions */}
      <div
        className={`grid transition-all duration-200 ease-out ${
          selectedIds.size > 0 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <Container className="p-3!">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-(--color-text-base)">
                {selectedIds.size} selected
              </span>
              <div className="flex items-center gap-2">
                {selectedIds.size === 1 && (
                  <Button variant="secondary" size="sm" onClick={handleEditSelected}>
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteTarget([...selectedIds])}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete ({selectedIds.size})
                </Button>
              </div>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-auto text-xs text-(--color-text-subtle) hover:text-(--color-text-base) cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </Container>
        </div>
      </div>

      {/* Table */}
      <Container className="p-0!">
        {loading ? (
          <div className="divide-y divide-(--color-border-base)">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                {Array.from({ length: 6 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-4 bg-(--color-bg-component) rounded animate-pulse"
                    style={{ width: `${60 + Math.random() * 80}px` }}
                  />
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-(--color-danger)">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchData} className="mt-3">
              Retry
            </Button>
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description="Add your first product to get started."
          />
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-(--color-border-base) max-h-[calc(100vh-220px)] overflow-y-auto">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-(--color-bg-subtle) border-b border-(--color-border-base)">
                <input
                  type="checkbox"
                  checked={products.length > 0 && selectedIds.size === products.length}
                  onChange={toggleAll}
                  className="rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer"
                />
                <span className="text-xs text-(--color-text-subtle)">Select all</span>
              </div>
              {products.map((product) => (
                <ProductCard
                  key={product.product_id}
                  product={product}
                  categories={categories}
                  usdToUzs={usdToUzs}
                  selected={selectedIds.has(product.product_id)}
                  onToggleSelect={toggleSelect}
                  onEdit={() => { setEditingProduct(product); setModalOpen(true) }}
                  onDelete={() => setDeleteTarget([product.product_id])}
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block">
              <Table columns={columns} data={products} />
            </div>

            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onChange={setPage}
            />
          </>
        )}
      </Container>

      {/* Product Modal */}
      <ProductModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingProduct(null)
        }}
        onSave={handleSave}
        product={editingProduct}
        categories={categories}
        saving={saving}
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-lg ring-1 ring-(--color-border-base) shadow-lg w-full max-w-sm mx-4 p-5">
            <h3 className="text-base font-semibold text-(--color-text-base) mb-2">
              Delete {deleteTarget.length === 1 ? 'Product' : `${deleteTarget.length} Products`}
            </h3>
            <p className="text-sm text-(--color-text-subtle) mb-5">
              Are you sure you want to delete{' '}
              <span className="font-medium text-(--color-text-base)">
                {deleteTarget.length === 1
                  ? products.find((p) => p.product_id === deleteTarget[0])?.product_name
                  : `${deleteTarget.length} products`}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleBulkDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
