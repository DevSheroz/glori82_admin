import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

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
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, shown as drawer when mobileMenuOpen */}
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

      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <div className="p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
