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
    .record(z.string().uuid(), z.coerce.number().int().min(1).max(5))
    .default({}),
  comments: z.record(z.string().uuid(), z.string().trim().max(500)).default({}),
  overallRating: z.enum(["like", "dislike"]).nullable().optional(),
  overallComment: z.string().trim().max(500).nullable().optional(),
  customerLanguage: z.enum(["bg", "en"]).default("bg"),
  extractedItems: z.array(feedbackItemSchema).max(100).default([]),
});

export type FeedbackSubmissionInput = z.infer<typeof feedbackSubmissionSchema>;

export const recoveryCommentSchema = z.object({
  restaurantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  comment: z.string().trim().min(1).max(1000),
});

export type RecoveryCommentInput = z.infer<typeof recoveryCommentSchema>;
