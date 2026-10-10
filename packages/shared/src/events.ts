export const RealtimeEvents = {
  TASK_CREATED: 'task.created',
  TASK_UPDATED: 'task.updated',
  TASK_STATUS_CHANGED: 'task.status_changed',
  TASK_ASSIGNED: 'task.assigned',
  TASK_DELETED: 'task.deleted',
  TASK_MOVED: 'task.moved',

  COMMENT_CREATED: 'comment.created',
  COMMENT_DELETED: 'comment.deleted',

  MEMBER_ADDED: 'member.added',
  MEMBER_REMOVED: 'member.removed',
  MEMBER_ROLE_CHANGED: 'member.role_changed',

  PROJECT_UPDATED: 'project.updated',
  PROJECT_ARCHIVED: 'project.archived',

  ACTIVITY_CREATED: 'activity.created',

  NOTIFICATION_CREATED: 'notification.created',
  NOTIFICATION_READ: 'notification.read',

  PRESENCE_UPDATE: 'presence.update',
  USER_DEACTIVATED: 'user.deactivated',
} as const;

export type RealtimeEventType = (typeof RealtimeEvents)[keyof typeof RealtimeEvents];

export const ClientRealtimeEvents = {
  PROJECT_JOIN: 'project.join',
  PROJECT_LEAVE: 'project.leave',
  PRESENCE_HEARTBEAT: 'presence.heartbeat',
} as const;

export type ClientRealtimeEventType = (typeof ClientRealtimeEvents)[keyof typeof ClientRealtimeEvents];

export interface RealtimeEnvelope<T = unknown> {
  event: RealtimeEventType;
  projectId?: string;
  actorId: string;
  entityId: string;
  version?: number;
  timestamp: string;
  data: T;
}

export interface PresenceUser {
  userId: string;
  name: string;
  handle: string;
  role: string;
  lastSeen: string;
}

export interface PresenceUpdatePayload {
  projectId: string;
  activeUsers: PresenceUser[];
}

export interface TaskMutationPayload {
  id: string;
  projectId: string;
  number?: number;
  title?: string;
  status?: string;
  version: number;
  assigneeId?: string | null;
  [key: string]: unknown;
}

export interface MemberMutationPayload {
  projectId: string;
  userId: string;
  projectRole?: string;
}

export interface NotificationPayload {
  id: string;
  userId: string;
  type: string;
  payload: Record<string, unknown>;
  readAt: string | null;
  createdAt: string;
}
