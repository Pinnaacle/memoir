import { z } from 'zod';

export const createEventSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required.')
    .max(200, 'Title must be 200 characters or less.'),
  occurredAt: z.date({
    error: 'Date is required.',
  }),
  location: z
    .string()
    .trim()
    .min(1, 'Location is required.')
    .max(160, 'Location must be 160 characters or less.'),
  mood: z
    .string()
    .trim()
    .min(1, 'Mood is required.')
    .max(80, 'Mood must be 80 characters or less.'),
  notes: z.string().trim().max(1200, 'Notes must be 1200 characters or less.'),
});

export type CreateEventValues = z.infer<typeof createEventSchema>;
