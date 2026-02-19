import { useState, useEffect, useCallback } from 'react'
import { Plus, Truck, Pencil, Trash2, X } from 'lucide-react'
import Container from '../../components/Container'
import Button from '../../components/Button'
import Table from '../../components/Table'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import ShipmentModal from './ShipmentModal'
import ShipmentDetail from './ShipmentDetail'
import { getColumns } from './columns'
import { shipmentsApi, ordersApi } from '../../lib/api'

const PAGE_SIZE = 20

const cardStatusColors = {
  pending: 'text-amber-600 bg-amber-50 ring-amber-200',
  shipped: 'text-gray-600 bg-gray-50 ring-gray-200',
  arrived: 'text-teal-600 bg-teal-50 ring-teal-200',
  received: 'text-blue-600 bg-blue-50 ring-blue-200',
  completed: 'text-green-600 bg-green-50 ring-green-200',
}

const cardStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'arrived', label: 'Arrived' },
  { value: 'received', label: 'Received' },
  { value: 'completed', label: 'Completed' },
]

const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`

function ShipmentCard({ shipment, selected, onToggleSelect, onViewDetail, onEdit, onDelete, onStatusChange }) {
  return (
    <div className={`p-4 space-y-3 transition-colors ${selected ? 'bg-blue-50/40' : ''}`}>
      {/* Row 1: checkbox + shipment # (tappable) + date */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(shipment.shipment_id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onViewDetail}
              className="font-semibold text-(--color-primary) hover:underline cursor-pointer"
            >
              {shipment.shipment_number}
            </button>
            <span className="text-xs text-(--color-text-subtle) tabular-nums shrink-0">
              {shipment.created_at
                ? new Date(shipment.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : '—'}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-(--color-text-subtle)">
            <span>{shipment.order_count} order{shipment.order_count !== 1 ? 's' : ''}</span>
            <span className="opacity-30">·</span>
            <span>{shipment.customer_count} customer{shipment.customer_count !== 1 ? 's' : ''}</span>
            <span className="opacity-30">·</span>
            <span>{Number(shipment.total_weight_kg).toFixed(2)} kg</span>
          </div>
        </div>
      </div>

      {/* Row 2: amounts */}
      <div className="ml-7 grid grid-cols-3 gap-2">
        <div>
          <div className="text-xs text-(--color-text-muted) mb-0.5">Orders (UZS)</div>
          <span className="tabular-nums text-sm font-medium">
            {Number(shipment.total_orders_uzs).toLocaleString()}
          </span>
        </div>
        <div>
          <div className="text-xs text-(--color-text-muted) mb-0.5">Fee ($)</div>
          <span className="tabular-nums text-sm font-medium">
            ${Number(shipment.shipment_fee).toFixed(2)}
          </span>
        </div>
        <div>
          <div className="text-xs text-(--color-text-muted) mb-0.5">Grand Total</div>
          <span className="tabular-nums text-sm font-semibold">
            {Number(shipment.grand_total_uzs).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Row 3: status dropdown + edit/delete */}
      <div className="ml-7 flex items-center gap-2">
        <select
          value={shipment.status}
          onChange={(e) => {
            e.stopPropagation()
            if (e.target.value !== shipment.status) onStatusChange(shipment.shipment_id, e.target.value)
          }}
          onClick={(e) => e.stopPropagation()}
          className={`text-xs font-medium rounded-full px-2.5 py-1 ring-1 cursor-pointer appearance-none pr-6 bg-size-12px bg-position-[right_6px_center] bg-no-repeat ${cardStatusColors[shipment.status] || ''}`}
          style={{ backgroundImage: chevronSvg }}
        >
          {cardStatusOptions.map((opt) => (
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

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState([])
  const [total, setTotal] = useState(0)
  const [allOrders, setAllOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingShipment, setEditingShipment] = useState(null)
  const [saving, setSaving] = useState(false)

  const [detailShipment, setDetailShipment] = useState(null)

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

      const [shipmentsRes, ordersRes] = await Promise.all([
        shipmentsApi.getAll(params),
        ordersApi.getAll({ page_size: 100, status: 'pending' }),
      ])
      setShipments(shipmentsRes.data.data)
      setTotal(shipmentsRes.data.total)
      setSelectedIds(new Set())

      // Mark orders that are already in a shipment
      const ordersInShipments = new Set()
      for (const s of shipmentsRes.data.data) {
        for (const o of s.orders || []) {
          ordersInShipments.add(o.order_id)
        }
      }
      const enrichedOrders = ordersRes.data.data.map((o) => ({
        ...o,
        _in_shipment: ordersInShipments.has(o.order_id),
      }))
      setAllOrders(enrichedOrders)
    } catch (err) {
      setError('Failed to load data. Make sure the backend is running.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterStatus, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setPage(1)
  }, [filterStatus])

  const handleEditSelected = () => {
    const shipmentId = [...selectedIds][0]
    const shipment = shipments.find((s) => s.shipment_id === shipmentId)
    if (shipment) {
      setEditingShipment(shipment)
      setModalOpen(true)
    }
  }

  const handleCreate = () => {
    setEditingShipment(null)
    setModalOpen(true)
  }

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (editingShipment) {
        await shipmentsApi.update(editingShipment.shipment_id, data)
      } else {
        await shipmentsApi.create(data)
      }
      setModalOpen(false)
      setEditingShipment(null)
      fetchData()
    } catch (err) {
      console.error('Save failed:', err)
      alert('Failed to save shipment. Check the console for details.')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!deleteTarget) return
    try {
      await Promise.all(deleteTarget.map((id) => shipmentsApi.delete(id)))
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete shipments.')
    }
  }

  const handleStatusChange = async (shipmentId, newStatus) => {
    try {
      await shipmentsApi.update(shipmentId, { status: newStatus })
      fetchData()
    } catch (err) {
      console.error('Status update failed:', err)
      alert('Failed to update status.')
    }
  }

  const handleRowClick = async (shipment) => {
    try {
      const res = await shipmentsApi.getById(shipment.shipment_id)
      setDetailShipment(res.data)
    } catch (err) {
      console.error(err)
      setDetailShipment(shipment)
    }
  }

  const toggleSelect = (shipmentId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(shipmentId)) next.delete(shipmentId)
      else next.add(shipmentId)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === shipments.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(shipments.map((s) => s.shipment_id)))
    }
  }

  const columns = getColumns({
    onRowClick: handleRowClick,
    onStatusChange: handleStatusChange,
    selectedIds,
    onToggleSelect: toggleSelect,
    onToggleAll: toggleAll,
    allSelected: shipments.length > 0 && selectedIds.size === shipments.length,
  })

  const selectClass =
    'rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-1.5 text-sm text-(--color-text-base) focus:outline-none focus:ring-2 focus:ring-(--color-primary)'

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-(--color-text-base)">
            Shipments
          </h1>
          <p className="text-sm text-(--color-text-subtle) mt-0.5">
            {total} shipment{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          Add Shipment
        </Button>
      </div>

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
            <option value="arrived">Arrived</option>
            <option value="received">Received</option>
            <option value="completed">Completed</option>
          </select>

          {filterStatus && (
            <button
              onClick={() => setFilterStatus('')}
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
        ) : shipments.length === 0 ? (
          <EmptyState
            icon={Truck}
            title="No shipments found"
            description="Create your first shipment to group orders for shipping."
          />
        ) : (
          <>
            {/* Mobile card list */}
            <div className="sm:hidden divide-y divide-(--color-border-base) max-h-[calc(100vh-220px)] overflow-y-auto">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-(--color-bg-subtle) border-b border-(--color-border-base)">
                <input
                  type="checkbox"
                  checked={shipments.length > 0 && selectedIds.size === shipments.length}
                  onChange={toggleAll}
                  className="rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer"
                />
                <span className="text-xs text-(--color-text-subtle)">Select all</span>
              </div>
              {shipments.map((shipment) => (
                <ShipmentCard
                  key={shipment.shipment_id}
                  shipment={shipment}
                  selected={selectedIds.has(shipment.shipment_id)}
                  onToggleSelect={toggleSelect}
                  onViewDetail={() => handleRowClick(shipment)}
                  onEdit={() => { setEditingShipment(shipment); setModalOpen(true) }}
                  onDelete={() => setDeleteTarget([shipment.shipment_id])}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block">
              <Table columns={columns} data={shipments} />
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

      <ShipmentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingShipment(null)
        }}
        onSave={handleSave}
        shipment={editingShipment}
        orders={allOrders}
        saving={saving}
      />

      <ShipmentDetail
        open={!!detailShipment}
        onClose={() => setDetailShipment(null)}
        shipment={detailShipment}
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
              Delete {deleteTarget.length === 1 ? 'Shipment' : `${deleteTarget.length} Shipments`}
            </h3>
            <p className="text-sm text-(--color-text-subtle) mb-5">
              Are you sure you want to delete{' '}
              <span className="font-medium text-(--color-text-base)">
                {deleteTarget.length === 1
                  ? shipments.find((s) => s.shipment_id === deleteTarget[0])?.shipment_number
                  : `${deleteTarget.length} shipments`}
              </span>
              ? The orders will not be deleted.
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
