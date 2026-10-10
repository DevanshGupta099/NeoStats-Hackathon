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

export interface RealtimeEnvelope<T = unknown> {
  event: RealtimeEventType;
  projectId?: string;
  actorId: string;
  entityId: string;
  version?: number;
  timestamp: string;
  data: T;
}
