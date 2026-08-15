export type NotificationType =
  | 'COMPANY_PENDING'
  | 'PRODUCT_PENDING'
  | 'PRODUCT_APPROVED'
  | 'PRODUCT_REJECTED'
  | 'ORDER_UPDATED'
  | 'NEW_ORDER';

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
