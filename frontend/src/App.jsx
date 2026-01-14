import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import MainLayout from './layouts/MainLayout';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import {
  Dashboard,
  Login,
  TenantRegister,
  POS,
  Products,
  Categories,
  Branches,
  Inventory,
  Transfers,
  Suppliers,
  Purchases,
  Sales,
  Users,
  Reports,
  Settings,
  Returns,
  Expenses,
  Shifts,
  Discounts,
  Installments,
  PreOrders,
  Analytics,
} from './pages';

// Restaurant/Cafe pages (feature-gated in Sidebar)
import Tables from './pages/Tables';
import Orders from './pages/Orders';
import RestaurantPOS from './pages/RestaurantPOS';
import KitchenDisplay from './pages/KitchenDisplay';

import './styles/globals.css';
import './styles/components.css';
import './styles/layout.css';

// SuperAdmin Pages
import SuperAdminLogin from './pages/superadmin/SuperAdminLogin';
import SuperAdminLayout from './pages/superadmin/SuperAdminLayout';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import TenantsPage from './pages/superadmin/TenantsPage';
import SubscriptionsPage from './pages/superadmin/SubscriptionsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/register"
            element={
              <PublicRoute>
                <TenantRegister />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="pos" element={<POS />} />
            <Route path="products" element={<Products />} />
            <Route path="categories" element={<Categories />} />
            <Route path="branches" element={<Branches />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="transfers" element={<Transfers />} />
            <Route path="suppliers" element={<Suppliers />} />
            <Route path="purchases" element={<Purchases />} />
            <Route path="sales" element={<Sales />} />
            <Route path="users" element={<Users />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="returns" element={<Returns />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="shifts" element={<Shifts />} />
            <Route path="discounts" element={<Discounts />} />
            <Route path="installments" element={<Installments />} />
            <Route path="preorders" element={<PreOrders />} />
            <Route path="analytics" element={<Analytics />} />

            {/* Restaurant/Cafe Routes (feature-gated) */}
            <Route path="tables" element={<Tables />} />
            <Route path="orders" element={<Orders />} />
            <Route path="restaurant-pos" element={<RestaurantPOS />} />
            <Route path="kitchen" element={<KitchenDisplay />} />
          </Route>

          {/* Super Admin Routes */}
          <Route path="/superadmin/login" element={<SuperAdminLogin />} />
          <Route path="/superadmin" element={<SuperAdminLayout />}>
            <Route path="dashboard" element={<SuperAdminDashboard />} />
            <Route path="tenants" element={<TenantsPage />} />
            <Route path="subscriptions" element={<SubscriptionsPage />} />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: 'IBM Plex Sans Arabic, sans-serif',
              direction: 'rtl',
              borderRadius: '10px',
            },
            success: {
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function NotFound() {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'IBM Plex Sans Arabic, sans-serif',
    }}>
      <h1 style={{ fontSize: '6rem', fontWeight: 700, color: 'var(--color-gray-300)', margin: 0 }}>404</h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>الصفحة غير موجودة</p>
      <a href="/" style={{ color: 'var(--color-primary-600)', textDecoration: 'none', fontWeight: 500 }}>
        العودة للرئيسية
      </a>
    </div>
  );
}

export default App;
