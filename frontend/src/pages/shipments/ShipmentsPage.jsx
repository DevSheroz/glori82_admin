import { useState, useEffect, useCallback } from 'react'
import { Plus, Truck } from 'lucide-react'
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

  const handleEdit = (shipment) => {
    setEditingShipment(shipment)
    setModalOpen(true)
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

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await shipmentsApi.delete(deleteTarget.shipment_id)
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete shipment.')
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

  const columns = getColumns({
    onEdit: handleEdit,
    onDelete: (shipment) => setDeleteTarget(shipment),
    onRowClick: handleRowClick,
  })

  const selectClass =
    'rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-1.5 text-sm text-(--color-text-base) focus:outline-none focus:ring-2 focus:ring-(--color-primary)'

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-(--color-text-base)">
            Shipments
          </h1>
          <p className="text-sm text-(--color-text-subtle) mt-0.5">
            {total} shipment{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate}>
          <Plus className="w-4 h-4" />
          Add Shipment
        </Button>
      </div>

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
            <option value="delivered">Delivered</option>
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
            <Table columns={columns} data={shipments} />
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

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-lg ring-1 ring-(--color-border-base) shadow-lg w-full max-w-sm mx-4 p-5">
            <h3 className="text-base font-semibold text-(--color-text-base) mb-2">
              Delete Shipment
            </h3>
            <p className="text-sm text-(--color-text-subtle) mb-5">
              Are you sure you want to delete{' '}
              <span className="font-medium text-(--color-text-base)">
                {deleteTarget.shipment_number}
              </span>
              ? The orders will not be deleted.
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
