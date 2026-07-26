export type UserAccountStatus = 'ACTIVE' | 'BLOCKED';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AdminUserRole = 'CLIENT' | 'COMPANY' | 'ADMIN';

export interface AdminUser {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  birthDate: string | null;
  gender: string | null;
  role: AdminUserRole;
  status: UserAccountStatus;
  companyVerificationStatus: VerificationStatus | null;
  createdAt: string;
}

export interface AdminClient {
  clientId: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  birthDate: string | null;
  gender: string | null;
  address: string | null;
  status: UserAccountStatus;
  createdAt: string;
}

export interface AdminCompany {
  companyId: string;
  companyName: string;
  companyType: string | null;
  establishmentDate: string | null;
  description: string | null;
  email: string;
  phoneNumber: string | null;
  address: string | null;
  proofDocument: string | null;
  verificationStatus: VerificationStatus;
  createdAt: string;
  owner: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    status: UserAccountStatus;
  };
}

export interface AdminProduct {
  productId: string;
  name: string;
  description: string | null;
  images: string[] | null;
  price: number;
  stock: number;
  notice: string | null;
  laboratory: string;
  verificationStatus: VerificationStatus;
  rejectionReason: string | null;
  category: { categoryId: string; name: string } | null;
  company: {
    companyId: string;
    companyName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}
