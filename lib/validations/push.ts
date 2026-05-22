import { z } from "zod";

/**
 * Zod schema matching the browser PushSubscriptionJSON shape.
 */
export const pushSubscribeSchema = z.object({
  endpoint: z.string().url("endpoint must be a valid URL"),
  keys: z.object({
    p256dh: z.string().min(1, "p256dh key is required"),
    auth: z.string().min(1, "auth key is required"),
  }),
  expirationTime: z.number().nullable().optional(),
  userAgent: z.string().max(500).optional(),
});

export type PushSubscribeInput = z.infer<typeof pushSubscribeSchema>;

export const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url("endpoint must be a valid URL"),
});

export type PushUnsubscribeInput = z.infer<typeof pushUnsubscribeSchema>;
