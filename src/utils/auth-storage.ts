import type { AuthResponse, AuthUser } from '../types/auth';

const TOKEN_KEY = 'parashop_access_token';
const USER_KEY = 'parashop_user';
const REMEMBER_KEY = 'parashop_remember';

/** Log out after this much inactivity (laptop sleep / away from keyboard). */
export const IDLE_TIMEOUT_MS = 30 * 60 * 1000;

function getAuthStore(): Storage {
  if (sessionStorage.getItem(TOKEN_KEY)) {
    return sessionStorage;
  }
  if (localStorage.getItem(REMEMBER_KEY) === '1') {
    return localStorage;
  }
  return sessionStorage;
}

export function isTokenExpired(token: string): boolean {
  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return true;
    const payload = JSON.parse(atob(payloadPart)) as { exp?: number };
    if (!payload.exp) return false;
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function saveAuth(auth: AuthResponse, rememberMe = false) {
  clearAuth();

  const store = rememberMe ? localStorage : sessionStorage;
  if (rememberMe) {
    localStorage.setItem(REMEMBER_KEY, '1');
  }

  store.setItem(TOKEN_KEY, auth.accessToken);
  store.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function saveStoredUser(user: AuthUser) {
  getAuthStore().setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

export function getStoredToken(): string | null {
  const token =
    sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);

  if (!token) return null;

  if (isTokenExpired(token)) {
    clearAuth();
    return null;
  }

  return token;
}

export function getStoredUser(): AuthUser | null {
  if (!getStoredToken()) return null;

  const raw =
    sessionStorage.getItem(USER_KEY) ?? localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getPostAuthPath(user: AuthUser): string {
  if (user.mustChangePassword) {
    return '/auth/change-password';
  }

  if (user.role === 'DELIVERY' && user.profileCompleted === false) {
    return '/auth/complete-profile';
  }

  if (user.role === 'ADMIN') {
    return '/admin';
  }

  if (user.role === 'COMPANY') {
    if (user.companyVerificationStatus === 'APPROVED') {
      return '/company';
    }
    return '/company/pending';
  }

  if (user.role === 'DELIVERY') {
    return '/delivery';
  }

  return '/';
}
