export type UserRole = 'CLIENT' | 'COMPANY' | 'ADMIN';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AuthUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  companyVerificationStatus: VerificationStatus | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface RegisterClientPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  role: 'CLIENT' | 'ADMIN';
}

export interface RegisterCompanyPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  companyName: string;
  companyType: 'PHARMACEUTICAL_LABORATORY' | 'PARAPHARMACY_COMPANY';
  establishmentDate: string;
  description?: string;
  address?: string;
  companyPhoneNumber?: string;
  proofDocument?: File;
}

export interface LoginPayload {
  email: string;
  password: string;
}
