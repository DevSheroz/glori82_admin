export default function Container({ children, className = '' }) {
  return (
    <div
      className={`bg-white rounded-lg ring-1 ring-(--color-border-base) p-5 ${className}`}
    >
      {children}
    </div>
  )
}
