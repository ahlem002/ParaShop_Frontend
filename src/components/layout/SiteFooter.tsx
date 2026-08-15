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
      </div>
    </footer>
  );
}
