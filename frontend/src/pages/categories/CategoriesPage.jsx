import { useState, useEffect, useCallback } from 'react'
import { Plus, FolderTree, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import Container from '../../components/Container'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import Table from '../../components/Table'
import Pagination from '../../components/Pagination'
import EmptyState from '../../components/EmptyState'
import CategoryModal from './CategoryModal'
import { getColumns } from './columns'
import { categoriesApi } from '../../lib/api'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 20

function CategoryCard({ category, selected, onToggleSelect, onEdit, onDelete }) {
  const attrs = category.attributes ?? []
  return (
    <div className={`p-4 space-y-3 transition-colors ${selected ? 'bg-blue-50/40' : ''}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(category.category_id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-(--color-text-base)">{category.category_name}</span>
          {category.description && (
            <p className="text-sm text-(--color-text-subtle) mt-0.5">{category.description}</p>
          )}
          {attrs.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {attrs.map((a) => (
                <Badge key={a.attribute_id} variant="neutral">{a.attribute_name}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ml-7 flex justify-end gap-1">
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
  )
}

export default function CategoriesPage() {
  const { t } = useTranslation()
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [saving, setSaving] = useState(false)

  const [selectedIds, setSelectedIds] = useState(new Set())
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await categoriesApi.getAll({ page, page_size: PAGE_SIZE })
      setCategories(res.data.data)
      setTotal(res.data.total)
      setSelectedIds(new Set())
    } catch (err) {
      setError(t('categories.failed_load'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [page, t])

  useEffect(() => { fetchData() }, [fetchData])

  const handleEditSelected = () => {
    const categoryId = [...selectedIds][0]
    const category = categories.find((c) => c.category_id === categoryId)
    if (category) { setEditingCategory(category); setModalOpen(true) }
  }

  const handleCreate = () => { setEditingCategory(null); setModalOpen(true) }

  const handleSave = async (data) => {
    setSaving(true)
    try {
      let res
      if (editingCategory) {
        res = await categoriesApi.update(editingCategory.category_id, data)
      } else {
        res = await categoriesApi.create(data)
      }
      return res.data
    } catch (err) {
      console.error('Save failed:', err)
      toast.error(t('categories.failed_save'))
      return null
    } finally {
      setSaving(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!deleteTarget) return
    try {
      await Promise.all(deleteTarget.map((id) => categoriesApi.delete(id)))
      setDeleteTarget(null)
      await fetchData()
      toast.success(t('categories.deleted_success'))
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error(t('categories.failed_delete'))
    }
  }

  const toggleSelect = (categoryId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === categories.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(categories.map((c) => c.category_id)))
  }

  const columns = getColumns({
    selectedIds,
    onToggleSelect: toggleSelect,
    onToggleAll: toggleAll,
    allSelected: categories.length > 0 && selectedIds.size === categories.length,
  })

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-(--color-text-base)">
            {t('categories.title')}
          </h1>
          <p className="text-sm text-(--color-text-subtle) mt-0.5">
            {total !== 1 ? t('categories.count_plural', { count: total }) : t('categories.count', { count: total })}
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          {t('categories.add')}
        </Button>
      </div>

      {/* Bulk Actions */}
      <div className={`grid transition-all duration-200 ease-out ${selectedIds.size > 0 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <Container className="p-3!">
            <div className="flex items-center gap-2 sm:gap-3">
              <span className="text-sm font-medium text-(--color-text-base) shrink-0">
                {t('common.selected', { count: selectedIds.size })}
              </span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {selectedIds.size === 1 && (
                  <Button variant="secondary" size="sm" onClick={handleEditSelected}>
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('common.edit')}</span>
                  </Button>
                )}
                <Button variant="danger" size="sm" onClick={() => setDeleteTarget([...selectedIds])}>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('common.delete')} ({selectedIds.size})</span>
                </Button>
              </div>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-auto text-(--color-text-subtle) hover:text-(--color-text-base) cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </Container>
        </div>
      </div>

      {/* Table */}
      <Container className="p-0!">
        {loading ? (
          <div className="divide-y divide-(--color-border-base)">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-4 bg-(--color-bg-component) rounded animate-pulse" style={{ width: `${60 + Math.random() * 80}px` }} />
                ))}
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <p className="text-sm text-(--color-danger)">{error}</p>
            <Button variant="secondary" size="sm" onClick={fetchData} className="mt-3">{t('common.retry')}</Button>
          </div>
        ) : categories.length === 0 ? (
          <EmptyState icon={FolderTree} title={t('categories.no_found')} description={t('categories.no_found_desc')} />
        ) : (
          <>
            {/* Mobile */}
            <div className="sm:hidden divide-y divide-(--color-border-base) max-h-[calc(100vh-220px)] overflow-y-auto">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-(--color-bg-subtle) border-b border-(--color-border-base)">
                <input
                  type="checkbox"
                  checked={categories.length > 0 && selectedIds.size === categories.length}
                  onChange={toggleAll}
                  className="rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer"
                />
                <span className="text-xs text-(--color-text-subtle)">{t('common.select_all')}</span>
              </div>
              {categories.map((category) => (
                <CategoryCard
                  key={category.category_id}
                  category={category}
                  selected={selectedIds.has(category.category_id)}
                  onToggleSelect={toggleSelect}
                  onEdit={() => { setEditingCategory(category); setModalOpen(true) }}
                  onDelete={() => setDeleteTarget([category.category_id])}
                />
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden sm:block">
              <Table columns={columns} data={categories} />
            </div>

            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
          </>
        )}
      </Container>

      <CategoryModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCategory(null) }}
        onSave={handleSave}
        onDone={() => { setModalOpen(false); setEditingCategory(null); fetchData() }}
        category={editingCategory}
        saving={saving}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-lg ring-1 ring-(--color-border-base) shadow-lg w-full max-w-sm mx-4 p-5">
            <h3 className="text-base font-semibold text-(--color-text-base) mb-2">
              {deleteTarget.length === 1 ? t('categories.delete_single') : t('categories.delete_many', { count: deleteTarget.length })}
            </h3>
            <p className="text-sm text-(--color-text-subtle) mb-5">
              {t('common.delete_confirm')}{' '}
              <span className="font-medium text-(--color-text-base)">
                {deleteTarget.length === 1
                  ? categories.find((c) => c.category_id === deleteTarget[0])?.category_name
                  : t('categories.delete_many_label', { count: deleteTarget.length })}
              </span>
              ? {t('common.cannot_be_undone')}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
              <Button variant="danger" onClick={handleBulkDelete}>{t('common.delete')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
