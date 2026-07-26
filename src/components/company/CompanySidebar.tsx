import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LogOut, Package } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Dashboard', to: '/company', icon: LayoutDashboard },
  { label: 'Product Management', to: '/company/products', icon: Package },
];

export function CompanySidebar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar__brand">
        <img
          src="/logoSideBar.png"
          alt="ParaShop+"
          className="admin-sidebar__logo"
        />
        <p className="admin-sidebar__subtitle">Company Panel</p>
      </div>

      <nav className="admin-sidebar__nav">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/company'}
              className={({ isActive }) =>
                `admin-sidebar__link${isActive ? ' active' : ''}`
              }
            >
              <Icon size={20} strokeWidth={2} className="admin-sidebar__link-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="admin-sidebar__account">
        {user && (
          <p className="admin-sidebar__user">
            {user.firstName} {user.lastName}
          </p>
        )}
        <button
          type="button"
          className="admin-sidebar__logout"
          onClick={handleLogout}
        >
          <LogOut size={18} strokeWidth={2} />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}
