import { useCallback, useEffect, useState } from 'react';
import type { AdminClient } from '../../types/admin';
import {
  getAdminClients,
  updateClientStatus,
} from '../../services/admin.service';

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
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAdminClients();
      setClients(data);
    } catch {
      setError('Failed to load clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  async function handleToggleStatus(client: AdminClient) {
    const newStatus = client.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const action = newStatus === 'BLOCKED' ? 'block' : 'activate';

    if (!window.confirm(`Are you sure you want to ${action} ${client.firstName} ${client.lastName}?`)) {
      return;
    }

    setUpdatingId(client.clientId);

    try {
      const updated = await updateClientStatus(client.clientId, newStatus);
      setClients((prev) =>
        prev.map((item) => (item.clientId === updated.clientId ? updated : item)),
      );
    } catch {
      setError(`Failed to ${action} client.`);
    } finally {
      setUpdatingId(null);
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

  if (error && clients.length === 0) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Client Management</h1>
        <div className="admin-error">
          {error}
          <br />
          <button type="button" className="btn btn-primary" onClick={loadClients}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Client Management</h1>
      <div className="admin-page-card">
      {error && <div className="admin-error" style={{ marginBottom: 16 }}>{error}</div>}

      {clients.length === 0 ? (
        <div className="admin-empty">No clients registered yet.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Birthday</th>
                <th>Gender</th>
                <th>Address</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.clientId}>
                  <td>
                    {client.firstName} {client.lastName}
                  </td>
                  <td>{client.email}</td>
                  <td>{client.phoneNumber ?? '—'}</td>
                  <td>{client.birthDate ? formatDate(client.birthDate) : '—'}</td>
                  <td>{client.gender ?? '—'}</td>
                  <td>{client.address ?? '—'}</td>
                  <td>
                    <StatusBadge status={client.status} />
                  </td>
                  <td>{formatDate(client.createdAt)}</td>
                  <td>
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className={`admin-btn-sm ${
                          client.status === 'ACTIVE'
                            ? 'admin-btn-sm--danger'
                            : 'admin-btn-sm--success'
                        }`}
                        disabled={updatingId === client.clientId}
                        onClick={() => handleToggleStatus(client)}
                      >
                        {updatingId === client.clientId
                          ? 'Updating...'
                          : client.status === 'ACTIVE'
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
    </div>
  );
}
