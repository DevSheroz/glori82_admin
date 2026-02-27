import { useState, useEffect, useCallback } from 'react'
import { Plus, Users, Pencil, Trash2, X } from 'lucide-react'
import Container from '../../components/Container'
import Button from '../../components/Button'
import Table from '../../components/Table'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import CustomerModal from './CustomerModal'
import { getColumns } from './columns'
import { customersApi } from '../../lib/api'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 20

export default function CustomersPage() {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Filter
  const [filterActive, setFilterActive] = useState('all')

  // Pagination
  const [page, setPage] = useState(1)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [saving, setSaving] = useState(false)

  // Selection
  const [selectedIds, setSelectedIds] = useState(new Set())

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { page, page_size: PAGE_SIZE }
      if (filterActive !== 'all') params.is_active = filterActive === 'active'
      const res = await customersApi.getAll(params)
      setCustomers(res.data.data)
      setTotal(res.data.total)
      setSelectedIds(new Set())
    } catch (err) {
      setError(t('customers.failed_load'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [filterActive, page])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    setPage(1)
  }, [filterActive])

  const handleEditSelected = () => {
    const customerId = [...selectedIds][0]
    const customer = customers.find((c) => c.customer_id === customerId)
    if (customer) {
      setEditingCustomer(customer)
      setModalOpen(true)
    }
  }

  const handleCreate = () => {
    setEditingCustomer(null)
    setModalOpen(true)
  }

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (editingCustomer) {
        await customersApi.update(editingCustomer.customer_id, data)
      } else {
        await customersApi.create(data)
      }
      setModalOpen(false)
      setEditingCustomer(null)
      fetchData()
    } catch (err) {
      console.error('Save failed:', err)
      alert(t('customers.failed_save'))
    } finally {
      setSaving(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!deleteTarget) return
    try {
      await Promise.all(deleteTarget.map((id) => customersApi.delete(id)))
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      console.error('Delete failed:', err)
      alert(t('customers.failed_delete'))
    }
  }

  const toggleSelect = (customerId) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(customerId)) next.delete(customerId)
      else next.add(customerId)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedIds.size === customers.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(customers.map((c) => c.customer_id)))
    }
  }

  const columns = getColumns({
    selectedIds,
    onToggleSelect: toggleSelect,
    onToggleAll: toggleAll,
    allSelected: customers.length > 0 && selectedIds.size === customers.length,
  })

  const selectClass =
    'rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-1.5 text-sm text-(--color-text-base) focus:outline-none focus:ring-2 focus:ring-(--color-primary)'

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-(--color-text-base)">
            {t('customers.title')}
          </h1>
          <p className="text-sm text-(--color-text-subtle) mt-0.5">
            {total !== 1 ? t('customers.count_plural', { count: total }) : t('customers.count', { count: total })}
          </p>
        </div>
        <Button variant="primary" onClick={handleCreate} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          {t('customers.add')}
        </Button>
      </div>

      {/* Filters */}
      <Container className="p-3!">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-wrap">
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className={selectClass}
          >
            <option value="all">{t('common.all_status')}</option>
            <option value="active">{t('common.active_only')}</option>
            <option value="inactive">{t('common.inactive_only')}</option>
          </select>

          {filterActive !== 'all' && (
            <button
              onClick={() => setFilterActive('all')}
              className="text-xs text-(--color-text-subtle) hover:text-(--color-text-base) underline cursor-pointer"
            >
              {t('common.clear_filters')}
            </button>
          )}
        </div>
      </Container>

      {/* Bulk Actions */}
      <div
        className={`grid transition-all duration-200 ease-out ${
          selectedIds.size > 0 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <Container className="p-3!">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-(--color-text-base)">
                {t('common.selected', { count: selectedIds.size })}
              </span>
              <div className="flex items-center gap-2">
                {selectedIds.size === 1 && (
                  <Button variant="secondary" size="sm" onClick={handleEditSelected}>
                    <Pencil className="w-3.5 h-3.5" />
                    {t('common.edit')}
                  </Button>
                )}
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setDeleteTarget([...selectedIds])}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('common.delete')} ({selectedIds.size})
                </Button>
              </div>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-auto text-xs text-(--color-text-subtle) hover:text-(--color-text-base) cursor-pointer"
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
                {Array.from({ length: 5 }).map((_, j) => (
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
              {t('common.retry')}
            </Button>
          </div>
        ) : customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title={t('customers.no_found')}
            description={t('customers.no_found_desc')}
          />
        ) : (
          <>
            <Table columns={columns} data={customers} />
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onChange={setPage}
            />
          </>
        )}
      </Container>

      {/* Customer Modal */}
      <CustomerModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingCustomer(null)
        }}
        onSave={handleSave}
        customer={editingCustomer}
        saving={saving}
      />

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
            onClick={() => setDeleteTarget(null)}
          />
          <div className="relative bg-white rounded-lg ring-1 ring-(--color-border-base) shadow-lg w-full max-w-sm mx-4 p-5">
            <h3 className="text-base font-semibold text-(--color-text-base) mb-2">
              {deleteTarget.length === 1 ? t('customers.delete_single') : t('customers.delete_many', { count: deleteTarget.length })}
            </h3>
            <p className="text-sm text-(--color-text-subtle) mb-5">
              {t('common.delete_confirm')}{' '}
              <span className="font-medium text-(--color-text-base)">
                {deleteTarget.length === 1
                  ? customers.find((c) => c.customer_id === deleteTarget[0])?.customer_name
                  : t('customers.delete_many_label', { count: deleteTarget.length })}
              </span>
              ? {t('common.cannot_be_undone')}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
                {t('common.cancel')}
              </Button>
              <Button variant="danger" onClick={handleBulkDelete}>
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
