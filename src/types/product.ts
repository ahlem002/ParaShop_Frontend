export interface ProductCategory {
  categoryId: string;
  name: string;
  description: string | null;
  image: string | null;
}

export type ProductVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CompanyProduct {
  productId: string;
  name: string;
  description: string | null;
  images: string[] | null;
  price: number | string;
  stock: number;
  notice: string | null;
  laboratory: string;
  verificationStatus: ProductVerificationStatus;
  rejectionReason: string | null;
  companyId: string;
  categoryId: string;
  category?: ProductCategory;
  createdAt: string;
  updatedAt: string;
}

export interface PublicProduct {
  productId: string;
  name: string;
  description: string | null;
  images: string[] | null;
  price: number | string;
  stock: number;
  notice: string | null;
  laboratory: string;
  category?: ProductCategory;
  company?: {
    companyId: string;
    companyName: string;
    deliveryFee?: number | string;
  };
}

export interface ProductFormPayload {
  name: string;
  description?: string;
  categoryId: string;
  price: string;
  stock: string;
  notice?: string;
  images?: File[];
}
