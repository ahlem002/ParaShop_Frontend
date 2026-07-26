import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/auth.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, completeTwoFactorLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (tempToken) {
        const redirectPath = await completeTwoFactorLogin(
          tempToken,
          twoFactorCode,
          rememberMe,
        );
        navigate(redirectPath);
        return;
      }

      const result = await login({ email, password }, rememberMe);
      if (typeof result === 'object' && result.requiresTwoFactor) {
        setTempToken(result.tempToken);
        setTwoFactorCode('');
        return;
      }

      navigate(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : tempToken
            ? 'Invalid authentication code.'
            : 'Invalid email or password. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <div className="auth-page">
        <div className="auth-card auth-card--wide">
          <h1>{tempToken ? 'Two-step verification' : 'Welcome back'}</h1>
          <p>
            {tempToken
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Sign in to your ParaShop+ account'}
          </p>

          {error && <div className="auth-error">{error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            {!tempToken ? (
              <>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    minLength={8}
                    required
                  />
                </div>

                <label className="auth-remember" htmlFor="rememberMe">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me on this device</span>
                </label>
              </>
            ) : (
              <div className="form-group">
                <label htmlFor="twoFactorCode">Authentication code</label>
                <input
                  id="twoFactorCode"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={twoFactorCode}
                  onChange={(e) =>
                    setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="123456"
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? tempToken
                  ? 'Verifying...'
                  : 'Signing in...'
                : tempToken
                  ? 'Verify'
                  : 'Login'}
            </button>

            {tempToken && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setTempToken(null);
                  setTwoFactorCode('');
                  setError('');
                }}
              >
                Back to login
              </button>
            )}
          </form>

          {!tempToken && (
            <div className="auth-footer">
              Don&apos;t have an account? <Link to="/signup">Sign up</Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
