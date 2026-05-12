import { toFeedbackItems } from "@/lib/kiosk/selection";
import type { LearnableReceiptAliasMapping } from "@/lib/kiosk/selection";
import type { OverallRating, SelectedItem } from "@/lib/kiosk/types";

type ReceiptExtractionResponse = {
  ok: boolean;
  status: number;
  payload: Record<string, any>;
};

type SubmitKioskFeedbackInput = {
  restaurantId: string;
  selectedItems: SelectedItem[];
  extractedItems: SelectedItem[];
  itemRatings: Record<string, number>;
  overallRating: OverallRating | null;
};

export async function extractReceiptForKiosk(
  restaurantId: string,
  file: File,
): Promise<ReceiptExtractionResponse> {
  const formData = new FormData();
  formData.append("restaurant_id", restaurantId);
  formData.append("file", file);

  const response = await fetch("/api/extract-receipt", {
    method: "POST",
    body: formData,
  });
  const payload = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    payload,
  };
}

export async function submitKioskFeedback({
  restaurantId,
  selectedItems,
  extractedItems,
  itemRatings,
  overallRating,
}: SubmitKioskFeedbackInput): Promise<Response> {
  return fetch("/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      restaurantId,
      items: toFeedbackItems(selectedItems),
      ratings: itemRatings,
      comments: {},
      overallRating,
      overallComment: null,
      customerLanguage: "bg",
      extractedItems: toFeedbackItems(extractedItems),
    }),
  });
}

export async function learnReceiptAliasesForKiosk(
  aliases: LearnableReceiptAliasMapping[],
): Promise<Response> {
  return fetch("/api/receipt-aliases/learn", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ aliases }),
  });
}
