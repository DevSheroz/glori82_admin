import { useState, useEffect, useCallback } from 'react'
import { Plus, Package, Pencil, Trash2, X } from 'lucide-react'
import Container from '../../components/Container'
import Button from '../../components/Button'
import Table from '../../components/Table'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import ProductModal from './ProductModal'
import { getColumns } from './columns'
import { productsApi, categoriesApi } from '../../lib/api'

const PAGE_SIZE = 20

export default function InventoryPage() {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [categories, setCategories] = useState([])
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

      const [productsRes, categoriesRes] = await Promise.all([
        productsApi.getAll(params),
        categoriesApi.getAll({ page_size: 100 }),
      ])
      setProducts(productsRes.data.data)
      setTotal(productsRes.data.total)
      setSelectedIds(new Set())
      setCategories(categoriesRes.data.data)
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
      {selectedIds.size > 0 && (
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
      )}

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
            <Table columns={columns} data={products} />
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
