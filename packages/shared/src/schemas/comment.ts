import { z } from 'zod';

export const CreateCommentSchema = z.object({
  body: z.string().min(1, 'Comment body cannot be empty').max(2000),
  mentions: z.array(z.string().uuid()).default([]),
});

export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
