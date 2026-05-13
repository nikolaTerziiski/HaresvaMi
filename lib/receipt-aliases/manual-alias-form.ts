import { z } from "zod";

export const manualReceiptAliasSchema = z.object({
  rawText: z.string().trim().min(1),
  menuItemId: z.string().uuid(),
});

export type ManualReceiptAliasFormValues = z.infer<
  typeof manualReceiptAliasSchema
>;
