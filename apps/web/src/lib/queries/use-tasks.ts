'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { queryKeys } from './keys';
import {
  TaskStatus,
  TaskPriority,
  CreateTaskInput,
  UpdateTaskInput,
  MoveTaskInput,
  ChangeTaskStatusInput,
  AssignTaskInput,
} from '@forgeline/shared';
import { toast } from 'sonner';

export interface TaskUser {
  id: string;
  name: string;
  handle: string;
  email?: string;
  avatarSeed?: string | null;
}

export interface TaskItem {
  id: string;
  number: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  version: number;
  projectId: string;
  assigneeId: string | null;
  reporterId: string;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  assignee?: TaskUser | null;
  reporter?: TaskUser | null;
  commentCount?: number;
  project?: {
    id: string;
    key: string;
    name: string;
  };
}

export interface TaskListResponse {
  items: TaskItem[];
  nextCursor: string | null;
  totalCount: number;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}

// 1. My Assigned Tasks
export function useMyTasks() {
  return useQuery({
    queryKey: queryKeys.tasks.mine(),
    queryFn: () => apiClient.get<TaskItem[]>('/tasks/mine'),
  });
}

// 2. Project Task List / Board
export function useProjectTasks(projectId: string, filters?: TaskFilters) {
  const queryParams = new URLSearchParams();
  if (filters?.status) queryParams.set('status', filters.status);
  if (filters?.priority) queryParams.set('priority', filters.priority);
  if (filters?.assigneeId) queryParams.set('assigneeId', filters.assigneeId);
  if (filters?.search) queryParams.set('search', filters.search);
  if (filters?.cursor) queryParams.set('cursor', filters.cursor);
  if (filters?.limit) queryParams.set('limit', filters.limit.toString());

  const qs = queryParams.toString();
  const endpoint = `/projects/${projectId}/tasks${qs ? `?${qs}` : ''}`;

  return useQuery({
    queryKey: queryKeys.tasks.project(projectId, filters),
    queryFn: () => apiClient.get<TaskListResponse>(endpoint),
    enabled: !!projectId,
  });
}

// 3. Single Task Detail
export function useTask(taskId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(taskId),
    queryFn: () => apiClient.get<TaskItem>(`/tasks/${taskId}`),
    enabled: !!taskId,
  });
}

// 4. Create Task Mutation
export function useCreateTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskInput) =>
      apiClient.post<TaskItem>(`/projects/${projectId}/tasks`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats(projectId) });
      toast.success('TASK CREATED', { description: 'New workload registered on board.' });
    },
  });
}

// 5. Update Task Mutation
export function useUpdateTask(taskId: string, projectId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, ifMatch }: { data: UpdateTaskInput; ifMatch?: number }) =>
      apiClient.patch<TaskItem>(`/tasks/${taskId}`, data, {
        headers: ifMatch ? { 'if-match': ifMatch.toString() } : undefined,
      }),
    onSuccess: (updated) => {
      queryClient.setQueryData(queryKeys.tasks.detail(taskId), updated);
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats(projectId) });
      }
      toast.success('TASK UPDATED', { description: `Revision bumped to v${updated.version}` });
    },
  });
}

// 6. Optimistic Move Task Mutation
export function useMoveTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      dto,
      ifMatch,
    }: {
      taskId: string;
      dto: MoveTaskInput;
      ifMatch?: number;
    }) =>
      apiClient.post<TaskItem>(`/tasks/${taskId}/move`, dto, {
        headers: ifMatch ? { 'if-match': ifMatch.toString() } : undefined,
      }),
    onMutate: async ({ taskId, dto }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.tasks.project(projectId) });

      // Snapshot previous value across all matching project task queries
      const previousData = queryClient.getQueryData<TaskListResponse>(
        queryKeys.tasks.project(projectId),
      );

      // Optimistically update
      if (previousData) {
        queryClient.setQueryData<TaskListResponse>(queryKeys.tasks.project(projectId), {
          ...previousData,
          items: previousData.items.map((item) =>
            item.id === taskId
              ? { ...item, status: dto.status, position: dto.position, version: item.version + 1 }
              : item,
          ),
        });
      }

      return { previousData };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.tasks.project(projectId), context.previousData);
      }
      toast.error('POSITION SYNC FAILED', { description: 'State reverted to last server revision.' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.project(projectId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats(projectId) });
    },
  });
}

// 7. Delete Task Mutation
export function useDeleteTask(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => apiClient.delete<{ success: boolean }>(`/tasks/${taskId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.stats(projectId) });
      toast.success('TASK REMOVED', { description: 'Task removed from current sprint.' });
    },
  });
}
