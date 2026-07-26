import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/notifications.service';
import type { AppNotification } from '../types/notification';

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(
  null,
);

function getSocketUrl() {
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (apiUrl?.startsWith('http')) {
    return apiUrl.replace(/\/api\/?$/, '');
  }
  return undefined;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    try {
      const [items, unread] = await Promise.all([
        fetchNotifications(),
        fetchUnreadCount(),
      ]);
      setNotifications(items);
      setUnreadCount(unread.count);
    } catch {
      // keep previous state on transient errors
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated || !token) return;

    const socket: Socket = io(`${getSocketUrl() ?? ''}/notifications`, {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('notification', (notification: AppNotification) => {
      setNotifications((prev) => {
        if (prev.some((item) => item.notificationId === notification.notificationId)) {
          return prev;
        }
        return [notification, ...prev];
      });
      setUnreadCount((count) => count + (notification.isRead ? 0 : 1));
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthenticated, token]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const updated = await markNotificationRead(notificationId);
      setNotifications((prev) =>
        prev.map((item) =>
          item.notificationId === notificationId ? updated : item,
        ),
      );
      const unread = await fetchUnreadCount();
      setUnreadCount(unread.count);
    } catch {
      await refresh();
    }
  }, [refresh]);

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsRead();
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true })),
    );
    setUnreadCount(0);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      loading,
      refresh,
      markAsRead,
      markAllAsRead,
    }),
    [
      notifications,
      unreadCount,
      loading,
      refresh,
      markAsRead,
      markAllAsRead,
    ],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }
  return context;
}
