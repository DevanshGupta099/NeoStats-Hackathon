'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { queryKeys } from './keys';
import { CreateCommentInput } from '@forgeline/shared';
import { toast } from 'sonner';

export interface CommentAuthor {
  id: string;
  name: string;
  handle: string;
  avatarSeed?: string | null;
}

export interface CommentItem {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  mentions: string[];
  createdAt: string;
  updatedAt: string;
  author: CommentAuthor;
}

export function useTaskComments(taskId: string) {
  return useQuery({
    queryKey: queryKeys.comments.task(taskId),
    queryFn: () => apiClient.get<CommentItem[]>(`/tasks/${taskId}/comments`),
    enabled: !!taskId,
  });
}

export function useCreateComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentInput) =>
      apiClient.post<CommentItem>(`/tasks/${taskId}/comments`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.task(taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.all });
      toast.success('TRANSMISSION POSTED', { description: 'Comment committed to task record.' });
    },
  });
}

export function useDeleteComment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => apiClient.delete(`/comments/${commentId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.comments.task(taskId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(taskId) });
      toast.success('COMMENT EXPUNGED', { description: 'Record removed.' });
    },
  });
}
