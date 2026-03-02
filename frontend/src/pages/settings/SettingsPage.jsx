import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, User } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import Container from '../../components/Container'
import Button from '../../components/Button'
import Badge from '../../components/Badge'
import EmptyState from '../../components/EmptyState'
import { usersApi } from '../../lib/api'

const emptyForm = { name: '', user_name: '', password: '', is_active: true }

function UserModal({ open, onClose, onSave, editingUser, saving }) {
  const { t } = useTranslation()
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (open) {
      setForm(
        editingUser
          ? { name: editingUser.name, user_name: editingUser.user_name, password: '', is_active: editingUser.is_active }
          : emptyForm
      )
      setErrors({})
    }
  }, [open, editingUser])

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = t('settings.error_name_required')
    if (!form.user_name.trim()) e.user_name = t('settings.error_username_required')
    if (!editingUser && !form.password.trim()) e.password = t('settings.error_password_required')
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const e2 = validate()
    if (Object.keys(e2).length > 0) { setErrors(e2); return }
    const payload = { name: form.name.trim(), user_name: form.user_name.trim() }
    if (!editingUser) payload.password = form.password
    else if (form.password.trim()) payload.password = form.password.trim()
    if (editingUser) payload.is_active = form.is_active
    onSave(payload)
  }

  if (!open) return null

  const inputClass = 'w-full rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-2 text-sm text-(--color-text-base) focus:outline-none focus:ring-2 focus:ring-(--color-primary) placeholder:text-(--color-text-muted)'
  const errorClass = 'text-xs text-(--color-danger) mt-1'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-lg ring-1 ring-(--color-border-base) shadow-lg w-full max-w-sm mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-(--color-border-base)">
          <h2 className="text-base font-semibold text-(--color-text-base)">
            {editingUser ? t('settings.modal_edit') : t('settings.modal_add')}
          </h2>
          <button onClick={onClose} className="p-1 rounded text-(--color-text-muted) hover:text-(--color-text-base) transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-(--color-text-subtle) mb-1">{t('settings.field_name')}</label>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder={t('settings.field_name_placeholder')}
            />
            {errors.name && <p className={errorClass}>{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-(--color-text-subtle) mb-1">{t('settings.field_username')}</label>
            <input
              className={inputClass}
              value={form.user_name}
              onChange={(e) => setForm((p) => ({ ...p, user_name: e.target.value }))}
              placeholder={t('settings.field_username_placeholder')}
              autoComplete="off"
            />
            {errors.user_name && <p className={errorClass}>{errors.user_name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-(--color-text-subtle) mb-1">
              {editingUser ? t('settings.field_password_edit') : t('settings.field_password')}
            </label>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder={editingUser ? t('settings.field_password_edit_placeholder') : t('settings.field_password_placeholder')}
              autoComplete="new-password"
            />
            {errors.password && <p className={errorClass}>{errors.password}</p>}
          </div>

          {editingUser && (
            <div className="flex items-center gap-2">
              <input
                id="is_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((p) => ({ ...p, is_active: e.target.checked }))}
                className="rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer"
              />
              <label htmlFor="is_active" className="text-sm text-(--color-text-base) cursor-pointer">
                {t('settings.field_active')}
              </label>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? t('common.saving') : editingUser ? t('common.save') : t('settings.create_user')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await usersApi.getAll()
      setUsers(res.data)
    } catch (err) {
      setError(t('settings.failed_load'))
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (editingUser) {
        await usersApi.update(editingUser.user_id, data)
        toast.success(t('settings.updated_success'))
      } else {
        await usersApi.create(data)
        toast.success(t('settings.created_success'))
      }
      setModalOpen(false)
      setEditingUser(null)
      await fetchData()
    } catch (err) {
      const detail = err.response?.data?.detail
      toast.error(detail || t('settings.failed_save'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await usersApi.delete(deleteTarget.user_id)
      setDeleteTarget(null)
      await fetchData()
      toast.success(t('settings.deleted_success'))
    } catch (err) {
      toast.error(t('settings.failed_delete'))
    }
  }

  const roleVariant = (role) => role === 'admin' ? 'info' : 'neutral'

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-semibold text-(--color-text-base)">{t('settings.title')}</h1>
          <p className="text-sm text-(--color-text-subtle) mt-0.5">{t('settings.subtitle')}</p>
        </div>
        <Button variant="primary" onClick={() => { setEditingUser(null); setModalOpen(true) }} className="self-start sm:self-auto">
          <Plus className="w-4 h-4" />
          {t('settings.add_user')}
        </Button>
      </div>

      {/* User list */}
      <Container className="p-0!">
        {loading ? (
          <div className="divide-y divide-(--color-border-base)">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                {Array.from({ length: 4 }).map((_, j) => (
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
        ) : users.length === 0 ? (
          <EmptyState icon={User} title={t('settings.no_users')} description={t('settings.no_users_desc')} />
        ) : (
          <div className="divide-y divide-(--color-border-base)">
            {users.map((u) => {
              const isSelf = u.user_id === currentUser?.user_id
              return (
                <div key={u.user_id} className="flex items-center gap-3 px-4 py-3">
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-(--color-bg-component) flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-(--color-text-subtle)">
                      {u.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-(--color-text-base)">{u.name}</span>
                      {isSelf && (
                        <span className="text-xs text-(--color-text-muted)">({t('settings.you')})</span>
                      )}
                      <Badge variant={roleVariant(u.role)}>{u.role}</Badge>
                      {!u.is_active && <Badge variant="danger">{t('common.inactive')}</Badge>}
                    </div>
                    <p className="text-xs text-(--color-text-muted) mt-0.5">@{u.user_name}</p>
                  </div>

                  {/* Created date — hidden on mobile */}
                  <span className="hidden sm:block text-xs text-(--color-text-muted) tabular-nums shrink-0">
                    {new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditingUser(u); setModalOpen(true) }}
                      className="p-1.5 rounded-md text-(--color-text-subtle) hover:text-(--color-text-base) hover:bg-(--color-bg-component) transition-colors"
                      title={t('common.edit')}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => !isSelf && setDeleteTarget(u)}
                      disabled={isSelf}
                      className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={isSelf ? t('settings.cannot_delete_self') : t('common.delete')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Container>

      <UserModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingUser(null) }}
        onSave={handleSave}
        editingUser={editingUser}
        saving={saving}
      />

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-lg ring-1 ring-(--color-border-base) shadow-lg w-full max-w-sm mx-4 p-5">
            <h3 className="text-base font-semibold text-(--color-text-base) mb-2">{t('settings.delete_user')}</h3>
            <p className="text-sm text-(--color-text-subtle) mb-5">
              {t('common.delete_confirm')}{' '}
              <span className="font-medium text-(--color-text-base)">{deleteTarget.name}</span>
              ? {t('common.cannot_be_undone')}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
              <Button variant="danger" onClick={handleDelete}>{t('common.delete')}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
