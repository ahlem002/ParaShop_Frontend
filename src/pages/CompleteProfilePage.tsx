import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPostAuthPath } from '../utils/auth-storage';
import '../styles/pages/auth.css';

export function CompleteProfilePage() {
  const { user, updateProfile, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [gender, setGender] = useState(user?.gender ?? '');
  const [birthDate, setBirthDate] = useState(user?.birthDate ?? '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/auth/change-password" replace />;
  }

  if (user.role !== 'DELIVERY' || user.profileCompleted !== false) {
    return <Navigate to={getPostAuthPath(user)} replace />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (!phoneNumber.trim() || !gender || !birthDate) {
      setError('Phone number, gender, and birth date are required.');
      return;
    }

    setBusy(true);
    try {
      const updated = await updateProfile({
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: phoneNumber.trim(),
        gender,
        birthDate,
      });
      navigate(getPostAuthPath(updated), { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save profile.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Complete your profile</h1>
        <p>
          Fill in your contact details before receiving delivery assignments.
        </p>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="phone">Phone number</label>
            <input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              placeholder="+216 ..."
            />
          </div>
          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              required
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="birth">Birth date</label>
            <input
              id="birth"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? 'Saving...' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
