import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminFooter } from './AdminFooter';
import { NavAvatar } from '../layout/NavAvatar';
import '../../styles/pages/admin.css';

export function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <header className="admin-header">
          <p className="admin-header__brand">Admin Panel</p>
          <NavAvatar />
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}
