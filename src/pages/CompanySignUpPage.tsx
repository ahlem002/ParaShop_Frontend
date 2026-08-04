import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PublicShell } from '../components/layout/PublicShell';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/auth.css';

export function CompanySignUpPage() {
  const navigate = useNavigate();
  const { registerAsCompany } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [companyForm, setCompanyForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    establishmentDate: '',
    companyType: '' as '' | 'PHARMACEUTICAL_LABORATORY' | 'PARAPHARMACY_COMPANY',
    phoneNumber: '',
    companyName: '',
    description: '',
    address: '',
    companyPhoneNumber: '',
  });

  async function handleCompanySubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!companyForm.companyType) {
      setError('Please select a company type.');
      return;
    }

    setIsSubmitting(true);

    try {
      const redirectPath = await registerAsCompany({
        firstName: companyForm.firstName,
        lastName: companyForm.lastName,
        email: companyForm.email,
        password: companyForm.password,
        phoneNumber: companyForm.phoneNumber || undefined,
        companyName: companyForm.companyName,
        companyType: companyForm.companyType,
        establishmentDate: companyForm.establishmentDate,
        description: companyForm.description || undefined,
        address: companyForm.address || undefined,
        companyPhoneNumber: companyForm.companyPhoneNumber || undefined,
        proofDocument: proofFile || undefined,
      });
      navigate(redirectPath);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not create company account. Please check your details.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PublicShell>
      <div className="auth-page">
        <div className="auth-card auth-card--wide">
          <h1>Register your company</h1>
          <p>
            Create a company account on ParaShop+. An admin will review your
            application before approval.
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleCompanySubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="companyFirstName">Owner first name</label>
                <input
                  id="companyFirstName"
                  value={companyForm.firstName}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="companyLastName">Owner last name</label>
                <input
                  id="companyLastName"
                  value={companyForm.lastName}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="companyEmail">Company email</label>
                <input
                  id="companyEmail"
                  type="email"
                  value={companyForm.email}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="companyPassword">Password</label>
                <input
                  id="companyPassword"
                  type="password"
                  value={companyForm.password}
                  onChange={(e) =>
                    setCompanyForm({ ...companyForm, password: e.target.value })
                  }
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="establishmentDate">Date of establishment</label>
                <input
                  id="establishmentDate"
                  type="date"
                  value={companyForm.establishmentDate}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      establishmentDate: e.target.value,
                    })
                  }
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="companyType">Company type</label>
                <select
                  id="companyType"
                  value={companyForm.companyType}
                  onChange={(e) =>
                    setCompanyForm({
                      ...companyForm,
                      companyType: e.target.value as
                        | ''
                        | 'PHARMACEUTICAL_LABORATORY'
                        | 'PARAPHARMACY_COMPANY',
                    })
                  }
                  required
                >
                  <option value="" disabled>
                    Select company type
                  </option>
                  <option value="PHARMACEUTICAL_LABORATORY">
                    Pharmaceutical Laboratory
                  </option>
                  <option value="PARAPHARMACY_COMPANY">
                    Parapharmacy Company
                  </option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="companyName">Company name</label>
              <input
                id="companyName"
                value={companyForm.companyName}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, companyName: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="companyDescription">Description (optional)</label>
              <textarea
                id="companyDescription"
                value={companyForm.description}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, description: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="companyPhone">Company phone (optional)</label>
              <input
                id="companyPhone"
                value={companyForm.companyPhoneNumber}
                onChange={(e) =>
                  setCompanyForm({
                    ...companyForm,
                    companyPhoneNumber: e.target.value,
                  })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="companyAddress">Company address (optional)</label>
              <input
                id="companyAddress"
                value={companyForm.address}
                onChange={(e) =>
                  setCompanyForm({ ...companyForm, address: e.target.value })
                }
              />
            </div>

            <div className="form-group">
              <label htmlFor="proofDocument">Proof document (optional)</label>
              <input
                id="proofDocument"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/*"
                onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
              />
              {proofFile && (
                <span className="form-file-name">{proofFile.name}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Register company'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
