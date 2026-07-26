import { useCallback, useEffect, useState } from 'react';
import type { AdminCompany } from '../../types/admin';
import {
  getAdminCompanies,
  updateCompanyVerification,
} from '../../services/admin.service';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString();
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
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    loadCompanies();
  }, [loadCompanies]);

  async function handleApprove(company: AdminCompany) {
    if (!window.confirm(`Approve ${company.companyName}?`)) {
      return;
    }

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
          <button type="button" className="btn btn-primary" onClick={loadCompanies}>
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
      {error && <div className="admin-error" style={{ marginBottom: 16 }}>{error}</div>}

      {companies.length === 0 ? (
        <div className="admin-empty">No companies registered yet.</div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Company</th>
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
              {companies.map((company) => (
                <tr key={company.companyId}>
                  <td>{company.companyName}</td>
                  <td>
                    {company.owner.firstName} {company.owner.lastName}
                    <br />
                    <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                      {company.owner.email}
                    </span>
                  </td>
                  <td>{company.email}</td>
                  <td>{company.phoneNumber ?? '—'}</td>
                  <td>{company.address ?? '—'}</td>
                  <td>
                    {company.proofDocument ? (
                      <a
                        href={company.proofDocument}
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
                    <VerificationBadge status={company.verificationStatus} />
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
                            onClick={() => handleApprove(company)}
                          >
                            {updatingId === company.companyId
                              ? 'Updating...'
                              : 'Approve'}
                          </button>
                          <button
                            type="button"
                            className="admin-btn-sm admin-btn-sm--danger"
                            disabled={updatingId === company.companyId}
                            onClick={() => handleReject(company)}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                          —
                        </span>
                      )}
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
