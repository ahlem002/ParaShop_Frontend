import { useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Calendar,
  Camera,
  ChevronDown,
  Heart,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { resolveUploadUrl } from '../config/api';
import {
  changePassword,
  disableTwoFactor,
  enableTwoFactor,
  setupTwoFactor,
} from '../services/auth.service';
import '../styles/pages/auth.css';
import '../styles/pages/profile.css';

type ProfileTab = 'personal' | 'security' | 'preferences' | 'activity';

const STATIC_ORDERS = [
  {
    id: '1',
    name: 'La Roche-Posay Effaclar Duo+',
    date: 'July 12, 2026',
    status: 'Delivered' as const,
  },
  {
    id: '2',
    name: 'CeraVe Hydrating Cleanser',
    date: 'July 5, 2026',
    status: 'Shipped' as const,
  },
  {
    id: '3',
    name: 'Vichy Mineral 89',
    date: 'June 28, 2026',
    status: 'Delivered' as const,
  },
];

const STATIC_SUMMARY = [
  { label: 'Orders', value: '12', action: 'View all', icon: Package },
  { label: 'Favorites', value: '8', action: 'View all', icon: Heart },
  { label: 'Addresses', value: '3', action: 'Manage', icon: MapPin },
  { label: 'Reward Points', value: '120', action: 'View details', icon: Star },
];

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

function toDateInputValue(value: string | null | undefined) {
  if (!value) return '';
  return value.slice(0, 10);
}

function formatJoined(value: string | null | undefined) {
  if (!value) return 'Joined recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Joined recently';
  return `Joined ${date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`;
}

function profileToForm(profile: {
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  address?: string | null;
  company?: {
    companyName?: string;
    description?: string | null;
    phoneNumber?: string | null;
  } | null;
}) {
  return {
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    phoneNumber: profile.phoneNumber ?? '',
    birthDate: toDateInputValue(profile.birthDate),
    gender: profile.gender ?? '',
    address: profile.address ?? '',
    companyName: profile.company?.companyName ?? '',
    description: profile.company?.description ?? '',
    companyPhoneNumber: profile.company?.phoneNumber ?? '',
  };
}

export function ProfilePage() {
  const { user, updateProfile, refreshProfile, setUserFromProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<ProfileTab>('personal');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordOpen, setPasswordOpen] = useState(false);
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

  const [form, setForm] = useState(() =>
    user ? profileToForm(user) : profileToForm({}),
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');

      const stored = user;
      if (stored) {
        setForm(profileToForm(stored));
      }

      try {
        const profile = await refreshProfile();
        if (cancelled || !profile) return;
        setForm(profileToForm(profile));
      } catch {
        if (!cancelled) {
          setError('Failed to load profile.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [refreshProfile]);

  useEffect(() => {
    if (!profileImageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(profileImageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [profileImageFile]);

  function resetFormFromUser() {
    if (!user) return;
    setForm(profileToForm(user));
    setProfileImageFile(null);
  }

  function handleCancelEdit() {
    resetFormFromUser();
    setEditing(false);
    setError('');
    setSuccess('');
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
    setTwoFactorError('');
    setTwoFactorSuccess('');
    setTwoFactorBusy(true);
    try {
      const updated = await disableTwoFactor(
        twoFactorPassword,
        twoFactorCode,
      );
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

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!user || !editing) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const updated = await updateProfile({
        firstName: form.firstName,
        lastName: form.lastName,
        phoneNumber: form.phoneNumber,
        birthDate: user.role === 'COMPANY' ? undefined : form.birthDate,
        gender: user.role === 'COMPANY' ? undefined : form.gender,
        address: form.address,
        companyName: user.role === 'COMPANY' ? form.companyName : undefined,
        description: user.role === 'COMPANY' ? form.description : undefined,
        companyPhoneNumber:
          user.role === 'COMPANY' ? form.companyPhoneNumber : undefined,
        profileImage: profileImageFile ?? undefined,
      });

      if (profileImageFile && !updated.profileImage) {
        setError(
          'Profile details were saved, but the photo could not be stored. Please try uploading again.',
        );
        setSaving(false);
        return;
      }

      setProfileImageFile(null);
      setEditing(false);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not update profile.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="profile-page">
        <h1 className="profile-page__title">My Profile</h1>
        <div className="admin-loading">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <h1 className="profile-page__title">My Profile</h1>
        <div className="admin-error">You must be signed in.</div>
      </div>
    );
  }

  const isCompany = user.role === 'COMPANY';
  const isClient = user.role === 'CLIENT';
  const imageUrl =
    previewUrl ?? resolveUploadUrl(user.profileImage ?? null);
  const displayPhone =
    form.phoneNumber ||
    (isCompany ? form.companyPhoneNumber : '') ||
    '—';

  return (
    <div className="profile-page">
      <div className="profile-page__heading">
        <div>
          <h1 className="profile-page__title">My Profile</h1>
          <p className="profile-page__subtitle">
            Manage your personal information and account settings.
          </p>
        </div>
      </div>

      {error && <div className="profile-alert profile-alert--error">{error}</div>}
      {success && (
        <div className="profile-alert profile-alert--success">{success}</div>
      )}

      <div className="profile-layout">
        <aside className="profile-sidebar-col">
          <section className="profile-card profile-summary">
            <div className="profile-summary__avatar-wrap">
              <div className="profile-summary__avatar">
                {imageUrl ? (
                  <img src={imageUrl} alt="" />
                ) : (
                  <span>
                    {user.firstName.charAt(0)}
                    {user.lastName.charAt(0)}
                  </span>
                )}
              </div>
              {editing && (
                <>
                  <button
                    type="button"
                    className="profile-summary__camera"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label="Change profile photo"
                  >
                    <Camera size={18} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
                    hidden
                    onChange={(e) =>
                      setProfileImageFile(e.target.files?.[0] ?? null)
                    }
                  />
                </>
              )}
            </div>
            {editing && (
              <button
                type="button"
                className="profile-summary__photo-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                {profileImageFile
                  ? profileImageFile.name
                  : imageUrl
                    ? 'Change photo'
                    : 'Add photo'}
              </button>
            )}

            <h2 className="profile-summary__name">
              {form.firstName} {form.lastName}
            </h2>
            <span className="profile-summary__badge">
              {user.role.charAt(0) + user.role.slice(1).toLowerCase()}
            </span>

            <ul className="profile-summary__list">
              <li>
                <Mail size={16} />
                <span>{user.email}</span>
              </li>
              <li>
                <Phone size={16} />
                <span>{displayPhone}</span>
              </li>
              <li>
                <Calendar size={16} />
                <span>{formatJoined(user.createdAt)}</span>
              </li>
            </ul>
          </section>

          {isClient && (
            <section className="profile-card profile-account-summary">
              <h3 className="profile-section-title">Account Summary</h3>
              <div className="profile-stats">
                {STATIC_SUMMARY.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="profile-stat">
                      <div className="profile-stat__top">
                        <span className="profile-stat__icon">
                          <Icon size={18} />
                        </span>
                        <span className="profile-stat__value">{item.value}</span>
                      </div>
                      <span className="profile-stat__label">{item.label}</span>
                      <button type="button" className="profile-stat__link">
                        {item.action}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </aside>

        <div className="profile-main-col">
          <section className="profile-card profile-form-card">
            <div className="profile-tabs">
              {(
                [
                  ['personal', 'Personal Info'],
                  ['security', 'Security'],
                  ['preferences', 'Preferences'],
                  ['activity', 'Activity'],
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

            {activeTab === 'personal' && (
              <form className="profile-form" onSubmit={handleSubmit}>
                <div className="profile-form__toolbar">
                  {!editing ? (
                    <button
                      type="button"
                      className="btn btn-secondary profile-edit-btn"
                      onClick={() => {
                        setSuccess('');
                        setError('');
                        setEditing(true);
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
                        onClick={handleCancelEdit}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="profile-form__grid">
                  <div className="form-group">
                    <label htmlFor="profileFirstName">First Name</label>
                    <input
                      id="profileFirstName"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm({ ...form, firstName: e.target.value })
                      }
                      disabled={!editing}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="profileLastName">Last Name</label>
                    <input
                      id="profileLastName"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                      disabled={!editing}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="profileEmail">Email Address</label>
                  <div className="profile-email-row">
                    <input id="profileEmail" value={user.email} disabled />
                    <span className="profile-verified">Verified</span>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="profilePhone">Phone Number</label>
                  <input
                    id="profilePhone"
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm({ ...form, phoneNumber: e.target.value })
                    }
                    disabled={!editing}
                    placeholder="+216 ..."
                  />
                </div>

                {!isCompany && (
                  <div className="profile-form__grid">
                    <div className="form-group">
                      <label htmlFor="profileBirthDate">Date of Birth</label>
                      <input
                        id="profileBirthDate"
                        type={editing ? 'date' : 'text'}
                        value={
                          editing
                            ? form.birthDate
                            : formatDateLabel(form.birthDate)
                        }
                        onChange={(e) =>
                          setForm({ ...form, birthDate: e.target.value })
                        }
                        disabled={!editing}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="profileGender">Gender</label>
                      {editing ? (
                        <select
                          id="profileGender"
                          value={form.gender}
                          onChange={(e) =>
                            setForm({ ...form, gender: e.target.value })
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
                        <input value={form.gender || '—'} disabled />
                      )}
                    </div>
                  </div>
                )}

                {!isCompany && (
                  <div className="form-group">
                    <label htmlFor="profileAddress">Address</label>
                    <input
                      id="profileAddress"
                      value={form.address}
                      onChange={(e) =>
                        setForm({ ...form, address: e.target.value })
                      }
                      disabled={!editing}
                    />
                  </div>
                )}

                {isCompany && (
                  <>
                    <div className="form-group">
                      <label htmlFor="profileCompanyName">Company Name</label>
                      <input
                        id="profileCompanyName"
                        value={form.companyName}
                        onChange={(e) =>
                          setForm({ ...form, companyName: e.target.value })
                        }
                        disabled={!editing}
                        required
                      />
                    </div>
                    <div className="profile-form__grid">
                      <div className="form-group">
                        <label>Company Type</label>
                        <input
                          value={
                            user.company?.companyType
                              ?.toLowerCase()
                              .replace(/_/g, ' ') ?? '—'
                          }
                          disabled
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="profileCompanyPhone">
                          Company Phone
                        </label>
                        <input
                          id="profileCompanyPhone"
                          value={form.companyPhoneNumber}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              companyPhoneNumber: e.target.value,
                            })
                          }
                          disabled={!editing}
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label htmlFor="profileDescription">Description</label>
                      <textarea
                        id="profileDescription"
                        value={form.description}
                        onChange={(e) =>
                          setForm({ ...form, description: e.target.value })
                        }
                        disabled={!editing}
                        rows={4}
                      />
                    </div>
                  </>
                )}
              </form>
            )}

            {activeTab === 'security' && (
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
                          <label htmlFor="currentPassword">Current password</label>
                          <input
                            id="currentPassword"
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
                            <label htmlFor="newPassword">New password</label>
                            <input
                              id="newPassword"
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
                            <label htmlFor="confirmPassword">Confirm password</label>
                            <input
                              id="confirmPassword"
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
                      {user.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                    </span>
                  </div>

                  {!user.twoFactorEnabled && !twoFactorSetup && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleStartTwoFactor}
                      disabled={twoFactorBusy}
                    >
                      {twoFactorBusy ? 'Preparing...' : 'Enable two-step verification'}
                    </button>
                  )}

                  {!user.twoFactorEnabled && twoFactorSetup && (
                    <form
                      className="profile-form"
                      onSubmit={handleEnableTwoFactor}
                    >
                      <p>
                        Scan this QR code with your authenticator app, or enter
                        the secret manually.
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
                        <label htmlFor="enable2faCode">Authentication code</label>
                        <input
                          id="enable2faCode"
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

                  {user.twoFactorEnabled && (
                    <form
                      className="profile-form"
                      onSubmit={handleDisableTwoFactor}
                    >
                      <p>
                        To disable two-step verification, confirm your password
                        and a current authenticator code.
                      </p>
                      <div className="form-group">
                        <label htmlFor="disable2faPassword">Password</label>
                        <input
                          id="disable2faPassword"
                          type="password"
                          value={twoFactorPassword}
                          onChange={(e) =>
                            setTwoFactorPassword(e.target.value)
                          }
                          minLength={8}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label htmlFor="disable2faCode">
                          Authentication code
                        </label>
                        <input
                          id="disable2faCode"
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
            )}

            {activeTab === 'preferences' && (
              <div className="profile-tab-placeholder">
                <h3>Preferences</h3>
                <p>
                  Notification and shopping preferences will appear here soon.
                </p>
                <div className="profile-placeholder-row">
                  <span>Email notifications</span>
                  <span>On</span>
                </div>
                <div className="profile-placeholder-row">
                  <span>Order updates</span>
                  <span>On</span>
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="profile-tab-placeholder">
                <h3>Activity</h3>
                <p>Your recent account activity will be listed here soon.</p>
                <div className="profile-placeholder-row">
                  <span>Last login</span>
                  <span>Today</span>
                </div>
                <div className="profile-placeholder-row">
                  <span>Profile updated</span>
                  <span>Recently</span>
                </div>
              </div>
            )}
          </section>

          {isClient && (
            <section className="profile-card profile-orders">
              <div className="profile-orders__header">
                <h3 className="profile-section-title">Recent Orders</h3>
                <button type="button" className="profile-stat__link">
                  View all orders
                </button>
              </div>
              <ul className="profile-orders__list">
                {STATIC_ORDERS.map((order) => (
                  <li key={order.id} className="profile-order">
                    <div className="profile-order__thumb" aria-hidden />
                    <div className="profile-order__info">
                      <p className="profile-order__name">{order.name}</p>
                      <p className="profile-order__date">{order.date}</p>
                    </div>
                    <span
                      className={`profile-order__status profile-order__status--${order.status.toLowerCase()}`}
                    >
                      {order.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
