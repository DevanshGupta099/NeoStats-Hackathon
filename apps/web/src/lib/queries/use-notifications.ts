'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { queryKeys } from './keys';

export interface NotificationItem {
  id: string;
  userId: string;
  actorId: string | null;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, any>;
  readAt: string | null;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    handle: string;
    avatarSeed?: string | null;
  };
}

export function useNotifications(unreadOnly = false) {
  return useQuery({
    queryKey: queryKeys.notifications.list(unreadOnly),
    queryFn: () =>
      apiClient.get<{ items: NotificationItem[]; nextCursor: string | null; totalCount: number }>(
        `/notifications${unreadOnly ? '?unread=true' : ''}`,
      ),
  });
}

export function useUnreadNotificationCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => apiClient.get<{ count: number }>('/notifications/unread-count'),
    refetchInterval: 15000, // Background poll every 15s as fallback
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/notifications/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
  });
}
