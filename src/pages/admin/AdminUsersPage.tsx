import { useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Search, X } from 'lucide-react';
import type { AdminUser, AdminUserRole } from '../../types/admin';
import { getAdminUsers, updateUserStatus } from '../../services/admin.service';
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

function UserDetailsModal({
  user,
  onClose,
}: {
  user: AdminUser;
  onClose: () => void;
}) {
  return (
    <div className="admin-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="admin-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="admin-modal__header">
          <h2 id="user-details-title">User details</h2>
          <button
            type="button"
            className="admin-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

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
            <p>
              <RoleBadge role={user.role} />
            </p>
          </div>
          <div>
            <span className="admin-modal__label">Status</span>
            <p>
              <StatusBadge status={user.status} />
            </p>
          </div>
          <div>
            <span className="admin-modal__label">Phone</span>
            <p>{user.phoneNumber ?? '—'}</p>
          </div>
          <div>
            <span className="admin-modal__label">Birthday</span>
            <p>{user.birthDate ? formatDate(user.birthDate) : '—'}</p>
          </div>
          <div>
            <span className="admin-modal__label">Gender</span>
            <p>{user.gender ?? '—'}</p>
          </div>
          {user.role === 'COMPANY' && (
            <div>
              <span className="admin-modal__label">Company status</span>
              <p>{user.companyVerificationStatus ?? '—'}</p>
            </div>
          )}
          <div>
            <span className="admin-modal__label">Joined</span>
            <p>{formatDate(user.createdAt)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AdminUsersPage() {
  const { confirm } = useConfirm();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAdminUsers();
      setUsers(data);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      if (!matchesRole) return false;
      if (statusFilter !== 'ALL' && user.status !== statusFilter) return false;

      if (!query) return true;

      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query) ||
        (user.phoneNumber ?? '').toLowerCase().includes(query)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  async function handleToggleStatus(user: AdminUser) {
    const newStatus = user.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const action = newStatus === 'BLOCKED' ? 'block' : 'activate';

    const ok = await confirm({
      title: `${action === 'block' ? 'Block' : 'Activate'} user?`,
      message: `Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`,
      confirmLabel: action === 'block' ? 'Yes, block' : 'Yes, activate',
      danger: action === 'block',
    });
    if (!ok) return;

    setUpdatingId(user.userId);

    try {
      const updated = await updateUserStatus(user.userId, newStatus);
      setUsers((prev) =>
        prev.map((item) => (item.userId === updated.userId ? updated : item)),
      );
      setSelectedUser((current) =>
        current?.userId === updated.userId ? updated : current,
      );
    } catch {
      setError(`Failed to ${action} user.`);
    } finally {
      setUpdatingId(null);
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

  if (error && users.length === 0) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">User Management</h1>
        <div className="admin-error">
          {error}
          <br />
          <button type="button" className="btn btn-primary" onClick={loadUsers}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">User Management</h1>
      <div className="admin-page-card">
        {error && <div className="admin-error" style={{ marginBottom: 16 }}>{error}</div>}

        <div className="list-toolbar">
          <div className="list-toolbar__field list-toolbar__field--search">
            <span className="list-toolbar__label">Search users</span>
            <div className="admin-search">
              <Search size={18} strokeWidth={2} className="admin-search__icon" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or email..."
                aria-label="Search users"
              />
            </div>
          </div>

          <label className="list-toolbar__field">
            <span className="list-toolbar__label">Filter by role</span>
            <select
              className="admin-select"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as RoleFilter)
              }
              aria-label="Filter by role"
            >
              <option value="ALL">All roles</option>
              <option value="CLIENT">Client</option>
              <option value="COMPANY">Company</option>
              <option value="ADMIN">Admin</option>
            </select>
          </label>

          <label className="list-toolbar__field">
            <span className="list-toolbar__label">Filter by status</span>
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter by status"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </label>
        </div>

        {users.length === 0 ? (
          <div className="admin-empty">No users registered yet.</div>
        ) : filteredUsers.length === 0 ? (
          <div className="admin-empty">No users match your search or filter.</div>
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
                          onClick={() => setSelectedUser(user)}
                          aria-label={`View details for ${user.firstName} ${user.lastName}`}
                          title="View details"
                        >
                          <Eye size={18} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className={`admin-btn-sm ${
                            user.status === 'ACTIVE'
                              ? 'admin-btn-sm--danger'
                              : 'admin-btn-sm--success'
                          }`}
                          disabled={updatingId === user.userId}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {updatingId === user.userId
                            ? 'Updating...'
                            : user.status === 'ACTIVE'
                              ? 'Block'
                              : 'Activate'}
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

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  );
}
