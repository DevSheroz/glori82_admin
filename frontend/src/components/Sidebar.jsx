import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Truck,
} from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/categories', label: 'Categories', icon: FolderTree },
  { to: '/shipments', label: 'Shipments', icon: Truck },
]

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 bg-white border-r border-(--color-border-base) flex flex-col z-30">
      <div className="h-14 flex items-center px-5 border-b border-(--color-border-base)">
        <span className="text-base font-semibold text-(--color-text-base) tracking-tight">
          glor82 Admin
        </span>
      </div>
      <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-(--color-bg-component) text-(--color-text-base)'
                  : 'text-(--color-text-subtle) hover:bg-(--color-bg-subtle) hover:text-(--color-text-base)'
              }`
            }
          >
            <item.icon className="w-4 h-4" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
