import { NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  History,
  LayoutDashboard,
  LogOut,
  Settings,
  Truck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../layout/ThemeToggle';

const navItems = [
  { label: 'Dashboard', to: '/delivery', icon: LayoutDashboard },
  { label: 'Active deliveries', to: '/delivery/orders', icon: Truck },
  { label: 'History', to: '/delivery/history', icon: History },
  { label: 'Notifications', to: '/delivery/notifications', icon: Bell },
  { label: 'Settings', to: '/delivery/settings', icon: Settings },
];

export function DeliverySidebar() {
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
        <p className="admin-sidebar__subtitle">Delivery Panel</p>
      </div>

      <nav className="admin-sidebar__nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/delivery'}
              className={({ isActive }) =>
                `admin-sidebar__link${isActive ? ' active' : ''}`
              }
            >
              <Icon
                size={20}
                strokeWidth={2}
                className="admin-sidebar__link-icon"
              />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="admin-sidebar__account">
        <ThemeToggle showLabel />
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
