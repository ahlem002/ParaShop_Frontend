import { PublicShell } from '../components/layout/PublicShell';
import { ProfilePage } from './ProfilePage';
import '../styles/pages/admin.css';
import '../styles/pages/auth.css';
import '../styles/pages/profile.css';

export function PublicProfilePage() {
  return (
    <PublicShell>
      <main className="container home-container profile-public-shell">
        <ProfilePage />
      </main>
    </PublicShell>
  );
}
