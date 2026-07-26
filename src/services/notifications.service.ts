import { authFetch } from '../config/api';
import type { AppNotification } from '../types/notification';

export function fetchNotifications() {
  return authFetch<AppNotification[]>('/notifications');
}

export function fetchUnreadCount() {
  return authFetch<{ count: number }>('/notifications/unread-count');
}

export function markNotificationRead(notificationId: string) {
  return authFetch<AppNotification>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export function markAllNotificationsRead() {
  return authFetch<{ success: boolean }>('/notifications/read-all', {
    method: 'PATCH',
  });
}
