import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  getProfile,
  login as loginRequest,
  registerClient,
  registerCompany,
  updateProfile as updateProfileRequest,
} from '../services/auth.service';
import type {
  AuthUser,
  LoginPayload,
  RegisterClientPayload,
  RegisterCompanyPayload,
  UpdateProfilePayload,
} from '../types/auth';
import {
  clearAuth,
  getPostAuthPath,
  getStoredToken,
  getStoredUser,
  IDLE_TIMEOUT_MS,
  saveAuth,
  saveStoredUser,
} from '../utils/auth-storage';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload, rememberMe?: boolean) => Promise<string>;
  registerAsClient: (payload: RegisterClientPayload) => Promise<string>;
  registerAsCompany: (payload: RegisterCompanyPayload) => Promise<string>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<AuthUser>;
  refreshProfile: () => Promise<AuthUser | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  const applyAuth = useCallback(
    (accessToken: string, authUser: AuthUser, rememberMe = false) => {
      saveAuth({ accessToken, user: authUser }, rememberMe);
      setToken(accessToken);
      setUser(authUser);
      return getPostAuthPath(authUser);
    },
    [],
  );

  const login = useCallback(
    async (payload: LoginPayload, rememberMe = false) => {
      const response = await loginRequest(payload);
      return applyAuth(response.accessToken, response.user, rememberMe);
    },
    [applyAuth],
  );

  const registerAsClient = useCallback(
    async (payload: RegisterClientPayload) => {
      const response = await registerClient(payload);
      return applyAuth(response.accessToken, response.user, false);
    },
    [applyAuth],
  );

  const registerAsCompany = useCallback(
    async (payload: RegisterCompanyPayload) => {
      const response = await registerCompany(payload);
      return applyAuth(response.accessToken, response.user, false);
    },
    [applyAuth],
  );

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const updated = await updateProfileRequest(payload);
    saveStoredUser(updated);
    setUser(updated);
    return updated;
  }, []);

  const refreshProfile = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setToken(null);
      setUser(null);
      return null;
    }

    const profile = await getProfile(currentToken);
    saveStoredUser(profile);
    setUser(profile);
    return profile;
  }, []);

  // End session after inactivity (including long laptop sleep).
  useEffect(() => {
    if (!token) return;

    let lastActivity = Date.now();

    const touch = () => {
      lastActivity = Date.now();
    };

    const checkIdle = () => {
      if (Date.now() - lastActivity >= IDLE_TIMEOUT_MS) {
        logout();
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkIdle();
      }
    };

    const events: Array<keyof WindowEventMap> = [
      'click',
      'keydown',
      'mousemove',
      'scroll',
      'touchstart',
    ];

    for (const event of events) {
      window.addEventListener(event, touch, { passive: true });
    }
    document.addEventListener('visibilitychange', onVisibility);

    const intervalId = window.setInterval(checkIdle, 30_000);

    return () => {
      for (const event of events) {
        window.removeEventListener(event, touch);
      }
      document.removeEventListener('visibilitychange', onVisibility);
      window.clearInterval(intervalId);
    };
  }, [token, logout]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      registerAsClient,
      registerAsCompany,
      updateProfile,
      refreshProfile,
      logout,
    }),
    [
      user,
      token,
      login,
      registerAsClient,
      registerAsCompany,
      updateProfile,
      refreshProfile,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export async function refreshStoredProfile(token: string) {
  return getProfile(token);
}
