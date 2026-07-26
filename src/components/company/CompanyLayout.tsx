import { Outlet } from 'react-router-dom';
import { CompanySidebar } from './CompanySidebar';
import { CompanyFooter } from './CompanyFooter';
import { NavAvatar } from '../layout/NavAvatar';
import '../../styles/pages/admin.css';

export function CompanyLayout() {
  return (
    <div className="admin-layout">
      <CompanySidebar />
      <div className="admin-main">
        <header className="admin-header">
          <p className="admin-header__brand">Company Panel</p>
          <NavAvatar />
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
        <CompanyFooter />
      </div>
    </div>
  );
}
