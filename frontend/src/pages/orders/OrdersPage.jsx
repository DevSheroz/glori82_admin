import { useState, useEffect, useCallback } from 'react'
import { Plus, ShoppingCart, Pencil, Trash2, X } from 'lucide-react'
import Container from '../../components/Container'
import Button from '../../components/Button'
import Table from '../../components/Table'
import EmptyState from '../../components/EmptyState'
import SearchSelect from '../../components/SearchSelect'
import Pagination from '../../components/Pagination'
import OrderModal from './OrderModal'
import { getColumns } from './columns'
import { ordersApi, customersApi, productsApi, categoriesApi } from '../../lib/api'

const PAGE_SIZE = 20

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('')
  const [filterCustomer, setFilterCustomer] = useState('')

  // Sorting
  const [sortBy, setSortBy] = useState('')
  const [sortDir, setSortDir] = useState('asc')

  // Pagination
  const [page, setPage] = useState(1)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
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
      if (filterStatus) params.status = filterStatus
      if (filterPaymentStatus) params.payment_status = filterPaymentStatus
      if (filterCustomer) params.customer_id = filterCustomer
      if (sortBy) {
        params.sort_by = sortBy
        params.sort_dir = sortDir
      }

      const [ordersRes, customersRes, productsRes, categoriesRes] = await Promise.all([
        ordersApi.getAll(params),
        customersApi.getAll({ page_size: 100 }),
        productsApi.getAll({ page_size: 100 }),
        categoriesApi.getAll({ page_size: 100 }),
      ])
      setOrders(ordersRes.data.data)
      setTotal(ordersRes.data.total)
      setSelectedIds(new Set())
      setCustomers(customersRes.data.data)
      setProducts(productsRes.data.data)
      setCategories(categoriesRes.data.data)
    } catch (err) {
      setError('Failed to load data. Make sure the backend is running.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterPaymentStatus, filterCustomer, sortBy, sortDir, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [filterStatus, filterPaymentStatus, filterCustomer])

  const handleEditSelected = () => {
    const orderId = [...selectedIds][0]
    const order = orders.find((o) => o.order_id === orderId)
    if (order) {
      setEditingOrder(order)
      setModalOpen(true)
    }
  }

  const handleCreate = () => {
    setEditingOrder(null)
    setModalOpen(true)
  }

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (editingOrder) {
        await ordersApi.update(editingOrder.order_id, data)
      } else {
        await ordersApi.create(data)
      }
      setModalOpen(false)
      setEditingOrder(null)
      fetchData()
    } catch (err) {
      console.error('Save failed:', err)
      alert('Failed to save order. Check the console for details.')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!deleteTarget) return
    try {
      await Promise.all(deleteTarget.map((id) => ordersApi.delete(id)))
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete orders.')
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await ordersApi.update(orderId, { status: newStatus })
      fetchData()
    } catch (err) {
      console.error('Status update failed:', err)
    }
  }

  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    try {
      await ordersApi.update(orderId, { payment_status: newPaymentStatus })
      fetchData()
    } catch (err) {
      console.error('Payment status update failed:', err)
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

  const toggleSelect = (orderId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(orderId)) next.delete(orderId)
      else next.add(orderId)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(orders.map((o) => o.order_id)))
    }
  }

  const columns = getColumns({
    onStatusChange: handleStatusChange,
    onPaymentStatusChange: handlePaymentStatusChange,
    selectedIds,
    onToggleSelect: toggleSelect,
    onToggleAll: toggleAll,
    allSelected: orders.length > 0 && selectedIds.size === orders.length,
    sortBy,
    sortDir,
    onSort: handleSort,
  })

  const selectClass =
    'rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-1.5 text-sm text-(--color-text-base) focus:outline-none focus:ring-2 focus:ring-(--color-primary)'

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-(--color-text-base)">
            Orders
          </h1>
          <p className="text-sm text-(--color-text-subtle) mt-0.5">
            {total} order{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Add Order
        </Button>
      </div>

      {/* Filters */}
      <Container className="p-3!">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="shipped">Shipped</option>
            <option value="received">Received</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">All Payment</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid_card">Paid (Card)</option>
            <option value="paid_cash">Paid (Cash)</option>
            <option value="partial">Partial Payment</option>
            <option value="prepayment">Prepayment</option>
          </select>

          <SearchSelect
            value={filterCustomer}
            onChange={(val) => setFilterCustomer(val)}
            placeholder="All Customers"
            options={customers.map((c) => ({
              value: c.customer_id,
              label: c.customer_name,
            }))}
          />

          {(filterStatus || filterPaymentStatus || filterCustomer) && (
            <button
              onClick={() => {
                setFilterStatus('')
                setFilterPaymentStatus('')
                setFilterCustomer('')
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
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="No orders found"
            description="Create your first order to get started."
          />
        ) : (
          <>
            <Table columns={columns} data={orders} />
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onChange={setPage}
            />
          </>
        )}
      </Container>

      {/* Order Modal */}
      <OrderModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingOrder(null)
        }}
        onSave={handleSave}
        order={editingOrder}
        customers={customers}
        products={products}
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
              Delete {deleteTarget.length === 1 ? 'Order' : `${deleteTarget.length} Orders`}
            </h3>
            <p className="text-sm text-(--color-text-subtle) mb-5">
              Are you sure you want to delete{' '}
              <span className="font-medium text-(--color-text-base)">
                {deleteTarget.length === 1
                  ? orders.find((o) => o.order_id === deleteTarget[0])?.order_number
                  : `${deleteTarget.length} orders`}
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
