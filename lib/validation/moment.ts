import { z } from 'zod';

export const createMomentSchema = z.object({
  momentType: z.string().trim().min(1, 'Moment type is required.'),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(120, 'Title must be 120 characters or less.'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required.')
    .max(1200, 'Description must be 1200 characters or less.'),
  occurredAt: z.date({
    error: 'Date is required.',
  }),
});

export type CreateMomentValues = z.infer<typeof createMomentSchema>;
