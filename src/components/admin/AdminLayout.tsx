import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminFooter } from './AdminFooter';
import { NavAvatar } from '../layout/NavAvatar';
import { NotificationBell } from '../notifications/NotificationBell';
import '../../styles/pages/admin.css';
import '../../styles/pages/notifications.css';

export function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-main">
        <header className="admin-header">
          <p className="admin-header__brand">Admin Panel</p>
          <div className="admin-header__actions">
            <NotificationBell />
            <NavAvatar />
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
        <AdminFooter />
      </div>
    </div>
  );
}
