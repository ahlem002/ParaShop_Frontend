import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { ListToolbar } from '../../components/common/ListToolbar';
import { getCompanyOrders } from '../../services/orders.service';
import type { CompanyOrderView, OrderStatus } from '../../types/order';
import {
  ORDER_STATUS_FILTER_HELP,
  formatOrderPrice,
  groupOrdersByClient,
  statusBadgeClass,
  statusLabel,
} from './company-order-utils';

export function CompanyOrdersPage() {
  const [orders, setOrders] = useState<CompanyOrderView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getCompanyOrders();
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const groups = useMemo(() => {
    const query = search.trim().toLowerCase();

    const matchingOrders = orders.filter((order) => {
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }
      if (!query) return true;

      const clientName =
        `${order.client.firstName} ${order.client.lastName}`.toLowerCase();
      const itemNames = order.items
        .map((item) => item.productName.toLowerCase())
        .join(' ');

      return (
        clientName.includes(query) ||
        order.client.email.toLowerCase().includes(query) ||
        (order.shippingPhone ?? '').toLowerCase().includes(query) ||
        (order.client.phoneNumber ?? '').toLowerCase().includes(query) ||
        itemNames.includes(query)
      );
    });

    return groupOrdersByClient(matchingOrders);
  }, [orders, search, statusFilter]);

  if (loading) {
    return (
      <div className="admin-page">
        <h1 className="admin-page-title">Order Management</h1>
        <div className="admin-loading">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading">
        <div>
          <h1 className="admin-page-title">Order Management</h1>
          <p className="admin-page-subtitle">
            Clients who ordered from your company. Open a client to manage their
            items and status.
          </p>
        </div>
      </div>

      <div className="admin-page-card">
        {error && (
          <div className="admin-error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by client, product, or phone..."
          searchAriaLabel="Search clients with orders"
          selects={[
            {
              id: 'status',
              label: 'Filter by status',
              value: statusFilter,
              onChange: (value) =>
                setStatusFilter(value as 'ALL' | OrderStatus),
              options: ORDER_STATUS_FILTER_HELP.map((item) => ({
                value: item.value,
                label: item.label,
              })),
            },
          ]}
        />

        {orders.length === 0 ? (
          <div className="admin-empty">
            No orders yet. Paid customer checkouts will appear here.
          </div>
        ) : groups.length === 0 ? (
          <div className="admin-empty">
            No clients match your search or status filter.
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Last order</th>
                  <th>Client</th>
                  <th>Orders</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Statuses</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {groups.map((group) => (
                  <tr key={group.client.clientId}>
                    <td>{new Date(group.latestAt).toLocaleDateString()}</td>
                    <td>
                      <Link
                        to={`/company/orders/client/${group.client.clientId}`}
                        className="company-order-client-link"
                      >
                        {group.client.firstName} {group.client.lastName}
                      </Link>
                      <div className="admin-muted">{group.client.email}</div>
                    </td>
                    <td>{group.orderCount}</td>
                    <td>{group.itemCount}</td>
                    <td>{formatOrderPrice(group.totalAmount)}</td>
                    <td>
                      <div className="company-order-status-chips">
                        {group.statusSummary.map((status) => (
                          <span
                            key={status}
                            className={statusBadgeClass(status)}
                          >
                            {statusLabel(status)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <Link
                        to={`/company/orders/client/${group.client.clientId}`}
                        className="admin-btn-sm admin-btn-sm--primary"
                      >
                        View orders
                        <ChevronRight size={16} strokeWidth={2} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
