import { PublicShell } from '../components/layout/PublicShell';
import { SettingsPage } from './SettingsPage';
import '../styles/pages/admin.css';
import '../styles/pages/profile.css';

export function PublicSettingsPage() {
  return (
    <PublicShell>
      <main className="container home-container settings-public-shell">
        <SettingsPage />
      </main>
    </PublicShell>
  );
}
