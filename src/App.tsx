import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AdminLayout } from './components/admin/AdminLayout';
import { CompanyLayout } from './components/company/CompanyLayout';
import { HomePage } from './pages/HomePage';
import { ProductsPage } from './pages/ProductsPage';
import { PublicProductDetailPage } from './pages/PublicProductDetailPage';
import { LoginPage } from './pages/LoginPage';
import { SignUpPage } from './pages/SignUpPage';
import { CompanySignUpPage } from './pages/CompanySignUpPage';
import { CompanyPendingPage } from './pages/CompanyPendingPage';
import { CompanyDashboardHomePage } from './pages/company/CompanyDashboardHomePage';
import { CompanyProductsPage } from './pages/company/CompanyProductsPage';
import { CompanyProductFormPage } from './pages/company/CompanyProductFormPage';
import { CompanyProductDetailPage } from './pages/company/CompanyProductDetailPage';
import { AdminDashboardHomePage } from './pages/admin/AdminDashboardHomePage';
import { AdminValidationsPage } from './pages/admin/AdminValidationsPage';
import { AdminProductValidationsPage } from './pages/admin/AdminProductValidationsPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminClientsPage } from './pages/admin/AdminClientsPage';
import { AdminCompaniesPage } from './pages/admin/AdminCompaniesPage';
import { SettingsPage } from './pages/SettingsPage';
import { PublicSettingsPage } from './pages/PublicSettingsPage';
import { ProfilePage } from './pages/ProfilePage';
import { PublicProfilePage } from './pages/PublicProfilePage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route
              path="/products/:productId"
              element={<PublicProductDetailPage />}
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
              <Route path="products/new" element={<CompanyProductFormPage />} />
              <Route
                path="products/:productId"
                element={<CompanyProductDetailPage />}
              />
              <Route
                path="products/:productId/edit"
                element={<CompanyProductFormPage />}
              />
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
              <Route path="profile" element={<ProfilePage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
