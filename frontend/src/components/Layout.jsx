import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Globe, ChevronDown, Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Sidebar from './Sidebar'

function LangDropdown() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' },
  ]

  const currentLabel = languages.find((l) => l.code === i18n.language)?.label ?? 'English'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-(--color-text-subtle) hover:bg-(--color-bg-subtle) hover:text-(--color-text-base) transition-colors"
      >
        <Globe className="w-4 h-4" strokeWidth={2} />
        <span className="font-medium">{currentLabel}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} strokeWidth={2} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-(--color-border-base) rounded-lg shadow-md min-w-36 py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => { i18n.changeLanguage(lang.code); setOpen(false) }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-(--color-bg-subtle) transition-colors ${
                  i18n.language === lang.code
                    ? 'text-(--color-text-base) font-medium'
                    : 'text-(--color-text-subtle)'
                }`}
              >
                {lang.label}
                {i18n.language === lang.code && (
                  <Check className="w-3.5 h-3.5 text-(--color-primary)" strokeWidth={2.5} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default function Layout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="h-screen flex bg-(--color-bg-subtle) overflow-hidden">
      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-(--color-border-base) flex items-center px-4 z-40">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 -ml-2 rounded-md text-(--color-text-subtle) hover:bg-(--color-bg-subtle)"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="ml-2 text-base font-semibold text-(--color-text-base)">
          glori82 Admin
        </span>
        <div className="ml-auto">
          <LangDropdown />
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed md:static inset-y-0 left-0 z-50
          transform transition-transform duration-300 ease-in-out
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onMobileClose={() => setMobileMenuOpen(false)}
          isMobile={mobileMenuOpen}
        />
      </div>

      {/* Right column: desktop topbar + content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Desktop top bar */}
        <div className="hidden md:flex h-12 shrink-0 bg-white border-b border-(--color-border-base) items-center justify-end px-6">
          <LangDropdown />
        </div>

        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          <div className="p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
