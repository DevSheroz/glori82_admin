import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { Plus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import { productsApi, currencyApi } from '../../lib/api'

/* ── Reusable autocomplete input ── */
function AutocompleteInput({ value, onChange, onSelect, options, placeholder, className }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filtered = useMemo(() => {
    const q = (value || '').trim().toLowerCase()
    if (!q) return []
    return options.filter((o) => o.label.toLowerCase().includes(q))
  }, [value, options])

  return (
    <div ref={ref} className="relative">
      <input
        value={value || ''}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => value && setOpen(true)}
        placeholder={placeholder}
        className={className}
        autoComplete="off"
      />
      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white rounded-md ring-1 ring-(--color-border-base) shadow-lg max-h-36 overflow-y-auto py-1">
          {filtered.map((o, i) => (
            <li
              key={o.value ?? i}
              onClick={() => { onSelect(o); setOpen(false) }}
              className="px-3 py-1.5 text-sm cursor-pointer hover:bg-(--color-bg-subtle) text-(--color-text-base) truncate"
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ── Constants ── */
const blankItem = {
  category_id: '',
  category_name: '',
  brand: '',
  product_id: '',
  product_name: '',
  quantity: 1,
  cost_price: '',
  selling_price: '',
  selling_price_uzs: '',
  weight_grams: '',
  cargo: '',
  customer_cargo: '',
  attribute_values: [],
  from_stock: false,
}

const initialForm = {
  customer_id: '',
  customer_name: '',
  city: '',
  address: '',
  phone: '',
  status: 'pending',
  payment_status: 'unpaid',
  paid_card: '',
  paid_cash: '',
  prepay_method: 'card',
  notes: '',
  service_fee: '3.00',
  is_family_discount: false,
  items: [{ ...blankItem }],
}

/* ── Main component ── */
export default function OrderModal({
  open,
  onClose,
  onSave,
  order,
  customers,
  products,
  stockProducts,
  categories,
  saving,
}) {
  const [form, setForm] = useState(initialForm)
  const [rowOptions, setRowOptions] = useState({})
  const [krwToUsd, setKrwToUsd] = useState(0)
  const [usdToUzs, setUsdToUzs] = useState(0)
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false)
  const [pendingStockId, setPendingStockId] = useState('')
  const [pendingStockQty, setPendingStockQty] = useState(1)
  const customerRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (customerRef.current && !customerRef.current.contains(e.target)) {
        setShowCustomerSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const filteredCustomers = useMemo(() => {
    const q = (form.customer_name || '').trim().toLowerCase()
    if (!q) return []
    return customers.filter((c) => c.customer_name.toLowerCase().includes(q))
  }, [form.customer_name, customers])

  const productMap = useMemo(() => {
    const map = {}
    for (const p of products) map[p.product_id] = p
    return map
  }, [products])

  const stockProductMap = useMemo(() => {
    const map = {}
    for (const p of (stockProducts || [])) map[p.product_id] = p
    return map
  }, [stockProducts])

  const customerMap = useMemo(() => {
    const map = {}
    for (const c of customers) map[c.customer_id] = c
    return map
  }, [customers])

  const categoryAttrsMap = useMemo(() => {
    const map = {}
    for (const c of categories) map[c.category_id] = c.attributes || []
    return map
  }, [categories])

  const productMapRef = useRef(productMap)
  const stockProductMapRef = useRef(stockProductMap)
  const customerMapRef = useRef(customerMap)
  useEffect(() => { productMapRef.current = productMap }, [productMap])
  useEffect(() => { stockProductMapRef.current = stockProductMap }, [stockProductMap])
  useEffect(() => { customerMapRef.current = customerMap }, [customerMap])

  useEffect(() => {
    if (!open) return
    currencyApi.getRates().then((res) => {
      setKrwToUsd(res.data.krw_to_usd || 0)
      setUsdToUzs(res.data.usd_to_uzs || 0)
    }).catch(() => {})
  }, [open])

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

  // Populate form on open
  useEffect(() => {
    if (!open) return

    if (order) {
      const items =
        order.items && order.items.length > 0
          ? order.items.map((it) => {
              const product = productMapRef.current[it.product_id] || stockProductMapRef.current[it.product_id]
              const weightGrams = it.packaged_weight_grams || product?.packaged_weight_grams || 0
              const qty = it.quantity ?? 1
              const totalWeightKg = weightGrams ? (weightGrams / 1000) * qty : 0
              return {
                category_id: product?.category_id ?? '',
                category_name: it.category_name || product?.category?.category_name || '',
                brand: product?.brand ?? '',
                product_id: it.product_id ?? '',
                product_name: it.product_name || product?.product_name || '',
                quantity: qty,
                cost_price: it.cost_price ?? '',
                selling_price: it.selling_price ?? '',
                selling_price_uzs: it.selling_price_uzs ?? '',
                weight_grams: weightGrams || '',
                cargo: totalWeightKg ? (totalWeightKg * 12).toFixed(2) : '',
                customer_cargo: totalWeightKg ? (totalWeightKg * 13).toFixed(2) : '',
                attribute_values: (it.attribute_values?.length
                  ? it.attribute_values
                  : (product?.attribute_values || [])
                ).map((av) => ({
                  attribute_id: av.attribute_id,
                  attribute_name: av.attribute_name,
                  value: av.value,
                })),
                from_stock: it.from_stock || false,
              }
            })
          : [{ ...blankItem }]

      const customer = order.customer_id ? customerMapRef.current[order.customer_id] : null

      const paidCard = order.paid_card ?? ''
      const paidCash = order.paid_cash ?? ''
      const prepayMethod = order.payment_status === 'prepayment'
        ? (Number(paidCard) > 0 ? 'card' : 'cash')
        : 'card'

      setForm({
        customer_id: order.customer_id ?? '',
        customer_name: customer?.customer_name ?? order.customer_name ?? '',
        city: customer?.city ?? '',
        address: customer?.address ?? '',
        phone: customer?.contact_phone ?? '',
        status: order.status ?? 'pending',
        payment_status: order.payment_status ?? 'unpaid',
        paid_card: paidCard,
        paid_cash: paidCash,
        prepay_method: prepayMethod,
        notes: order.notes ?? '',
        service_fee: order.service_fee ?? '3.00',
        is_family_discount: order.is_family_discount ?? false,
        items,
      })

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
      setForm({ ...initialForm, items: [{ ...blankItem }] })
      setRowOptions({})
      setPendingStockId('')
      setPendingStockQty(1)
    }
  }, [order, open, fetchBrands, fetchProducts])

  /* ── Customer handlers ── */
  const handleCustomerNameChange = (e) => {
    setForm((prev) => ({ ...prev, customer_name: e.target.value, customer_id: '' }))
    setShowCustomerSuggestions(true)
  }

  const handleCustomerPick = (customer) => {
    setForm((prev) => ({
      ...prev,
      customer_id: customer.customer_id,
      customer_name: customer.customer_name,
      city: customer.city || '',
      address: customer.address || '',
      phone: customer.contact_phone || '',
    }))
    setShowCustomerSuggestions(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handlePaymentStatusChange = (e) => {
    const value = e.target.value
    setForm((prev) => {
      const next = { ...prev, payment_status: value }
      if (value === 'unpaid') {
        next.paid_card = ''
        next.paid_cash = ''
      } else if (value === 'paid_card') {
        next.paid_card = totals.totalPriceUzs ? Math.round(totals.totalPriceUzs).toString() : ''
        next.paid_cash = ''
      } else if (value === 'paid_cash') {
        next.paid_card = ''
        next.paid_cash = totals.totalPriceUzs ? Math.round(totals.totalPriceUzs).toString() : ''
      } else if (value === 'partial' || value === 'prepayment') {
        next.paid_card = ''
        next.paid_cash = ''
      }
      return next
    })
  }

  /* ── Item: Category handlers ── */
  const handleCategoryType = (index, text) => {
    setForm((prev) => {
      const items = prev.items.map((it, i) =>
        i === index
          ? { ...blankItem, category_name: text, quantity: it.quantity }
          : it
      )
      return { ...prev, items }
    })
    setRowOptions((prev) => ({ ...prev, [index]: { brands: [], products: [] } }))
  }

  const handleCategoryPick = async (index, option) => {
    const attrs = categoryAttrsMap[option.value] || []
    setForm((prev) => {
      const items = prev.items.map((it, i) =>
        i === index
          ? {
              ...blankItem,
              category_id: option.value,
              category_name: option.label,
              quantity: it.quantity,
              attribute_values: attrs.map((a) => ({
                attribute_id: a.attribute_id,
                attribute_name: a.attribute_name,
                value: '',
              })),
            }
          : it
      )
      return { ...prev, items }
    })
    const brands = await fetchBrands(option.value)
    setRowOptions((prev) => ({ ...prev, [index]: { brands, products: [] } }))
  }

  /* ── Item: Brand handlers ── */
  const handleBrandType = (index, text) => {
    setForm((prev) => {
      const items = prev.items.map((it, i) =>
        i === index
          ? { ...it, brand: text, product_id: '', product_name: '', selling_price: '', selling_price_uzs: '', cost_price: '', weight_grams: '' }
          : it
      )
      return { ...prev, items }
    })
    setRowOptions((prev) => ({
      ...prev,
      [index]: { ...prev[index], products: [] },
    }))
  }

  const handleBrandPick = async (index, option, categoryId) => {
    setForm((prev) => {
      const items = prev.items.map((it, i) =>
        i === index
          ? { ...it, brand: option.label, product_id: '', product_name: '', selling_price: '', selling_price_uzs: '', cost_price: '', weight_kg: '' }
          : it
      )
      return { ...prev, items }
    })
    if (categoryId) {
      const prods = await fetchProducts(categoryId, option.label)
      setRowOptions((prev) => ({
        ...prev,
        [index]: { ...prev[index], products: prods },
      }))
    }
  }

  /* ── Item: Product handlers ── */
  const handleProductType = (index, text) => {
    setForm((prev) => {
      const items = prev.items.map((it, i) =>
        i === index
          ? { ...it, product_id: '', product_name: text, from_stock: false }
          : it
      )
      return { ...prev, items }
    })
  }

  const handleProductPick = (index, option) => {
    const product =
      productMap[option.value] ||
      (rowOptions[index]?.products || []).find((p) => p.product_id === Number(option.value))

    setForm((prev) => {
      const markup = prev.is_family_discount ? 1.0 : 1.5
      const items = prev.items.map((it, i) => {
        if (i !== index) return it
        const updated = { ...it, product_id: option.value, product_name: option.label, from_stock: false }
        if (product) {
          updated.cost_price = product.cost_price ?? ''
          if (product.cost_price && krwToUsd > 0) {
            const sellUsd = Number(product.cost_price) * krwToUsd * markup
            updated.selling_price = sellUsd.toFixed(2)
            updated.selling_price_uzs = usdToUzs > 0 ? Math.round(sellUsd * usdToUzs).toString() : (product.selling_price_uzs ?? '')
          } else {
            updated.selling_price = product.selling_price ?? ''
            updated.selling_price_uzs = product.selling_price_uzs ?? ''
          }
          if (product.packaged_weight_grams) {
            const qty = Number(it.quantity) || 1
            const totalWtKg = (product.packaged_weight_grams / 1000) * qty
            updated.weight_grams = product.packaged_weight_grams
            updated.cargo = (totalWtKg * 12).toFixed(2)
            updated.customer_cargo = (totalWtKg * 13).toFixed(2)
          }
          if (product.attribute_values?.length > 0) {
            updated.attribute_values = product.attribute_values.map((av) => ({
              attribute_id: av.attribute_id,
              attribute_name: av.attribute_name,
              value: av.value,
            }))
          }
        }
        return updated
      })
      return { ...prev, items }
    })
  }

  /* ── Item: numeric field handlers ── */
  const handleCostChange = (index, costKrw) => {
    setForm((prev) => {
      const markup = prev.is_family_discount ? 1.0 : 1.5
      const items = prev.items.map((it, i) => {
        if (i !== index) return it
        const updated = { ...it, cost_price: costKrw }
        if (costKrw && krwToUsd > 0) {
          const sellUsd = Number(costKrw) * krwToUsd * markup
          updated.selling_price = sellUsd.toFixed(2)
          if (usdToUzs > 0) {
            updated.selling_price_uzs = Math.round(sellUsd * usdToUzs).toString()
          }
        }
        return updated
      })
      return { ...prev, items }
    })
  }

  const handleDiscountToggle = (checked) => {
    const markup = checked ? 1.0 : 1.5
    setForm((prev) => ({
      ...prev,
      is_family_discount: checked,
      items: prev.items.map((item) => {
        if (!item.cost_price || krwToUsd <= 0) return item
        const sellUsd = Number(item.cost_price) * krwToUsd * markup
        return {
          ...item,
          selling_price: sellUsd.toFixed(2),
          selling_price_uzs: usdToUzs > 0 ? Math.round(sellUsd * usdToUzs).toString() : item.selling_price_uzs,
        }
      }),
    }))
  }

  const handleItemField = (index, field, value) => {
    setForm((prev) => {
      const items = prev.items.map((it, i) => {
        if (i !== index) return it
        const updated = { ...it, [field]: value }
        // Auto-fill selling_price_uzs when selling_price changes
        if (field === 'selling_price' && usdToUzs > 0 && value) {
          updated.selling_price_uzs = Math.round(Number(value) * usdToUzs).toString()
        }
        // Auto-fill cargo when weight or quantity changes
        if (field === 'weight_grams' || field === 'quantity') {
          const grams = Number(field === 'weight_grams' ? value : it.weight_grams) || 0
          const qty = Number(field === 'quantity' ? value : it.quantity) || 1
          const totalKg = (grams / 1000) * qty
          updated.cargo = (totalKg * 12).toFixed(2)
          updated.customer_cargo = (totalKg * 13).toFixed(2)
        }
        return updated
      })
      return { ...prev, items }
    })
  }

  const handleAttrValueChange = (itemIndex, attrIndex, value) => {
    setForm((prev) => {
      const items = prev.items.map((it, i) => {
        if (i !== itemIndex) return it
        const avs = [...(it.attribute_values || [])]
        avs[attrIndex] = { ...avs[attrIndex], value }
        return { ...it, attribute_values: avs }
      })
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

  /* ── From Stock handler ── */
  const addFromStockItem = () => {
    if (!pendingStockId) return
    const product = stockProductMap[Number(pendingStockId)]
    if (!product) return
    const qty = Math.min(Math.max(1, Number(pendingStockQty) || 1), product.stock_quantity || 999)
    const weightGrams = product.packaged_weight_grams || 0
    const totalKg = (weightGrams / 1000) * qty
    const markup = form.is_family_discount ? 1.0 : 1.5
    let stockSellingPrice = product.selling_price ?? ''
    let stockSellingPriceUzs = product.selling_price_uzs ?? ''
    if (product.cost_price && krwToUsd > 0) {
      const sellUsd = Number(product.cost_price) * krwToUsd * markup
      stockSellingPrice = sellUsd.toFixed(2)
      stockSellingPriceUzs = usdToUzs > 0 ? Math.round(sellUsd * usdToUzs).toString() : stockSellingPriceUzs
    }

    const newItem = {
      category_id: product.category_id ?? '',
      category_name: product.category?.category_name || categories.find((c) => c.category_id === product.category_id)?.category_name || '',
      brand: product.brand ?? '',
      product_id: product.product_id,
      product_name: product.product_name,
      quantity: qty,
      cost_price: product.cost_price ?? '',
      selling_price: stockSellingPrice,
      selling_price_uzs: stockSellingPriceUzs,
      weight_grams: weightGrams || '',
      cargo: totalKg ? (totalKg * 12).toFixed(2) : '',
      customer_cargo: totalKg ? (totalKg * 13).toFixed(2) : '',
      attribute_values: (product.attribute_values || []).map((av) => ({
        attribute_id: av.attribute_id,
        attribute_name: av.attribute_name,
        value: av.value,
      })),
      from_stock: true,
    }
    setForm((prev) => ({ ...prev, items: [...prev.items, newItem] }))
    setPendingStockId('')
    setPendingStockQty(1)
  }

  /* ── Computed totals ── */
  const totals = useMemo(() => {
    let totalSelling = 0
    let totalWeight = 0
    let totalCargo = 0
    let totalCustomerCargo = 0

    for (const it of form.items) {
      const qty = Number(it.quantity) || 0
      const sell = Number(it.selling_price) || 0
      const grams = Number(it.weight_grams) || 0
      totalSelling += sell * qty
      totalWeight += (grams / 1000) * qty
      totalCargo += Number(it.cargo) || 0
      totalCustomerCargo += Number(it.customer_cargo) || 0
    }

    const serviceFee = Number(form.service_fee) || 3
    const totalPrice = totalSelling + totalCustomerCargo + serviceFee
    const totalPriceUzs = usdToUzs > 0 ? totalPrice * usdToUzs : 0
    const totalPaid = (Number(form.paid_card) || 0) + (Number(form.paid_cash) || 0)
    const budgetApplied = Number(order?.budget_applied_uzs) || 0
    const unpaid = totalPriceUzs - totalPaid - budgetApplied

    return { totalSelling, totalWeight, totalCargo, totalCustomerCargo, totalPrice, totalPriceUzs, budgetApplied, unpaid }
  }, [form.items, form.service_fee, form.paid_card, form.paid_cash, usdToUzs])

  /* ── Submit ── */
  const hasInvalidWeight = form.items.some(
    (it) => it.weight_grams && !Number.isInteger(Number(it.weight_grams))
  )

  const handleSubmit = (e) => {
    e.preventDefault()
    if (hasInvalidWeight) return
    const payload = {
      customer_id: form.customer_id ? Number(form.customer_id) : null,
      customer_name: form.customer_name || null,
      customer_city: form.city || null,
      customer_address: form.address || null,
      customer_phone: form.phone || null,
      status: form.status,
      payment_status: form.payment_status,
      paid_card: Number(form.paid_card) || 0,
      paid_cash: Number(form.paid_cash) || 0,
      total_amount: totals.totalSelling || null,
      notes: form.notes || null,
      service_fee: Number(form.service_fee) || 3,
      is_family_discount: form.is_family_discount,
      items: form.items
        .filter((it) => it.product_id || it.product_name || it.cost_price || it.selling_price)
        .map((it) => ({
          product_id: it.product_id ? Number(it.product_id) : null,
          product_name: it.product_name || null,
          brand: it.brand || null,
          category_id: it.category_id ? Number(it.category_id) : null,
          category_name: it.category_name || null,
          quantity: Number(it.quantity) || 1,
          selling_price: it.selling_price ? Number(it.selling_price) : null,
          selling_price_uzs: it.selling_price_uzs ? Number(it.selling_price_uzs) : null,
          cost_price: it.cost_price ? Number(it.cost_price) : null,
          packaged_weight_grams: it.weight_grams ? Number(it.weight_grams) : null,
          from_stock: it.from_stock || false,
          attribute_values: (it.attribute_values || [])
            .filter((av) => av.value)
            .map((av) => ({ attribute_id: av.attribute_id, value: av.value })),
        })),
    }
    if (order) {
      payload.order_number = order.order_number
    }
    onSave(payload)
  }

  const isEdit = !!order
  const { t } = useTranslation()

  const inputClass =
    'w-full rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-2 text-sm text-(--color-text-base) placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary) transition-shadow'

  const labelClass = 'block text-xs font-medium text-(--color-text-subtle) mb-1.5'

  const tinyLabel = 'block text-[10px] text-(--color-text-muted) mb-0.5'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('orders.modal.title_edit', { number: order.order_number }) : t('orders.modal.title_add')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            {t('common.cancel')}
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving || hasInvalidWeight}>
            {saving ? t('common.saving') : isEdit ? t('orders.modal.update') : t('orders.modal.create')}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Customer Section */}
        <div>
          <h3 className="text-xs font-semibold text-(--color-text-base) uppercase tracking-wider mb-3">
            {t('orders.modal.section_customer')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div ref={customerRef} className="relative">
              <label className={labelClass}>{t('orders.modal.name')}</label>
              <input
                value={form.customer_name}
                onChange={handleCustomerNameChange}
                onFocus={() => form.customer_name && setShowCustomerSuggestions(true)}
                className={inputClass}
                placeholder={t('orders.modal.customer_placeholder')}
                autoComplete="off"
              />
              {showCustomerSuggestions && filteredCustomers.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full bg-white rounded-md ring-1 ring-(--color-border-base) shadow-lg max-h-48 overflow-y-auto py-1">
                  {filteredCustomers.map((c) => (
                    <li
                      key={c.customer_id}
                      onClick={() => handleCustomerPick(c)}
                      className="px-3 py-1.5 text-sm cursor-pointer hover:bg-(--color-bg-subtle) text-(--color-text-base)"
                    >
                      {c.customer_name}
                      {c.city && (
                        <span className="text-xs text-(--color-text-muted) ml-1">
                          ({c.city})
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className={labelClass}>{t('orders.modal.city')}</label>
              <input name="city" value={form.city} onChange={handleChange} className={inputClass} placeholder={t('orders.modal.city')} />
            </div>
            <div>
              <label className={labelClass}>{t('orders.modal.address')}</label>
              <input name="address" value={form.address} onChange={handleChange} className={inputClass} placeholder={t('orders.modal.address')} />
            </div>
            <div>
              <label className={labelClass}>{t('orders.modal.phone')}</label>
              <input name="phone" value={form.phone} onChange={handleChange} className={inputClass} placeholder={t('orders.modal.phone')} />
            </div>
          </div>
        </div>

        {/* Order Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>{t('orders.modal.status')}</label>
            <select name="status" value={form.status} onChange={handleChange} className={inputClass}>
              <option value="pending">{t('orders.status.pending')}</option>
              <option value="shipped">{t('orders.status.shipped')}</option>
              <option value="received">{t('orders.status.received')}</option>
              <option value="completed">{t('orders.status.completed')}</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>{t('orders.modal.service_fee')}</label>
            <input name="service_fee" type="number" step="0.01" value={form.service_fee} onChange={handleChange} className={inputClass} />
          </div>
          <div className="sm:col-span-2 flex items-center justify-end gap-3">
            <label htmlFor="family-discount" className="text-sm text-(--color-text-base) cursor-pointer select-none">
              Family / Friends Discount
            </label>
            <button
              id="family-discount"
              type="button"
              role="switch"
              aria-checked={form.is_family_discount}
              onClick={() => handleDiscountToggle(!form.is_family_discount)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none ${form.is_family_discount ? 'bg-(--color-primary)' : 'bg-(--color-border-base)'}`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition-transform duration-200 mt-0.5 ${form.is_family_discount ? 'translate-x-4' : 'translate-x-0.5'}`}
              />
            </button>
          </div>
        </div>

        {/* Payment */}
        <div>
          <h3 className="text-xs font-semibold text-(--color-text-base) uppercase tracking-wider mb-3">
            {t('orders.modal.section_payment')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{t('orders.modal.payment_status')}</label>
              <select name="payment_status" value={form.payment_status} onChange={handlePaymentStatusChange} className={inputClass}>
                <option value="unpaid">{t('orders.payment.unpaid')}</option>
                <option value="paid_card">{t('orders.payment.paid_card')}</option>
                <option value="paid_cash">{t('orders.payment.paid_cash')}</option>
                <option value="partial">{t('orders.payment.partial')}</option>
                <option value="prepayment">{t('orders.payment.prepayment')}</option>
              </select>
            </div>

            {/* Partial Payment: show card + cash inputs */}
            {form.payment_status === 'partial' && (
              <>
                <div>
                  <label className={labelClass}>{t('orders.modal.paid_card_uzs')}</label>
                  <input name="paid_card" type="number" step="1" min="0" value={form.paid_card} onChange={handleChange} className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className={labelClass}>{t('orders.modal.paid_cash_uzs')}</label>
                  <input name="paid_cash" type="number" step="1" min="0" value={form.paid_cash} onChange={handleChange} className={inputClass} placeholder="0" />
                </div>
              </>
            )}

            {/* Prepayment: method selector + amount */}
            {form.payment_status === 'prepayment' && (
              <>
                <div>
                  <label className={labelClass}>{t('orders.modal.prepaid_via')}</label>
                  <select name="prepay_method" value={form.prepay_method} onChange={(e) => {
                    const method = e.target.value
                    setForm((prev) => {
                      const amount = prev.prepay_method === 'card' ? prev.paid_card : prev.paid_cash
                      return {
                        ...prev,
                        prepay_method: method,
                        paid_card: method === 'card' ? amount : '',
                        paid_cash: method === 'cash' ? amount : '',
                      }
                    })
                  }} className={inputClass}>
                    <option value="card">{t('orders.card')}</option>
                    <option value="cash">{t('orders.cash')}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t('orders.modal.prepaid_amount')}</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={form.prepay_method === 'card' ? form.paid_card : form.paid_cash}
                    onChange={(e) => {
                      const val = e.target.value
                      setForm((prev) => ({
                        ...prev,
                        paid_card: prev.prepay_method === 'card' ? val : '',
                        paid_cash: prev.prepay_method === 'cash' ? val : '',
                      }))
                    }}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
              </>
            )}
          </div>

          {/* Budget applied display */}
          {totals.budgetApplied > 0 && (
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="text-(--color-text-subtle)">{t('orders.modal.budget_applied')}:</span>
              <span className="font-semibold tabular-nums text-emerald-600">
                −{Math.round(totals.budgetApplied).toLocaleString()} UZS
              </span>
            </div>
          )}

          {/* Unpaid display */}
          {form.payment_status !== 'unpaid' && totals.totalPriceUzs > 0 && (
            <div className="mt-2 flex items-center gap-3 text-sm">
              <span className="text-(--color-text-subtle)">{t('orders.modal.unpaid_label')}:</span>
              <span className={`font-semibold tabular-nums ${totals.unpaid > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {Math.round(totals.unpaid).toLocaleString()} UZS
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className={labelClass}>{t('orders.modal.notes')}</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} className={inputClass} placeholder={t('orders.modal.notes_placeholder')} />
        </div>

        {/* From Stock Picker */}
        {(stockProducts || []).length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-(--color-text-base) uppercase tracking-wider mb-2">
              {t('orders.modal.section_from_stock')}
            </h3>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <select
                  value={pendingStockId}
                  onChange={(e) => { setPendingStockId(e.target.value); setPendingStockQty(1) }}
                  className={inputClass}
                >
                  <option value="">{t('orders.modal.from_stock_placeholder')}</option>
                  {(stockProducts || []).map((p) => (
                    <option key={p.product_id} value={p.product_id}>
                      {p.product_name} — {t('orders.modal.from_stock_available', { qty: p.stock_quantity })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-20 shrink-0">
                <input
                  type="number"
                  min="1"
                  max={pendingStockId ? (stockProductMap[Number(pendingStockId)]?.stock_quantity || 999) : 999}
                  value={pendingStockQty}
                  onChange={(e) => setPendingStockQty(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="button"
                onClick={addFromStockItem}
                disabled={!pendingStockId}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium bg-(--color-primary) text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Items Section */}
        <div>
          <h3 className="text-xs font-semibold text-(--color-text-base) uppercase tracking-wider mb-2">{t('orders.modal.section_items')}</h3>

          <div className="space-y-3">
            {form.items.map((item, index) => {
              const opts = rowOptions[index] || { brands: [], products: [] }

              return (
                <div
                  key={index}
                  className={`relative p-3 rounded-md ring-1 ${item.from_stock ? 'bg-emerald-50 ring-emerald-300' : 'bg-(--color-bg-subtle) ring-(--color-border-base)'}`}
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-(--color-text-subtle)">{t('orders.modal.item_label', { number: index + 1 })}</span>
                      {item.from_stock && (
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 ring-1 ring-emerald-300 px-1.5 py-0.5 rounded">
                          {t('orders.modal.section_from_stock')}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="p-1 rounded-md text-(--color-text-muted) hover:text-(--color-danger) hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Row 1: Category, Brand, Product */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                    <div>
                      <span className={tinyLabel}>{t('orders.modal.category')}</span>
                      <AutocompleteInput
                        value={item.category_name}
                        onChange={(text) => handleCategoryType(index, text)}
                        onSelect={(opt) => handleCategoryPick(index, opt)}
                        placeholder={t('orders.modal.category') + '...'}
                        className={inputClass + ' py-1.5 text-xs'}
                        options={categories.map((c) => ({
                          value: c.category_id,
                          label: c.category_name,
                        }))}
                      />
                    </div>
                    <div>
                      <span className={tinyLabel}>{t('orders.modal.brand')}</span>
                      <AutocompleteInput
                        value={item.brand}
                        onChange={(text) => handleBrandType(index, text)}
                        onSelect={(opt) => handleBrandPick(index, opt, item.category_id)}
                        placeholder={t('orders.modal.brand') + '...'}
                        className={inputClass + ' py-1.5 text-xs'}
                        options={(opts.brands || []).map((b) => ({
                          value: b,
                          label: b,
                        }))}
                      />
                    </div>
                    <div>
                      <span className={tinyLabel}>{t('orders.modal.product')}</span>
                      <AutocompleteInput
                        value={item.product_name}
                        onChange={(text) => handleProductType(index, text)}
                        onSelect={(opt) => handleProductPick(index, opt)}
                        placeholder={t('orders.modal.product') + '...'}
                        className={inputClass + ' py-1.5 text-xs'}
                        options={(opts.products || []).map((p) => ({
                          value: p.product_id,
                          label: p.product_name,
                        }))}
                      />
                    </div>
                  </div>

                  {/* Row 1.5: Attributes */}
                  {item.category_id && (item.attribute_values || []).length > 0 && (
                    <div className="flex flex-wrap items-end gap-2 mb-2">
                      {item.attribute_values.map((av, ai) => (
                        <div key={av.attribute_id} className="min-w-25 flex-1">
                          <span className={tinyLabel}>{av.attribute_name}</span>
                          <input
                            value={av.value}
                            onChange={(e) => handleAttrValueChange(index, ai, e.target.value)}
                            placeholder={av.attribute_name}
                            className={inputClass + ' py-1.5 text-xs'}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Row 2: Qty, Cost, Selling, Weight, Cargo, Cust Cargo */}
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                    <div>
                      <span className={tinyLabel}>{t('orders.modal.qty')}</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemField(index, 'quantity', e.target.value)}
                        className={inputClass + ' py-1.5 text-xs'}
                      />
                    </div>
                    <div>
                      <span className={tinyLabel}>{t('orders.modal.cost_krw')}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.cost_price}
                        onChange={(e) => handleCostChange(index, e.target.value)}
                        placeholder="0"
                        className={inputClass + ' py-1.5 text-xs'}
                      />
                    </div>
                    <div>
                      <span className={tinyLabel}>{t('orders.modal.sell_usd')}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.selling_price}
                        onChange={(e) => handleItemField(index, 'selling_price', e.target.value)}
                        placeholder="0.00"
                        className={inputClass + ' py-1.5 text-xs'}
                      />
                      {Number(item.quantity) > 1 && Number(item.selling_price) > 0 && (
                        <span className="text-[10px] text-(--color-text-muted) mt-0.5 block">
                          {t('orders.modal.item_total')}: ${(Number(item.selling_price) * Number(item.quantity)).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className={tinyLabel}>{t('orders.modal.weight_g')}</span>
                      <input
                        type="number"
                        step="1"
                        value={item.weight_grams}
                        onChange={(e) => handleItemField(index, 'weight_grams', e.target.value)}
                        placeholder="0"
                        className={`${inputClass} py-1.5 text-xs ${item.weight_grams && !Number.isInteger(Number(item.weight_grams)) ? 'ring-amber-400 ring-2' : ''}`}
                      />
                      {item.weight_grams && !Number.isInteger(Number(item.weight_grams)) && (
                        <span className="text-[10px] text-amber-600 mt-0.5 block">
                          {t('orders.modal.weight_error')}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className={tinyLabel}>{t('orders.modal.cargo')}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.cargo}
                        onChange={(e) => handleItemField(index, 'cargo', e.target.value)}
                        placeholder="0.00"
                        className={inputClass + ' py-1.5 text-xs'}
                      />
                    </div>
                    <div>
                      <span className={tinyLabel}>{t('orders.modal.cust_cargo')}</span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.customer_cargo}
                        onChange={(e) => handleItemField(index, 'customer_cargo', e.target.value)}
                        placeholder="0.00"
                        className={inputClass + ' py-1.5 text-xs'}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex justify-end mt-2">
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center gap-1 text-xs font-medium text-(--color-primary) hover:underline cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {t('orders.modal.add_item')}
            </button>
          </div>

          {/* Totals */}
          <div className="flex flex-wrap items-center justify-end gap-4 sm:gap-6 mt-3 pt-3 border-t border-(--color-border-base)">
            <div className="text-right">
              <span className="text-[10px] text-(--color-text-muted) block">{t('orders.modal.total_weight')}</span>
              <span className="text-sm font-semibold text-(--color-text-base) tabular-nums">
                {totals.totalWeight.toFixed(2)} kg
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-(--color-text-muted) block">{t('orders.modal.total_cargo')}</span>
              <span className="text-sm font-semibold text-(--color-text-base) tabular-nums">
                ${totals.totalCargo.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-(--color-text-muted) block">{t('orders.modal.total_cust_cargo')}</span>
              <span className="text-sm font-semibold text-(--color-text-base) tabular-nums">
                ${totals.totalCustomerCargo.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-(--color-text-muted) block">
                {t('orders.modal.total_price_fee', { fee: Number(form.service_fee || 3).toFixed(0) })}
              </span>
              <span className="text-sm font-bold text-(--color-primary) tabular-nums">
                ${totals.totalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}
