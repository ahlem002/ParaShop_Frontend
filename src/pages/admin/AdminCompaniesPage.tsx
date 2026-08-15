import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Eye, Pencil, Trash2, X } from 'lucide-react';
import type { AdminCompany } from '../../types/admin';
import {
  deleteAdminCompany,
  getAdminCompanies,
  updateAdminCompany,
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
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [viewCompany, setViewCompany] = useState<AdminCompany | null>(null);
  const [editCompany, setEditCompany] = useState<AdminCompany | null>(null);
  const [editForm, setEditForm] = useState({
    companyName: '',
    companyType: 'PARAPHARMACY_COMPANY',
    establishmentDate: '',
    description: '',
    email: '',
    phoneNumber: '',
    address: '',
    ownerFirstName: '',
    ownerLastName: '',
    ownerStatus: 'ACTIVE' as AdminCompany['owner']['status'],
  });
  const [saving, setSaving] = useState(false);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCompanies(await getAdminCompanies());
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
      if (!query) return true;
      const ownerName =
        `${company.owner.firstName} ${company.owner.lastName}`.toLowerCase();
      return (
        company.companyName.toLowerCase().includes(query) ||
        company.email.toLowerCase().includes(query) ||
        ownerName.includes(query)
      );
    });
  }, [companies, search, statusFilter, typeFilter]);

  function openEdit(company: AdminCompany) {
    setEditCompany(company);
    setEditForm({
      companyName: company.companyName,
      companyType: company.companyType ?? 'PARAPHARMACY_COMPANY',
      establishmentDate: company.establishmentDate?.slice(0, 10) ?? '',
      description: company.description ?? '',
      email: company.email,
      phoneNumber: company.phoneNumber ?? '',
      address: company.address ?? '',
      ownerFirstName: company.owner.firstName,
      ownerLastName: company.owner.lastName,
      ownerStatus: company.owner.status,
    });
  }

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!editCompany) return;
    setSaving(true);
    setError('');
    try {
      const updated = await updateAdminCompany(editCompany.companyId, {
        companyName: editForm.companyName.trim(),
        companyType: editForm.companyType,
        establishmentDate: editForm.establishmentDate,
        description: editForm.description.trim(),
        email: editForm.email.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
        address: editForm.address.trim(),
        ownerFirstName: editForm.ownerFirstName.trim(),
        ownerLastName: editForm.ownerLastName.trim(),
        ownerStatus: editForm.ownerStatus,
      });
      setCompanies((prev) =>
        prev.map((item) =>
          item.companyId === updated.companyId ? updated : item,
        ),
      );
      setEditCompany(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update company.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(company: AdminCompany) {
    const ok = await confirm({
      title: 'Delete company?',
      message: `Permanently delete ${company.companyName} and its owner account?`,
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;

    setBusyId(company.companyId);
    setError('');
    try {
      await deleteAdminCompany(company.companyId);
      setCompanies((prev) =>
        prev.filter((item) => item.companyId !== company.companyId),
      );
      if (viewCompany?.companyId === company.companyId) setViewCompany(null);
      if (editCompany?.companyId === company.companyId) setEditCompany(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to delete company.',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleApprove(company: AdminCompany) {
    const ok = await confirm({
      title: 'Approve company?',
      message: `Approve ${company.companyName}?`,
      confirmLabel: 'Yes, approve',
    });
    if (!ok) return;

    setBusyId(company.companyId);
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
      setViewCompany(updated);
    } catch {
      setError('Failed to approve company.');
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(company: AdminCompany) {
    const ok = await confirm({
      title: 'Reject company?',
      message: `Reject ${company.companyName}?`,
      confirmLabel: 'Continue',
      danger: true,
    });
    if (!ok) return;

    const reason = window.prompt(
      `Reject ${company.companyName}? Optional reason:`,
    );
    if (reason === null) return;

    setBusyId(company.companyId);
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
      setViewCompany(updated);
    } catch {
      setError('Failed to reject company.');
    } finally {
      setBusyId(null);
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
              label: 'Filter by type',
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
          ]}
        />

        {filtered.length === 0 ? (
          <div className="admin-empty">No companies found.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Owner</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((company) => (
                  <tr key={company.companyId}>
                    <td>{company.companyName}</td>
                    <td>
                      {company.owner.firstName} {company.owner.lastName}
                    </td>
                    <td>
                      <VerificationBadge status={company.verificationStatus} />
                    </td>
                    <td>
                      <div className="admin-table__actions">
                        <button
                          type="button"
                          className="admin-icon-btn"
                          title="View more"
                          aria-label="View more"
                          onClick={() => setViewCompany(company)}
                        >
                          <Eye size={16} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn"
                          title="Modify"
                          aria-label="Modify"
                          onClick={() => openEdit(company)}
                        >
                          <Pencil size={16} strokeWidth={2} />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn--danger"
                          title="Delete"
                          aria-label="Delete"
                          disabled={busyId === company.companyId}
                          onClick={() => void handleDelete(company)}
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

      {viewCompany && (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={() => setViewCompany(null)}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__header">
              <h2>Company details</h2>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setViewCompany(null)}
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="admin-modal__grid">
              <div>
                <span className="admin-modal__label">Company</span>
                <p>{viewCompany.companyName}</p>
              </div>
              <div>
                <span className="admin-modal__label">Type</span>
                <p>{formatCompanyType(viewCompany.companyType)}</p>
              </div>
              <div>
                <span className="admin-modal__label">Email</span>
                <p>{viewCompany.email}</p>
              </div>
              <div>
                <span className="admin-modal__label">Phone</span>
                <p>{viewCompany.phoneNumber ?? '—'}</p>
              </div>
              <div>
                <span className="admin-modal__label">Address</span>
                <p>{viewCompany.address ?? '—'}</p>
              </div>
              <div>
                <span className="admin-modal__label">Established</span>
                <p>
                  {viewCompany.establishmentDate
                    ? formatDate(viewCompany.establishmentDate)
                    : '—'}
                </p>
              </div>
              <div>
                <span className="admin-modal__label">Description</span>
                <p>{viewCompany.description ?? '—'}</p>
              </div>
              <div>
                <span className="admin-modal__label">Owner</span>
                <p>
                  {viewCompany.owner.firstName} {viewCompany.owner.lastName}
                  <br />
                  {viewCompany.owner.email}
                  <br />
                  Status: {viewCompany.owner.status.toLowerCase()}
                </p>
              </div>
              <div>
                <span className="admin-modal__label">Verification</span>
                <p>
                  <VerificationBadge
                    status={viewCompany.verificationStatus}
                  />
                </p>
              </div>
              <div>
                <span className="admin-modal__label">Proof</span>
                <p>
                  {resolveUploadUrl(viewCompany.proofDocument) ? (
                    <a
                      href={resolveUploadUrl(viewCompany.proofDocument)!}
                      target="_blank"
                      rel="noreferrer"
                      className="admin-link"
                    >
                      View document
                    </a>
                  ) : (
                    '—'
                  )}
                </p>
              </div>
              <div>
                <span className="admin-modal__label">Registered</span>
                <p>{formatDate(viewCompany.createdAt)}</p>
              </div>
            </div>
            <div className="admin-modal__actions">
              {viewCompany.verificationStatus === 'PENDING' && (
                <>
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={busyId === viewCompany.companyId}
                    onClick={() => void handleApprove(viewCompany)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busyId === viewCompany.companyId}
                    onClick={() => void handleReject(viewCompany)}
                  >
                    Reject
                  </button>
                </>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewCompany(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  openEdit(viewCompany);
                  setViewCompany(null);
                }}
              >
                Modify
              </button>
            </div>
          </div>
        </div>
      )}

      {editCompany && (
        <div
          className="admin-modal-overlay"
          role="presentation"
          onClick={() => setEditCompany(null)}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal__header">
              <h2>Modify company</h2>
              <button
                type="button"
                className="admin-modal__close"
                onClick={() => setEditCompany(null)}
                aria-label="Close"
              >
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label htmlFor="co-name">Company name</label>
                  <input
                    id="co-name"
                    value={editForm.companyName}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        companyName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="co-type">Type</label>
                  <select
                    id="co-type"
                    value={editForm.companyType}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        companyType: e.target.value,
                      }))
                    }
                  >
                    <option value="PHARMACEUTICAL_LABORATORY">
                      Pharmaceutical laboratory
                    </option>
                    <option value="PARAPHARMACY_COMPANY">
                      Parapharmacy company
                    </option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="co-email">Email</label>
                  <input
                    id="co-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, email: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="co-phone">Phone</label>
                  <input
                    id="co-phone"
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
                  <label htmlFor="co-est">Establishment date</label>
                  <input
                    id="co-est"
                    type="date"
                    value={editForm.establishmentDate}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        establishmentDate: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="co-address">Address</label>
                  <textarea
                    id="co-address"
                    rows={2}
                    value={editForm.address}
                    onChange={(e) =>
                      setEditForm((p) => ({ ...p, address: e.target.value }))
                    }
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label htmlFor="co-desc">Description</label>
                  <textarea
                    id="co-desc"
                    rows={2}
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="co-owner-first">Owner first name</label>
                  <input
                    id="co-owner-first"
                    value={editForm.ownerFirstName}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        ownerFirstName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="co-owner-last">Owner last name</label>
                  <input
                    id="co-owner-last"
                    value={editForm.ownerLastName}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        ownerLastName: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="co-owner-status">Owner status</label>
                  <select
                    id="co-owner-status"
                    value={editForm.ownerStatus}
                    onChange={(e) =>
                      setEditForm((p) => ({
                        ...p,
                        ownerStatus: e.target
                          .value as AdminCompany['owner']['status'],
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
                  onClick={() => setEditCompany(null)}
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
