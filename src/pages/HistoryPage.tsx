import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp,
  History,
  KeyRound,
  LogIn,
  Package,
  ShoppingBag,
  ShoppingCart,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserRound,
  CreditCard,
  XCircle,
} from 'lucide-react';
import { PublicShell } from '../components/layout/PublicShell';
import { useConfirm } from '../context/ConfirmContext';
import {
  clearMyActivity,
  deleteActivityEntry,
  getMyActivity,
  type ActivitySort,
} from '../services/activity.service';
import type { ActivityLogEntry, ActivityType } from '../types/activity';
import { formatNotificationTime } from '../utils/notification-time';
import '../styles/pages/history.css';
import '../styles/pages/cart.css';

type FilterTab = 'all' | 'account' | 'cart' | 'orders';

function categoryFor(type: ActivityType): Exclude<FilterTab, 'all'> {
  if (
    type === 'PROFILE_UPDATED' ||
    type === 'PASSWORD_CHANGED' ||
    type === 'TWO_FACTOR_ENABLED' ||
    type === 'TWO_FACTOR_DISABLED' ||
    type === 'LOGIN'
  ) {
    return 'account';
  }
  if (
    type === 'CHECKOUT_STARTED' ||
    type === 'PAYMENT_SUCCEEDED' ||
    type === 'PAYMENT_FAILED' ||
    type === 'ORDER_CANCELLED'
  ) {
    return 'orders';
  }
  return 'cart';
}

function iconFor(type: ActivityType) {
  switch (type) {
    case 'PROFILE_UPDATED':
      return UserRound;
    case 'PASSWORD_CHANGED':
      return KeyRound;
    case 'TWO_FACTOR_ENABLED':
      return ShieldCheck;
    case 'TWO_FACTOR_DISABLED':
      return ShieldOff;
    case 'LOGIN':
      return LogIn;
    case 'CART_ITEM_ADDED':
      return ShoppingCart;
    case 'CART_ITEM_UPDATED':
      return Package;
    case 'CART_ITEM_REMOVED':
    case 'CART_CLEARED':
    case 'CART_COMPANY_CLEARED':
      return Trash2;
    case 'CHECKOUT_STARTED':
      return ShoppingBag;
    case 'PAYMENT_SUCCEEDED':
      return CreditCard;
    case 'PAYMENT_FAILED':
    case 'ORDER_CANCELLED':
      return XCircle;
    default:
      return History;
  }
}

function toneFor(type: ActivityType) {
  switch (type) {
    case 'PAYMENT_SUCCEEDED':
    case 'TWO_FACTOR_ENABLED':
      return 'green';
    case 'PAYMENT_FAILED':
    case 'CART_ITEM_REMOVED':
    case 'CART_CLEARED':
    case 'TWO_FACTOR_DISABLED':
    case 'ORDER_CANCELLED':
      return 'red';
    case 'CHECKOUT_STARTED':
    case 'CART_ITEM_ADDED':
      return 'blue';
    case 'LOGIN':
    case 'PROFILE_UPDATED':
    case 'PASSWORD_CHANGED':
      return 'purple';
    default:
      return 'neutral';
  }
}

export function HistoryPage() {
  const { confirm } = useConfirm();
  const [entries, setEntries] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<ActivitySort>('newest');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyActivity(150, sort);
      setEntries(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not load activity history',
      );
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    return {
      all: entries.length,
      account: entries.filter((e) => categoryFor(e.type) === 'account').length,
      cart: entries.filter((e) => categoryFor(e.type) === 'cart').length,
      orders: entries.filter((e) => categoryFor(e.type) === 'orders').length,
    };
  }, [entries]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = entries.filter((entry) => {
      if (tab !== 'all' && categoryFor(entry.type) !== tab) return false;
      if (!query) return true;
      return (
        entry.title.toLowerCase().includes(query) ||
        entry.message.toLowerCase().includes(query)
      );
    });

    return [...list].sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sort === 'oldest' ? ta - tb : tb - ta;
    });
  }, [entries, tab, search, sort]);

  const grouped = useMemo(() => {
    const groups = new Map<string, ActivityLogEntry[]>();

    for (const entry of filtered) {
      const date = new Date(entry.createdAt);
      const key = Number.isNaN(date.getTime())
        ? 'Unknown'
        : date.toLocaleDateString([], {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

      const list = groups.get(key) ?? [];
      list.push(entry);
      groups.set(key, list);
    }

    return Array.from(groups.entries());
  }, [filtered]);

  async function handleDeleteOne(entry: ActivityLogEntry) {
    const ok = await confirm({
      title: 'Delete this activity?',
      message: `"${entry.title}" will be removed from your history.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!ok) return;

    setBusyId(entry.activityId);
    setError('');
    try {
      await deleteActivityEntry(entry.activityId);
      setEntries((prev) =>
        prev.filter((item) => item.activityId !== entry.activityId),
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete activity',
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleClearAll() {
    if (entries.length === 0) return;

    const ok = await confirm({
      title: 'Clear all history?',
      message: `This will permanently delete all ${entries.length} activity entries. This cannot be undone.`,
      confirmLabel: 'Clear all',
      cancelLabel: 'Cancel',
      danger: true,
    });
    if (!ok) return;

    setClearing(true);
    setError('');
    try {
      await clearMyActivity();
      setEntries([]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not clear history',
      );
    } finally {
      setClearing(false);
    }
  }

  return (
    <PublicShell>
      <main className="container home-container history-page">
        <div className="history-page__header">
          <div>
            <h1>Activity history</h1>
            <p>
              Traceability log of profile changes, cart actions, and purchases.
            </p>
          </div>
          {entries.length > 0 && (
            <button
              type="button"
              className="btn btn-secondary history-page__clear"
              onClick={() => void handleClearAll()}
              disabled={clearing || loading}
            >
              <Trash2 size={16} strokeWidth={2} />
              {clearing ? 'Clearing…' : 'Clear all'}
            </button>
          )}
        </div>

        <div className="history-toolbar">
          <div className="history-tabs" role="tablist" aria-label="Filter history">
            {(
              [
                ['all', 'All'],
                ['account', 'Account'],
                ['cart', 'Cart'],
                ['orders', 'Orders'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                className={
                  tab === id
                    ? 'history-tabs__tab history-tabs__tab--active'
                    : 'history-tabs__tab'
                }
                onClick={() => setTab(id)}
              >
                {label}
                <span className="history-tabs__count">{counts[id]}</span>
              </button>
            ))}
          </div>

          <div className="history-toolbar__controls">
            <label className="history-sort">
              <ArrowDownUp size={15} strokeWidth={2} aria-hidden />
              <span className="history-sort__label">Time</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as ActivitySort)}
                aria-label="Sort by time"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
              </select>
            </label>
            <input
              type="search"
              className="history-search"
              placeholder="Search activity…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search activity"
            />
          </div>
        </div>

        {error && <div className="cart-page__error">{error}</div>}
        {loading && <p className="history-page__status">Loading history…</p>}

        {!loading && filtered.length === 0 && (
          <div className="history-empty">
            <History size={28} strokeWidth={1.75} />
            <h2>No activity yet</h2>
            <p>
              When you update your profile, manage your cart, or complete a
              purchase, it will show up here.
            </p>
          </div>
        )}

        <div className="history-timeline">
          {grouped.map(([day, dayEntries]) => (
            <section key={day} className="history-day">
              <h2 className="history-day__label">{day}</h2>
              <ul className="history-day__list">
                {dayEntries.map((entry) => {
                  const Icon = iconFor(entry.type);
                  const tone = toneFor(entry.type);
                  const deleting = busyId === entry.activityId;
                  return (
                    <li key={entry.activityId} className="history-item">
                      <span
                        className={`history-item__icon history-item__icon--${tone}`}
                        aria-hidden
                      >
                        <Icon size={18} strokeWidth={1.85} />
                      </span>
                      <div className="history-item__body">
                        <div className="history-item__top">
                          <strong>{entry.title}</strong>
                          <time dateTime={entry.createdAt}>
                            {formatNotificationTime(entry.createdAt)}
                          </time>
                        </div>
                        <p>{entry.message}</p>
                      </div>
                      <button
                        type="button"
                        className="history-item__delete"
                        onClick={() => void handleDeleteOne(entry)}
                        disabled={deleting || clearing}
                        aria-label={`Delete ${entry.title}`}
                        title="Delete"
                      >
                        <Trash2 size={16} strokeWidth={2} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </PublicShell>
  );
}
