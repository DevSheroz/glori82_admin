import Badge from '../../components/Badge'
import { useTranslation } from 'react-i18next'

const checkboxClass = 'rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer'

export function getColumns({ selectedIds, onToggleSelect, onToggleAll, allSelected }) {
  const { t } = useTranslation()
  return [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={onToggleAll}
          className={checkboxClass}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      width: '40px',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.customer_id)}
          onChange={() => onToggleSelect(row.customer_id)}
          onClick={(e) => e.stopPropagation()}
          className={checkboxClass}
        />
      ),
    },
    {
      key: 'customer_name',
      label: t('customers.col_name'),
      render: (row) => (
        <span className="font-medium text-(--color-text-base)">
          {row.customer_name}
        </span>
      ),
    },
    {
      key: 'contact_phone',
      label: t('customers.col_phone'),
      render: (row) => (
        <span className="text-(--color-text-subtle) tabular-nums">
          {row.contact_phone || '—'}
        </span>
      ),
    },
    {
      key: 'telegram_id',
      label: t('customers.col_telegram'),
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {row.telegram_id || '—'}
        </span>
      ),
    },
    {
      key: 'address',
      label: t('customers.col_address'),
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {row.address || '—'}
        </span>
      ),
    },
    {
      key: 'city',
      label: t('customers.col_city'),
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {row.city || '—'}
        </span>
      ),
    },
    {
      key: 'budget',
      label: t('customers.col_budget'),
      render: (row) => {
        const amount = Number(row.budget) || 0
        return amount > 0 ? (
          <span className="text-sm font-medium text-emerald-600 tabular-nums">
            {Math.round(amount).toLocaleString('en-US')} UZS
          </span>
        ) : (
          <span className="text-(--color-text-subtle)">—</span>
        )
      },
    },
    {
      key: 'is_active',
      label: t('common.status'),
      render: (row) =>
        row.is_active ? (
          <Badge variant="success">{t('common.active')}</Badge>
        ) : (
          <Badge variant="neutral">{t('common.inactive')}</Badge>
        ),
    },
  ]
}
