import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../enums';

export const CreateTaskSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(150),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.BACKLOG),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  position: z.number().default(1000),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().min(2).max(150).optional(),
  description: z.string().max(2000).optional(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  position: z.number().optional(),
  version: z.number().int().positive('Version must be a positive integer').optional(),
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const ChangeTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
  version: z.number().int().positive('Version must be a positive integer').optional(),
});

export type ChangeTaskStatusInput = z.infer<typeof ChangeTaskStatusSchema>;

export const AssignTaskSchema = z.object({
  assigneeId: z.string().uuid().nullable(),
  version: z.number().int().positive('Version must be a positive integer').optional(),
});

export type AssignTaskInput = z.infer<typeof AssignTaskSchema>;

export const MoveTaskSchema = z.object({
  status: z.nativeEnum(TaskStatus),
  position: z.number(),
  version: z.number().int().positive('Version must be a positive integer').optional(),
});

export type MoveTaskInput = z.infer<typeof MoveTaskSchema>;
