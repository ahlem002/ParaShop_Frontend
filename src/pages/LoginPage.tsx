import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicShell } from '../components/layout/PublicShell';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/auth.css';

function resolveRedirect(
  defaultPath: string,
  redirect: string | null,
): string {
  if (!redirect || !redirect.startsWith('/') || redirect.startsWith('//')) {
    return defaultPath;
  }
  return redirect;
}

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, loginWithGoogle, completeTwoFactorLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const redirectParam = searchParams.get('redirect');

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
        navigate(resolveRedirect(redirectPath, redirectParam));
        return;
      }

      const result = await login({ email, password }, rememberMe);
      if (typeof result === 'object' && result.requiresTwoFactor) {
        setTempToken(result.tempToken);
        setTwoFactorCode('');
        return;
      }

      navigate(resolveRedirect(result, redirectParam));
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

  async function handleGoogleCredential(idToken: string) {
    setError('');
    setIsSubmitting(true);
    try {
      const result = await loginWithGoogle(idToken, rememberMe);
      if (typeof result === 'object' && result.requiresTwoFactor) {
        setTempToken(result.tempToken);
        setTwoFactorCode('');
        return;
      }
      navigate(resolveRedirect(result, redirectParam));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Google Sign-In failed. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <PublicShell>
      <div className="auth-page">
        <div className="auth-card auth-card--wide">
          <h1>{tempToken ? 'Two-step verification' : 'Welcome back'}</h1>
          <p>
            {tempToken
              ? 'Enter the 6-digit code from your authenticator app'
              : 'Sign in to your ParaShop+ account'}
          </p>

          {error && <div className="auth-error">{error}</div>}

          {!tempToken && (
            <>
              <GoogleSignInButton
                text="signin_with"
                disabled={isSubmitting}
                onCredential={handleGoogleCredential}
              />
              <div className="auth-divider">
                <span>or</span>
              </div>
            </>
          )}

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
                    setTwoFactorCode(
                      e.target.value.replace(/\D/g, '').slice(0, 6),
                    )
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
    </PublicShell>
  );
}
