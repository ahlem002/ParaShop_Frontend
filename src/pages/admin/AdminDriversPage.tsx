import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import type { AdminUser } from '../../types/admin';
import {
  createAdminDriver,
  deleteAdminDriver,
  getAdminDrivers,
  resendAdminDriverInvite,
  updateAdminDriver,
} from '../../services/admin.service';
import { ListToolbar } from '../../components/common/ListToolbar';
import { useConfirm } from '../../context/ConfirmContext';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function isPendingInvite(driver: AdminUser) {
  return Boolean(driver.mustChangePassword);
}

export function AdminDriversPage() {
  const { confirm } = useConfirm();
  const [drivers, setDrivers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [viewDriver, setViewDriver] = useState<AdminUser | null>(null);
  const [editDriver, setEditDriver] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    birthDate: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const loadDrivers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminDrivers();
      setDrivers(data);
    } catch {
      setError('Failed to load drivers.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDrivers();
  }, [loadDrivers]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return drivers.filter((driver) => {
      if (statusFilter !== 'ALL' && driver.status !== statusFilter) {
        return false;
      }
      if (!query) return true;
      const fullName = `${driver.firstName} ${driver.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        driver.email.toLowerCase().includes(query) ||
        (driver.phoneNumber ?? '').toLowerCase().includes(query)
      );
    });
  }, [drivers, search, statusFilter]);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    try {
      const created = await createAdminDriver({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
      });
      setDrivers((prev) => [created, ...prev]);
      setForm({ firstName: '', lastName: '', email: '' });
      setSuccess(
        `Driver created. An invite email was sent to ${created.email}.`,
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create driver.',
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleResend(driver: AdminUser) {
    const ok = await confirm({
      title: 'Resend invite email?',
      message: `Send a new temporary password to ${driver.email}?`,
      confirmLabel: 'Resend',
    });
    if (!ok) return;

    setBusyId(driver.userId);
    setError('');
    setSuccess('');
    try {
      const updated = await resendAdminDriverInvite(driver.userId);
      setDrivers((prev) =>
        prev.map((item) =>
          item.userId === updated.userId ? { ...item, ...updated } : item,
        ),
      );
      setSuccess(`Invite resent to ${updated.email}.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to resend invite.',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleCancelInvite(driver: AdminUser) {
    const ok = await confirm({
      title: 'Cancel invite?',
      message: `Remove ${driver.firstName} ${driver.lastName} before they log in? This deletes the pending account.`,
      confirmLabel: 'Cancel invite',
      danger: true,
    });
    if (!ok) return;

    setBusyId(driver.userId);
    setError('');
    setSuccess('');
    try {
      await deleteAdminDriver(driver.userId);
      setDrivers((prev) =>
        prev.filter((item) => item.userId !== driver.userId),
      );
      setSuccess('Pending invite cancelled.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to cancel invite.',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(driver: AdminUser) {
    const ok = await confirm({
      title: 'Delete driver?',
      message: `Permanently delete ${driver.firstName} ${driver.lastName}?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;

    setBusyId(driver.userId);
    setError('');
    setSuccess('');
    try {
      await deleteAdminDriver(driver.userId);
      setDrivers((prev) =>
        prev.filter((item) => item.userId !== driver.userId),
      );
      if (viewDriver?.userId === driver.userId) setViewDriver(null);
      if (editDriver?.userId === driver.userId) setEditDriver(null);
      setSuccess('Driver deleted.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete driver.',
      );
    } finally {
      setBusyId(null);
    }
  }

  function openEdit(driver: AdminUser) {
    setEditDriver(driver);
    setEditForm({
      firstName: driver.firstName,
      lastName: driver.lastName,
      email: driver.email,
      phoneNumber: driver.phoneNumber ?? '',
      gender: driver.gender ?? '',
      birthDate: driver.birthDate?.slice(0, 10) ?? '',
    });
  }

  async function handleSaveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editDriver) return;

    setSavingEdit(true);
    setError('');
    setSuccess('');
    try {
      const updated = await updateAdminDriver(editDriver.userId, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
        gender: editForm.gender,
        birthDate: editForm.birthDate,
      });
      setDrivers((prev) =>
        prev.map((item) =>
          item.userId === updated.userId ? { ...item, ...updated } : item,
        ),
      );
      setEditDriver(null);
      setSuccess('Driver updated.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update driver.',
      );
    } finally {
      setSavingEdit(false);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Driver Management</h1>
        <div className="admin-loading">Loading drivers...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1 className="admin-page-title">Driver Management</h1>
          <p className="admin-page-subtitle">
            Create delivery accounts. Drivers receive a temporary password by
            email and must complete their profile on first login.
          </p>
        </div>
      </div>

      {error && <div className="admin-error">{error}</div>}
      {success && <div className="admin-success">{success}</div>}

      <div className="admin-page-card" style={{ marginBottom: 16 }}>
        <h2 className="admin-page-title" style={{ fontSize: 18 }}>
          Add driver
        </h2>
        <form className="admin-form-grid" onSubmit={handleCreate}>
          <div className="form-group">
            <label htmlFor="driver-first">First name</label>
            <input
              id="driver-first"
              value={form.firstName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, firstName: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="driver-last">Last name</label>
            <input
              id="driver-last"
              value={form.lastName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, lastName: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="driver-email">Email</label>
            <input
              id="driver-email"
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              required
            />
          </div>
          <div className="form-group" style={{ alignSelf: 'end' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create driver'}
            </button>
          </div>
        </form>
      </div>

      <div className="admin-page-card">
        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search drivers..."
          searchAriaLabel="Search drivers"
          selects={[
            {
              id: 'status',
              label: 'Filter by status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'ALL', label: 'All statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'BLOCKED', label: 'Blocked' },
              ],
            },
          ]}
        />

        {filtered.length === 0 ? (
          <div className="admin-empty">No drivers found.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Setup</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((driver) => {
                  const pending = isPendingInvite(driver);
                  const busy = busyId === driver.userId;

                  return (
                    <tr key={driver.userId}>
                      <td>
                        {driver.firstName} {driver.lastName}
                      </td>
                      <td>{driver.email}</td>
                      <td>{driver.phoneNumber ?? '—'}</td>
                      <td>
                        {pending
                          ? 'Invite pending'
                          : driver.profileCompleted === false
                            ? 'Profile pending'
                            : 'Ready'}
                      </td>
                      <td>
                        <span
                          className={`admin-badge admin-badge--${driver.status.toLowerCase()}`}
                        >
                          {driver.status.toLowerCase()}
                        </span>
                      </td>
                      <td>{formatDate(driver.createdAt)}</td>
                      <td>
                        <div className="admin-table__actions">
                          {pending ? (
                            <>
                              <button
                                type="button"
                                className="admin-btn-sm admin-btn-sm--primary"
                                disabled={busy}
                                onClick={() => void handleResend(driver)}
                              >
                                Resend
                              </button>
                              <button
                                type="button"
                                className="admin-btn-sm admin-btn-sm--danger"
                                disabled={busy}
                                onClick={() => void handleCancelInvite(driver)}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                className="admin-icon-btn"
                                title="View more"
                                aria-label="View more"
                                onClick={() => setViewDriver(driver)}
                              >
                                <Eye size={16} strokeWidth={2} />
                              </button>
                              <button
                                type="button"
                                className="admin-icon-btn"
                                title="Modify"
                                aria-label="Modify"
                                onClick={() => openEdit(driver)}
                              >
                                <Pencil size={16} strokeWidth={2} />
                              </button>
                              <button
                                type="button"
                                className="admin-icon-btn admin-icon-btn--danger"
                                title="Delete"
                                aria-label="Delete"
                                disabled={busy}
                                onClick={() => void handleDelete(driver)}
                              >
                                <Trash2 size={16} strokeWidth={2} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewDriver && (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={() => setViewDriver(null)}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>
              {viewDriver.firstName} {viewDriver.lastName}
            </h2>
            <dl className="admin-detail-list">
              <div>
                <dt>Email</dt>
                <dd>{viewDriver.email}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{viewDriver.phoneNumber ?? '—'}</dd>
              </div>
              <div>
                <dt>Gender</dt>
                <dd>{viewDriver.gender ?? '—'}</dd>
              </div>
              <div>
                <dt>Birth date</dt>
                <dd>{viewDriver.birthDate?.slice(0, 10) ?? '—'}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>{viewDriver.status}</dd>
              </div>
              <div>
                <dt>Setup</dt>
                <dd>
                  {viewDriver.profileCompleted === false
                    ? 'Profile pending'
                    : 'Ready'}
                </dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDate(viewDriver.createdAt)}</dd>
              </div>
            </dl>
            <div className="admin-modal__actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewDriver(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  openEdit(viewDriver);
                  setViewDriver(null);
                }}
              >
                Modify
              </button>
            </div>
          </div>
        </div>
      )}

      {editDriver && (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={() => setEditDriver(null)}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Modify driver</h2>
            <form onSubmit={handleSaveEdit}>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label htmlFor="edit-first">First name</label>
                  <input
                    id="edit-first"
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-last">Last name</label>
                  <input
                    id="edit-last"
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-email">Email</label>
                  <input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-phone">Phone</label>
                  <input
                    id="edit-phone"
                    value={editForm.phoneNumber}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="edit-gender">Gender</label>
                  <select
                    id="edit-gender"
                    value={editForm.gender}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        gender: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="edit-birth">Birth date</label>
                  <input
                    id="edit-birth"
                    type="date"
                    value={editForm.birthDate}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        birthDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="admin-modal__actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditDriver(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingEdit}
                >
                  {savingEdit ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
