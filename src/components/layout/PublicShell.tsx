import type { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { SiteFooter } from './SiteFooter';

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="public-shell">
      <Navbar />
      <div className="public-shell__content">{children}</div>
      <SiteFooter />
    </div>
  );
}
