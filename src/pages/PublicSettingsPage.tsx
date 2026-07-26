import { Navbar } from '../components/layout/Navbar';
import { SettingsPage } from './SettingsPage';
import '../styles/pages/admin.css';

export function PublicSettingsPage() {
  return (
    <>
      <Navbar />
      <main className="container home-container" style={{ maxWidth: 960 }}>
        <SettingsPage />
      </main>
    </>
  );
}
