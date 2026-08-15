export type UserRole = 'CLIENT' | 'COMPANY' | 'ADMIN' | 'DELIVERY';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AuthCompanyProfile {
  companyId: string;
  companyName: string;
  companyType: string;
  establishmentDate: string;
  description: string | null;
  phoneNumber: string | null;
  email: string;
  proofDocument: string | null;
}

export interface AuthUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  role: UserRole;
  companyVerificationStatus: VerificationStatus | null;
  address?: string | null;
  profileImage?: string | null;
  createdAt?: string | null;
  twoFactorEnabled?: boolean;
  mustChangePassword?: boolean;
  profileCompleted?: boolean;
  savedPaymentMethod?: {
    cardName: string | null;
    cardNumber: string | null;
    cardExpiry: string | null;
  } | null;
  company?: AuthCompanyProfile | null;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export type LoginResult =
  | AuthResponse
  | { requiresTwoFactor: true; tempToken: string };

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

export interface UpdateProfilePayload {
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  birthDate?: string;
  gender?: string;
  address?: string;
  companyName?: string;
  description?: string;
  companyPhoneNumber?: string;
  profileImage?: File | null;
}

export interface SaveCheckoutDetailsPayload {
  address?: string;
  phoneNumber?: string;
  cardName?: string;
  cardNumber?: string;
  cardExpiry?: string;
}
