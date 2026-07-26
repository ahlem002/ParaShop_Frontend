import { Outlet } from 'react-router-dom';
import { CompanySidebar } from './CompanySidebar';
import { CompanyFooter } from './CompanyFooter';
import { NavAvatar } from '../layout/NavAvatar';
import { NotificationBell } from '../notifications/NotificationBell';
import '../../styles/pages/admin.css';
import '../../styles/pages/notifications.css';

export function CompanyLayout() {
  return (
    <div className="admin-layout">
      <CompanySidebar />
      <div className="admin-main">
        <header className="admin-header">
          <p className="admin-header__brand">Company Panel</p>
          <div className="admin-header__actions">
            <NotificationBell />
            <NavAvatar />
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
        <CompanyFooter />
      </div>
    </div>
  );
}
