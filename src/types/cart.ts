export interface CartProduct {
  productId: string;
  name: string;
  price: number;
  stock: number;
  images: string[] | null;
  laboratory: string;
  category: { categoryId: string; name: string } | null;
  company: {
    companyId: string;
    companyName: string;
    deliveryFee: number;
  };
}

export interface CartItem {
  cartItemId: string;
  quantity: number;
  lineTotal: number;
  product: CartProduct;
}

export interface CartCompanyGroup {
  companyId: string;
  companyName: string;
  deliveryFee: number;
  items: CartItem[];
  subtotal: number;
  total: number;
}

export interface CartResponse {
  items: CartItem[];
  groups: CartCompanyGroup[];
  itemCount: number;
}
