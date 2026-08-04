import { Navigate } from 'react-router-dom';
import { PublicShell } from '../components/layout/PublicShell';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/auth.css';

export function CompanyPendingPage() {
  const { user, logout } = useAuth();

  if (!user || user.role !== 'COMPANY') {
    return <Navigate to="/login" replace />;
  }

  if (user.companyVerificationStatus === 'APPROVED') {
    return <Navigate to="/company" replace />;
  }

  const isRejected = user.companyVerificationStatus === 'REJECTED';

  return (
    <PublicShell>
      <div className="pending-page">
        <div className="pending-card">
          <h1>{isRejected ? 'Registration rejected' : 'Account under review'}</h1>
          <p>
            {isRejected
              ? 'Your company registration was rejected. Please contact support or submit a new application.'
              : 'Thank you for registering. Your company account is pending admin validation. You will receive an email once your account has been approved. Until then, you cannot access platform features.'}
          </p>
          {!isRejected && (
            <p className="pending-card__note">
              Please keep an eye on your inbox at <strong>{user.email}</strong>.
            </p>
          )}
          <button type="button" className="btn btn-secondary" onClick={logout}>
            Log out
          </button>
        </div>
      </div>
    </PublicShell>
  );
}
