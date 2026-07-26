import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/auth.css';

export function SignUpPage() {
  const navigate = useNavigate();
  const { registerAsClient } = useAuth();
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clientForm, setClientForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    birthDate: '',
    gender: '',
    phoneNumber: '',
    address: '',
    role: 'CLIENT' as 'CLIENT' | 'ADMIN',
  });

  async function handleClientSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const redirectPath = await registerAsClient({
        firstName: clientForm.firstName,
        lastName: clientForm.lastName,
        email: clientForm.email,
        password: clientForm.password,
        birthDate: clientForm.birthDate,
        gender: clientForm.gender,
        phoneNumber: clientForm.phoneNumber || undefined,
        address: clientForm.address || undefined,
        role: clientForm.role,
      });
      navigate(redirectPath);
    } catch {
      setError('Could not create account. Email may already be in use.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-card auth-card--wide">
          <h1>Create an account</h1>
          <p>Join ParaShop+ as a client or admin</p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleClientSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  value={clientForm.firstName}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, firstName: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  value={clientForm.lastName}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="clientEmail">Email</label>
              <input
                id="clientEmail"
                type="email"
                value={clientForm.email}
                onChange={(e) =>
                  setClientForm({ ...clientForm, email: e.target.value })
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="clientPassword">Password</label>
              <input
                id="clientPassword"
                type="password"
                value={clientForm.password}
                onChange={(e) =>
                  setClientForm({ ...clientForm, password: e.target.value })
                }
                minLength={8}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="birthDate">Birthday</label>
                <input
                  id="birthDate"
                  type="date"
                  value={clientForm.birthDate}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, birthDate: e.target.value })
                  }
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={clientForm.gender}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, gender: e.target.value })
                  }
                  required
                >
                  <option value="" disabled>
                    Select gender
                  </option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">Phone (optional)</label>
                <input
                  id="phoneNumber"
                  value={clientForm.phoneNumber}
                  onChange={(e) =>
                    setClientForm({ ...clientForm, phoneNumber: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  value={clientForm.role}
                  onChange={(e) =>
                    setClientForm({
                      ...clientForm,
                      role: e.target.value as 'CLIENT' | 'ADMIN',
                    })
                  }
                >
                  <option value="CLIENT">Client</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Address (optional)</label>
              <input
                id="address"
                value={clientForm.address}
                onChange={(e) =>
                  setClientForm({ ...clientForm, address: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Sign up'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </>
  );
}
