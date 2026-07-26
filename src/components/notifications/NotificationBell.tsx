import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationsContext';
import { formatNotificationTime } from '../../utils/notification-time';

function notificationsPathForRole(role: string | undefined) {
  if (role === 'ADMIN') return '/admin/notifications';
  if (role === 'COMPANY') return '/company/notifications';
  return '/notifications';
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const path = notificationsPathForRole(user?.role);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  if (!isAuthenticated || !user) return null;

  const preview = notifications.slice(0, 4);

  return (
    <div className="notification-bell" ref={rootRef}>
      <button
        type="button"
        className="notification-bell__trigger"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Bell size={20} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="notification-bell__badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-bell__dropdown">
          <div className="notification-bell__dropdown-head">
            <p>Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                className="notification-bell__text-btn"
                onClick={() => {
                  void markAllAsRead();
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {preview.length === 0 ? (
            <p className="notification-bell__empty">No notifications yet</p>
          ) : (
            <ul className="notification-bell__list">
              {preview.map((item) => (
                <li key={item.notificationId}>
                  <button
                    type="button"
                    className={`notification-bell__item${!item.isRead ? ' unread' : ''}`}
                    onClick={() => {
                      if (!item.isRead) {
                        void markAsRead(item.notificationId);
                      }
                      setOpen(false);
                      navigate(item.link || path);
                    }}
                  >
                    <span className="notification-bell__item-title">
                      {item.title}
                    </span>
                    <span className="notification-bell__item-meta">
                      {formatNotificationTime(item.createdAt)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Link
            to={path}
            className="notification-bell__view-all"
            onClick={() => setOpen(false)}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
