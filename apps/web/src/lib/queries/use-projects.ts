'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { queryKeys } from './keys';
import {
  ProjectStatus,
  ProjectRole,
  CreateProjectInput,
  UpdateProjectInput,
} from '@forgeline/shared';
import { toast } from 'sonner';

export interface ProjectItem {
  id: string;
  name: string;
  key: string;
  description: string | null;
  status: ProjectStatus;
  version: number;
  taskSeq: number;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  myRole?: ProjectRole;
  _count?: {
    members: number;
    tasks: number;
  };
  members?: Array<{
    userId: string;
    projectRole: ProjectRole;
    user: {
      id: string;
      name: string;
      handle: string;
      email: string;
      avatarSeed?: string | null;
    };
  }>;
}

export interface ProjectStats {
  projectId: string;
  totalTasks: number;
  openTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  memberCount: number;
}

export interface ProjectMember {
  userId: string;
  projectId: string;
  projectRole: ProjectRole;
  joinedAt: string;
  user: {
    id: string;
    name: string;
    handle: string;
    email: string;
    avatarSeed?: string | null;
  };
}

export interface ActivityLogItem {
  id: string;
  projectId: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: Record<string, any>;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
    handle: string;
  };
}

export interface ProjectFilters {
  status?: ProjectStatus;
  search?: string;
  mine?: boolean;
}

// 1. List Projects
export function useProjects(filters?: ProjectFilters) {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.set('status', filters.status);
  if (filters?.search) queryParams.set('search', filters.search);
  if (filters?.mine) queryParams.set('mine', 'true');

  const qs = queryParams.toString();
  const endpoint = `/projects${qs ? `?${qs}` : ''}`;

  return useQuery({
    queryKey: queryKeys.projects.list(filters),
    queryFn: () => apiClient.get<ProjectItem[]>(endpoint),
  });
}

// 2. Project Details
export function useProject(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.detail(projectId),
    queryFn: () => apiClient.get<ProjectItem>(`/projects/${projectId}`),
    enabled: !!projectId,
  });
}

// 3. Project Stats
export function useProjectStats(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.stats(projectId),
    queryFn: () => apiClient.get<ProjectStats>(`/projects/${projectId}/stats`),
    enabled: !!projectId,
  });
}

// 4. Project Members
export function useProjectMembers(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.members(projectId),
    queryFn: () => apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`),
    enabled: !!projectId,
  });
}

// 5. Project Activity Timeline
export function useProjectActivity(projectId: string, filters?: { limit?: number; cursor?: string }) {
  const queryParams = new URLSearchParams();
  if (filters?.limit) queryParams.set('limit', filters.limit.toString());
  if (filters?.cursor) queryParams.set('cursor', filters.cursor);

  const qs = queryParams.toString();
  const endpoint = `/projects/${projectId}/activity${qs ? `?${qs}` : ''}`;

  return useQuery({
    queryKey: queryKeys.projects.activity(projectId, filters),
    queryFn: () => apiClient.get<{ items: ActivityLogItem[]; nextCursor: string | null }>(endpoint),
    enabled: !!projectId,
  });
}

// 6. Create Project Mutation
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProjectInput) =>
      apiClient.post<ProjectItem>('/projects', data),
    onSuccess: (newProj) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('SECTOR INITIALIZED', {
        description: `Project [${newProj.key}] successfully deployed.`,
      });
    },
  });
}

// 7. Archive Project Mutation
export function useArchiveProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) =>
      apiClient.post<ProjectItem>(`/projects/${projectId}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('PROJECT ARCHIVED', {
        description: 'Sector set to read-only cold storage.',
      });
    },
  });
}

// 8. Restore Project Mutation
export function useRestoreProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) =>
      apiClient.post<ProjectItem>(`/projects/${projectId}/restore`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.all });
      toast.success('PROJECT RESTORED', {
        description: 'Sector re-activated for operational workflows.',
      });
    },
  });
}
