import { PackageOpen } from 'lucide-react'

export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'Get started by creating a new item.',
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 rounded-lg bg-(--color-bg-component) flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-(--color-text-muted)" />
      </div>
      <p className="text-sm font-medium text-(--color-text-base) mb-1">
        {title}
      </p>
      <p className="text-sm text-(--color-text-subtle)">{description}</p>
    </div>
  )
}
