import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

export const UpdateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(60).optional(),
  handle: z.string().min(2).max(30).regex(/^[a-zA-Z0-9_]+$/, 'Handle may only contain letters, numbers, and underscores').optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
