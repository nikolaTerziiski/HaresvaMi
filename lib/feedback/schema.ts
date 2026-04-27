import { z } from "zod";

export const feedbackItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().max(200).optional(),
  quantity: z.coerce.number().int().min(1).max(99).default(1),
});

export const feedbackSubmissionSchema = z.object({
  restaurantId: z.string().uuid(),
  items: z.array(feedbackItemSchema).min(1).max(100),
  ratings: z
    .record(z.string().uuid(), z.coerce.number().int().min(1).max(10))
    .default({}),
  comments: z.record(z.string().uuid(), z.string().trim().max(500)).default({}),
  overallRating: z.enum(["like", "dislike"]).nullable().optional(),
  overallComment: z.string().trim().max(500).nullable().optional(),
  customerLanguage: z.enum(["bg", "en"]).default("bg"),
  extractedItems: z.array(feedbackItemSchema).max(100).default([]),
});

export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;
