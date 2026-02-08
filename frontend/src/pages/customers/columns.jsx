import Badge from '../../components/Badge'

const checkboxClass = 'rounded border-(--color-border-base) text-(--color-primary) focus:ring-(--color-primary) cursor-pointer'

export function getColumns({ selectedIds, onToggleSelect, onToggleAll, allSelected }) {
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
      label: 'Name',
      render: (row) => (
        <span className="font-medium text-(--color-text-base)">
          {row.customer_name}
        </span>
      ),
    },
    {
      key: 'contact_phone',
      label: 'Phone',
      render: (row) => (
        <span className="text-(--color-text-subtle) tabular-nums">
          {row.contact_phone || '—'}
        </span>
      ),
    },
    {
      key: 'telegram_id',
      label: 'Telegram',
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {row.telegram_id || '—'}
        </span>
      ),
    },
    {
      key: 'address',
      label: 'Address',
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {row.address || '—'}
        </span>
      ),
    },
    {
      key: 'city',
      label: 'City',
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {row.city || '—'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (row) =>
        row.is_active ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="neutral">Inactive</Badge>
        ),
    },
  ]
}
