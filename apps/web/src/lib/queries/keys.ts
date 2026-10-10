export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    mine: () => [...queryKeys.tasks.all, 'mine'] as const,
    project: (projectId: string, filters?: Record<string, any>) =>
      [...queryKeys.tasks.all, 'project', projectId, filters ?? {}] as const,
    detail: (taskId: string) => [...queryKeys.tasks.all, 'detail', taskId] as const,
  },
  projects: {
    all: ['projects'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.projects.all, 'list', filters ?? {}] as const,
    detail: (id: string) => [...queryKeys.projects.all, 'detail', id] as const,
    stats: (id: string) => [...queryKeys.projects.all, 'stats', id] as const,
    members: (id: string) => [...queryKeys.projects.all, 'members', id] as const,
    activity: (id: string, filters?: Record<string, any>) =>
      [...queryKeys.projects.all, 'activity', id, filters ?? {}] as const,
  },
  comments: {
    all: ['comments'] as const,
    task: (taskId: string) => [...queryKeys.comments.all, 'task', taskId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (unreadOnly?: boolean) =>
      [...queryKeys.notifications.all, 'list', { unreadOnly }] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
  activity: {
    all: ['activity'] as const,
    system: (filters?: Record<string, any>) =>
      [...queryKeys.activity.all, 'system', filters ?? {}] as const,
  },
};
