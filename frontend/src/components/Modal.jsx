import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open) return null

  const sizeClasses = {
    md: 'md:max-w-lg',
    lg: 'md:max-w-3xl',
    xl: 'md:max-w-5xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className={`relative bg-white md:rounded-lg rounded-t-xl ring-1 ring-(--color-border-base) shadow-lg w-full md:mx-5 max-h-[90vh] md:max-h-[90vh] flex flex-col ${sizeClasses[size] || sizeClasses.md}`}>
        <div className="flex items-center justify-between px-4 md:px-5 py-4 border-b border-(--color-border-base)">
          <h2 className="text-base font-semibold text-(--color-text-base)">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-(--color-text-muted) hover:text-(--color-text-base) hover:bg-(--color-bg-subtle) transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-5">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 px-4 md:px-5 py-4 border-t border-(--color-border-base)">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
