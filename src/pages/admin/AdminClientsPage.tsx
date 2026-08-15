import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Trash2, X } from 'lucide-react';
import type { AdminClient } from '../../types/admin';
import {
  deleteAdminClient,
  getAdminClients,
  updateAdminClient,
} from '../../services/admin.service';
import { ListToolbar } from '../../components/common/ListToolbar';
import { useConfirm } from '../../context/ConfirmContext';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function StatusBadge({ status }: { status: AdminClient['status'] }) {
  return (
    <span className={`admin-badge admin-badge--${status.toLowerCase()}`}>
      {status.toLowerCase()}
    </span>
  );
}

export function AdminClientsPage() {
  const { confirm } = useConfirm();
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [viewClient, setViewClient] = useState<AdminClient | null>(null);
  const [editClient, setEditClient] = useState<AdminClient | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: '',
    birthDate: '',
    address: '',
    status: 'ACTIVE' as AdminClient['status'],
  });
  const [saving, setSaving] = useState(false);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setClients(await getAdminClients());
    } catch {
      setError('Failed to load clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClients();
  }, [loadClients]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clients.filter((client) => {
      if (statusFilter !== 'ALL' && client.status !== statusFilter) return false;
      if (!query) return true;
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        client.email.toLowerCase().includes(query) ||
        (client.phoneNumber ?? '').toLowerCase().includes(query)
      );
    });
  }, [clients, search, statusFilter]);

  function openEdit(client: AdminClient) {
    setEditClient(client);
    setEditForm({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phoneNumber: client.phoneNumber ?? '',
      gender: client.gender ?? '',
      birthDate: client.birthDate?.slice(0, 10) ?? '',
      address: client.address ?? '',
      status: client.status,
    });
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!editClient) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateAdminClient(editClient.clientId, {
        firstName: editForm.firstName.trim(),
        lastName: editForm.lastName.trim(),
        email: editForm.email.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
        gender: editForm.gender,
        birthDate: editForm.birthDate,
        address: editForm.address.trim(),
        status: editForm.status,
      });
      setClients((prev) =>
        prev.map((item) =>
          item.clientId === updated.clientId ? { ...item, ...updated } : item,
        ),
      );
      setEditClient(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update client.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(client: AdminClient) {
    const ok = await confirm({
      title: 'Delete client?',
      message: `Permanently delete ${client.firstName} ${client.lastName}?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;

    setBusyId(client.clientId);
    setError('');
    try {
      await deleteAdminClient(client.clientId);
      setClients((prev) =>
        prev.filter((item) => item.clientId !== client.clientId),
      );
      if (viewClient?.clientId === client.clientId) setViewClient(null);
      if (editClient?.clientId === client.clientId) setEditClient(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete client.',
      );
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Client Management</h1>
        <div className="admin-loading">Loading clients...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Client Management</h1>
      <div className="admin-page-card">
        {error && (
          <div className="admin-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, email, or phone..."
          searchAriaLabel="Search clients"
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
          <div className="admin-empty">No clients found.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.clientId}>
                    <td>
                      {client.firstName} {client.lastName}
                    </td>
                    <td>{client.email}</td>
                    <td>
                      <StatusBadge status={client.status} />
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        <button
                          type="button"
                          className="admin-icon-btn"
                          title="View more"
                          aria-label="View more"
                          onClick={() => setViewClient(client)}
                        >
                          <Eye size={16} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn"
                          title="Modify"
                          aria-label="Modify"
                          onClick={() => openEdit(client)}
                        >
                          <Pencil size={16} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--danger"
                          title="Delete"
                          aria-label="Delete"
                          disabled={busyId === client.clientId}
                          onClick={() => void handleDelete(client)}
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

      {viewClient && (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={() => setViewClient(null)}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__header">
              <h2>Client details</h2>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setViewClient(null)}
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="admin-modal__grid">
              <div>
                <span className="admin-modal__label">Name</span>
                <p>
                  {viewClient.firstName} {viewClient.lastName}
                </p>
              </div>
              <div>
                <span className="admin-modal__label">Email</span>
                <p>{viewClient.email}</p>
              </div>
              <div>
                <span className="admin-modal__label">Phone</span>
                <p>{viewClient.phoneNumber ?? '—'}</p>
              </div>
              <div>
                <span className="admin-modal__label">Birthday</span>
                <p>
                  {viewClient.birthDate
                    ? formatDate(viewClient.birthDate)
                    : '—'}
                </p>
              </div>
              <div>
                <span className="admin-modal__label">Gender</span>
                <p>{viewClient.gender ?? '—'}</p>
              </div>
              <div>
                <span className="admin-modal__label">Address</span>
                <p>{viewClient.address ?? '—'}</p>
              </div>
              <div>
                <span className="admin-modal__label">Status</span>
                <p>
                  <StatusBadge status={viewClient.status} />
                </p>
              </div>
              <div>
                <span className="admin-modal__label">Joined</span>
                <p>{formatDate(viewClient.createdAt)}</p>
              </div>
            </div>
            <div className="admin-modal__actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewClient(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  openEdit(viewClient);
                  setViewClient(null);
                }}
              >
                Modify
              </button>
            </div>
          </div>
        </div>
      )}

      {editClient && (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={() => setEditClient(null)}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__header">
              <h2>Modify client</h2>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setEditClient(null)}
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label htmlFor="client-first">First name</label>
                  <input
                    id="client-first"
                    value={editForm.firstName}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, firstName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="client-last">Last name</label>
                  <input
                    id="client-last"
                    value={editForm.lastName}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, lastName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="client-email">Email</label>
                  <input
                    id="client-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, email: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="client-phone">Phone</label>
                  <input
                    id="client-phone"
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
                  <label htmlFor="client-gender">Gender</label>
                  <select
                    id="client-gender"
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
                  <label htmlFor="client-birth">Birth date</label>
                  <input
                    id="client-birth"
                    type="date"
                    value={editForm.birthDate}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, birthDate: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="client-address">Address</label>
                  <textarea
                    id="client-address"
                    rows={2}
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, address: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="client-status">Status</label>
                  <select
                    id="client-status"
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        status: e.target.value as AdminClient['status'],
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
                  onClick={() => setEditClient(null)}
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
