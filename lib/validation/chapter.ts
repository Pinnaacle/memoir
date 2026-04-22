import { z } from 'zod';

export const createChapterSchema = z.object({
  chapterType: z.string().trim().min(1, 'Chapter type is required.'),
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(200, 'Title must be 200 characters or less.'),
  description: z
    .string()
    .trim()
    .max(1200, 'Description must be 1200 characters or less.'),
  occurredAt: z.date({
    error: 'Date is required.',
  }),
});

export type CreateChapterValues = z.infer<typeof createChapterSchema>;
