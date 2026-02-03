import { useState, useEffect, useCallback } from 'react'
import { Plus, ShoppingCart } from 'lucide-react'
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
  const [filterCustomer, setFilterCustomer] = useState('')

  // Pagination
  const [page, setPage] = useState(1)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [saving, setSaving] = useState(false)

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, page_size: PAGE_SIZE }
      if (filterStatus) params.status = filterStatus
      if (filterCustomer) params.customer_id = filterCustomer

      const [ordersRes, customersRes, productsRes, categoriesRes] = await Promise.all([
        ordersApi.getAll(params),
        customersApi.getAll({ page_size: 100 }),
        productsApi.getAll({ page_size: 100 }),
        categoriesApi.getAll({ page_size: 100 }),
      ])
      setOrders(ordersRes.data.data)
      setTotal(ordersRes.data.total)
      setCustomers(customersRes.data.data)
      setProducts(productsRes.data.data)
      setCategories(categoriesRes.data.data)
    } catch (err) {
      setError('Failed to load data. Make sure the backend is running.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterCustomer, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1)
  }, [filterStatus, filterCustomer])

  const handleEdit = (order) => {
    setEditingOrder(order)
    setModalOpen(true)
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

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await ordersApi.delete(deleteTarget.order_id)
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete order.')
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

  const columns = getColumns({
    onEdit: handleEdit,
    onDelete: (order) => setDeleteTarget(order),
    onStatusChange: handleStatusChange,
  })

  const selectClass =
    'rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-1.5 text-sm text-(--color-text-base) focus:outline-none focus:ring-2 focus:ring-(--color-primary)'

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-(--color-text-base)">
            Orders
          </h1>
          <p className="text-sm text-(--color-text-subtle) mt-0.5">
            {total} order{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Add Order
        </Button>
      </div>

      {/* Filters */}
      <Container className="p-3!">
        <div className="flex items-center gap-3 flex-wrap">
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

          <SearchSelect
            value={filterCustomer}
            onChange={(val) => setFilterCustomer(val)}
            placeholder="All Customers"
            options={customers.map((c) => ({
              value: c.customer_id,
              label: c.customer_name,
            }))}
          />

          {(filterStatus || filterCustomer) && (
            <button
              onClick={() => {
                setFilterStatus('')
                setFilterCustomer('')
              }}
              className="text-xs text-(--color-text-subtle) hover:text-(--color-text-base) underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      </Container>

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
              Delete Order
            </h3>
            <p className="text-sm text-(--color-text-subtle) mb-5">
              Are you sure you want to delete{' '}
              <span className="font-medium text-(--color-text-base)">
                {deleteTarget.order_number}
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
