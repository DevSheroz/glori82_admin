import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Layout from './components/Layout'
import LoginPage from './pages/auth/LoginPage'
import InventoryPage from './pages/inventory/InventoryPage'
import OrdersPage from './pages/orders/OrdersPage'
import ArchivedOrdersPage from './pages/orders/ArchivedOrdersPage'
import CustomersPage from './pages/customers/CustomersPage'
import CategoriesPage from './pages/categories/CategoriesPage'
import ShipmentsPage from './pages/shipments/ShipmentsPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import SettingsPage from './pages/settings/SettingsPage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors />
      <AuthProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/orders" replace />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="customers" element={<CustomersPage />} />
              <Route path="shipments" element={<ShipmentsPage />} />
              <Route element={<AdminRoute />}>
                <Route path="archived" element={<ArchivedOrdersPage />} />
                <Route path="categories" element={<CategoriesPage />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
