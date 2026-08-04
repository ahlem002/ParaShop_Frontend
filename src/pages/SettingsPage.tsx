import { useEffect, useState, type FormEvent } from 'react';
import { ChevronDown, Moon, Pencil, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, ACCENT_OPTIONS, type ThemeMode } from '../context/ThemeContext';
import { useConfirm } from '../context/ConfirmContext';
import {
  changePassword,
  disableTwoFactor,
  enableTwoFactor,
  setupTwoFactor,
} from '../services/auth.service';
import '../styles/pages/auth.css';
import '../styles/pages/profile.css';

type SettingsTab = 'appearance' | 'security' | 'personal';

function formatDateLabel(value: string | null | undefined) {
  if (!value) return '—';
  const date = new Date(value.includes('T') ? value : `${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function SettingsPage() {
  const { user, updateProfile, setUserFromProfile } = useAuth();
  const { theme, setTheme, accent, setAccent } = useTheme();
  const { confirm } = useConfirm();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [passwordOpen, setPasswordOpen] = useState(false);

  const [editingPersonal, setEditingPersonal] = useState(false);
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalError, setPersonalError] = useState('');
  const [personalSuccess, setPersonalSuccess] = useState('');
  const [personalForm, setPersonalForm] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    birthDate: '',
    gender: '',
    address: '',
    companyName: '',
    description: '',
    companyPhoneNumber: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const [twoFactorSetup, setTwoFactorSetup] = useState<{
    secret: string;
    qrCodeUrl: string;
  } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorPassword, setTwoFactorPassword] = useState('');
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [twoFactorSuccess, setTwoFactorSuccess] = useState('');

  const isCompany = user?.role === 'COMPANY';

  useEffect(() => {
    if (!user) return;
    setPersonalForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phoneNumber: user.phoneNumber ?? '',
      birthDate: user.birthDate?.slice(0, 10) ?? '',
      gender: user.gender ?? '',
      address: user.address ?? '',
      companyName: user.company?.companyName ?? '',
      description: user.company?.description ?? '',
      companyPhoneNumber: user.company?.phoneNumber ?? '',
    });
  }, [user]);

  const themes: {
    value: ThemeMode;
    label: string;
    description: string;
    icon: typeof Sun;
  }[] = [
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

  function resetPersonalForm() {
    if (!user) return;
    setPersonalForm({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      phoneNumber: user.phoneNumber ?? '',
      birthDate: user.birthDate?.slice(0, 10) ?? '',
      gender: user.gender ?? '',
      address: user.address ?? '',
      companyName: user.company?.companyName ?? '',
      description: user.company?.description ?? '',
      companyPhoneNumber: user.company?.phoneNumber ?? '',
    });
  }

  async function handlePersonalSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user || !editingPersonal) return;

    setPersonalSaving(true);
    setPersonalError('');
    setPersonalSuccess('');

    try {
      await updateProfile({
        firstName: personalForm.firstName,
        lastName: personalForm.lastName,
        phoneNumber: personalForm.phoneNumber,
        birthDate: isCompany ? undefined : personalForm.birthDate,
        gender: isCompany ? undefined : personalForm.gender,
        address: personalForm.address,
        companyName: isCompany ? personalForm.companyName : undefined,
        description: isCompany ? personalForm.description : undefined,
        companyPhoneNumber: isCompany
          ? personalForm.companyPhoneNumber
          : undefined,
      });
      setEditingPersonal(false);
      setPersonalSuccess('Personal information updated successfully.');
    } catch (err) {
      setPersonalError(
        err instanceof Error
          ? err.message
          : 'Could not update personal information.',
      );
    } finally {
      setPersonalSaving(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setPasswordSuccess('Password updated successfully.');
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'Could not update password.',
      );
    } finally {
      setPasswordSaving(false);
    }
  }

  async function handleStartTwoFactor() {
    setTwoFactorError('');
    setTwoFactorSuccess('');
    setTwoFactorBusy(true);
    try {
      const setup = await setupTwoFactor();
      setTwoFactorSetup({
        secret: setup.secret,
        qrCodeUrl: setup.qrCodeUrl,
      });
      setTwoFactorCode('');
    } catch (err) {
      setTwoFactorError(
        err instanceof Error
          ? err.message
          : 'Could not start two-factor setup.',
      );
    } finally {
      setTwoFactorBusy(false);
    }
  }

  async function handleEnableTwoFactor(event: FormEvent) {
    event.preventDefault();
    setTwoFactorError('');
    setTwoFactorSuccess('');
    setTwoFactorBusy(true);
    try {
      const updated = await enableTwoFactor(twoFactorCode);
      setUserFromProfile(updated);
      setTwoFactorSetup(null);
      setTwoFactorCode('');
      setTwoFactorSuccess('Two-step verification is now enabled.');
    } catch (err) {
      setTwoFactorError(
        err instanceof Error
          ? err.message
          : 'Could not enable two-factor authentication.',
      );
    } finally {
      setTwoFactorBusy(false);
    }
  }

  async function handleDisableTwoFactor(event: FormEvent) {
    event.preventDefault();
    const ok = await confirm({
      title: 'Disable two-step verification?',
      message:
        'Your account will be less secure without two-step verification. Continue?',
      confirmLabel: 'Yes, disable',
      danger: true,
    });
    if (!ok) return;

    setTwoFactorError('');
    setTwoFactorSuccess('');
    setTwoFactorBusy(true);
    try {
      const updated = await disableTwoFactor(twoFactorPassword, twoFactorCode);
      setUserFromProfile(updated);
      setTwoFactorPassword('');
      setTwoFactorCode('');
      setTwoFactorSetup(null);
      setTwoFactorSuccess('Two-step verification has been disabled.');
    } catch (err) {
      setTwoFactorError(
        err instanceof Error
          ? err.message
          : 'Could not disable two-factor authentication.',
      );
    } finally {
      setTwoFactorBusy(false);
    }
  }

  return (
    <div className="profile-page settings-page">
      <div className="profile-page__heading">
        <div>
          <h1 className="profile-page__title">Settings</h1>
          <p className="profile-page__subtitle">
            Manage your appearance, security, and personal information.
          </p>
        </div>
      </div>

      <section className="profile-card profile-form-card settings-page__card settings-page__tabs-card">
        <div className="profile-tabs">
          {(
            [
              ['appearance', 'Appearance'],
              ['security', 'Security'],
              ['personal', 'Personal Information'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={`profile-tabs__btn${activeTab === id ? ' is-active' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === 'appearance' && (
        <div className="settings-appearance-stack">
          <section className="profile-card profile-form-card settings-page__card">
            <h3 className="profile-section-title">Display mode</h3>
            <p className="profile-page__subtitle" style={{ marginBottom: 18 }}>
              Switch between light and dark. Saved on this device.
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
          </section>

          <section className="profile-card profile-form-card settings-page__card">
            <h3 className="profile-section-title">Theme color</h3>
            <p className="profile-page__subtitle" style={{ marginBottom: 18 }}>
              Buttons, links, borders, and accents follow this color across the
              site.
            </p>

            <div className="settings-accent-grid">
              {ACCENT_OPTIONS.map((option) => {
                const selected = accent === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`settings-accent-card${selected ? ' is-selected' : ''}`}
                    onClick={() => setAccent(option.value)}
                    aria-pressed={selected}
                  >
                    <span
                      className="settings-accent-card__swatch"
                      style={{ background: option.swatch }}
                      aria-hidden
                    />
                    <span className="settings-accent-card__body">
                      <strong>{option.label}</strong>
                      <span>{option.description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {activeTab === 'security' && (
        <section className="profile-card profile-form-card settings-page__card">
          <div className="profile-security">
            <section className="profile-security__block">
              <button
                type="button"
                className={`profile-security__toggle${passwordOpen ? ' is-open' : ''}`}
                onClick={() => setPasswordOpen((open) => !open)}
                aria-expanded={passwordOpen}
              >
                <span>
                  <h3>Change password</h3>
                  <p>Use a strong password you do not reuse elsewhere.</p>
                </span>
                <ChevronDown size={20} className="profile-security__chevron" />
              </button>

              {passwordOpen && (
                <>
                  {passwordError && (
                    <div className="profile-alert profile-alert--error">
                      {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="profile-alert profile-alert--success">
                      {passwordSuccess}
                    </div>
                  )}
                  <form className="profile-form" onSubmit={handlePasswordSubmit}>
                    <div className="form-group">
                      <label htmlFor="settingsCurrentPassword">
                        Current password
                      </label>
                      <input
                        id="settingsCurrentPassword"
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({
                            ...passwordForm,
                            currentPassword: e.target.value,
                          })
                        }
                        minLength={8}
                        required
                      />
                    </div>
                    <div className="profile-form__grid">
                      <div className="form-group">
                        <label htmlFor="settingsNewPassword">New password</label>
                        <input
                          id="settingsNewPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              newPassword: e.target.value,
                            })
                          }
                          minLength={8}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="settingsConfirmPassword">
                          Confirm password
                        </label>
                        <input
                          id="settingsConfirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({
                              ...passwordForm,
                              confirmPassword: e.target.value,
                            })
                          }
                          minLength={8}
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={passwordSaving}
                    >
                      {passwordSaving ? 'Updating...' : 'Update password'}
                    </button>
                  </form>
                </>
              )}
            </section>

            <section className="profile-security__block">
              <h3>Two-step verification</h3>
              <p>
                Protect your account with a code from an authenticator app
                (Google Authenticator, Microsoft Authenticator, etc.).
              </p>
              {twoFactorError && (
                <div className="profile-alert profile-alert--error">
                  {twoFactorError}
                </div>
              )}
              {twoFactorSuccess && (
                <div className="profile-alert profile-alert--success">
                  {twoFactorSuccess}
                </div>
              )}

              <div className="profile-placeholder-row">
                <span>Status</span>
                <span>
                  {user?.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                </span>
              </div>

              {user && !user.twoFactorEnabled && !twoFactorSetup && (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStartTwoFactor}
                  disabled={twoFactorBusy}
                >
                  {twoFactorBusy
                    ? 'Preparing...'
                    : 'Enable two-step verification'}
                </button>
              )}

              {user && !user.twoFactorEnabled && twoFactorSetup && (
                <form className="profile-form" onSubmit={handleEnableTwoFactor}>
                  <p>
                    Scan this QR code with your authenticator app, or enter the
                    secret manually.
                  </p>
                  <div className="profile-2fa-qr">
                    <img
                      src={twoFactorSetup.qrCodeUrl}
                      alt="Two-factor QR code"
                    />
                  </div>
                  <div className="form-group">
                    <label>Secret key</label>
                    <input value={twoFactorSetup.secret} readOnly />
                  </div>
                  <div className="form-group">
                    <label htmlFor="settingsEnable2faCode">
                      Authentication code
                    </label>
                    <input
                      id="settingsEnable2faCode"
                      inputMode="numeric"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) =>
                        setTwoFactorCode(
                          e.target.value.replace(/\D/g, '').slice(0, 6),
                        )
                      }
                      placeholder="123456"
                      required
                    />
                  </div>
                  <div className="profile-form__actions-inline">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setTwoFactorSetup(null);
                        setTwoFactorCode('');
                      }}
                      disabled={twoFactorBusy}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={twoFactorBusy}
                    >
                      {twoFactorBusy ? 'Enabling...' : 'Confirm and enable'}
                    </button>
                  </div>
                </form>
              )}

              {user?.twoFactorEnabled && (
                <form
                  className="profile-form"
                  onSubmit={handleDisableTwoFactor}
                >
                  <p>
                    To disable two-step verification, confirm your password and
                    a current authenticator code.
                  </p>
                  <div className="form-group">
                    <label htmlFor="settingsDisable2faPassword">Password</label>
                    <input
                      id="settingsDisable2faPassword"
                      type="password"
                      value={twoFactorPassword}
                      onChange={(e) => setTwoFactorPassword(e.target.value)}
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="settingsDisable2faCode">
                      Authentication code
                    </label>
                    <input
                      id="settingsDisable2faCode"
                      inputMode="numeric"
                      maxLength={6}
                      value={twoFactorCode}
                      onChange={(e) =>
                        setTwoFactorCode(
                          e.target.value.replace(/\D/g, '').slice(0, 6),
                        )
                      }
                      placeholder="123456"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-secondary"
                    disabled={twoFactorBusy}
                  >
                    {twoFactorBusy
                      ? 'Disabling...'
                      : 'Disable two-step verification'}
                  </button>
                </form>
              )}
            </section>
          </div>
        </section>
      )}

      {activeTab === 'personal' && (
        <section className="profile-card profile-form-card settings-page__card">
          <div className="settings-tab-panel">
            <div className="profile-form__toolbar">
              <h3 className="profile-section-title" style={{ margin: 0 }}>
                Personal Information
              </h3>
              {!editingPersonal ? (
                <button
                  type="button"
                  className="btn btn-secondary profile-edit-btn"
                  onClick={() => {
                    setPersonalError('');
                    setPersonalSuccess('');
                    setEditingPersonal(true);
                  }}
                >
                  <Pencil size={16} />
                  Edit
                </button>
              ) : (
                <div className="profile-form__actions-inline">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => {
                      resetPersonalForm();
                      setEditingPersonal(false);
                      setPersonalError('');
                    }}
                    disabled={personalSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    form="settingsPersonalForm"
                    className="btn btn-primary"
                    disabled={personalSaving}
                  >
                    {personalSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {personalError && (
              <div className="profile-alert profile-alert--error">
                {personalError}
              </div>
            )}
            {personalSuccess && (
              <div className="profile-alert profile-alert--success">
                {personalSuccess}
              </div>
            )}

            {user ? (
              <form
                id="settingsPersonalForm"
                className="profile-form"
                onSubmit={handlePersonalSubmit}
              >
                <div className="profile-form__grid">
                  <div className="form-group">
                    <label htmlFor="settingsFirstName">First Name</label>
                    <input
                      id="settingsFirstName"
                      value={personalForm.firstName}
                      onChange={(e) =>
                        setPersonalForm({
                          ...personalForm,
                          firstName: e.target.value,
                        })
                      }
                      disabled={!editingPersonal}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="settingsLastName">Last Name</label>
                    <input
                      id="settingsLastName"
                      value={personalForm.lastName}
                      onChange={(e) =>
                        setPersonalForm({
                          ...personalForm,
                          lastName: e.target.value,
                        })
                      }
                      disabled={!editingPersonal}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="settingsEmail">Email Address</label>
                  <input id="settingsEmail" value={user.email} disabled />
                </div>

                <div className="form-group">
                  <label htmlFor="settingsPhone">Phone Number</label>
                  <input
                    id="settingsPhone"
                    value={personalForm.phoneNumber}
                    onChange={(e) =>
                      setPersonalForm({
                        ...personalForm,
                        phoneNumber: e.target.value,
                      })
                    }
                    disabled={!editingPersonal}
                  />
                </div>

                {!isCompany && (
                  <div className="profile-form__grid">
                    <div className="form-group">
                      <label htmlFor="settingsBirthDate">Date of Birth</label>
                      <input
                        id="settingsBirthDate"
                        type={editingPersonal ? 'date' : 'text'}
                        value={
                          editingPersonal
                            ? personalForm.birthDate
                            : formatDateLabel(personalForm.birthDate)
                        }
                        onChange={(e) =>
                          setPersonalForm({
                            ...personalForm,
                            birthDate: e.target.value,
                          })
                        }
                        disabled={!editingPersonal}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="settingsGender">Gender</label>
                      {editingPersonal ? (
                        <select
                          id="settingsGender"
                          value={personalForm.gender}
                          onChange={(e) =>
                            setPersonalForm({
                              ...personalForm,
                              gender: e.target.value,
                            })
                          }
                          required
                        >
                          <option value="" disabled>
                            Select gender
                          </option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                      ) : (
                        <input value={personalForm.gender || '—'} disabled />
                      )}
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="settingsAddress">Address</label>
                  <input
                    id="settingsAddress"
                    value={personalForm.address}
                    onChange={(e) =>
                      setPersonalForm({
                        ...personalForm,
                        address: e.target.value,
                      })
                    }
                    disabled={!editingPersonal}
                  />
                </div>

                {isCompany && (
                  <>
                    <div className="form-group">
                      <label htmlFor="settingsCompanyName">Company Name</label>
                      <input
                        id="settingsCompanyName"
                        value={personalForm.companyName}
                        onChange={(e) =>
                          setPersonalForm({
                            ...personalForm,
                            companyName: e.target.value,
                          })
                        }
                        disabled={!editingPersonal}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="settingsCompanyPhone">
                        Company Phone
                      </label>
                      <input
                        id="settingsCompanyPhone"
                        value={personalForm.companyPhoneNumber}
                        onChange={(e) =>
                          setPersonalForm({
                            ...personalForm,
                            companyPhoneNumber: e.target.value,
                          })
                        }
                        disabled={!editingPersonal}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="settingsDescription">Description</label>
                      <textarea
                        id="settingsDescription"
                        value={personalForm.description}
                        onChange={(e) =>
                          setPersonalForm({
                            ...personalForm,
                            description: e.target.value,
                          })
                        }
                        disabled={!editingPersonal}
                        rows={4}
                      />
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label>Role</label>
                  <input value={user.role.toLowerCase()} disabled />
                </div>
              </form>
            ) : (
              <p className="admin-validations__intro">You are not signed in.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
