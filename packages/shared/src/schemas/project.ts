import { z } from 'zod';
import { ProjectRole, ProjectStatus } from '../enums';

export const CreateProjectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  key: z.string().min(2).max(10).toUpperCase().regex(/^[A-Z0-9]+$/, 'Project key must be uppercase alphanumeric'),
  description: z.string().max(500).optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  version: z.number().int().positive('Version must be a positive integer').optional(),
});

export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

export const AddProjectMemberSchema = z.object({
  userId: z.string().uuid('Invalid user ID'),
  projectRole: z.nativeEnum(ProjectRole).default(ProjectRole.MEMBER),
});

export type AddProjectMemberInput = z.infer<typeof AddProjectMemberSchema>;

export const UpdateProjectMemberSchema = z.object({
  projectRole: z.nativeEnum(ProjectRole),
});

export type UpdateProjectMemberInput = z.infer<typeof UpdateProjectMemberSchema>;
