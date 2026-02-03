import { useState, useEffect } from 'react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'

const initialForm = {
  customer_name: '',
  contact_phone: '',
  telegram_id: '',
  location: '',
  is_active: true,
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
        location: customer.location ?? '',
        is_active: customer.is_active ?? true,
      })
    } else {
      setForm(initialForm)
    }
  }, [customer, open])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      customer_name: form.customer_name,
      contact_phone: form.contact_phone || null,
      telegram_id: form.telegram_id || null,
      location: form.location || null,
      is_active: form.is_active,
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

        <div>
          <label className={labelClass}>Location</label>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            className={inputClass}
            placeholder="City, country"
          />
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
