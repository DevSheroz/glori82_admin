import { useState, useEffect, useMemo, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import SearchSelect from '../../components/SearchSelect'
import { productsApi } from '../../lib/api'

const blankItem = { category_id: '', brand: '', product_id: '', quantity: 1, selling_price: '', selling_price_uzs: '', cost_price: '' }

const initialForm = {
  customer_id: '',
  status: 'pending',
  notes: '',
  items: [{ ...blankItem }],
  cost_override: '',
}

export default function OrderModal({
  open,
  onClose,
  onSave,
  order,
  customers,
  products,
  categories,
  saving,
}) {
  const [form, setForm] = useState(initialForm)
  const [rowOptions, setRowOptions] = useState({})

  const productMap = useMemo(() => {
    const map = {}
    for (const p of products) map[p.product_id] = p
    return map
  }, [products])

  const fetchBrands = useCallback(async (categoryId) => {
    try {
      const res = await productsApi.getBrands({ category_id: categoryId })
      return res.data
    } catch {
      return []
    }
  }, [])

  const fetchProducts = useCallback(async (categoryId, brand) => {
    try {
      const params = { page_size: 100 }
      if (categoryId) params.category_id = categoryId
      if (brand) params.brand = brand
      const res = await productsApi.getAll(params)
      return res.data.data
    } catch {
      return []
    }
  }, [])

  useEffect(() => {
    if (!open) return

    if (order) {
      const items =
        order.items && order.items.length > 0
          ? order.items.map((it) => {
              const product = productMap[it.product_id]
              return {
                category_id: product?.category_id ?? '',
                brand: product?.brand ?? '',
                product_id: it.product_id ?? '',
                quantity: it.quantity ?? 1,
                selling_price: it.selling_price ?? '',
                selling_price_uzs: it.selling_price_uzs ?? '',
                cost_price: it.cost_price ?? '',
              }
            })
          : [{ ...blankItem }]

      setForm({
        customer_id: order.customer_id ?? '',
        status: order.status ?? 'pending',
        notes: order.notes ?? '',
        items,
        cost_override: '',
      })

      // Pre-populate row options for edit mode
      const loadRowOptions = async () => {
        const opts = {}
        for (let i = 0; i < items.length; i++) {
          const item = items[i]
          if (item.category_id) {
            const [brands, prods] = await Promise.all([
              fetchBrands(item.category_id),
              fetchProducts(item.category_id, item.brand || undefined),
            ])
            opts[i] = { brands, products: prods }
          }
        }
        setRowOptions(opts)
      }
      loadRowOptions()
    } else {
      setForm(initialForm)
      setRowOptions({})
    }
  }, [order, open, productMap, fetchBrands, fetchProducts])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategoryChange = async (index, categoryId) => {
    setForm((prev) => {
      const items = prev.items.map((it, i) =>
        i === index ? { ...it, category_id: categoryId, brand: '', product_id: '', selling_price: '', selling_price_uzs: '', cost_price: '' } : it
      )
      return { ...prev, items }
    })

    if (categoryId) {
      const brands = await fetchBrands(categoryId)
      setRowOptions((prev) => ({ ...prev, [index]: { brands, products: [] } }))
    } else {
      setRowOptions((prev) => ({ ...prev, [index]: { brands: [], products: [] } }))
    }
  }

  const handleBrandChange = async (index, brand, categoryId) => {
    setForm((prev) => {
      const items = prev.items.map((it, i) =>
        i === index ? { ...it, brand, product_id: '', selling_price: '', selling_price_uzs: '', cost_price: '' } : it
      )
      return { ...prev, items }
    })

    if (brand) {
      const prods = await fetchProducts(categoryId, brand)
      setRowOptions((prev) => ({
        ...prev,
        [index]: { ...prev[index], products: prods },
      }))
    } else {
      setRowOptions((prev) => ({
        ...prev,
        [index]: { ...prev[index], products: [] },
      }))
    }
  }

  const handleProductChange = (index, productId) => {
    setForm((prev) => {
      const items = prev.items.map((it, i) => {
        if (i !== index) return it
        const updated = { ...it, product_id: productId }
        if (productId) {
          const product = productMap[productId] || (rowOptions[index]?.products || []).find((p) => p.product_id === Number(productId))
          if (product) {
            updated.selling_price = product.selling_price ?? ''
            updated.selling_price_uzs = product.selling_price_uzs ?? ''
            updated.cost_price = product.cost_price ?? ''
          }
        }
        return updated
      })
      return { ...prev, items }
    })
  }

  const handleQuantityChange = (index, value) => {
    setForm((prev) => {
      const items = prev.items.map((it, i) =>
        i === index ? { ...it, quantity: value } : it
      )
      return { ...prev, items }
    })
  }

  const handlePriceChange = (index, field, value) => {
    setForm((prev) => {
      const items = prev.items.map((it, i) =>
        i === index ? { ...it, [field]: value } : it
      )
      return { ...prev, items }
    })
  }

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { ...blankItem }] }))
  }

  const removeItem = (index) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
    setRowOptions((prev) => {
      const next = {}
      for (const [key, val] of Object.entries(prev)) {
        const k = Number(key)
        if (k < index) next[k] = val
        else if (k > index) next[k - 1] = val
      }
      return next
    })
  }

  const computedTotal = useMemo(() => {
    let sum = 0
    for (const it of form.items) {
      const price = Number(it.selling_price) || 0
      const qty = Number(it.quantity) || 0
      sum += price * qty
    }
    return sum
  }, [form.items])

  const computedTotalUzs = useMemo(() => {
    let sum = 0
    for (const it of form.items) {
      const price = Number(it.selling_price_uzs) || 0
      const qty = Number(it.quantity) || 0
      sum += price * qty
    }
    return sum
  }, [form.items])

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = {
      customer_id: form.customer_id ? Number(form.customer_id) : null,
      status: form.status,
      total_amount: computedTotal || null,
      notes: form.notes || null,
      items: form.items
        .filter((it) => it.product_id)
        .map((it) => ({
          product_id: Number(it.product_id),
          quantity: Number(it.quantity) || 1,
          selling_price: it.selling_price ? Number(it.selling_price) : null,
          selling_price_uzs: it.selling_price_uzs ? Number(it.selling_price_uzs) : null,
          cost_price: it.cost_price ? Number(it.cost_price) : null,
        })),
    }
    if (order) {
      payload.order_number = order.order_number
    }
    onSave(payload)
  }

  const isEdit = !!order

  const inputClass =
    'w-full rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-2 text-sm text-(--color-text-base) placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary) transition-shadow'

  const labelClass = 'block text-xs font-medium text-(--color-text-subtle) mb-1.5'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? `Edit ${order.order_number}` : 'Add Order'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className={labelClass}>Customer</label>
            <SearchSelect
              value={form.customer_id}
              onChange={(val) =>
                setForm((prev) => ({ ...prev, customer_id: val }))
              }
              placeholder="None"
              options={customers.map((c) => ({
                value: c.customer_id,
                label: c.customer_name,
              }))}
            />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="pending">Pending</option>
              <option value="shipped">Shipped</option>
              <option value="received">Received</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            rows={2}
            className={inputClass}
            placeholder="Optional notes"
          />
        </div>

        {/* Items section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className={labelClass + ' mb-0!'}>Order Items</label>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 text-xs font-medium text-(--color-primary) hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          </div>

          <div className="space-y-3">
            {form.items.map((item, index) => {
              const opts = rowOptions[index] || { brands: [], products: [] }
              return (
                <div
                  key={index}
                  className="relative p-3 sm:p-0 rounded-md sm:rounded-none bg-(--color-bg-subtle) sm:bg-transparent"
                >
                  {/* Mobile: Card layout */}
                  <div className="sm:hidden space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-(--color-text-subtle)">Item {index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-1 rounded-md text-(--color-text-muted) hover:text-(--color-danger) hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-(--color-text-muted)">Category</span>
                        <select
                          value={item.category_id}
                          onChange={(e) => handleCategoryChange(index, e.target.value)}
                          className={inputClass + ' py-1.5 text-xs'}
                        >
                          <option value="">Category...</option>
                          {categories.map((c) => (
                            <option key={c.category_id} value={c.category_id}>
                              {c.category_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <span className="text-[10px] text-(--color-text-muted)">Brand</span>
                        <select
                          value={item.brand}
                          onChange={(e) => handleBrandChange(index, e.target.value, item.category_id)}
                          disabled={!item.category_id}
                          className={inputClass + ' py-1.5 text-xs disabled:opacity-50'}
                        >
                          <option value="">Brand...</option>
                          {opts.brands.map((b) => (
                            <option key={b} value={b}>
                              {b}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-(--color-text-muted)">Item</span>
                      <select
                        value={item.product_id}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        disabled={!item.brand}
                        className={inputClass + ' py-1.5 text-xs disabled:opacity-50'}
                      >
                        <option value="">Item...</option>
                        {opts.products.map((p) => (
                          <option key={p.product_id} value={p.product_id}>
                            {p.product_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[10px] text-(--color-text-muted)">Qty</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(index, e.target.value)}
                          className={inputClass + ' py-1.5 text-xs'}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-(--color-text-muted)">USD</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.selling_price}
                          onChange={(e) => handlePriceChange(index, 'selling_price', e.target.value)}
                          placeholder="0.00"
                          className={inputClass + ' py-1.5 text-xs'}
                        />
                      </div>
                      <div>
                        <span className="text-[10px] text-(--color-text-muted)">UZS</span>
                        <input
                          type="number"
                          step="0.01"
                          value={item.selling_price_uzs}
                          onChange={(e) => handlePriceChange(index, 'selling_price_uzs', e.target.value)}
                          placeholder="0"
                          className={inputClass + ' py-1.5 text-xs'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Desktop: Grid layout */}
                  <div className="hidden sm:grid grid-cols-[1fr_1fr_1fr_60px_90px_90px_28px] gap-2 items-end">
                    <div>
                      {index === 0 && (
                        <span className="text-[10px] text-(--color-text-muted)">Category</span>
                      )}
                      <select
                        value={item.category_id}
                        onChange={(e) => handleCategoryChange(index, e.target.value)}
                        className={inputClass + ' py-1.5 text-xs'}
                      >
                        <option value="">Category...</option>
                        {categories.map((c) => (
                          <option key={c.category_id} value={c.category_id}>
                            {c.category_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      {index === 0 && (
                        <span className="text-[10px] text-(--color-text-muted)">Brand</span>
                      )}
                      <select
                        value={item.brand}
                        onChange={(e) => handleBrandChange(index, e.target.value, item.category_id)}
                        disabled={!item.category_id}
                        className={inputClass + ' py-1.5 text-xs disabled:opacity-50'}
                      >
                        <option value="">Brand...</option>
                        {opts.brands.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      {index === 0 && (
                        <span className="text-[10px] text-(--color-text-muted)">Item</span>
                      )}
                      <select
                        value={item.product_id}
                        onChange={(e) => handleProductChange(index, e.target.value)}
                        disabled={!item.brand}
                        className={inputClass + ' py-1.5 text-xs disabled:opacity-50'}
                      >
                        <option value="">Item...</option>
                        {opts.products.map((p) => (
                          <option key={p.product_id} value={p.product_id}>
                            {p.product_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      {index === 0 && (
                        <span className="text-[10px] text-(--color-text-muted)">Qty</span>
                      )}
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                        className={inputClass + ' py-1.5 text-xs'}
                      />
                    </div>
                    <div>
                      {index === 0 && (
                        <span className="text-[10px] text-(--color-text-muted)">Price (USD)</span>
                      )}
                      <input
                        type="number"
                        step="0.01"
                        value={item.selling_price}
                        onChange={(e) => handlePriceChange(index, 'selling_price', e.target.value)}
                        placeholder="0.00"
                        className={inputClass + ' py-1.5 text-xs'}
                      />
                    </div>
                    <div>
                      {index === 0 && (
                        <span className="text-[10px] text-(--color-text-muted)">Price (UZS)</span>
                      )}
                      <input
                        type="number"
                        step="0.01"
                        value={item.selling_price_uzs}
                        onChange={(e) => handlePriceChange(index, 'selling_price_uzs', e.target.value)}
                        placeholder="0"
                        className={inputClass + ' py-1.5 text-xs'}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1.5 rounded-md text-(--color-text-muted) hover:text-(--color-danger) hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Totals */}
          <div className="flex items-center justify-end gap-4 mt-3 pt-3 border-t border-(--color-border-base)">
            <div className="text-right">
              <span className="text-[10px] text-(--color-text-muted) block">Total (USD)</span>
              <span className="text-sm font-semibold text-(--color-text-base) tabular-nums">
                ${computedTotal.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-(--color-text-muted) block">Total (UZS)</span>
              <span className="text-sm font-semibold text-(--color-text-base) tabular-nums">
                {computedTotalUzs.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}
