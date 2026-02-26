import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'

const initialForm = {
  customer_name: '',
  contact_phone: '',
  telegram_id: '',
  address: '',
  city: '',
  is_active: true,
  budget: '',
}

export default function CustomerModal({ open, onClose, onSave, customer, saving }) {
  const [form, setForm] = useState(initialForm)

  useEffect(() => {
    if (!open) return
    if (customer) {
      setForm({
        customer_name: customer.customer_name ?? '',
        contact_phone: customer.contact_phone ?? '',
        telegram_id: customer.telegram_id ?? '',
        address: customer.address ?? '',
        city: customer.city ?? '',
        is_active: customer.is_active ?? true,
        budget: customer.budget && Number(customer.budget) > 0
          ? Math.round(Number(customer.budget)).toLocaleString('en-US')
          : '',
      })
    } else {
      setForm(initialForm)
    }
  }, [customer, open])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleBudgetChange = (e) => {
    const raw = e.target.value.replace(/,/g, '')
    if (raw === '' || /^\d+$/.test(raw)) {
      const formatted = raw ? Number(raw).toLocaleString('en-US') : ''
      setForm((prev) => ({ ...prev, budget: formatted }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      customer_name: form.customer_name,
      contact_phone: form.contact_phone || null,
      telegram_id: form.telegram_id || null,
      address: form.address || null,
      city: form.city || null,
      is_active: form.is_active,
      budget: Number(form.budget.replace(/,/g, '')) || 0,
    })
  }

  const isEdit = !!customer

  const inputClass =
    'w-full rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-2 text-sm text-(--color-text-base) placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary) transition-shadow'

  const labelClass = 'block text-xs font-medium text-(--color-text-subtle) mb-1.5'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Customer' : 'Add Customer'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving || !form.customer_name.trim()}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Name *</label>
          <input
            name="customer_name"
            value={form.customer_name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Customer name"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Phone</label>
            <input
              name="contact_phone"
              value={form.contact_phone}
              onChange={handleChange}
              className={inputClass}
              placeholder="+1 234 567 890"
            />
          </div>
          <div>
            <label className={labelClass}>Telegram ID</label>
            <input
              name="telegram_id"
              value={form.telegram_id}
              onChange={handleChange}
              className={inputClass}
              placeholder="@username"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Address</label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className={inputClass}
              placeholder="Street address"
            />
          </div>
          <div>
            <label className={labelClass}>City</label>
            <input
              name="city"
              value={form.city}
              onChange={handleChange}
              className={inputClass}
              placeholder="e.g. Tashkent"
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Budget (UZS)</label>
          <div className="relative">
            <input
              name="budget"
              value={form.budget}
              onChange={handleBudgetChange}
              className={inputClass}
              placeholder="0"
              inputMode="numeric"
            />
            {form.budget && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-(--color-text-muted) pointer-events-none">
                UZS
              </span>
            )}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={handleChange}
            className="rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary)"
          />
          <span className="text-sm text-(--color-text-base)">Active</span>
        </label>
      </form>
    </Modal>
  )
}
