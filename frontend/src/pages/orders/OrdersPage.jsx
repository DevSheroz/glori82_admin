import { useState, useEffect, useCallback } from 'react'
import { Plus, ShoppingCart, Pencil, Trash2, X, Package } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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

// Color maps (mirrored from columns.jsx for the mobile card view)
const cardStatusColors = {
  pending: 'text-amber-600 bg-amber-50 ring-amber-200',
  shipped: 'text-gray-600 bg-gray-50 ring-gray-200',
  arrived: 'text-teal-600 bg-teal-50 ring-teal-200',
  received: 'text-blue-600 bg-blue-50 ring-blue-200',
  completed: 'text-green-600 bg-green-50 ring-green-200',
}

const cardPaymentColors = {
  unpaid: 'text-red-600 bg-red-50 ring-red-200',
  paid_card: 'text-green-600 bg-green-50 ring-green-200',
  paid_cash: 'text-green-600 bg-green-50 ring-green-200',
  partial: 'text-amber-600 bg-amber-50 ring-amber-200',
  prepayment: 'text-purple-600 bg-purple-50 ring-purple-200',
}

const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`

function OrderCard({ order, selected, onToggleSelect, onEdit, onDelete, onStatusChange, onPaymentStatusChange }) {
  const { t } = useTranslation()

  const cardStatusOptions = [
    { value: 'pending', label: t('orders.status.pending') },
    { value: 'shipped', label: t('orders.status.shipped') },
    { value: 'arrived', label: t('orders.status.arrived') },
    { value: 'received', label: t('orders.status.received') },
    { value: 'completed', label: t('orders.status.completed') },
  ]

  const cardPaymentOptions = [
    { value: 'unpaid', label: t('orders.payment.unpaid') },
    { value: 'paid_card', label: t('orders.payment.paid_card') },
    { value: 'paid_cash', label: t('orders.payment.paid_cash') },
    { value: 'partial', label: t('orders.payment.partial') },
    { value: 'prepayment', label: t('orders.payment.prepayment') },
  ]

  return (
    <div className={`p-4 space-y-3 transition-colors ${selected ? 'bg-blue-50/40' : ''}`}>
      {/* Row 1: checkbox + order # + date */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(order.order_id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-(--color-text-base)">{order.order_number}</span>
            <span className="text-xs text-(--color-text-subtle) tabular-nums shrink-0">
              {order.order_date
                ? new Date(order.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—'}
            </span>
          </div>
          <div className="text-sm text-(--color-text-subtle) mt-0.5">{order.customer_name || 'TBA'}</div>
          {order.shipping_number && (
            <div className="text-xs text-(--color-text-muted) mt-0.5 flex items-center gap-1">
              <Package className="w-3 h-3" />
              {order.shipping_number}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: products */}
      {order.items && order.items.length > 0 && (
        <div className="ml-7 space-y-1">
          {order.items.map((it, i) => {
            const inStock = it.from_stock === true
            return (
              <div
                key={it.item_id ?? i}
                className={`flex items-start justify-between gap-2 text-sm ${
                  inStock ? 'bg-emerald-50 ring-1 ring-emerald-200 rounded px-1.5 py-0.5 -mx-1.5' : ''
                }`}
              >
                <span className="text-(--color-text-base)">
                  {it.product_name}
                  {it.product_attributes && (
                    <span className="text-(--color-text-muted) text-xs ml-1">({it.product_attributes})</span>
                  )}
                </span>
                <span className="text-(--color-text-muted) tabular-nums shrink-0">x{it.quantity}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Row 3: amounts */}
      <div className="ml-7 flex items-center gap-5">
        <div>
          <div className="text-xs text-(--color-text-muted) mb-0.5">{t('orders.total_uzs')}</div>
          {order.final_amount_uzs != null ? (
            <span className="tabular-nums font-semibold text-emerald-700 flex items-center gap-1 text-sm">
              {Number(order.final_amount_uzs).toLocaleString()}
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-1 py-0.5 rounded">FINAL</span>
            </span>
          ) : (
            <span className="tabular-nums font-semibold text-sm">
              {order.total_price_uzs != null ? Number(order.total_price_uzs).toLocaleString() : '—'}
            </span>
          )}
        </div>
        {order.unpaid != null && Number(order.unpaid) > 0 && (
          <div>
            <div className="text-xs text-(--color-text-muted) mb-0.5">{t('orders.payment.unpaid')}</div>
            <span className="tabular-nums font-semibold text-red-600 text-sm">
              {Number(order.unpaid).toLocaleString()} UZS
            </span>
            {Number(order.budget_applied_uzs) > 0 && (
              <div className="mt-0.5">
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 ring-1 ring-emerald-200 rounded px-1.5 py-0.5">
                  budget −{Math.round(Number(order.budget_applied_uzs)).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Row 4: status/payment dropdowns + edit/delete */}
      <div className="ml-7 flex items-center gap-2 flex-wrap">
        <select
          value={order.status}
          onChange={(e) => {
            e.stopPropagation()
            if (e.target.value !== order.status) onStatusChange(order.order_id, e.target.value)
          }}
          onClick={(e) => e.stopPropagation()}
          className={`text-xs font-medium rounded-full px-2.5 py-1 ring-1 cursor-pointer appearance-none pr-6 bg-size-12px bg-position-[right_6px_center] bg-no-repeat ${cardStatusColors[order.status] || ''}`}
          style={{ backgroundImage: chevronSvg }}
        >
          {cardStatusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <select
          value={order.payment_status || 'unpaid'}
          onChange={(e) => {
            e.stopPropagation()
            if (e.target.value !== order.payment_status) onPaymentStatusChange(order.order_id, e.target.value, order)
          }}
          onClick={(e) => e.stopPropagation()}
          className={`text-xs font-medium rounded-full px-2.5 py-1 ring-1 cursor-pointer appearance-none pr-6 bg-size-12px bg-position-[right_6px_center] bg-no-repeat ${cardPaymentColors[order.payment_status] || cardPaymentColors.unpaid}`}
          style={{ backgroundImage: chevronSvg }}
        >
          {cardPaymentOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center gap-1">
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
    </div>
  )
}

export default function OrdersPage() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState([])
  const [total, setTotal] = useState(0)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [stockProducts, setStockProducts] = useState([])
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

  // Payment amount prompt (for partial/prepayment)
  const [paymentPrompt, setPaymentPrompt] = useState(null)

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
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

      const [ordersRes, customersRes, productsRes, categoriesRes, stockRes] = await Promise.all([
        ordersApi.getAll(params),
        customersApi.getAll({ page_size: 100 }),
        productsApi.getAll({ page_size: 100 }),
        categoriesApi.getAll({ page_size: 100 }),
        productsApi.getAll({ page_size: 100, stock_status: 'in_stock' }),
      ])
      setOrders(ordersRes.data.data)
      setTotal(ordersRes.data.total)
      setSelectedIds(new Set())
      setCustomers(customersRes.data.data)
      setProducts(productsRes.data.data)
      setStockProducts(stockRes.data.data)
      setCategories(categoriesRes.data.data)
    } catch (err) {
      setError(t('orders.failed_load'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, filterPaymentStatus, filterCustomer, sortBy, sortDir, page, t])

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
      alert(t('orders.failed_save'))
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
      alert(t('orders.failed_delete'))
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    // Optimistic update — keeps the select at the new value immediately
    setOrders((prev) => prev.map((o) => o.order_id === orderId ? { ...o, status: newStatus } : o))
    try {
      await ordersApi.update(orderId, { status: newStatus })
      fetchData(true) // sync final_amount_uzs and any other computed fields
    } catch (err) {
      console.error('Status update failed:', err)
      fetchData(true) // revert to server state on error
    }
  }

  const handlePaymentStatusChange = async (orderId, newPaymentStatus, row) => {
    if (newPaymentStatus === 'partial' || newPaymentStatus === 'prepayment') {
      setPaymentPrompt({
        orderId,
        status: newPaymentStatus,
        total: row?.total_price_uzs ? Number(row.total_price_uzs) : 0,
        orderNumber: row?.order_number,
        amount: '',
        method: 'card',
      })
      return
    }

    // Optimistic update
    setOrders((prev) => prev.map((o) => o.order_id === orderId ? { ...o, payment_status: newPaymentStatus } : o))
    try {
      const update = { payment_status: newPaymentStatus }
      const total = row?.total_price_uzs ? Number(row.total_price_uzs) : 0

      if (newPaymentStatus === 'paid_card') {
        update.paid_card = total
        update.paid_cash = 0
      } else if (newPaymentStatus === 'paid_cash') {
        update.paid_card = 0
        update.paid_cash = total
      } else if (newPaymentStatus === 'unpaid') {
        update.paid_card = 0
        update.paid_cash = 0
      }

      await ordersApi.update(orderId, update)
      fetchData(true)
    } catch (err) {
      console.error('Payment status update failed:', err)
      fetchData(true) // revert on error
    }
  }

  const handlePaymentPromptSave = async () => {
    if (!paymentPrompt) return
    try {
      const amount = Number(paymentPrompt.amount) || 0
      const update = {
        payment_status: paymentPrompt.status,
        paid_card: paymentPrompt.method === 'card' ? amount : 0,
        paid_cash: paymentPrompt.method === 'cash' ? amount : 0,
      }
      await ordersApi.update(paymentPrompt.orderId, update)
      setPaymentPrompt(null)
      fetchData(true)
    } catch (err) {
      console.error('Payment update failed:', err)
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
            {t('orders.title')}
          </h1>
          <p className="text-sm text-(--color-text-subtle) mt-0.5">
            {total !== 1 ? t('orders.count_plural', { count: total }) : t('orders.count', { count: total })}
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          {t('orders.add')}
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
            <option value="">{t('common.all_status')}</option>
            <option value="pending">{t('orders.status.pending')}</option>
            <option value="shipped">{t('orders.status.shipped')}</option>
            <option value="arrived">{t('orders.status.arrived')}</option>
            <option value="received">{t('orders.status.received')}</option>
            <option value="completed">{t('orders.status.completed')}</option>
          </select>

          <select
            value={filterPaymentStatus}
            onChange={(e) => setFilterPaymentStatus(e.target.value)}
            className={selectClass}
          >
            <option value="">{t('orders.payment.all')}</option>
            <option value="unpaid">{t('orders.payment.unpaid')}</option>
            <option value="paid_card">{t('orders.payment.paid_card')}</option>
            <option value="paid_cash">{t('orders.payment.paid_cash')}</option>
            <option value="partial">{t('orders.payment.partial')}</option>
            <option value="prepayment">{t('orders.payment.prepayment')}</option>
          </select>

          <SearchSelect
            value={filterCustomer}
            onChange={(val) => setFilterCustomer(val)}
            placeholder={t('orders.all_customers')}
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
              {t('common.clear_filters')}
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
                {t('common.selected', { count: selectedIds.size })}
              </span>
              <div className="flex items-center gap-2">
                {selectedIds.size === 1 && (
                  <Button variant="secondary" size="sm" onClick={handleEditSelected}>
                    <Pencil className="w-3.5 h-3.5" />
                    {t('common.edit')}
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteTarget([...selectedIds])}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('common.delete')} ({selectedIds.size})
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
              {t('common.retry')}
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title={t('orders.no_found')}
            description={t('orders.no_found_desc')}
          />
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-(--color-border-base) max-h-[calc(100vh-220px)] overflow-y-auto">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-(--color-bg-subtle) border-b border-(--color-border-base)">
                <input
                  type="checkbox"
                  checked={orders.length > 0 && selectedIds.size === orders.length}
                  onChange={toggleAll}
                  className="rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer"
                />
                <span className="text-xs text-(--color-text-subtle)">{t('common.select_all')}</span>
              </div>
              {orders.map((order) => (
                <OrderCard
                  key={order.order_id}
                  order={order}
                  selected={selectedIds.has(order.order_id)}
                  onToggleSelect={toggleSelect}
                  onEdit={() => { setEditingOrder(order); setModalOpen(true) }}
                  onDelete={() => setDeleteTarget([order.order_id])}
                  onStatusChange={handleStatusChange}
                  onPaymentStatusChange={handlePaymentStatusChange}
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block">
              <Table columns={columns} data={orders} />
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
        stockProducts={stockProducts}
        categories={categories}
        saving={saving}
      />

      {/* Payment Amount Prompt */}
      {paymentPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setPaymentPrompt(null)}
          />
          <div className="relative bg-white rounded-lg ring-1 ring-(--color-border-base) shadow-lg w-full max-w-sm mx-4 p-5">
            <h3 className="text-base font-semibold text-(--color-text-base) mb-1">
              {paymentPrompt.status === 'prepayment' ? t('orders.payment.prepayment') : t('orders.partial_payment')}
            </h3>
            <p className="text-sm text-(--color-text-subtle) mb-4">
              {paymentPrompt.orderNumber}
              {paymentPrompt.total > 0 && (
                <span className="ml-1">
                  — Total: <span className="font-medium text-(--color-text-base)">{Math.round(paymentPrompt.total).toLocaleString()} UZS</span>
                </span>
              )}
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-(--color-text-subtle) mb-1">{t('orders.method')}</label>
                <select
                  value={paymentPrompt.method}
                  onChange={(e) => setPaymentPrompt((p) => ({ ...p, method: e.target.value }))}
                  className="w-full rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-2 text-sm text-(--color-text-base) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
                >
                  <option value="card">{t('orders.card')}</option>
                  <option value="cash">{t('orders.cash')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-(--color-text-subtle) mb-1">{t('orders.amount_uzs')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={paymentPrompt.amount ? Number(paymentPrompt.amount).toLocaleString() : ''}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^0-9]/g, '')
                    setPaymentPrompt((p) => ({ ...p, amount: raw }))
                  }}
                  placeholder="0"
                  autoFocus
                  className="w-full rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-2 text-sm text-(--color-text-base) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
                />
                {paymentPrompt.total > 0 && Number(paymentPrompt.amount) > 0 && (
                  <p className="text-xs text-(--color-text-muted) mt-1">
                    {t('orders.remaining')}: <span className={`font-medium ${(paymentPrompt.total - Number(paymentPrompt.amount)) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {Math.round(paymentPrompt.total - Number(paymentPrompt.amount)).toLocaleString()} UZS
                    </span>
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Button variant="secondary" onClick={() => setPaymentPrompt(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" onClick={handlePaymentPromptSave}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-lg ring-1 ring-(--color-border-base) shadow-lg w-full max-w-sm mx-4 p-5">
            <h3 className="text-base font-semibold text-(--color-text-base) mb-2">
              {deleteTarget.length === 1 ? t('orders.delete_single') : t('orders.delete_many', { count: deleteTarget.length })}
            </h3>
            <p className="text-sm text-(--color-text-subtle) mb-5">
              {t('common.delete_confirm')}{' '}
              <span className="font-medium text-(--color-text-base)">
                {deleteTarget.length === 1
                  ? orders.find((o) => o.order_id === deleteTarget[0])?.order_number
                  : t('orders.delete_many_label', { count: deleteTarget.length })}
              </span>
              ? {t('common.cannot_be_undone')}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={handleBulkDelete}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
