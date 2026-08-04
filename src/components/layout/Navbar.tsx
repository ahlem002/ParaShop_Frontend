import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { NavAvatar } from './NavAvatar';
import { NotificationBell } from '../notifications/NotificationBell';
import '../../styles/pages/notifications.css';
import '../../styles/pages/cart.css';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
];

export function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const { cart } = useCart();
  const { favorites } = useFavorites();

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
        {isAuthenticated && user?.role === 'CLIENT' && (
          <>
            <NavLink
              to="/cart"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              Cart
              {cart.itemCount > 0 && (
                <span className="nav-cart-link__count">
                  {' '}
                  ({cart.itemCount > 99 ? '99+' : cart.itemCount})
                </span>
              )}
            </NavLink>
            <NavLink
              to="/favorites"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              Favorites
              {favorites.count > 0 && (
                <span className="nav-cart-link__count">
                  {' '}
                  ({favorites.count > 99 ? '99+' : favorites.count})
                </span>
              )}
            </NavLink>
            <NavLink
              to="/orders"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              Orders
            </NavLink>
            <NavLink
              to="/history"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              History
            </NavLink>
            <NavLink
              to="/notifications"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              Notifications
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              Settings
            </NavLink>
          </>
        )}
      </nav>
      <div className="nav-auth">
        <ThemeToggle />
        {isAuthenticated && user ? (
          <>
            <NotificationBell />
            <NavAvatar />
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
