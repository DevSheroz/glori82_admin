import { useState, useEffect, useMemo } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'

const initialForm = {
  order_ids: [],
  status: 'pending',
  notes: '',
}

export default function ShipmentModal({
  open,
  onClose,
  onSave,
  shipment,
  orders,
  saving,
}) {
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    if (!open) return
    if (shipment) {
      setForm({
        order_ids: shipment.orders?.map((o) => o.order_id) || [],
        status: shipment.status || 'pending',
        notes: shipment.notes || '',
      })
    } else {
      setForm(initialForm)
    }
  }, [shipment, open])

  const availableOrders = useMemo(() => {
    const selectedSet = new Set(form.order_ids)
    return orders.filter(
      (o) => selectedSet.has(o.order_id) || !o._in_shipment
    )
  }, [orders, form.order_ids])

  const selectedOrderDetails = useMemo(() => {
    const orderMap = {}
    for (const o of orders) orderMap[o.order_id] = o
    return form.order_ids
      .map((id) => orderMap[id])
      .filter(Boolean)
  }, [orders, form.order_ids])

  const totalWeight = useMemo(() => {
    let grams = 0
    for (const order of selectedOrderDetails) {
      for (const item of order.items || []) {
        const pw = item.packaged_weight_grams || 0
        grams += pw * (item.quantity || 1)
      }
    }
    return grams / 1000
  }, [selectedOrderDetails])

  const shipmentFee = totalWeight * 12

  const toggleOrder = (orderId) => {
    setForm((prev) => {
      const ids = prev.order_ids.includes(orderId)
        ? prev.order_ids.filter((id) => id !== orderId)
        : [...prev.order_ids, orderId]
      return { ...prev, order_ids: ids }
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      order_ids: form.order_ids,
      notes: form.notes || null,
    }
    if (shipment) {
      payload.status = form.status
    }
    onSave(payload)
  }

  const isEdit = !!shipment

  const inputClass =
    'w-full rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-2 text-sm text-(--color-text-base) placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary) transition-shadow'

  const labelClass = 'block text-xs font-medium text-(--color-text-subtle) mb-1.5'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${shipment.shipment_number}` : 'Create Shipment'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={saving || form.order_ids.length === 0}
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {isEdit && (
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              className={inputClass}
            >
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="received">Received</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            rows={2}
            className={inputClass}
            placeholder="Optional notes"
          />
        </div>

        <div>
          <label className={labelClass}>
            Select Orders ({form.order_ids.length} selected)
          </label>
          <div className="max-h-60 overflow-y-auto rounded-md ring-1 ring-(--color-border-base) divide-y divide-(--color-border-base)">
            {availableOrders.length === 0 ? (
              <p className="text-sm text-(--color-text-muted) p-3 text-center">
                No orders available
              </p>
            ) : (
              availableOrders.map((order) => {
                const isSelected = form.order_ids.includes(order.order_id)
                return (
                  <label
                    key={order.order_id}
                    className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-(--color-bg-subtle) transition-colors ${
                      isSelected ? 'bg-(--color-bg-component)' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleOrder(order.order_id)}
                      className="rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary)"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-(--color-text-base)">
                          {order.order_number}
                        </span>
                        <span className="text-xs text-(--color-text-muted)">
                          {order.customer_name || 'No customer'}
                        </span>
                      </div>
                      <div className="text-xs text-(--color-text-subtle)">
                        {order.items?.length || 0} items
                        {order.total_amount != null && ` · $${Number(order.total_amount).toFixed(2)}`}
                      </div>
                    </div>
                  </label>
                )
              })
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-3 border-t border-(--color-border-base)">
          <div className="text-right">
            <span className="text-[10px] text-(--color-text-muted) block">Total Weight</span>
            <span className="text-sm font-semibold text-(--color-text-base) tabular-nums">
              {totalWeight.toFixed(2)} kg
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-(--color-text-muted) block">Shipment Fee</span>
            <span className="text-sm font-semibold text-(--color-text-base) tabular-nums">
              ${shipmentFee.toFixed(2)}
            </span>
          </div>
        </div>
      </form>
    </Modal>
  )
}
