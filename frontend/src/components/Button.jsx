const variants = {
  primary:
    'bg-(--color-primary) text-white hover:bg-(--color-primary-hover) active:bg-indigo-700',
  secondary:
    'bg-white text-(--color-text-base) ring-1 ring-(--color-border-base) hover:bg-(--color-bg-subtle) active:bg-(--color-bg-component)',
  danger:
    'bg-(--color-danger) text-white hover:bg-(--color-danger-hover) active:bg-red-700',
  ghost:
    'text-(--color-text-subtle) hover:bg-(--color-bg-subtle) hover:text-(--color-text-base)',
}

const sizes = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-3.5 py-2 text-sm',
}

export default function Button({
  children,
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
