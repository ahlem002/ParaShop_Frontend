export type ActivityType =
  | 'PROFILE_UPDATED'
  | 'PASSWORD_CHANGED'
  | 'TWO_FACTOR_ENABLED'
  | 'TWO_FACTOR_DISABLED'
  | 'CART_ITEM_ADDED'
  | 'CART_ITEM_UPDATED'
  | 'CART_ITEM_REMOVED'
  | 'CART_CLEARED'
  | 'CART_COMPANY_CLEARED'
  | 'CHECKOUT_STARTED'
  | 'PAYMENT_SUCCEEDED'
  | 'PAYMENT_FAILED'
  | 'LOGIN'
  | 'ORDER_CANCELLED';

export interface ActivityLogEntry {
  activityId: string;
  type: ActivityType;
  title: string;
  message: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}
