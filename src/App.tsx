import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationsProvider } from './context/NotificationsContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { ConfirmProvider } from './context/ConfirmContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import { CompanyLayout } from './components/company/CompanyLayout';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { PublicProductDetailPage } from './pages/PublicProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { FakePaymentPage } from './pages/FakePaymentPage';
import { ConfirmPaymentPage } from './pages/ConfirmPaymentPage';
import { OrdersPage } from './pages/OrdersPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { PaymentFailPage } from './pages/PaymentFailPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { CompanySignUpPage } from './pages/CompanySignUpPage';
import { CompanyPendingPage } from './pages/CompanyPendingPage';
import { CompanyDashboardHomePage } from './pages/company/CompanyDashboardHomePage';
import { CompanyProductsPage } from './pages/company/CompanyProductsPage';
import { CompanyProductFormPage } from './pages/company/CompanyProductFormPage';
import { CompanyProductDetailPage } from './pages/company/CompanyProductDetailPage';
import { CompanyOrdersPage } from './pages/company/CompanyOrdersPage';
import { CompanyClientOrdersPage } from './pages/company/CompanyClientOrdersPage';
import { AdminDashboardHomePage } from './pages/admin/AdminDashboardHomePage';
import { AdminValidationsPage } from './pages/admin/AdminValidationsPage';
import { AdminProductValidationsPage } from './pages/admin/AdminProductValidationsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminClientsPage } from './pages/admin/AdminClientsPage';
import { AdminCompaniesPage } from './pages/admin/AdminCompaniesPage';
import { AdminRevenuePage } from './pages/admin/AdminRevenuePage';
import { AdminCampaignsPage } from './pages/admin/AdminCampaignsPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { PublicSettingsPage } from './pages/PublicSettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { PublicProfilePage } from './pages/PublicProfilePage';
import { NotificationsPage } from './pages/NotificationsPage';
import { PublicNotificationsPage } from './pages/PublicNotificationsPage';
import { HistoryPage } from './pages/HistoryPage';
import { FavoritesPage } from './pages/FavoritesPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ConfirmProvider>
          <NotificationsProvider>
            <CartProvider>
              <FavoritesProvider>
              <BrowserRouter>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route
                  path="/products/:productId"
                  element={<PublicProductDetailPage />}
                />
                <Route
                  path="/cart"
                  element={
                    <ProtectedRoute allowedRoles={['CLIENT']}>
                      <CartPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute allowedRoles={['CLIENT']}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout/payment"
                  element={
                    <ProtectedRoute allowedRoles={['CLIENT']}>
                      <FakePaymentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/checkout/confirm"
                  element={
                    <ProtectedRoute allowedRoles={['CLIENT']}>
                      <ConfirmPaymentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders"
                  element={
                    <ProtectedRoute allowedRoles={['CLIENT']}>
                      <OrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/payment/success"
                  element={
                    <ProtectedRoute allowedRoles={['CLIENT']}>
                      <PaymentSuccessPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/payment/fail"
                  element={
                    <ProtectedRoute allowedRoles={['CLIENT']}>
                      <PaymentFailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute allowedRoles={['CLIENT']}>
                      <PublicProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute allowedRoles={['CLIENT']}>
                      <PublicSettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute allowedRoles={['CLIENT']}>
                      <PublicNotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/history"
                  element={
                    <ProtectedRoute allowedRoles={['CLIENT']}>
                      <HistoryPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute allowedRoles={['CLIENT']}>
                      <FavoritesPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/signup/company" element={<CompanySignUpPage />} />
                <Route path="/company/pending" element={<CompanyPendingPage />} />
                <Route
                  path="/company"
                  element={
                    <ProtectedRoute allowedRoles={['COMPANY']}>
                      <CompanyLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<CompanyDashboardHomePage />} />
                  <Route path="products" element={<CompanyProductsPage />} />
                  <Route path="orders" element={<CompanyOrdersPage />} />
                  <Route path="orders/client/:clientId" element={<CompanyClientOrdersPage />} />
                  <Route path="products/new" element={<CompanyProductFormPage />} />
                  <Route
                    path="products/:productId"
                    element={<CompanyProductDetailPage />}
                  />
                  <Route
                    path="products/:productId/edit"
                    element={<CompanyProductFormPage />}
                  />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="history" element={<HistoryPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AdminLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboardHomePage />} />
                  <Route path="validations" element={<AdminValidationsPage />} />
                  <Route
                    path="product-validations"
                    element={<AdminProductValidationsPage />}
                  />
                  <Route path="users" element={<AdminUsersPage />} />
                  <Route path="clients" element={<AdminClientsPage />} />
                  <Route path="companies" element={<AdminCompaniesPage />} />
                  <Route path="revenue" element={<AdminRevenuePage />} />
                  <Route path="campaigns" element={<AdminCampaignsPage />} />
                  <Route path="analytics" element={<AdminAnalyticsPage />} />
                  <Route path="history" element={<HistoryPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="profile" element={<ProfilePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
              </FavoritesProvider>
          </CartProvider>
        </NotificationsProvider>
        </ConfirmProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
