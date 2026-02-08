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
          checked={selectedIds.has(row.category_id)}
          onChange={() => onToggleSelect(row.category_id)}
          onClick={(e) => e.stopPropagation()}
          className={checkboxClass}
        />
      ),
    },
    {
      key: 'category_name',
      label: 'Name',
      render: (row) => (
        <span className="font-medium text-(--color-text-base)">
          {row.category_name}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <span className="text-(--color-text-subtle)">
          {row.description || '—'}
        </span>
      ),
    },
    {
      key: 'attributes',
      label: 'Attributes',
      render: (row) => {
        const attrs = row.attributes ?? []
        if (attrs.length === 0) return <span className="text-(--color-text-muted)">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {attrs.map((a) => (
              <Badge key={a.attribute_id} variant="neutral">
                {a.attribute_name}
              </Badge>
            ))}
          </div>
        )
      },
    },
  ]
}
