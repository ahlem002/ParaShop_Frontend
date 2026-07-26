import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminClient } from '../../types/admin';
import {
  getAdminClients,
  updateClientStatus,
} from '../../services/admin.service';
import { ListToolbar } from '../../components/common/ListToolbar';

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
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
    void loadClients();
  }, [loadClients]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clients.filter((client) => {
      if (statusFilter !== 'ALL' && client.status !== statusFilter) {
        return false;
      }
      if (!query) return true;

      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      return (
        fullName.includes(query) ||
        client.email.toLowerCase().includes(query) ||
        (client.phoneNumber ?? '').toLowerCase().includes(query) ||
        (client.address ?? '').toLowerCase().includes(query)
      );
    });
  }, [clients, search, statusFilter]);

  async function handleToggleStatus(client: AdminClient) {
    const newStatus = client.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
    const action = newStatus === 'BLOCKED' ? 'block' : 'activate';

    if (
      !window.confirm(
        `Are you sure you want to ${action} ${client.firstName} ${client.lastName}?`,
      )
    ) {
      return;
    }

    setUpdatingId(client.clientId);

    try {
      const updated = await updateClientStatus(client.clientId, newStatus);
      setClients((prev) =>
        prev.map((item) =>
          item.clientId === updated.clientId ? updated : item,
        ),
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

        {clients.length === 0 ? (
          <div className="admin-empty">No clients registered yet.</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            No clients match your search or filter.
          </div>
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
                {filtered.map((client) => (
                  <tr key={client.clientId}>
                    <td>
                      {client.firstName} {client.lastName}
                    </td>
                    <td>{client.email}</td>
                    <td>{client.phoneNumber ?? '—'}</td>
                    <td>
                      {client.birthDate ? formatDate(client.birthDate) : '—'}
                    </td>
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
                          onClick={() => void handleToggleStatus(client)}
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
