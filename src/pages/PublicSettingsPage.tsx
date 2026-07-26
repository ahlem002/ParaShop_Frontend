import { Navbar } from '../components/layout/Navbar';
import { SettingsPage } from './SettingsPage';
import '../styles/pages/admin.css';
import '../styles/pages/profile.css';

export function PublicSettingsPage() {
  return (
    <>
      <Navbar />
      <main className="container home-container settings-public-shell">
        <SettingsPage />
      </main>
    </>
  );
}
