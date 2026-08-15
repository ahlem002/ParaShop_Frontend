export type NotificationType =
  | 'COMPANY_PENDING'
  | 'PRODUCT_PENDING'
  | 'PRODUCT_APPROVED'
  | 'PRODUCT_REJECTED'
  | 'PRODUCT_LOW_STOCK'
  | 'PRODUCT_SOLD_OUT'
  | 'PRODUCT_AUTO_DELETED'
  | 'ORDER_UPDATED'
  | 'NEW_ORDER'
  | 'DELIVERY_ASSIGNED'
  | 'DRIVER_RATED';

export interface AppNotification {
  notificationId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  relatedId: string | null;
  isRead: boolean;
  createdAt: string;
}

export type NotificationFilterTab =
  | 'all'
  | 'unread'
  | 'products'
  | 'companies'
  | 'system';
