import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminFooter } from './AdminFooter';
import { useAuth } from '../../context/AuthContext';
import '../../styles/pages/admin.css';

export function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <header className="admin-header">
          <p className="admin-header__brand">Admin Panel</p>
          {user && (
            <p className="admin-header__user">
              {user.firstName} {user.lastName}
            </p>
          )}
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}
