import type { AuthResponse, AuthUser } from '../types/auth';

const TOKEN_KEY = 'parashop_access_token';
const USER_KEY = 'parashop_user';

export function saveAuth(auth: AuthResponse) {
  localStorage.setItem(TOKEN_KEY, auth.accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(auth.user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function getPostAuthPath(user: AuthUser): string {
  if (user.role === 'ADMIN') {
    return '/admin';
  }

  if (user.role === 'COMPANY') {
    if (user.companyVerificationStatus === 'APPROVED') {
      return '/company';
    }
    return '/company/pending';
  }

  return '/';
}
