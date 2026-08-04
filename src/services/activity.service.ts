import { authFetch } from '../config/api';
import type { ActivityLogEntry } from '../types/activity';

export type ActivitySort = 'newest' | 'oldest';

export function getMyActivity(limit = 100, sort: ActivitySort = 'newest') {
  return authFetch<ActivityLogEntry[]>(
    `/activity/mine?limit=${limit}&sort=${sort}`,
  );
}

export function deleteActivityEntry(activityId: string) {
  return authFetch<{ success: boolean }>(`/activity/mine/${activityId}`, {
    method: 'DELETE',
  });
}

export function clearMyActivity() {
  return authFetch<{ success: boolean; deleted: number }>('/activity/mine', {
    method: 'DELETE',
  });
}
