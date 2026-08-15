import { Outlet } from 'react-router-dom';
import { DeliverySidebar } from './DeliverySidebar';
import { NavAvatar } from '../layout/NavAvatar';
import { NotificationBell } from '../notifications/NotificationBell';
import '../../styles/pages/admin.css';
import '../../styles/pages/notifications.css';

export function DeliveryLayout() {
  return (
    <div className="admin-layout">
      <DeliverySidebar />
      <div className="admin-main">
        <header className="admin-header">
          <p className="admin-header__brand">Delivery Panel</p>
          <div className="admin-header__actions">
            <NotificationBell />
            <NavAvatar />
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
