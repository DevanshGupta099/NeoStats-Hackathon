import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../enums';

export const TaskDraftRequestSchema = z.object({
  prompt: z.string().min(3, 'Prompt must be at least 3 characters').max(1000),
  projectId: z.string().uuid().optional(),
});
export type TaskDraftRequestInput = z.infer<typeof TaskDraftRequestSchema>;

export const TaskDraftResponseSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().max(2000).default(''),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.BACKLOG),
});
export type TaskDraftResponse = z.infer<typeof TaskDraftResponseSchema>;

export const AiTaskDraftEnvelopeSchema = z.object({
  draft: TaskDraftResponseSchema,
  aiGenerated: z.boolean(),
  note: z.string().optional(),
});
export type AiTaskDraftEnvelope = z.infer<typeof AiTaskDraftEnvelopeSchema>;
