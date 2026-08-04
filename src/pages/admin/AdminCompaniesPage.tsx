import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AdminCompany } from '../../types/admin';
import {
  getAdminCompanies,
  updateCompanyVerification,
} from '../../services/admin.service';
import { ListToolbar } from '../../components/common/ListToolbar';
import { resolveUploadUrl } from '../../config/api';
import { useConfirm } from '../../context/ConfirmContext';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
}

function formatCompanyType(type: string | null) {
  if (!type) return '—';
  return type
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function VerificationBadge({
  status,
}: {
  status: AdminCompany['verificationStatus'];
}) {
  return (
    <span className={`admin-badge admin-badge--${status.toLowerCase()}`}>
      {status.toLowerCase()}
    </span>
  );
}

export function AdminCompaniesPage() {
  const { confirm } = useConfirm();
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [ownerStatusFilter, setOwnerStatusFilter] = useState('ALL');

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAdminCompanies();
      setCompanies(data);
    } catch {
      setError('Failed to load companies.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return companies.filter((company) => {
      if (
        statusFilter !== 'ALL' &&
        company.verificationStatus !== statusFilter
      ) {
        return false;
      }
      if (typeFilter !== 'ALL' && company.companyType !== typeFilter) {
        return false;
      }
      if (
        ownerStatusFilter !== 'ALL' &&
        company.owner.status !== ownerStatusFilter
      ) {
        return false;
      }
      if (!query) return true;

      const ownerName =
        `${company.owner.firstName} ${company.owner.lastName}`.toLowerCase();
      return (
        company.companyName.toLowerCase().includes(query) ||
        company.email.toLowerCase().includes(query) ||
        (company.phoneNumber ?? '').toLowerCase().includes(query) ||
        ownerName.includes(query) ||
        company.owner.email.toLowerCase().includes(query)
      );
    });
  }, [companies, search, statusFilter, typeFilter, ownerStatusFilter]);

  async function handleApprove(company: AdminCompany) {
    const ok = await confirm({
      title: 'Approve company?',
      message: `Approve ${company.companyName}?`,
      confirmLabel: 'Yes, approve',
      danger: false,
    });
    if (!ok) return;

    setUpdatingId(company.companyId);

    try {
      const updated = await updateCompanyVerification(
        company.companyId,
        'APPROVED',
      );
      setCompanies((prev) =>
        prev.map((item) =>
          item.companyId === updated.companyId ? updated : item,
        ),
      );
    } catch {
      setError('Failed to approve company.');
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleReject(company: AdminCompany) {
    const ok = await confirm({
      title: 'Reject company?',
      message: `Reject ${company.companyName}? You can optionally provide a reason next.`,
      confirmLabel: 'Continue',
      danger: true,
    });
    if (!ok) return;

    const reason = window.prompt(
      `Reject ${company.companyName}? Optionally provide a reason:`,
    );

    if (reason === null) {
      return;
    }

    setUpdatingId(company.companyId);

    try {
      const updated = await updateCompanyVerification(
        company.companyId,
        'REJECTED',
        reason || undefined,
      );
      setCompanies((prev) =>
        prev.map((item) =>
          item.companyId === updated.companyId ? updated : item,
        ),
      );
    } catch {
      setError('Failed to reject company.');
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Company Management</h1>
        <div className="admin-loading">Loading companies...</div>
      </div>
    );
  }

  if (error && companies.length === 0) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Company Management</h1>
        <div className="admin-error">
          {error}
          <br />
          <button
            type="button"
            className="btn btn-primary"
            onClick={loadCompanies}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Company Management</h1>
      <div className="admin-page-card">
        {error && (
          <div className="admin-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by company, email, or owner..."
          searchAriaLabel="Search companies"
          selects={[
            {
              id: 'status',
              label: 'Filter by verification',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'ALL', label: 'All statuses' },
                { value: 'PENDING', label: 'Pending' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
              ],
            },
            {
              id: 'type',
              label: 'Filter by company type',
              value: typeFilter,
              onChange: setTypeFilter,
              options: [
                { value: 'ALL', label: 'All types' },
                {
                  value: 'PHARMACEUTICAL_LABORATORY',
                  label: 'Pharmaceutical laboratory',
                },
                {
                  value: 'PARAPHARMACY_COMPANY',
                  label: 'Parapharmacy company',
                },
              ],
            },
            {
              id: 'ownerStatus',
              label: 'Filter by owner status',
              value: ownerStatusFilter,
              onChange: setOwnerStatusFilter,
              options: [
                { value: 'ALL', label: 'All owner statuses' },
                { value: 'ACTIVE', label: 'Owner active' },
                { value: 'BLOCKED', label: 'Owner blocked' },
              ],
            },
          ]}
        />

        {companies.length === 0 ? (
          <div className="admin-empty">No companies registered yet.</div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty">
            No companies match your search or filters.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Type</th>
                  <th>Owner</th>
                  <th>Company Email</th>
                  <th>Phone</th>
                  <th>Address</th>
                  <th>Proof</th>
                  <th>Status</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((company) => {
                  const proofUrl = resolveUploadUrl(company.proofDocument);

                  return (
                    <tr key={company.companyId}>
                      <td>{company.companyName}</td>
                      <td>{formatCompanyType(company.companyType)}</td>
                      <td>
                        {company.owner.firstName} {company.owner.lastName}
                        <br />
                        <span
                          style={{
                            color: 'var(--text-secondary)',
                            fontSize: 13,
                          }}
                        >
                          {company.owner.email}
                        </span>
                      </td>
                      <td>{company.email}</td>
                      <td>{company.phoneNumber ?? '—'}</td>
                      <td>{company.address ?? '—'}</td>
                      <td>
                        {proofUrl ? (
                          <a
                            href={proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="admin-link"
                          >
                            View
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <VerificationBadge
                          status={company.verificationStatus}
                        />
                      </td>
                      <td>{formatDate(company.createdAt)}</td>
                      <td>
                        <div className="admin-table__actions">
                          {company.verificationStatus === 'PENDING' ? (
                            <>
                              <button
                                type="button"
                                className="admin-btn-sm admin-btn-sm--success"
                                disabled={updatingId === company.companyId}
                                onClick={() => void handleApprove(company)}
                              >
                                {updatingId === company.companyId
                                  ? 'Updating...'
                                  : 'Approve'}
                              </button>
                              <button
                                type="button"
                                className="admin-btn-sm admin-btn-sm--danger"
                                disabled={updatingId === company.companyId}
                                onClick={() => void handleReject(company)}
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span
                              style={{
                                color: 'var(--text-secondary)',
                                fontSize: 13,
                              }}
                            >
                              —
                            </span>
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
    </div>
  );
}
