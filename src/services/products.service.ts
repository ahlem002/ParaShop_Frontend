import { apiFetch, authFetch } from '../config/api';
import type {
  CompanyProduct,
  ProductCategory,
  ProductFormPayload,
  PublicProduct,
} from '../types/product';

export function getCategories() {
  return apiFetch<ProductCategory[]>('/categories');
}

export function getPublicProducts() {
  return apiFetch<PublicProduct[]>('/products');
}

export function getPublicProduct(productId: string) {
  return apiFetch<PublicProduct>(`/products/${productId}`);
}

export function getCompanyProducts() {
  return authFetch<CompanyProduct[]>('/company/products');
}

export function getCompanyProduct(productId: string) {
  return authFetch<CompanyProduct>(`/company/products/${productId}`);
}

function toFormData(payload: ProductFormPayload) {
  const formData = new FormData();
  formData.append('name', payload.name);
  formData.append('categoryId', payload.categoryId);
  formData.append('price', payload.price);
  formData.append('stock', payload.stock);

  if (payload.description) {
    formData.append('description', payload.description);
  }

  if (payload.notice !== undefined) {
    formData.append('notice', payload.notice);
  }

  payload.images?.forEach((file) => {
    formData.append('images', file);
  });

  return formData;
}

export function createCompanyProduct(payload: ProductFormPayload) {
  return authFetch<CompanyProduct>('/company/products', {
    method: 'POST',
    body: toFormData(payload),
  });
}

export function updateCompanyProduct(
  productId: string,
  payload: ProductFormPayload,
) {
  return authFetch<CompanyProduct>(`/company/products/${productId}`, {
    method: 'PATCH',
    body: toFormData(payload),
  });
}

export function deleteCompanyProduct(productId: string) {
  return authFetch<{ deleted: boolean }>(`/company/products/${productId}`, {
    method: 'DELETE',
  });
}
