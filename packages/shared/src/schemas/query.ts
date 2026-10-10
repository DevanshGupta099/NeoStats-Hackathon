import { z } from 'zod';
import { TaskPriority, TaskStatus } from '../enums';

export const PaginationQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export const TaskFilterQuerySchema = PaginationQuerySchema.extend({
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().uuid().optional(),
  search: z.string().max(100).optional(),
});

export type TaskFilterQuery = z.infer<typeof TaskFilterQuerySchema>;
