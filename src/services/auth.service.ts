import { apiFetch } from '../config/api';
import type {
  AuthResponse,
  AuthUser,
  LoginPayload,
  RegisterClientPayload,
  RegisterCompanyPayload,
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
  return apiFetch<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getProfile(token: string) {
  return apiFetch<AuthUser>('/auth/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
