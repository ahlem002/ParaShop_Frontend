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
      return 'admin-badge admin-badge--rejected';
    default:
      return 'admin-badge';
  }
}

export function nextActionLabel(status: CompanyOrderNextStatus) {
  switch (status) {
    case 'PROCESSING':
      return 'Mark processing';
    case 'SHIPPED':
      return 'Mark shipped';
    case 'DELIVERED':
      return 'Mark delivered';
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
      'You are preparing the order. Next step is Mark shipped when it leaves.',
  },
  {
    value: 'SHIPPED',
    label: 'Shipped',
    description:
      'Order is on the way. Next step is Mark delivered when the client receives it.',
  },
  {
    value: 'DELIVERED',
    label: 'Delivered',
    description: 'Order completed successfully. No further action needed.',
  },
  {
    value: 'PENDING_PAYMENT',
    label: 'Pending payment',
    description:
      'Checkout started but Flouci payment is not confirmed yet. Wait for payment.',
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
