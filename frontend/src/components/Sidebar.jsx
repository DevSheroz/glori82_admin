import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  Truck,
  X,
  Menu,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/categories', label: 'Categories', icon: FolderTree },
  { to: '/shipments', label: 'Shipments', icon: Truck },
]

export default function Sidebar({ collapsed, onToggle, onMobileClose, isMobile }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  // On mobile, always show full sidebar (not collapsed)
  const isCollapsed = isMobile ? false : collapsed

  return (
    <aside
      className={`${
        isCollapsed ? 'w-16' : 'w-60'
      } h-full shrink-0 bg-white border-r border-(--color-border-base) flex flex-col z-30 transition-all duration-300`}
    >
      <div className="h-14 flex items-center px-3 border-b border-(--color-border-base)">
        <span className={`text-base font-semibold text-(--color-text-base) tracking-tight pl-2 whitespace-nowrap overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0' : 'flex-1 opacity-100'}`}>
          glori82
        </span>
        <button
          onClick={isMobile ? onMobileClose : onToggle}
          className="p-2 shrink-0 rounded-md text-(--color-text-subtle) hover:bg-(--color-bg-subtle) hover:text-(--color-text-base) transition-colors"
          title={isMobile ? 'Close menu' : isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
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
            onClick={onMobileClose}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium overflow-hidden whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-(--color-bg-component) text-(--color-text-base)'
                  : 'text-(--color-text-subtle) hover:bg-(--color-bg-subtle) hover:text-(--color-text-base)'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" strokeWidth={2} />
            {item.label}
          </NavLink>
        ))}
      </nav>
      {user && (
        <div className="border-t border-(--color-border-base) px-3 py-3">
          <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-(--color-bg-component) flex items-center justify-center shrink-0">
              <span className="text-xs font-medium text-(--color-text-subtle)">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-(--color-text-base) truncate">{user.name}</p>
                <p className="text-xs text-(--color-text-muted) truncate">{user.role}</p>
              </div>
            )}
            {!isCollapsed && (
              <button
                onClick={handleLogout}
                title="Logout"
                className="p-1.5 rounded-md text-(--color-text-muted) hover:text-(--color-danger) hover:bg-(--color-bg-subtle) transition-colors"
              >
                <LogOut className="w-4 h-4" strokeWidth={2} />
              </button>
            )}
          </div>
          {isCollapsed && (
            <button
              onClick={handleLogout}
              title="Logout"
              className="mt-2 w-full flex justify-center p-1.5 rounded-md text-(--color-text-muted) hover:text-(--color-danger) hover:bg-(--color-bg-subtle) transition-colors"
            >
              <LogOut className="w-4 h-4" strokeWidth={2} />
            </button>
          )}
        </div>
      )}
    </aside>
  )
}
