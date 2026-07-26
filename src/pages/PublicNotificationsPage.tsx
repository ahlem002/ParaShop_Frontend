import { Navbar } from '../components/layout/Navbar';
import { NotificationsPage } from './NotificationsPage';
import '../styles/pages/admin.css';

export function PublicNotificationsPage() {
  return (
    <>
      <Navbar />
      <main className="container home-container notifications-public-shell">
        <NotificationsPage />
      </main>
    </>
  );
}
