import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Logo } from './Logo';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
];

function getRoleBadgeClass(role: string) {
  if (role === 'ADMIN') return 'role-badge role-badge--admin';
  if (role === 'COMPANY') return 'role-badge role-badge--company';
  return 'role-badge';
}

export function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="navbar">
      <Link to="/" className="logo-link">
        <Logo />
      </Link>
      <nav className="nav-links">
        {navLinks.map((link) => (
          <NavLink
            key={link.label}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) => (isActive ? 'active' : undefined)}
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="nav-auth">
        {isAuthenticated && user ? (
          <>
            <span className={getRoleBadgeClass(user.role)}>
              {user.role.toLowerCase()}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-nav"
              onClick={handleLogout}
            >
              Log out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary btn-nav">
              Login
            </Link>
            <Link to="/signup" className="btn btn-primary btn-nav">
              Sign up
            </Link>
            <Link to="/signup/company" className="btn btn-secondary btn-nav">
              Sign up as company
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
