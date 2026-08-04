import { NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PackageCheck,
  Settings,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ThemeToggle } from '../layout/ThemeToggle';

const navItems = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
  { label: 'Company Validations', to: '/admin/validations', icon: ClipboardCheck },
  { label: 'Product Validations', to: '/admin/product-validations', icon: PackageCheck },
  { label: 'User Management', to: '/admin/users', icon: UserCog },
  { label: 'Client Management', to: '/admin/clients', icon: Users },
  { label: 'Company Management', to: '/admin/companies', icon: Building2 },
  { label: 'Revenue', to: '/admin/revenue', icon: TrendingUp },
  { label: 'Campaigns', to: '/admin/campaigns', icon: Megaphone },
  { label: 'Analytics', to: '/admin/analytics', icon: BarChart3 },
  { label: 'History', to: '/admin/history', icon: History },
  { label: 'Notifications', to: '/admin/notifications', icon: Bell },
  { label: 'Settings', to: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
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
      </div>

      <nav className="admin-sidebar__nav">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/admin'}
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
