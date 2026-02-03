import { useState, useEffect } from 'react'
import { Plus, X, GripVertical } from 'lucide-react'
import Modal from '../../components/Modal'
import Button from '../../components/Button'
import { categoriesApi } from '../../lib/api'

const initialForm = {
  category_name: '',
  description: '',
}

export default function CategoryModal({ open, onClose, onSave, onDone, category, saving }) {
  const [form, setForm] = useState(initialForm)
  const [attributes, setAttributes] = useState([])
  const [newAttrName, setNewAttrName] = useState('')

  useEffect(() => {
    if (!open) return
    if (category) {
      setForm({
        category_name: category.category_name ?? '',
        description: category.description ?? '',
      })
      setAttributes(category.attributes ?? [])
    } else {
      setForm(initialForm)
      setAttributes([])
    }
    setNewAttrName('')
  }, [category, open])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddAttribute = () => {
    const name = newAttrName.trim()
    if (!name) return
    setAttributes((prev) => [
      ...prev,
      { attribute_name: name, sort_order: prev.length, _new: true },
    ])
    setNewAttrName('')
  }

  const handleRemoveAttribute = (index) => {
    setAttributes((prev) => {
      const attr = prev[index]
      if (attr._new) {
        return prev.filter((_, i) => i !== index)
      }
      return prev.map((a, i) => (i === index ? { ...a, _deleted: true } : a))
    })
  }

  const handleAttrNameChange = (index, value) => {
    setAttributes((prev) =>
      prev.map((a, i) => (i === index ? { ...a, attribute_name: value, _edited: true } : a))
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const categoryData = {
      category_name: form.category_name,
      description: form.description || null,
    }
    const savedCategory = await onSave(categoryData)
    if (!savedCategory) return
    const catId = savedCategory.category_id

    for (const attr of attributes) {
      if (attr._deleted && attr.attribute_id) {
        await categoriesApi.deleteAttribute(catId, attr.attribute_id)
      } else if (attr._new && !attr._deleted) {
        await categoriesApi.addAttribute(catId, {
          attribute_name: attr.attribute_name,
          sort_order: attr.sort_order,
        })
      } else if (attr._edited && attr.attribute_id) {
        await categoriesApi.updateAttribute(catId, attr.attribute_id, {
          attribute_name: attr.attribute_name,
        })
      }
    }
    onDone()
  }

  const isEdit = !!category
  const visibleAttributes = attributes.filter((a) => !a._deleted)

  const inputClass =
    'w-full rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-2 text-sm text-(--color-text-base) placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary) transition-shadow'

  const labelClass = 'block text-xs font-medium text-(--color-text-subtle) mb-1.5'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Category' : 'Add Category'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={saving || !form.category_name.trim()}>
            {saving ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass}>Name *</label>
          <input
            name="category_name"
            value={form.category_name}
            onChange={handleChange}
            className={inputClass}
            placeholder="Category name"
            required
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            rows={3}
            className={inputClass}
            placeholder="Optional description"
          />
        </div>

        <div>
          <label className={labelClass}>Attributes</label>
          <div className="space-y-2">
            {visibleAttributes.map((attr, index) => {
              const realIndex = attributes.indexOf(attr)
              return (
                <div key={attr.attribute_id ?? `new-${index}`} className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-(--color-text-muted) shrink-0" />
                  <input
                    value={attr.attribute_name}
                    onChange={(e) => handleAttrNameChange(realIndex, e.target.value)}
                    className={inputClass}
                    placeholder="Attribute name"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveAttribute(realIndex)}
                    className="shrink-0 p-1 rounded hover:bg-(--color-bg-subtle) text-(--color-text-muted) hover:text-(--color-danger) transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
            <div className="flex items-center gap-2">
              <input
                value={newAttrName}
                onChange={(e) => setNewAttrName(e.target.value)}
                className={inputClass}
                placeholder="New attribute name (e.g. Size, Color)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddAttribute()
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddAttribute}
                disabled={!newAttrName.trim()}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </Modal>
  )
}
