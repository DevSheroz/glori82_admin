import { useState, useEffect, useMemo } from 'react'
import { X } from 'lucide-react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'

const initialForm = {
  order_ids: [],
  stock_items: [],
  status: 'pending',
  notes: '',
}

export default function ShipmentModal({
  open,
  onClose,
  onSave,
  shipment,
  orders,
  products,
  saving,
}) {
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    if (!open) return
    if (shipment) {
      setForm({
        order_ids: shipment.orders?.map((o) => o.order_id) || [],
        stock_items: shipment.stock_items?.map((si) => ({
          product_id: si.product_id,
          quantity: si.quantity,
        })) || [],
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

  const productsById = useMemo(() => {
    const map = {}
    for (const p of products || []) map[p.product_id] = p
    return map
  }, [products])

  const totalWeight = useMemo(() => {
    let grams = 0
    for (const order of selectedOrderDetails) {
      for (const item of order.items || []) {
        const pw = item.packaged_weight_grams || 0
        grams += pw * (item.quantity || 1)
      }
    }
    for (const si of form.stock_items) {
      const p = productsById[si.product_id]
      if (p?.packaged_weight_grams) {
        grams += p.packaged_weight_grams * si.quantity
      }
    }
    return grams / 1000
  }, [selectedOrderDetails, form.stock_items, productsById])

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
      stock_items: form.stock_items,
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
            disabled={saving || (form.order_ids.length === 0 && form.stock_items.length === 0)}
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

        {/* In-stock items section */}
        <div>
          <label className={labelClass}>
            In-Stock Items ({form.stock_items.length} added)
          </label>
          <select
            value=""
            onChange={(e) => {
              const productId = Number(e.target.value)
              if (!productId) return
              if (form.stock_items.some((si) => si.product_id === productId)) return
              setForm((prev) => ({
                ...prev,
                stock_items: [...prev.stock_items, { product_id: productId, quantity: 1 }],
              }))
              e.target.value = ''
            }}
            className={inputClass}
          >
            <option value="">Select a product to add...</option>
            {(products || [])
              .filter((p) => !form.stock_items.some((si) => si.product_id === p.product_id))
              .map((p) => (
                <option key={p.product_id} value={p.product_id}>
                  {p.product_name}{p.brand ? ` — ${p.brand}` : ''}
                </option>
              ))}
          </select>

          {form.stock_items.length > 0 && (
            <div className="mt-2 space-y-1.5">
              {form.stock_items.map((si, idx) => {
                const product = productsById[si.product_id]
                const maxQty = product?.stock_quantity || 1
                const weightKg = product?.packaged_weight_grams
                  ? ((product.packaged_weight_grams * si.quantity) / 1000).toFixed(2)
                  : null
                return (
                  <div
                    key={si.product_id}
                    className="flex items-center gap-2 px-3 py-2 rounded-md ring-1 ring-(--color-border-base) bg-(--color-bg-subtle)"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-(--color-text-base) truncate">
                        {product?.product_name || `Product #${si.product_id}`}
                      </div>
                      <div className="text-xs text-(--color-text-muted)">
                        {weightKg && <span>{weightKg} kg</span>}
                        {weightKg && <span className="mx-1 opacity-40">·</span>}
                        <span>stock: {maxQty}</span>
                      </div>
                    </div>
                    <input
                      type="number"
                      min="1"
                      max={maxQty}
                      value={si.quantity}
                      onChange={(e) => {
                        const qty = Math.min(maxQty, Math.max(1, parseInt(e.target.value) || 1))
                        setForm((prev) => ({
                          ...prev,
                          stock_items: prev.stock_items.map((item, i) =>
                            i === idx ? { ...item, quantity: qty } : item
                          ),
                        }))
                      }}
                      className="w-16 rounded-md ring-1 ring-(--color-border-base) px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          stock_items: prev.stock_items.filter((_, i) => i !== idx),
                        }))
                      }
                      className="p-1 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
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
