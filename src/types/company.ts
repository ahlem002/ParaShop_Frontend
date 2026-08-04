export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface CompanyDashboardStats {
  products: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    inStock: number;
    outOfStock: number;
    lowStock: number;
  };
  inventory: {
    totalStockUnits: number;
    catalogValue: number;
  };
  sales: {
    paidOrders: number;
    unitsSold: number;
    revenue: number;
    revenueThisMonth: number;
  };
  engagement: {
    favorites: number;
    inCarts: number;
    cartUnits: number;
  };
  outOfStockProducts: Array<{
    productId: string;
    name: string;
    stock: number;
    verificationStatus: VerificationStatus;
    price: number;
  }>;
  lowStockProducts: Array<{
    productId: string;
    name: string;
    stock: number;
    verificationStatus: VerificationStatus;
    price: number;
  }>;
  topSelling: Array<{
    productId: string;
    name: string;
    unitsSold: number;
    revenue: number;
  }>;
  mostFavorited: Array<{
    productId: string;
    name: string;
    favorites: number;
  }>;
  mostInCart: Array<{
    productId: string;
    name: string;
    cartEntries: number;
    cartUnits: number;
  }>;
  charts: {
    salesLast7Days: Array<{
      date: string;
      label: string;
      revenue: number;
      units: number;
      orders: number;
    }>;
    favoritesLast7Days: Array<{
      date: string;
      label: string;
      favorites: number;
    }>;
    stockLevels: Array<{
      productId: string;
      name: string;
      stock: number;
    }>;
  };
}
