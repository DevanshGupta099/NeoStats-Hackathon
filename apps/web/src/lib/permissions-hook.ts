'use client';

import { useAuth } from './auth-context';
import { hasPermission, Permission, PolicyContext, ProjectRole } from '@forgeline/shared';

export function usePermissions(projectRole?: ProjectRole | null, projectId?: string) {
  const { user } = useAuth();

  const can = (
    action: Permission,
    resource?: {
      projectId?: string;
      assigneeId?: string | null;
      authorId?: string | null;
    } | null,
  ): boolean => {
    if (!user) return false;

    const context: PolicyContext = {
      user: {
        id: user.id,
        globalRole: user.globalRole,
        isActive: user.isActive,
      },
      projectMember:
        projectRole && projectId
          ? {
              userId: user.id,
              projectId,
              projectRole,
            }
          : null,
      resource: resource ?? null,
    };

    return hasPermission(action, context);
  };

  return {
    can,
    user,
    isAdmin: user?.globalRole === 'ADMIN',
  };
}
