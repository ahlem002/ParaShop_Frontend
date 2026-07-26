export function CompanyFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="admin-footer">
      <div className="admin-footer__inner">
        <p className="admin-footer__copyright">
          &copy; {year} ParaShop+. All rights reserved.
        </p>
        <p className="admin-footer__meta">Company Panel v1.0</p>
      </div>
    </footer>
  );
}
