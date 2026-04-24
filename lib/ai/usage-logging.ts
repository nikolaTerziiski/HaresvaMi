import "server-only";

import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const GEMINI_COST_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
] as const;

export type GeminiCostModel = (typeof GEMINI_COST_MODELS)[number];

export type AiUsageEventType =
  | "receipt_scan_attempt"
  | "receipt_scan_success"
  | "receipt_scan_failed"
  | "receipt_extraction"
  | "menu_extraction"
  | "insight_generation";

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type GeminiUsageMetadataLike = {
  promptTokenCount?: number | null;
  candidatesTokenCount?: number | null;
  totalTokenCount?: number | null;
};

export type EstimateGeminiCostInput = {
  model: string;
  inputTokens: number;
  outputTokens: number;
};

export type AiUsageEventInput = {
  restaurantId: string;
  eventType: AiUsageEventType;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens?: number;
  success: boolean;
  failureReason?: string | null;
};

const GEMINI_PRICING_USD_PER_1M_TOKENS = {
  "gemini-2.5-flash-lite": {
    input: 0.1,
    output: 0.4,
  },
  "gemini-2.5-flash": {
    input: 0.3,
    output: 2.5,
  },
} as const satisfies Record<
  GeminiCostModel,
  { input: number; output: number }
>;

function assertNonNegativeInteger(value: number, label: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }
}

function normalizeGeminiModel(model: string) {
  return model.trim().replace(/^models\//, "");
}

export function isGeminiCostModel(model: string): model is GeminiCostModel {
  return GEMINI_COST_MODELS.includes(
    normalizeGeminiModel(model) as GeminiCostModel,
  );
}

export function estimateGeminiCostUsd({
  model,
  inputTokens,
  outputTokens,
}: EstimateGeminiCostInput): number {
  assertNonNegativeInteger(inputTokens, "inputTokens");
  assertNonNegativeInteger(outputTokens, "outputTokens");

  const normalizedModel = normalizeGeminiModel(model);

  if (!isGeminiCostModel(normalizedModel)) {
    throw new Error(`Unsupported Gemini cost model: ${model}`);
  }

  const pricing = GEMINI_PRICING_USD_PER_1M_TOKENS[normalizedModel];

  return Number(
    (
      (inputTokens / 1_000_000) * pricing.input +
      (outputTokens / 1_000_000) * pricing.output
    ).toFixed(6),
  );
}

export function readGeminiTokenUsage(
  usageMetadata: GeminiUsageMetadataLike | null | undefined,
): TokenUsage {
  const inputTokens = usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;
  const totalTokens =
    usageMetadata?.totalTokenCount ?? inputTokens + outputTokens;

  assertNonNegativeInteger(inputTokens, "inputTokens");
  assertNonNegativeInteger(outputTokens, "outputTokens");
  assertNonNegativeInteger(totalTokens, "totalTokens");

  return {
    inputTokens,
    outputTokens,
    totalTokens,
  };
}

export async function insertAiUsageEvent(input: AiUsageEventInput) {
  const inputTokens = input.inputTokens;
  const outputTokens = input.outputTokens;
  const totalTokens = input.totalTokens ?? inputTokens + outputTokens;

  assertNonNegativeInteger(inputTokens, "inputTokens");
  assertNonNegativeInteger(outputTokens, "outputTokens");
  assertNonNegativeInteger(totalTokens, "totalTokens");

  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.from("ai_usage_events").insert({
    restaurant_id: input.restaurantId,
    event_type: input.eventType,
    model: normalizeGeminiModel(input.model),
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: totalTokens,
    estimated_cost_usd: estimateGeminiCostUsd({
      model: input.model,
      inputTokens,
      outputTokens,
    }),
    success: input.success,
    failure_reason: input.failureReason
      ? input.failureReason.slice(0, 500)
      : null,
  });

  if (error) {
    throw new Error(`Unable to insert AI usage event: ${error.message}`);
  }
}
