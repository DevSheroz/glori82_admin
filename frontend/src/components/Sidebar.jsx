import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Truck,
  X,
  Menu,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/categories', label: 'Categories', icon: FolderTree },
  { to: '/shipments', label: 'Shipments', icon: Truck },
]

export default function Sidebar({ collapsed, onToggle }) {
  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-60'
      } shrink-0 bg-white border-r border-(--color-border-base) flex flex-col z-30 transition-all duration-300`}
    >
      <div className="h-14 flex items-center justify-between px-3 border-b border-(--color-border-base)">
        {!collapsed && (
          <span className="text-base font-semibold text-(--color-text-base) tracking-tight pl-2">
            glor82 Admin
          </span>
        )}
        <button
          onClick={onToggle}
          className={`p-2 rounded-md text-(--color-text-subtle) hover:bg-(--color-bg-subtle) hover:text-(--color-text-base) transition-colors ${
            collapsed ? 'mx-auto' : ''
          }`}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <Menu className="w-5 h-5" strokeWidth={2} />
          ) : (
            <X className="w-5 h-5" strokeWidth={2} />
          )}
        </button>
      </div>
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-(--color-bg-component) text-(--color-text-base)'
                  : 'text-(--color-text-subtle) hover:bg-(--color-bg-subtle) hover:text-(--color-text-base)'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" strokeWidth={2} />
            {!collapsed && item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
