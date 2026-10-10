'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  useNotifications,
  useMarkNotificationRead,
  NotificationItem,
} from '@/lib/queries/use-notifications';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queries/keys';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { HeatSkeleton } from '@/components/ui/heat-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Bell,
  CheckCheck,
  Check,
  Clock,
  Sparkles,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

export default function AlertsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useNotifications(unreadOnly);
  const markRead = useMarkNotificationRead();

  const items = data?.items || [];
  const unreadCount = items.filter((n) => !n.readAt).length;

  const handleMarkAllRead = async () => {
    try {
      await apiClient.post('/notifications/read-all');
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
      toast.success('ALL TRANSMISSIONS MARKED AS READ');
    } catch {
      toast.error('FAILED TO MARK READ');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="hud-panel p-5 sm:p-7 hud-corner-brackets bg-basalt/85 border-steel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-ice mb-1">
              <Bell className="w-4 h-4 animate-pulse" />
              <span className="font-mono text-xs font-semibold tracking-wider uppercase">
                SYSTEM ALERTS & NOTIFICATIONS
              </span>
            </div>
            <h1 className="font-hud uppercase tracking-wide text-2xl sm:text-3xl font-black text-bone">
              NOTIFICATIONS INBOX
            </h1>
            <p className="font-body text-xs sm:text-sm text-ash mt-1">
              Real-time inbox for task assignments, @mentions, and system status updates.
            </p>
          </div>

          <div className="flex items-center space-x-2 flex-wrap">
            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`px-3 py-1.5 text-xs font-mono uppercase rounded border transition-colors min-h-[36px] flex items-center space-x-1.5 ${
                unreadOnly
                  ? 'bg-plasma text-void font-bold border-plasma'
                  : 'bg-void border-steel text-ash hover:text-bone'
              }`}
            >
              <Filter className="w-3 h-3" />
              <span>UNREAD ONLY</span>
            </button>

            <Button
              variant="outline"
              size="sm"
              disabled={unreadCount === 0}
              onClick={handleMarkAllRead}
              className="min-h-[36px]"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1 text-plasma" />
              MARK ALL READ
            </Button>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="space-y-3">
          <HeatSkeleton className="h-16 w-full" />
          <HeatSkeleton className="h-16 w-full" />
          <HeatSkeleton className="h-16 w-full" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="INBOX DISPATCHES CLEARED"
          description={
            unreadOnly
              ? 'No unread notifications pending in your telemetry queue.'
              : 'You have no notifications logged.'
          }
        />
      ) : (
        <div className="hud-panel bg-basalt border-steel rounded divide-y divide-steel/50 overflow-hidden">
          {items.map((notif) => {
            const isUnread = !notif.readAt;

            return (
              <div
                key={notif.id}
                className={`p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isUnread
                    ? 'bg-plasma/5 hover:bg-plasma/10 border-l-4 border-l-plasma'
                    : 'hover:bg-graphite/40'
                }`}
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      isUnread ? 'bg-plasma animate-ping' : 'bg-steel'
                    }`}
                  />

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className="font-hud uppercase tracking-wider text-xs font-bold text-bone">
                        {notif.title}
                      </span>
                      <span className="font-mono text-[9px] text-ash bg-steel/30 px-1 py-0.5 rounded">
                        {notif.type}
                      </span>
                      {isUnread && (
                        <span className="font-mono text-[9px] text-plasma font-bold">
                          NEW
                        </span>
                      )}
                    </div>

                    <p className="font-body text-xs text-ash">{notif.body}</p>

                    {notif.actor && (
                      <span className="font-mono text-[10px] text-ash/70 block">
                        Triggered by @{notif.actor.handle} ({notif.actor.name})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-center flex-shrink-0">
                  <div className="flex items-center space-x-1 text-ash/60 text-[10px] font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>

                  {isUnread && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => markRead.mutate(notif.id)}
                      className="h-8 px-2 text-[10px]"
                      title="Mark as read"
                    >
                      <Check className="w-3 h-3 text-plasma" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
