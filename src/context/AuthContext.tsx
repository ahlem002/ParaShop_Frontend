import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { getProfile, login as loginRequest, registerClient, registerCompany } from '../services/auth.service';
import type {
  AuthUser,
  LoginPayload,
  RegisterClientPayload,
  RegisterCompanyPayload,
} from '../types/auth';
import {
  clearAuth,
  getPostAuthPath,
  getStoredToken,
  getStoredUser,
  saveAuth,
} from '../utils/auth-storage';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<string>;
  registerAsClient: (payload: RegisterClientPayload) => Promise<string>;
  registerAsCompany: (payload: RegisterCompanyPayload) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getStoredToken());

  const applyAuth = useCallback((accessToken: string, authUser: AuthUser) => {
    saveAuth({ accessToken, user: authUser });
    setToken(accessToken);
    setUser(authUser);
    return getPostAuthPath(authUser);
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await loginRequest(payload);
    return applyAuth(response.accessToken, response.user);
  }, [applyAuth]);

  const registerAsClient = useCallback(async (payload: RegisterClientPayload) => {
    const response = await registerClient(payload);
    return applyAuth(response.accessToken, response.user);
  }, [applyAuth]);

  const registerAsCompany = useCallback(async (payload: RegisterCompanyPayload) => {
    const response = await registerCompany(payload);
    return applyAuth(response.accessToken, response.user);
  }, [applyAuth]);

  const logout = useCallback(() => {
    clearAuth();
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      login,
      registerAsClient,
      registerAsCompany,
      logout,
    }),
    [user, token, login, registerAsClient, registerAsCompany, logout],
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
