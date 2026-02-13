import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import LoginPage from './pages/auth/LoginPage'
import InventoryPage from './pages/inventory/InventoryPage'
import OrdersPage from './pages/orders/OrdersPage'
import CustomersPage from './pages/customers/CustomersPage'
import CategoriesPage from './pages/categories/CategoriesPage'
import ShipmentsPage from './pages/shipments/ShipmentsPage'

function Placeholder({ title }) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-sm text-(--color-text-muted)">
        {title} — Coming soon
      </p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/orders" replace />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="dashboard" element={<Placeholder title="Dashboard" />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="shipments" element={<ShipmentsPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
