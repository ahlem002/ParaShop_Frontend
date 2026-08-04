import { Link } from 'react-router-dom';

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner container home-container">
        <div className="site-footer__brand">
          <p className="site-footer__copyright">
            &copy; {year} ParaShop+. All rights reserved.
          </p>
          <p className="site-footer__tagline">
            Trusted pharmacy & wellness marketplace
          </p>
        </div>
        <nav className="site-footer__links" aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/products">Products</Link>
          <Link to="/cart">Cart</Link>
          <Link to="/orders">Orders</Link>
          <Link to="/history">History</Link>
          <Link to="/login">Login</Link>
        </nav>
      </div>
    </footer>
  );
}
