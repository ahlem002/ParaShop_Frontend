import { authFetch } from '../config/api';
import type {
  AdminClient,
  AdminCompany,
  AdminDashboardStats,
  AdminProduct,
  AdminUser,
  UserAccountStatus,
} from '../types/admin';

export function getAdminDashboard() {
  return authFetch<AdminDashboardStats>('/admin/dashboard');
}

export function getAdminUsers() {
  return authFetch<AdminUser[]>('/admin/users');
}

export function updateUserStatus(userId: string, status: UserAccountStatus) {
  return authFetch<AdminUser>(`/admin/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function updateAdminUser(
  userId: string,
  payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    gender?: string;
    birthDate?: string;
    status?: UserAccountStatus;
  },
) {
  return authFetch<AdminUser>(`/admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminUser(userId: string) {
  return authFetch<{ success: boolean }>(`/admin/users/${userId}`, {
    method: 'DELETE',
  });
}

export function getAdminDrivers() {
  return authFetch<AdminUser[]>('/admin/drivers');
}

export function createAdminDriver(payload: {
  firstName: string;
  lastName: string;
  email: string;
}) {
  return authFetch<AdminUser>('/admin/drivers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function resendAdminDriverInvite(userId: string) {
  return authFetch<AdminUser>(`/admin/drivers/${userId}/resend-invite`, {
    method: 'POST',
  });
}

export function updateAdminDriver(
  userId: string,
  payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    gender?: string;
    birthDate?: string;
  },
) {
  return authFetch<AdminUser>(`/admin/drivers/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminDriver(userId: string) {
  return authFetch<{ success: boolean }>(`/admin/drivers/${userId}`, {
    method: 'DELETE',
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

export function updateAdminClient(
  clientId: string,
  payload: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    gender?: string;
    birthDate?: string;
    address?: string;
    status?: UserAccountStatus;
  },
) {
  return authFetch<AdminClient>(`/admin/clients/${clientId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminClient(clientId: string) {
  return authFetch<{ success: boolean }>(`/admin/clients/${clientId}`, {
    method: 'DELETE',
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

export function updateAdminCompany(
  companyId: string,
  payload: {
    companyName?: string;
    companyType?: string;
    establishmentDate?: string;
    description?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    ownerFirstName?: string;
    ownerLastName?: string;
    ownerStatus?: UserAccountStatus;
  },
) {
  return authFetch<AdminCompany>(`/admin/companies/${companyId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteAdminCompany(companyId: string) {
  return authFetch<{ success: boolean }>(`/admin/companies/${companyId}`, {
    method: 'DELETE',
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
