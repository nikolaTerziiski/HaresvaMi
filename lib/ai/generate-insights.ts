import "server-only";

import { GoogleGenerativeAI } from "@google/generative-ai";

import {
  insertAiUsageEvent,
  readGeminiTokenUsage,
} from "@/lib/ai/usage-logging";
import type {
  DishInsight,
  InsightPeriod,
  InsightPeriodTotals,
} from "@/lib/insights/types";

const INSIGHTS_MODEL = "gemini-2.5-flash-lite";

const SYSTEM_PROMPT =
  "Ти си помощник на собственик на българска механа. Пишеш кратко, топло, без жаргон, на 'ти'. Не използваш markdown.";

export async function generateInsightSummary(input: {
  restaurantId: string;
  restaurantName: string;
  period: InsightPeriod;
  current: InsightPeriodTotals;
  previous: InsightPeriodTotals;
  topPerformer: DishInsight | null;
  watchDish: DishInsight | null;
  improvedDish: DishInsight | null;
}): Promise<{ summaryText: string }> {
  const apiKey =
    process.env.GOOGLE_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: INSIGHTS_MODEL,
    systemInstruction: SYSTEM_PROMPT,
  });

  const periodData = {
    periodType: input.period.key,
    from: input.period.currentFrom,
    to: input.period.currentTo,
    current: {
      completedSessions: input.current.completedSessions,
      itemRatingCount: input.current.itemRatingCount,
      itemAverage: input.current.itemAverage,
      likeRate: input.current.likeRate,
    },
    previous: {
      completedSessions: input.previous.completedSessions,
      itemRatingCount: input.previous.itemRatingCount,
      itemAverage: input.previous.itemAverage,
      likeRate: input.previous.likeRate,
    },
    topPerformer: input.topPerformer
      ? {
          name: input.topPerformer.name,
          currentAverage: input.topPerformer.currentAverage,
          delta: input.topPerformer.delta,
        }
      : null,
    watchDish: input.watchDish
      ? {
          name: input.watchDish.name,
          currentAverage: input.watchDish.currentAverage,
          delta: input.watchDish.delta,
        }
      : null,
    improvedDish: input.improvedDish
      ? {
          name: input.improvedDish.name,
          currentAverage: input.improvedDish.currentAverage,
          delta: input.improvedDish.delta,
        }
      : null,
  };

  const userPrompt = `Ресторант: ${input.restaurantName}
Данни за периода:
${JSON.stringify(periodData, null, 2)}

Напиши 3-4 изречения максимум. Без markdown. Спомени поне едно конкретно ястие по име. Завърши с едно наблюдение или препоръка. Пиши неформално, на 'ти'.`;

  const result = await model.generateContent(userPrompt);
  const responseText = result.response.text().trim();

  const usage = readGeminiTokenUsage(
    result.response.usageMetadata as Parameters<typeof readGeminiTokenUsage>[0],
  );

  await insertAiUsageEvent({
    restaurantId: input.restaurantId,
    eventType: "insight_generation",
    model: INSIGHTS_MODEL,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
    success: true,
  }).catch((logError) => {
    console.error("Failed to log AI usage event:", logError);
  });

  return { summaryText: responseText };
}
