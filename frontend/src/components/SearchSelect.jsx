import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

export default function SearchSelect({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef(null)
  const inputRef = useRef(null)

  const selected = options.find((o) => String(o.value) === String(value))

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase()),
  )

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const handleSelect = (val) => {
    onChange(val)
    setOpen(false)
    setQuery('')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
    setQuery('')
  }

  return (
    <div ref={ref} className={'relative ' + className}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between rounded-md ring-1 ring-(--color-border-base) bg-white px-3 py-1.5 text-sm text-(--color-text-base) focus:outline-none focus:ring-2 focus:ring-(--color-primary) cursor-pointer"
      >
        <span className={selected ? '' : 'text-(--color-text-muted)'}>
          {selected ? selected.label : placeholder}
        </span>
        <span className="flex items-center gap-1">
          {value && (
            <X
              className="w-3.5 h-3.5 text-(--color-text-muted) hover:text-(--color-text-base)"
              onClick={handleClear}
            />
          )}
          <ChevronDown className="w-3.5 h-3.5 text-(--color-text-muted)" />
        </span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-md ring-1 ring-(--color-border-base) shadow-lg overflow-hidden">
          <div className="p-1.5">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded-md ring-1 ring-(--color-border-base) bg-white px-2.5 py-1.5 text-sm text-(--color-text-base) placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary)"
            />
          </div>
          <ul className="max-h-48 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-(--color-text-muted)">
                No results
              </li>
            ) : (
              filtered.map((o) => (
                <li
                  key={o.value}
                  onClick={() => handleSelect(o.value)}
                  className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-(--color-bg-subtle) ${
                    String(o.value) === String(value)
                      ? 'text-(--color-primary) font-medium'
                      : 'text-(--color-text-base)'
                  }`}
                >
                  {o.label}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
