import { Navbar } from '../components/layout/Navbar';
import { ProfilePage } from './ProfilePage';
import '../styles/pages/admin.css';
import '../styles/pages/auth.css';
import '../styles/pages/profile.css';

export function PublicProfilePage() {
  return (
    <>
      <Navbar />
      <main className="container home-container profile-public-shell">
        <ProfilePage />
      </main>
    </>
  );
}
