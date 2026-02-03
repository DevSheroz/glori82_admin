import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'

const initialForm = {
  product_name: '',
  brand: '',
  category_id: '',
  description: '',
  cost_price: '',
  selling_price: '',
  selling_price_uzs: '',
  packaged_weight_grams: '',
  volume_ml: '',
  stock_quantity: '',
  reorder_level: '',
  is_active: true,
}

export default function ProductModal({
  open,
  onClose,
  onSave,
  product,
  categories,
  saving,
}) {
  const [form, setForm] = useState(initialForm)
  const [attrValues, setAttrValues] = useState({})

  useEffect(() => {
    if (product) {
      setForm({
        product_name: product.product_name ?? '',
        brand: product.brand ?? '',
        category_id: product.category_id ?? '',
        description: product.description ?? '',
        cost_price: product.cost_price ?? '',
        selling_price: product.selling_price ?? '',
        selling_price_uzs: product.selling_price_uzs ?? '',
        packaged_weight_grams: product.packaged_weight_grams ?? '',
        volume_ml: product.volume_ml ?? '',
        stock_quantity: product.stock_quantity ?? '',
        reorder_level: product.reorder_level ?? '',
        is_active: product.is_active ?? true,
      })
      const vals = {}
      for (const av of product.attribute_values ?? []) {
        vals[av.attribute_id] = av.value
      }
      setAttrValues(vals)
    } else {
      setForm(initialForm)
      setAttrValues({})
    }
  }, [product, open])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const selectedCategory = categories.find(
    (c) => c.category_id === Number(form.category_id)
  )
  const categoryAttributes = selectedCategory?.attributes ?? []

  const handleAttrValueChange = (attrId, value) => {
    setAttrValues((prev) => ({ ...prev, [attrId]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const attributeValuesList = categoryAttributes
      .filter((a) => attrValues[a.attribute_id]?.trim())
      .map((a) => ({
        attribute_id: a.attribute_id,
        value: attrValues[a.attribute_id].trim(),
      }))

    const payload = {
      ...form,
      category_id: form.category_id ? Number(form.category_id) : null,
      cost_price: Number(form.cost_price) || 0,
      selling_price: form.selling_price ? Number(form.selling_price) : null,
      selling_price_uzs: form.selling_price_uzs ? Number(form.selling_price_uzs) : null,
      packaged_weight_grams: form.packaged_weight_grams ? Number(form.packaged_weight_grams) : null,
      volume_ml: form.volume_ml ? Number(form.volume_ml) : null,
      stock_quantity: Number(form.stock_quantity) || 0,
      reorder_level: Number(form.reorder_level) || 0,
      brand: form.brand || null,
      attribute_values: attributeValuesList.length > 0 ? attributeValuesList : null,
    }
    onSave(payload)
  }

  const isEdit = !!product

  const inputClass =
    'w-full rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-2 text-sm text-(--color-text-base) placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary) transition-shadow'

  const labelClass = 'block text-xs font-medium text-(--color-text-subtle) mb-1.5'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Product' : 'Add Product'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={saving || !form.product_name}
          >
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Product Name *</label>
          <input
            name="product_name"
            value={form.product_name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Enter product name"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Brand</label>
          <input
            name="brand"
            value={form.brand}
            onChange={handleChange}
            className={inputClass}
            placeholder="e.g. Innisfree, Beplain"
          />
        </div>

        <div>
          <label className={labelClass}>Category</label>
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.category_id} value={c.category_id}>
                {c.category_name}
              </option>
            ))}
          </select>
        </div>

        {categoryAttributes.length > 0 && (
          <div>
            <label className={labelClass}>Attributes</label>
            <div className="grid grid-cols-2 gap-3">
              {categoryAttributes.map((attr) => (
                <div key={attr.attribute_id}>
                  <label className={labelClass}>{attr.attribute_name}</label>
                  <input
                    value={attrValues[attr.attribute_id] ?? ''}
                    onChange={(e) => handleAttrValueChange(attr.attribute_id, e.target.value)}
                    className={inputClass}
                    placeholder={attr.attribute_name}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={2}
            className={inputClass}
            placeholder="Optional description"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Cost Price (KRW)</label>
            <input
              name="cost_price"
              type="number"
              step="1"
              min="0"
              value={form.cost_price}
              onChange={handleChange}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>Price (USD)</label>
            <input
              name="selling_price"
              type="number"
              step="0.01"
              min="0"
              value={form.selling_price}
              onChange={handleChange}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className={labelClass}>Price (UZS)</label>
            <input
              name="selling_price_uzs"
              type="number"
              step="0.01"
              min="0"
              value={form.selling_price_uzs}
              onChange={handleChange}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Weight (g)</label>
            <input
              name="packaged_weight_grams"
              type="number"
              min="0"
              value={form.packaged_weight_grams}
              onChange={handleChange}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>Volume (ml)</label>
            <input
              name="volume_ml"
              type="number"
              min="0"
              value={form.volume_ml}
              onChange={handleChange}
              className={inputClass}
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Stock Quantity</label>
            <input
              name="stock_quantity"
              type="number"
              min="0"
              value={form.stock_quantity}
              onChange={handleChange}
              className={inputClass}
              placeholder="0"
            />
          </div>
          <div>
            <label className={labelClass}>Reorder Level</label>
            <input
              name="reorder_level"
              type="number"
              min="0"
              value={form.reorder_level}
              onChange={handleChange}
              className={inputClass}
              placeholder="0"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            id="is_active"
            className="rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary)"
          />
          <label
            htmlFor="is_active"
            className="text-sm text-(--color-text-base)"
          >
            Active
          </label>
        </div>
      </form>
    </Modal>
  )
}
