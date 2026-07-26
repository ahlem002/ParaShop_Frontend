import { Link } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, type ThemeMode } from '../context/ThemeContext';

export function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  const profilePath =
    user?.role === 'ADMIN'
      ? '/admin/profile'
      : user?.role === 'COMPANY'
        ? '/company/profile'
        : '/profile';

  const themes: { value: ThemeMode; label: string; description: string; icon: typeof Sun }[] =
    [
      {
        value: 'light',
        label: 'Light',
        description: 'Bright interface for daytime use',
        icon: Sun,
      },
      {
        value: 'dark',
        label: 'Dark',
        description: 'Dim interface that’s easier on the eyes',
        icon: Moon,
      },
    ];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Settings</h1>
      <p className="admin-validations__intro" style={{ marginBottom: 16 }}>
        Manage your account preferences and appearance.
      </p>

      <div className="admin-page-card" style={{ marginBottom: 16 }}>
        <h2 className="settings-section-title">Account</h2>
        {user ? (
          <>
            <div className="admin-modal__grid">
              <div>
                <span className="admin-modal__label">Name</span>
                <p>
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div>
                <span className="admin-modal__label">Email</span>
                <p>{user.email}</p>
              </div>
              <div>
                <span className="admin-modal__label">Role</span>
                <p>{user.role.toLowerCase()}</p>
              </div>
              {user.role === 'COMPANY' && user.companyVerificationStatus && (
                <div>
                  <span className="admin-modal__label">Company status</span>
                  <p>
                    <span
                      className={`admin-badge admin-badge--${user.companyVerificationStatus.toLowerCase()}`}
                    >
                      {user.companyVerificationStatus.toLowerCase()}
                    </span>
                  </p>
                </div>
              )}
            </div>
            <div className="admin-table__actions" style={{ marginTop: 20 }}>
              <Link to={profilePath} className="btn btn-primary">
                View profile
              </Link>
            </div>
          </>
        ) : (
          <p className="admin-validations__intro">You are not signed in.</p>
        )}
      </div>

      <div className="admin-page-card">
        <h2 className="settings-section-title">Appearance</h2>
        <p className="admin-validations__intro" style={{ marginBottom: 16 }}>
          Choose how ParaShop+ looks. Your choice is saved on this device.
        </p>

        <div className="settings-theme-grid">
          {themes.map(({ value, label, description, icon: Icon }) => {
            const selected = theme === value;

            return (
              <button
                key={value}
                type="button"
                className={`settings-theme-card${selected ? ' is-selected' : ''}`}
                onClick={() => setTheme(value)}
                aria-pressed={selected}
              >
                <span className="settings-theme-card__icon">
                  <Icon size={22} strokeWidth={2} />
                </span>
                <span className="settings-theme-card__body">
                  <strong>{label}</strong>
                  <span>{description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
