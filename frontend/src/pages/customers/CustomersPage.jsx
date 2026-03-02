import { useState, useEffect, useCallback } from 'react'
import { Plus, Users, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import Container from '../../components/Container'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import Table from '../../components/Table'
import EmptyState from '../../components/EmptyState'
import Pagination from '../../components/Pagination'
import CustomerModal from './CustomerModal'
import { getColumns } from './columns'
import { customersApi } from '../../lib/api'
import { useTranslation } from 'react-i18next'

const PAGE_SIZE = 20

function CustomerCard({ customer, selected, onToggleSelect, onEdit, onDelete }) {
  const { t } = useTranslation()
  return (
    <div className={`p-4 space-y-3 transition-colors ${selected ? 'bg-blue-50/40' : ''}`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(customer.customer_id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-(--color-text-base) truncate">{customer.customer_name}</span>
            {customer.is_active ? (
              <Badge variant="success">{t('common.active')}</Badge>
            ) : (
              <Badge variant="neutral">{t('common.inactive')}</Badge>
            )}
          </div>

          {customer.contact_phone && (
            <div className="text-sm text-(--color-text-subtle) mt-1 tabular-nums">
              {customer.contact_phone}
            </div>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {customer.telegram_id && (
              <span className="text-xs text-(--color-text-muted)">{customer.telegram_id}</span>
            )}
            {customer.city && (
              <span className="text-xs text-(--color-text-muted)">{customer.city}</span>
            )}
            {customer.address && (
              <span className="text-xs text-(--color-text-muted)">{customer.address}</span>
            )}
          </div>

          {Number(customer.budget) > 0 && (
            <div className="text-sm font-medium text-emerald-600 tabular-nums mt-1">
              {Math.round(Number(customer.budget)).toLocaleString('en-US')} UZS
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

export default function CustomersPage() {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [filterActive, setFilterActive] = useState('all')
  const [page, setPage] = useState(1)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [saving, setSaving] = useState(false)

  const [selectedIds, setSelectedIds] = useState(new Set())
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
  }, [filterActive, page, t])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(1) }, [filterActive])

  const handleEditSelected = () => {
    const customerId = [...selectedIds][0]
    const customer = customers.find((c) => c.customer_id === customerId)
    if (customer) { setEditingCustomer(customer); setModalOpen(true) }
  }

  const handleCreate = () => { setEditingCustomer(null); setModalOpen(true) }

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
      await fetchData()
    } catch (err) {
      console.error('Save failed:', err)
      toast.error(t('customers.failed_save'))
    } finally {
      setSaving(false)
    }
  }

  const handleBulkDelete = async () => {
    if (!deleteTarget) return
    try {
      await Promise.all(deleteTarget.map((id) => customersApi.delete(id)))
      setDeleteTarget(null)
      await fetchData()
      toast.success(t('customers.deleted_success'))
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error(t('customers.failed_delete'))
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
    if (selectedIds.size === customers.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(customers.map((c) => c.customer_id)))
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
          <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className={selectClass}>
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
                {Array.from({ length: 5 }).map((_, j) => (
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
        ) : customers.length === 0 ? (
          <EmptyState icon={Users} title={t('customers.no_found')} description={t('customers.no_found_desc')} />
        ) : (
          <>
            {/* Mobile */}
            <div className="sm:hidden divide-y divide-(--color-border-base) max-h-[calc(100vh-220px)] overflow-y-auto">
              <div className="flex items-center gap-3 px-4 py-2.5 bg-(--color-bg-subtle) border-b border-(--color-border-base)">
                <input
                  type="checkbox"
                  checked={customers.length > 0 && selectedIds.size === customers.length}
                  onChange={toggleAll}
                  className="rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer"
                />
                <span className="text-xs text-(--color-text-subtle)">{t('common.select_all')}</span>
              </div>
              {customers.map((customer) => (
                <CustomerCard
                  key={customer.customer_id}
                  customer={customer}
                  selected={selectedIds.has(customer.customer_id)}
                  onToggleSelect={toggleSelect}
                  onEdit={() => { setEditingCustomer(customer); setModalOpen(true) }}
                  onDelete={() => setDeleteTarget([customer.customer_id])}
                />
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden sm:block">
              <Table columns={columns} data={customers} />
            </div>

            <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
          </>
        )}
      </Container>

      <CustomerModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingCustomer(null) }}
        onSave={handleSave}
        customer={editingCustomer}
        saving={saving}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setDeleteTarget(null)} />
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
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
              <Button variant="danger" onClick={handleBulkDelete}>{t('common.delete')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
