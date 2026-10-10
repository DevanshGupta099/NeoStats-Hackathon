'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, connectSocket, disconnectSocket } from './socket-client';
import { useAuth } from '../auth-context';
import { queryKeys } from '../queries/keys';
import { useRecentEventsStore } from '../stores/recent-events-store';
import {
  RealtimeEvents,
  ClientRealtimeEvents,
  RealtimeEnvelope,
  PresenceUser,
  PresenceUpdatePayload,
  TaskMutationPayload,
  MemberMutationPayload,
  NotificationPayload,
} from '@forgeline/shared';
import { toast } from 'sonner';

export type SocketStatus = 'live' | 'reconnecting' | 'offline';

interface SocketContextType {
  status: SocketStatus;
  activeProjectId: string | null;
  presenceUsers: PresenceUser[];
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const router = useRouter();

  const [status, setStatus] = useState<SocketStatus>('offline');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceUser[]>>({});

  const addEvent = useRecentEventsStore((s) => s.addEvent);

  // Extract projectId from pathname e.g. /projects/[id]
  const projectMatch = pathname.match(/\/projects\/([^/]+)/);
  const currentRouteProjectId =
    projectMatch && projectMatch[1] !== 'new' ? projectMatch[1] : null;

  // Track latest active project ID ref for socket callbacks
  const activeProjectIdRef = useRef<string | null>(null);
  activeProjectIdRef.current = activeProjectId;

  // 1. Connection lifecycle
  useEffect(() => {
    if (!user) {
      disconnectSocket();
      setStatus('offline');
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('forgeline_token') : null;
    const socket = connectSocket(token);

    const onConnect = () => {
      setStatus('live');
      // If we already have an active project route, join immediately
      if (activeProjectIdRef.current) {
        socket.emit(ClientRealtimeEvents.PROJECT_JOIN, {
          projectId: activeProjectIdRef.current,
        });
      }
    };

    const onDisconnect = () => {
      setStatus('offline');
    };

    const onReconnectAttempt = () => {
      setStatus('reconnecting');
    };

    const onReconnect = () => {
      setStatus('live');
      // Invalidate active queries on reconnect to sync missed states
      queryClient.invalidateQueries();
      if (activeProjectIdRef.current) {
        socket.emit(ClientRealtimeEvents.PROJECT_JOIN, {
          projectId: activeProjectIdRef.current,
        });
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnectAttempt);
    socket.io.on('reconnect', onReconnect);

    if (socket.connected) {
      setStatus('live');
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnectAttempt);
      socket.io.off('reconnect', onReconnect);
    };
  }, [user, queryClient]);

  // 2. Room Navigation & Presence Heartbeat
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !socket.connected || !user) return;

    if (currentRouteProjectId && currentRouteProjectId !== activeProjectId) {
      // Leave old room if any
      if (activeProjectId) {
        socket.emit(ClientRealtimeEvents.PROJECT_LEAVE, {
          projectId: activeProjectId,
        });
      }
      // Join new room
      socket.emit(ClientRealtimeEvents.PROJECT_JOIN, {
        projectId: currentRouteProjectId,
      });
      setActiveProjectId(currentRouteProjectId);
    } else if (!currentRouteProjectId && activeProjectId) {
      // Leaving project routes
      socket.emit(ClientRealtimeEvents.PROJECT_LEAVE, {
        projectId: activeProjectId,
      });
      setActiveProjectId(null);
    }
  }, [currentRouteProjectId, activeProjectId, user]);

  // Periodic presence heartbeat while inside project route
  useEffect(() => {
    if (!activeProjectId || !user) return;

    const interval = setInterval(() => {
      const socket = getSocket();
      if (socket && socket.connected) {
        socket.emit(ClientRealtimeEvents.PRESENCE_HEARTBEAT, {
          projectId: activeProjectId,
        });
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [activeProjectId, user]);

  // 3. Centralized Realtime Event Listeners
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !socket.on) return;

    // A. Presence Update
    const handlePresenceUpdate = (payload: PresenceUpdatePayload) => {
      if (payload && payload.projectId) {
        setPresenceMap((prev) => ({
          ...prev,
          [payload.projectId]: payload.activeUsers,
        }));
      }
    };

    // B. Account Deactivation
    const handleUserDeactivated = (envelope: RealtimeEnvelope<{ userId: string }>) => {
      const targetUserId = envelope.data?.userId || envelope.entityId;
      if (user && targetUserId === user.id) {
        toast.error('SESSION TERMINATED', {
          description: 'Your user account was deactivated by an administrator.',
        });
        logout();
        router.replace('/login');
      }
    };

    // C. Member Removal (Eviction)
    const handleMemberRemoved = (envelope: RealtimeEnvelope<MemberMutationPayload>) => {
      const targetUserId = envelope.data?.userId;
      const targetProjectId = envelope.projectId || envelope.data?.projectId;

      // Update members cache
      if (targetProjectId) {
        queryClient.setQueryData(
          queryKeys.projects.members(targetProjectId),
          (old: any[] | undefined) =>
            old ? old.filter((m) => m.userId !== targetUserId) : [],
        );
      }

      // If current user is removed, kick them out
      if (user && targetUserId === user.id && targetProjectId === activeProjectIdRef.current) {
        toast.warning('MEMBERSHIP REVOKED', {
          description: 'You were removed from this project roster.',
        });
        router.replace('/projects');
      }
    };

    // D. Member Role Changed / Added
    const handleMemberRoleChanged = (envelope: RealtimeEnvelope<any>) => {
      if (envelope.projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.members(envelope.projectId),
        });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
    };

    const handleMemberAdded = (envelope: RealtimeEnvelope<any>) => {
      if (envelope.projectId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.members(envelope.projectId),
        });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
      }
    };

    // E. Task Created
    const handleTaskCreated = (envelope: RealtimeEnvelope<any>) => {
      const task = envelope.data;
      const pId = envelope.projectId || task?.projectId;
      if (!task || !pId) return;

      queryClient.setQueryData(
        queryKeys.tasks.project(pId),
        (old: { items: any[]; totalCount: number; nextCursor: string | null } | undefined) => {
          if (!old) return old;
          if (old.items.some((t) => t.id === task.id)) return old;
          return {
            ...old,
            items: [task, ...old.items],
            totalCount: old.totalCount + 1,
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats(pId) });

      if (envelope.actorId !== user?.id) {
        addEvent(task.id, 'task.created', envelope.actorId);
      }
    };

    // F. Task Updated / Status Changed / Assigned / Moved
    const handleTaskUpdated = (envelope: RealtimeEnvelope<any>) => {
      const updated = envelope.data;
      const taskId = envelope.entityId;
      const pId = envelope.projectId || updated?.projectId;

      if (!updated || !taskId) return;

      // Check version cache: ignore if incoming version is older than cached
      const cachedTask = queryClient.getQueryData<any>(queryKeys.tasks.detail(taskId));
      if (
        cachedTask &&
        envelope.version !== undefined &&
        envelope.version <= cachedTask.version
      ) {
        return; // Ignore stale event
      }

      // Update detail query cache
      queryClient.setQueryData(queryKeys.tasks.detail(taskId), (old: any) =>
        old ? { ...old, ...updated } : updated,
      );

      // Update project tasks list query cache
      if (pId) {
        queryClient.setQueryData(
          queryKeys.tasks.project(pId),
          (old: { items: any[]; totalCount: number; nextCursor: string | null } | undefined) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.map((item) =>
                item.id === taskId ? { ...item, ...updated } : item,
              ),
            };
          },
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats(pId) });
      }

      // If assigned to current user, invalidate my tasks
      if (updated.assigneeId === user?.id || cachedTask?.assigneeId === user?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.mine() });
      }

      // Trigger visual flourish and haptics if change came from remote peer
      if (envelope.actorId !== user?.id) {
        addEvent(taskId, envelope.event, envelope.actorId);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(15);
          } catch {}
        }
      }
    };

    // G. Task Deleted
    const handleTaskDeleted = (envelope: RealtimeEnvelope<any>) => {
      const taskId = envelope.entityId;
      const pId = envelope.projectId;

      if (pId) {
        queryClient.setQueryData(
          queryKeys.tasks.project(pId),
          (old: { items: any[]; totalCount: number; nextCursor: string | null } | undefined) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.filter((t) => t.id !== taskId),
              totalCount: Math.max(0, old.totalCount - 1),
            };
          },
        );
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats(pId) });
      }

      queryClient.removeQueries({ queryKey: queryKeys.tasks.detail(taskId) });
    };

    // H. Comment Created / Deleted
    const handleCommentCreated = (envelope: RealtimeEnvelope<any>) => {
      const comment = envelope.data;
      const taskId = comment?.taskId || envelope.entityId;
      if (!comment || !taskId) return;

      queryClient.setQueryData(
        queryKeys.comments.task(taskId),
        (old: any[] | undefined) => {
          if (!old) return [comment];
          if (old.some((c) => c.id === comment.id)) return old;
          return [...old, comment];
        },
      );

      // Increment comment count on task
      if (envelope.projectId) {
        queryClient.setQueryData(
          queryKeys.tasks.project(envelope.projectId),
          (old: any) => {
            if (!old) return old;
            return {
              ...old,
              items: old.items.map((t: any) =>
                t.id === taskId ? { ...t, commentCount: (t.commentCount || 0) + 1 } : t,
              ),
            };
          },
        );
      }

      if (envelope.actorId !== user?.id) {
        toast.info('NEW TRANSMISSION', {
          description: `@${comment.author?.handle || 'User'} commented on task #${taskId.slice(0, 6)}`,
        });
      }
    };

    const handleCommentDeleted = (envelope: RealtimeEnvelope<any>) => {
      const commentId = envelope.entityId;
      const taskId = envelope.data?.taskId;
      if (taskId && commentId) {
        queryClient.setQueryData(
          queryKeys.comments.task(taskId),
          (old: any[] | undefined) =>
            old ? old.filter((c) => c.id !== commentId) : [],
        );
      }
    };

    // I. Notifications
    const handleNotificationCreated = (envelope: RealtimeEnvelope<any>) => {
      const notif = envelope.data;
      if (!notif) return;

      queryClient.setQueryData(
        queryKeys.notifications.list(false),
        (old: any) => {
          if (!old) return { items: [notif], totalCount: 1, nextCursor: null };
          return {
            ...old,
            items: [notif, ...old.items],
            totalCount: old.totalCount + 1,
          };
        },
      );

      queryClient.setQueryData(
        queryKeys.notifications.unreadCount(),
        (old: { count: number } | undefined) => ({
          count: (old?.count || 0) + 1,
        }),
      );

      toast.info(notif.title || 'NEW SYSTEM NOTIFICATION', {
        description: notif.body,
      });

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([20, 50, 20]);
        } catch {}
      }
    };

    const handleNotificationRead = (envelope: RealtimeEnvelope<any>) => {
      const notifId = envelope.entityId;
      queryClient.setQueryData(
        queryKeys.notifications.list(false),
        (old: any) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((n: any) =>
              n.id === notifId ? { ...n, readAt: new Date().toISOString() } : n,
            ),
          };
        },
      );
      queryClient.setQueryData(
        queryKeys.notifications.unreadCount(),
        (old: { count: number } | undefined) => ({
          count: Math.max(0, (old?.count || 1) - 1),
        }),
      );
    };

    // J. Project updates
    const handleProjectUpdated = (envelope: RealtimeEnvelope<any>) => {
      const proj = envelope.data;
      if (proj && proj.id) {
        queryClient.setQueryData(queryKeys.projects.detail(proj.id), proj);
      }
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    };

    // K. Activity created
    const handleActivityCreated = (envelope: RealtimeEnvelope<any>) => {
      const act = envelope.data;
      if (envelope.projectId && act) {
        queryClient.setQueryData(
          queryKeys.projects.activity(envelope.projectId),
          (old: any) => {
            if (!old) return { items: [act], nextCursor: null };
            return { ...old, items: [act, ...old.items] };
          },
        );
      }
    };

    // Attach all socket listeners
    socket.on(RealtimeEvents.PRESENCE_UPDATE, handlePresenceUpdate);
    socket.on(RealtimeEvents.USER_DEACTIVATED, handleUserDeactivated);
    socket.on(RealtimeEvents.MEMBER_REMOVED, handleMemberRemoved);
    socket.on(RealtimeEvents.MEMBER_ROLE_CHANGED, handleMemberRoleChanged);
    socket.on(RealtimeEvents.MEMBER_ADDED, handleMemberAdded);

    socket.on(RealtimeEvents.TASK_CREATED, handleTaskCreated);
    socket.on(RealtimeEvents.TASK_UPDATED, handleTaskUpdated);
    socket.on(RealtimeEvents.TASK_STATUS_CHANGED, handleTaskUpdated);
    socket.on(RealtimeEvents.TASK_ASSIGNED, handleTaskUpdated);
    socket.on(RealtimeEvents.TASK_MOVED, handleTaskUpdated);
    socket.on(RealtimeEvents.TASK_DELETED, handleTaskDeleted);

    socket.on(RealtimeEvents.COMMENT_CREATED, handleCommentCreated);
    socket.on(RealtimeEvents.COMMENT_DELETED, handleCommentDeleted);

    socket.on(RealtimeEvents.NOTIFICATION_CREATED, handleNotificationCreated);
    socket.on(RealtimeEvents.NOTIFICATION_READ, handleNotificationRead);

    socket.on(RealtimeEvents.PROJECT_UPDATED, handleProjectUpdated);
    socket.on(RealtimeEvents.PROJECT_ARCHIVED, handleProjectUpdated);
    socket.on(RealtimeEvents.ACTIVITY_CREATED, handleActivityCreated);

    return () => {
      socket.off(RealtimeEvents.PRESENCE_UPDATE, handlePresenceUpdate);
      socket.off(RealtimeEvents.USER_DEACTIVATED, handleUserDeactivated);
      socket.off(RealtimeEvents.MEMBER_REMOVED, handleMemberRemoved);
      socket.off(RealtimeEvents.MEMBER_ROLE_CHANGED, handleMemberRoleChanged);
      socket.off(RealtimeEvents.MEMBER_ADDED, handleMemberAdded);

      socket.off(RealtimeEvents.TASK_CREATED, handleTaskCreated);
      socket.off(RealtimeEvents.TASK_UPDATED, handleTaskUpdated);
      socket.off(RealtimeEvents.TASK_STATUS_CHANGED, handleTaskUpdated);
      socket.off(RealtimeEvents.TASK_ASSIGNED, handleTaskUpdated);
      socket.off(RealtimeEvents.TASK_MOVED, handleTaskUpdated);
      socket.off(RealtimeEvents.TASK_DELETED, handleTaskDeleted);

      socket.off(RealtimeEvents.COMMENT_CREATED, handleCommentCreated);
      socket.off(RealtimeEvents.COMMENT_DELETED, handleCommentDeleted);

      socket.off(RealtimeEvents.NOTIFICATION_CREATED, handleNotificationCreated);
      socket.off(RealtimeEvents.NOTIFICATION_READ, handleNotificationRead);

      socket.off(RealtimeEvents.PROJECT_UPDATED, handleProjectUpdated);
      socket.off(RealtimeEvents.PROJECT_ARCHIVED, handleProjectUpdated);
      socket.off(RealtimeEvents.ACTIVITY_CREATED, handleActivityCreated);
    };
  }, [user, queryClient, router, logout, addEvent]);

  const joinProject = useCallback((projectId: string) => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit(ClientRealtimeEvents.PROJECT_JOIN, { projectId });
      setActiveProjectId(projectId);
    }
  }, []);

  const leaveProject = useCallback((projectId: string) => {
    const socket = getSocket();
    if (socket && socket.connected) {
      socket.emit(ClientRealtimeEvents.PROJECT_LEAVE, { projectId });
      setActiveProjectId(null);
    }
  }, []);

  const currentPresence = activeProjectId ? presenceMap[activeProjectId] || [] : [];

  return (
    <SocketContext.Provider
      value={{
        status,
        activeProjectId,
        presenceUsers: currentPresence,
        joinProject,
        leaveProject,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
