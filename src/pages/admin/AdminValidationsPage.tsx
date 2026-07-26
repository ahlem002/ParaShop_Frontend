import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, XCircle } from 'lucide-react';
import type { AdminCompany, VerificationStatus } from '../../types/admin';
import {
  getAdminCompanies,
  updateCompanyVerification,
} from '../../services/admin.service';

type FilterTab = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL';

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

function VerificationBadge({ status }: { status: VerificationStatus }) {
  return (
    <span className={`admin-badge admin-badge--${status.toLowerCase()}`}>
      {status.toLowerCase()}
    </span>
  );
}

export function AdminValidationsPage() {
  const [companies, setCompanies] = useState<AdminCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('PENDING');

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAdminCompanies();
      setCompanies(data);
    } catch {
      setError('Failed to load company validation requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const counts = useMemo(
    () => ({
      PENDING: companies.filter((c) => c.verificationStatus === 'PENDING').length,
      APPROVED: companies.filter((c) => c.verificationStatus === 'APPROVED').length,
      REJECTED: companies.filter((c) => c.verificationStatus === 'REJECTED').length,
      ALL: companies.length,
    }),
    [companies],
  );

  const filtered = useMemo(() => {
    if (filter === 'ALL') return companies;
    return companies.filter((c) => c.verificationStatus === filter);
  }, [companies, filter]);

  async function handleApprove(company: AdminCompany) {
    if (!window.confirm(`Approve "${company.companyName}"? They will gain full company access.`)) {
      return;
    }

    setUpdatingId(company.companyId);

    try {
      const updated = await updateCompanyVerification(company.companyId, 'APPROVED');
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
      `Reject "${company.companyName}"? Optionally provide a reason:`,
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
        <h1 className="admin-page-title">Company Validations</h1>
        <div className="admin-loading">Loading validation requests...</div>
      </div>
    );
  }

  if (error && companies.length === 0) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Company Validations</h1>
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

  const tabs: { key: FilterTab; label: string }[] = [
    { key: 'PENDING', label: 'Pending' },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
    { key: 'ALL', label: 'All' },
  ];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Company Validations</h1>
      <div className="admin-validations">
      <p className="admin-validations__intro">
        Review company registration requests. Pending companies cannot access the
        platform until you approve them.
      </p>

      {error && <div className="admin-error" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="admin-filter-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`admin-filter-tab${filter === tab.key ? ' active' : ''}`}
            onClick={() => setFilter(tab.key)}
          >
            {tab.label}
            <span className="admin-filter-tab__count">{counts[tab.key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="admin-page-card admin-page-card--empty">
          <h2>
            {filter === 'PENDING'
              ? 'No pending requests'
              : 'No companies in this filter'}
          </h2>
          <p>
            {filter === 'PENDING'
              ? 'New company accounts waiting for validation will appear here.'
              : 'Try another filter to see more results.'}
          </p>
        </div>
      ) : (
        <div className="admin-validation-list">
          {filtered.map((company) => {
            const isPending = company.verificationStatus === 'PENDING';
            const isUpdating = updatingId === company.companyId;

            return (
              <article key={company.companyId} className="admin-validation-card">
                <div className="admin-validation-card__header">
                  <div>
                    <h2>{company.companyName}</h2>
                    <p className="admin-validation-card__meta">
                      Registered {formatDate(company.createdAt)}
                    </p>
                  </div>
                  <VerificationBadge status={company.verificationStatus} />
                </div>

                <div className="admin-validation-card__grid">
                  <div>
                    <span className="admin-validation-card__label">Owner</span>
                    <p>
                      {company.owner.firstName} {company.owner.lastName}
                    </p>
                    <p className="admin-validation-card__sub">{company.owner.email}</p>
                  </div>
                  <div>
                    <span className="admin-validation-card__label">Company email</span>
                    <p>{company.email}</p>
                  </div>
                  <div>
                    <span className="admin-validation-card__label">Type</span>
                    <p>{formatCompanyType(company.companyType)}</p>
                  </div>
                  <div>
                    <span className="admin-validation-card__label">Established</span>
                    <p>
                      {company.establishmentDate
                        ? formatDate(company.establishmentDate)
                        : '—'}
                    </p>
                  </div>
                  <div>
                    <span className="admin-validation-card__label">Phone</span>
                    <p>{company.phoneNumber ?? '—'}</p>
                  </div>
                  <div>
                    <span className="admin-validation-card__label">Address</span>
                    <p>{company.address ?? '—'}</p>
                  </div>
                </div>

                {company.description && (
                  <div className="admin-validation-card__description">
                    <span className="admin-validation-card__label">Description</span>
                    <p>{company.description}</p>
                  </div>
                )}

                <div className="admin-validation-card__footer">
                  {company.proofDocument ? (
                    <a
                      href={company.proofDocument}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-link admin-validation-card__proof"
                    >
                      View proof document
                      <ExternalLink size={16} strokeWidth={2} />
                    </a>
                  ) : (
                    <span className="admin-validation-card__no-proof">
                      No proof document provided
                    </span>
                  )}

                  {isPending && (
                    <div className="admin-table__actions">
                      <button
                        type="button"
                        className="admin-btn-sm admin-btn-sm--success"
                        disabled={isUpdating}
                        onClick={() => handleApprove(company)}
                      >
                        <CheckCircle2 size={16} strokeWidth={2} />
                        {isUpdating ? 'Updating...' : 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="admin-btn-sm admin-btn-sm--danger"
                        disabled={isUpdating}
                        onClick={() => handleReject(company)}
                      >
                        <XCircle size={16} strokeWidth={2} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
    </div>
  );
}
