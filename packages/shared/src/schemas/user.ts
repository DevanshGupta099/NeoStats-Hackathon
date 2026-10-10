import { z } from 'zod';
import { GlobalRole } from '../enums';

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  name: z.string().min(2, 'Name must be at least 2 characters').max(60),
  handle: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Alphanumeric and underscores only'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  globalRole: z.nativeEnum(GlobalRole).default(GlobalRole.TEAM_MEMBER),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  handle: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_]+$/).optional(),
  globalRole: z.nativeEnum(GlobalRole).optional(),
  isActive: z.boolean().optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
