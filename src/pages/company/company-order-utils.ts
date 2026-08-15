import type {
  CompanyOrderNextStatus,
  CompanyOrderView,
  OrderClientView,
  OrderStatus,
} from '../../types/order';

export function formatOrderPrice(value: number) {
  return `${Number(value).toFixed(2)} TND`;
}

export function statusLabel(status: OrderStatus) {
  switch (status) {
    case 'PAID':
      return 'Paid';
    case 'PENDING_PAYMENT':
      return 'Pending payment';
    case 'PAYMENT_FAILED':
      return 'Payment failed';
    case 'PROCESSING':
      return 'Processing';
    case 'SHIPPED':
      return 'Shipped';
    case 'DELIVERED':
      return 'Delivered';
    case 'RETURNED':
      return 'Returned to seller';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

export function statusBadgeClass(status: OrderStatus) {
  switch (status) {
    case 'PAID':
    case 'DELIVERED':
      return 'admin-badge admin-badge--approved';
    case 'PROCESSING':
    case 'SHIPPED':
    case 'PENDING_PAYMENT':
      return 'admin-badge admin-badge--pending';
    case 'PAYMENT_FAILED':
    case 'CANCELLED':
    case 'RETURNED':
      return 'admin-badge admin-badge--rejected';
    default:
      return 'admin-badge';
  }
}

export function nextActionLabel(status: CompanyOrderNextStatus) {
  switch (status) {
    case 'PROCESSING':
      return 'Mark processing';
    default:
      return status;
  }
}

export const ORDER_STATUS_FILTER_HELP: {
  value: 'ALL' | OrderStatus;
  label: string;
  description: string;
}[] = [
  {
    value: 'ALL',
    label: 'All statuses',
    description: 'Every client who has at least one order with your company.',
  },
  {
    value: 'PAID',
    label: 'Paid',
    description:
      'Payment succeeded. Prepare the package — next step is Mark processing.',
  },
  {
    value: 'PROCESSING',
    label: 'Processing',
    description:
      'You are preparing the order. Assign a driver from Delivery Management to ship it.',
  },
  {
    value: 'SHIPPED',
    label: 'Shipped',
    description:
      'A driver is delivering the order. Track it in Delivery Management.',
  },
  {
    value: 'DELIVERED',
    label: 'Delivered',
    description: 'Order completed successfully. No further action needed.',
  },
  {
    value: 'RETURNED',
    label: 'Returned to seller',
    description:
      'Client did not accept the order. The driver returned it to you.',
  },
  {
    value: 'PENDING_PAYMENT',
    label: 'Pending payment',
    description:
      'Checkout started but payment is not confirmed yet. Wait for payment.',
  },
  {
    value: 'PAYMENT_FAILED',
    label: 'Payment failed',
    description: 'Payment did not go through. Nothing to ship.',
  },
  {
    value: 'CANCELLED',
    label: 'Cancelled',
    description: 'Order was cancelled. Stock may have been restored.',
  },
];

export interface ClientOrderGroup {
  client: OrderClientView;
  orders: CompanyOrderView[];
  latestAt: string;
  totalAmount: number;
  itemCount: number;
  orderCount: number;
  statusSummary: OrderStatus[];
}

export function groupOrdersByClient(
  orders: CompanyOrderView[],
): ClientOrderGroup[] {
  const map = new Map<string, ClientOrderGroup>();

  for (const order of orders) {
    const key = order.client.clientId;
    const existing = map.get(key);
    const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

    if (!existing) {
      map.set(key, {
        client: order.client,
        orders: [order],
        latestAt: order.createdAt,
        totalAmount: Number(order.total),
        itemCount,
        orderCount: 1,
        statusSummary: [order.status],
      });
      continue;
    }

    existing.orders.push(order);
    existing.orderCount += 1;
    existing.itemCount += itemCount;
    existing.totalAmount += Number(order.total);
    if (!existing.statusSummary.includes(order.status)) {
      existing.statusSummary.push(order.status);
    }
    if (new Date(order.createdAt) > new Date(existing.latestAt)) {
      existing.latestAt = order.createdAt;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime(),
  );
}
