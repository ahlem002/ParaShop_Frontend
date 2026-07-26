import { Outlet } from 'react-router-dom';
import { CompanySidebar } from './CompanySidebar';
import { CompanyFooter } from './CompanyFooter';
import { useAuth } from '../../context/AuthContext';
import '../../styles/pages/admin.css';

export function CompanyLayout() {
  const { user } = useAuth();

  return (
    <div className="admin-layout">
      <CompanySidebar />
      <div className="admin-main">
        <header className="admin-header">
          <p className="admin-header__brand">Company Panel</p>
          {user && (
            <p className="admin-header__user">
              {user.firstName} {user.lastName}
            </p>
          )}
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
        <CompanyFooter />
      </div>
    </div>
  );
}
