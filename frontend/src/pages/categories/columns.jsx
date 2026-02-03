import Badge from '../../components/Badge'
import Button from '../../components/Button'
import { Pencil, Trash2 } from 'lucide-react'

export function getColumns({ onEdit, onDelete }) {
  return [
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
    {
      key: 'actions',
      label: '',
      width: '100px',
      render: (row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="sm" onClick={() => onEdit(row)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(row)}>
            <Trash2 className="w-3.5 h-3.5 text-(--color-danger)" />
          </Button>
        </div>
      ),
    },
  ]
}
