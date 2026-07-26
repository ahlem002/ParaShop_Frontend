import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  Check,
  CheckCheck,
  Package,
  Settings2,
  XCircle,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationsContext';
import type {
  AppNotification,
  NotificationFilterTab,
  NotificationType,
} from '../types/notification';
import { formatNotificationTime } from '../utils/notification-time';
import { ListToolbar } from '../components/common/ListToolbar';
import '../styles/pages/notifications.css';
import '../styles/pages/admin.css';

const PREF_KEY = 'parashop-notification-prefs';

type PrefKey =
  | 'companies'
  | 'products'
  | 'promotions'
  | 'messages'
  | 'system';

const defaultPrefs: Record<PrefKey, boolean> = {
  companies: true,
  products: true,
  promotions: true,
  messages: true,
  system: true,
};

function loadPrefs(): Record<PrefKey, boolean> {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return defaultPrefs;
    return { ...defaultPrefs, ...JSON.parse(raw) };
  } catch {
    return defaultPrefs;
  }
}

function iconForType(type: NotificationType) {
  switch (type) {
    case 'COMPANY_PENDING':
      return Building2;
    case 'PRODUCT_PENDING':
      return Package;
    case 'PRODUCT_APPROVED':
      return Check;
    case 'PRODUCT_REJECTED':
      return XCircle;
    default:
      return Bell;
  }
}

function toneForType(type: NotificationType) {
  switch (type) {
    case 'COMPANY_PENDING':
      return 'purple';
    case 'PRODUCT_PENDING':
      return 'blue';
    case 'PRODUCT_APPROVED':
      return 'green';
    case 'PRODUCT_REJECTED':
      return 'yellow';
    default:
      return 'purple';
  }
}

function matchesTab(item: AppNotification, tab: NotificationFilterTab) {
  if (tab === 'all') return true;
  if (tab === 'unread') return !item.isRead;
  if (tab === 'companies') return item.type === 'COMPANY_PENDING';
  if (tab === 'products') {
    return (
      item.type === 'PRODUCT_PENDING' ||
      item.type === 'PRODUCT_APPROVED' ||
      item.type === 'PRODUCT_REJECTED'
    );
  }
  return false;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
    useNotifications();
  const [tab, setTab] = useState<NotificationFilterTab>('all');
  const [prefs, setPrefs] = useState(loadPrefs);
  const [search, setSearch] = useState('');

  const counts = useMemo(() => {
    const products = notifications.filter((n) =>
      matchesTab(n, 'products'),
    ).length;
    const companies = notifications.filter((n) =>
      matchesTab(n, 'companies'),
    ).length;
    return {
      all: notifications.length,
      unread: unreadCount,
      products,
      companies,
      system: 0,
    };
  }, [notifications, unreadCount]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((item) => {
      if (!matchesTab(item, tab)) return false;
      if (!query) return true;
      return (
        item.title.toLowerCase().includes(query) ||
        item.message.toLowerCase().includes(query)
      );
    });
  }, [notifications, tab, search]);

  function togglePref(key: PrefKey) {
    setPrefs((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem(PREF_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function handleOpen(item: AppNotification) {
    if (!item.isRead) {
      await markAsRead(item.notificationId);
    }
    if (item.link) {
      navigate(item.link);
    }
  }

  const tabs: { id: NotificationFilterTab; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'unread', label: 'Unread', count: counts.unread },
    { id: 'companies', label: 'Companies', count: counts.companies },
    { id: 'products', label: 'Products', count: counts.products },
    { id: 'system', label: 'System', count: counts.system },
  ];

  return (
    <div className="notifications-page">
      <div className="notifications-page__main">
        <div className="notifications-page__heading">
          <div>
            <h1>Notifications</h1>
            <p>Stay updated with everything happening on ParaShop+</p>
          </div>
          <div className="notifications-page__actions">
            <button
              type="button"
              className="notifications-page__btn"
              onClick={() => {
                void markAllAsRead();
              }}
              disabled={unreadCount === 0}
            >
              <CheckCheck size={16} strokeWidth={2} />
              Mark all as read
            </button>
          </div>
        </div>

        <ListToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search notifications..."
          searchAriaLabel="Search notifications"
        />

        <div className="notifications-tabs" role="tablist">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={`notifications-tabs__tab${tab === item.id ? ' active' : ''}`}
              onClick={() => setTab(item.id)}
            >
              {item.label}
              {typeof item.count === 'number' && item.count > 0 && (
                <span>({item.count})</span>
              )}
            </button>
          ))}
        </div>

        <div className="notifications-list">
          {loading && notifications.length === 0 ? (
            <div className="notifications-empty">Loading notifications…</div>
          ) : filtered.length === 0 ? (
            <div className="notifications-empty">
              <Bell size={28} strokeWidth={1.75} />
              <p>No notifications in this view yet.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = iconForType(item.type);
              return (
                <button
                  key={item.notificationId}
                  type="button"
                  className={`notification-card${!item.isRead ? ' unread' : ''}`}
                  onClick={() => {
                    void handleOpen(item);
                  }}
                >
                  <span
                    className={`notification-card__icon notification-card__icon--${toneForType(item.type)}`}
                  >
                    <Icon size={18} strokeWidth={2} />
                  </span>
                  <span className="notification-card__body">
                    <span className="notification-card__title">{item.title}</span>
                    <span className="notification-card__message">
                      {item.message}
                    </span>
                  </span>
                  <span className="notification-card__meta">
                    <span className="notification-card__time">
                      {formatNotificationTime(item.createdAt)}
                    </span>
                    {!item.isRead && (
                      <span className="notification-card__dot" aria-hidden />
                    )}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      <aside className="notifications-page__aside">
        <section className="notifications-prefs">
          <div className="notifications-prefs__head">
            <h2>Notification Preferences</h2>
            <Settings2 size={18} strokeWidth={2} />
          </div>
          <ul className="notifications-prefs__list">
            {(
              [
                {
                  key: 'companies' as const,
                  title: 'Companies',
                  desc: 'New company registrations',
                },
                {
                  key: 'products' as const,
                  title: 'Products',
                  desc: 'Product review updates',
                },
                {
                  key: 'promotions' as const,
                  title: 'Promotions',
                  desc: 'Special offers and deals',
                },
                {
                  key: 'messages' as const,
                  title: 'Messages',
                  desc: 'New chat messages',
                },
                {
                  key: 'system' as const,
                  title: 'System Updates',
                  desc: 'Account and security alerts',
                },
              ] as const
            ).map((row) => (
              <li key={row.key}>
                <div>
                  <p>{row.title}</p>
                  <span>{row.desc}</span>
                </div>
                <button
                  type="button"
                  className={`notifications-switch${prefs[row.key] ? ' on' : ''}`}
                  aria-pressed={prefs[row.key]}
                  onClick={() => togglePref(row.key)}
                >
                  <span />
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}
