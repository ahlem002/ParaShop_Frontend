import { authFetch } from '../config/api';
import type {
  AdminClient,
  AdminCompany,
  AdminProduct,
  AdminUser,
  UserAccountStatus,
} from '../types/admin';

export function getAdminUsers() {
  return authFetch<AdminUser[]>('/admin/users');
}

export function updateUserStatus(userId: string, status: UserAccountStatus) {
  return authFetch<AdminUser>(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function getAdminClients() {
  return authFetch<AdminClient[]>('/admin/clients');
}

export function updateClientStatus(clientId: string, status: UserAccountStatus) {
  return authFetch<AdminClient>(`/admin/clients/${clientId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function getAdminCompanies() {
  return authFetch<AdminCompany[]>('/admin/companies');
}

export function updateCompanyVerification(
  companyId: string,
  decision: 'APPROVED' | 'REJECTED',
  reason?: string,
) {
  return authFetch<AdminCompany>(`/admin/companies/${companyId}/verification`, {
    method: 'PATCH',
    body: JSON.stringify({ decision, reason }),
  });
}

export function getAdminProducts() {
  return authFetch<AdminProduct[]>('/admin/products');
}

export function updateProductVerification(
  productId: string,
  decision: 'APPROVED' | 'REJECTED',
  reason?: string,
) {
  return authFetch<AdminProduct>(
    `/admin/products/${productId}/verification`,
    {
      method: 'PATCH',
      body: JSON.stringify({ decision, reason }),
    },
  );
}
