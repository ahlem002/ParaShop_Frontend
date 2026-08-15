import { apiFetch, authFetch } from '../config/api';
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterClientPayload,
  RegisterCompanyPayload,
  SaveCheckoutDetailsPayload,
  UpdateProfilePayload,
} from '../types/auth';

export function registerClient(payload: RegisterClientPayload) {
  return apiFetch<AuthResponse>('/auth/register/client', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function registerCompany(payload: RegisterCompanyPayload) {
  const formData = new FormData();

  formData.append('firstName', payload.firstName);
  formData.append('lastName', payload.lastName);
  formData.append('email', payload.email);
  formData.append('password', payload.password);
  formData.append('companyName', payload.companyName);
  formData.append('companyType', payload.companyType);
  formData.append('establishmentDate', payload.establishmentDate);

  if (payload.phoneNumber) {
    formData.append('phoneNumber', payload.phoneNumber);
  }
  if (payload.description) {
    formData.append('description', payload.description);
  }
  if (payload.address) {
    formData.append('address', payload.address);
  }
  if (payload.companyPhoneNumber) {
    formData.append('companyPhoneNumber', payload.companyPhoneNumber);
  }
  if (payload.proofDocument) {
    formData.append('proofDocument', payload.proofDocument);
  }

  return apiFetch<AuthResponse>('/auth/register/company', {
    method: 'POST',
    body: formData,
  });
}

export function login(payload: LoginPayload) {
  return apiFetch<
    AuthResponse | { requiresTwoFactor: true; tempToken: string }
  >('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginWithGoogle(idToken: string) {
  return apiFetch<
    AuthResponse | { requiresTwoFactor: true; tempToken: string }
  >('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
}

export function verifyTwoFactorLogin(tempToken: string, code: string) {
  return apiFetch<AuthResponse>('/auth/2fa/verify-login', {
    method: 'POST',
    body: JSON.stringify({ tempToken, code }),
  });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return authFetch<{ message: string }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export function setupTwoFactor() {
  return authFetch<{
    secret: string;
    otpauthUrl: string;
    qrCodeUrl: string;
  }>('/auth/2fa/setup', {
    method: 'POST',
  });
}

export function enableTwoFactor(code: string) {
  return authFetch<AuthUser>('/auth/2fa/enable', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
}

export function disableTwoFactor(password: string, code: string) {
  return authFetch<AuthUser>('/auth/2fa/disable', {
    method: 'POST',
    body: JSON.stringify({ password, code }),
  });
}

export function getProfile(token: string) {
  return apiFetch<AuthUser>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateProfile(payload: UpdateProfilePayload) {
  const formData = new FormData();
  formData.append('firstName', payload.firstName);
  formData.append('lastName', payload.lastName);

  if (payload.phoneNumber !== undefined) {
    formData.append('phoneNumber', payload.phoneNumber);
  }
  if (payload.birthDate !== undefined) {
    formData.append('birthDate', payload.birthDate);
  }
  if (payload.gender !== undefined) {
    formData.append('gender', payload.gender);
  }
  if (payload.address !== undefined) {
    formData.append('address', payload.address);
  }
  if (payload.companyName !== undefined) {
    formData.append('companyName', payload.companyName);
  }
  if (payload.description !== undefined) {
    formData.append('description', payload.description);
  }
  if (payload.companyPhoneNumber !== undefined) {
    formData.append('companyPhoneNumber', payload.companyPhoneNumber);
  }
  if (payload.profileImage) {
    formData.append('profileImage', payload.profileImage);
  }

  return authFetch<AuthUser>('/auth/profile', {
    method: 'PATCH',
    body: formData,
  });
}

export function saveCheckoutDetails(payload: SaveCheckoutDetailsPayload) {
  return authFetch<AuthUser>('/auth/checkout-details', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
