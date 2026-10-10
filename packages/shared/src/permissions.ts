import { GlobalRole, ProjectRole } from './enums';

export const Permissions = {
  USER_MANAGE: 'user:manage',
  PROJECT_CREATE: 'project:create',
  PROJECT_ARCHIVE: 'project:archive',
  PROJECT_ASSIGN_MANAGER: 'project:assign_manager',
  PROJECT_VIEW_ALL: 'project:view_all',
  PROJECT_UPDATE: 'project:update',
  PROJECT_MANAGE_MEMBERS: 'project:manage_members',
  PROJECT_VIEW: 'project:view',
  TASK_CREATE: 'task:create',
  TASK_DELETE: 'task:delete',
  TASK_ASSIGN: 'task:assign',
  TASK_UPDATE: 'task:update',
  TASK_STATUS_CHANGE: 'task:status_change',
  COMMENT_CREATE: 'comment:create',
  COMMENT_DELETE: 'comment:delete',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export interface PolicyContext {
  user: {
    id: string;
    globalRole: GlobalRole;
    isActive: boolean;
  };
  projectMember?: {
    userId: string;
    projectId: string;
    projectRole: ProjectRole;
  } | null;
  resource?: {
    projectId?: string;
    assigneeId?: string | null;
    authorId?: string | null;
  } | null;
}

/**
 * Pure policy evaluation engine.
 * The server is the authority; this function is shared for UI conditional rendering.
 */
export function hasPermission(action: Permission, context: PolicyContext): boolean {
  const { user, projectMember, resource } = context;

  // Inactive / deactivated users have zero permissions
  if (!user.isActive) {
    return false;
  }

  // ADMIN has full system capabilities
  if (user.globalRole === GlobalRole.ADMIN) {
    return true;
  }

  // Actions strictly reserved for Global ADMIN
  if (
    action === Permissions.USER_MANAGE ||
    action === Permissions.PROJECT_CREATE ||
    action === Permissions.PROJECT_ARCHIVE ||
    action === Permissions.PROJECT_ASSIGN_MANAGER ||
    action === Permissions.PROJECT_VIEW_ALL
  ) {
    return false;
  }

  // Must be a member of the project for project-scoped actions
  if (!projectMember) {
    return false;
  }

  // Rule of Cap: global role caps project role
  // If global role is VIEWER, read-only always
  if (user.globalRole === GlobalRole.VIEWER || projectMember.projectRole === ProjectRole.VIEWER) {
    return action === Permissions.PROJECT_VIEW;
  }

  // Project Manager permissions (must be global PM AND project MANAGER)
  const isEffectiveManager =
    user.globalRole === GlobalRole.PROJECT_MANAGER &&
    projectMember.projectRole === ProjectRole.MANAGER;

  if (isEffectiveManager) {
    return true; // Has all project-level manager capabilities
  }

  // Team Member permissions
  if (projectMember.projectRole === ProjectRole.MEMBER || user.globalRole === GlobalRole.TEAM_MEMBER) {
    switch (action) {
      case Permissions.PROJECT_VIEW:
        return true;
      case Permissions.COMMENT_CREATE:
        return true;
      case Permissions.COMMENT_DELETE:
        return resource?.authorId === user.id;
      case Permissions.TASK_UPDATE:
      case Permissions.TASK_STATUS_CHANGE:
        // Team member can ONLY update tasks explicitly assigned to them
        return resource?.assigneeId === user.id;
      default:
        // Cannot create/delete tasks, assign tasks, manage members, or edit project
        return false;
    }
  }

  return false;
}
