import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Search, Trash2, X } from 'lucide-react';
import type { AdminUser, AdminUserRole } from '../../types/admin';
import {
  deleteAdminUser,
  getAdminUsers,
  updateAdminUser,
} from '../../services/admin.service';
import { useConfirm } from '../../context/ConfirmContext';

type RoleFilter = 'ALL' | AdminUserRole;

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function StatusBadge({ status }: { status: AdminUser['status'] }) {
  return (
    <span className={`admin-badge admin-badge--${status.toLowerCase()}`}>
      {status.toLowerCase()}
    </span>
  );
}

function RoleBadge({ role }: { role: AdminUser['role'] }) {
  return <span className="admin-link">{role.toLowerCase()}</span>;
}

export function AdminUsersPage() {
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    birthDate: '',
    status: 'ACTIVE' as AdminUser['status'],
  });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setUsers(await getAdminUsers());
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      if (roleFilter !== 'ALL' && user.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && user.status !== statusFilter) return false;
      if (!query) return true;
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  function openEdit(user: AdminUser) {
    setEditUser(user);
    setEditForm({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber ?? '',
      gender: user.gender ?? '',
      birthDate: user.birthDate?.slice(0, 10) ?? '',
      status: user.status,
    });
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!editUser) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateAdminUser(editUser.userId, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
        gender: editForm.gender,
        birthDate: editForm.birthDate,
        status: editForm.status,
      });
      setUsers((prev) =>
        prev.map((item) =>
          item.userId === updated.userId ? { ...item, ...updated } : item,
        ),
      );
      setEditUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(user: AdminUser) {
    const ok = await confirm({
      title: 'Delete user?',
      message: `Permanently delete ${user.firstName} ${user.lastName}?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;

    setBusyId(user.userId);
    setError('');
    try {
      await deleteAdminUser(user.userId);
      setUsers((prev) => prev.filter((item) => item.userId !== user.userId));
      if (viewUser?.userId === user.userId) setViewUser(null);
      if (editUser?.userId === user.userId) setEditUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">User Management</h1>
        <div className="admin-loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">User Management</h1>
      <div className="admin-page-card">
        {error && (
          <div className="admin-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <div className="list-toolbar">
          <div className="list-toolbar__field list-toolbar__field--search">
            <span className="list-toolbar__label">Search users</span>
            <div className="admin-search">
              <Search size={18} strokeWidth={2} className="admin-search__icon" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
              />
            </div>
          </div>
          <label className="list-toolbar__field">
            <span className="list-toolbar__label">Filter by role</span>
            <select
              className="admin-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
            >
              <option value="ALL">All roles</option>
              <option value="CLIENT">Client</option>
              <option value="COMPANY">Company</option>
              <option value="DELIVERY">Delivery</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>
          <label className="list-toolbar__field">
            <span className="list-toolbar__label">Filter by status</span>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </label>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="admin-empty">No users found.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.userId}>
                    <td>
                      {user.firstName} {user.lastName}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <RoleBadge role={user.role} />
                    </td>
                    <td>
                      <StatusBadge status={user.status} />
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        <button
                          type="button"
                          className="admin-icon-btn"
                          title="View more"
                          aria-label="View more"
                          onClick={() => setViewUser(user)}
                        >
                          <Eye size={16} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn"
                          title="Modify"
                          aria-label="Modify"
                          onClick={() => openEdit(user)}
                        >
                          <Pencil size={16} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--danger"
                          title="Delete"
                          aria-label="Delete"
                          disabled={busyId === user.userId}
                          onClick={() => void handleDelete(user)}
                        >
                          <Trash2 size={16} strokeWidth={2} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {viewUser && (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={() => setViewUser(null)}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__header">
              <h2>User details</h2>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setViewUser(null)}
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="admin-modal__grid">
              <div>
                <span className="admin-modal__label">Name</span>
                <p>
                  {viewUser.firstName} {viewUser.lastName}
                </p>
              </div>
              <div>
                <span className="admin-modal__label">Email</span>
                <p>{viewUser.email}</p>
              </div>
              <div>
                <span className="admin-modal__label">Role</span>
                <p>
                  <RoleBadge role={viewUser.role} />
                </p>
              </div>
              <div>
                <span className="admin-modal__label">Status</span>
                <p>
                  <StatusBadge status={viewUser.status} />
                </p>
              </div>
              <div>
                <span className="admin-modal__label">Phone</span>
                <p>{viewUser.phoneNumber ?? '—'}</p>
              </div>
              <div>
                <span className="admin-modal__label">Birthday</span>
                <p>
                  {viewUser.birthDate ? formatDate(viewUser.birthDate) : '—'}
                </p>
              </div>
              <div>
                <span className="admin-modal__label">Gender</span>
                <p>{viewUser.gender ?? '—'}</p>
              </div>
              {viewUser.role === 'COMPANY' && (
                <div>
                  <span className="admin-modal__label">Company status</span>
                  <p>{viewUser.companyVerificationStatus ?? '—'}</p>
                </div>
              )}
              <div>
                <span className="admin-modal__label">Joined</span>
                <p>{formatDate(viewUser.createdAt)}</p>
              </div>
            </div>
            <div className="admin-modal__actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewUser(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  openEdit(viewUser);
                  setViewUser(null);
                }}
              >
                Modify
              </button>
            </div>
          </div>
        </div>
      )}

      {editUser && (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={() => setEditUser(null)}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__header">
              <h2>Modify user</h2>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setEditUser(null)}
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label htmlFor="user-first">First name</label>
                  <input
                    id="user-first"
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, firstName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="user-last">Last name</label>
                  <input
                    id="user-last"
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, lastName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="user-email">Email</label>
                  <input
                    id="user-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, email: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="user-phone">Phone</label>
                  <input
                    id="user-phone"
                    value={editForm.phoneNumber}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        phoneNumber: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="user-gender">Gender</label>
                  <select
                    id="user-gender"
                    value={editForm.gender}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, gender: e.target.value }))
                    }
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="user-birth">Birth date</label>
                  <input
                    id="user-birth"
                    type="date"
                    value={editForm.birthDate}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, birthDate: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="user-status">Status</label>
                  <select
                    id="user-status"
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        status: e.target.value as AdminUser['status'],
                      }))
                    }
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="BLOCKED">Blocked</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal__actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditUser(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
