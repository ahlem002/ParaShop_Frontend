import { PublicShell } from '../components/layout/PublicShell';
import { NotificationsPage } from './NotificationsPage';
import '../styles/pages/admin.css';

export function PublicNotificationsPage() {
  return (
    <PublicShell>
      <main className="container home-container notifications-public-shell">
        <NotificationsPage />
      </main>
    </PublicShell>
  );
}
