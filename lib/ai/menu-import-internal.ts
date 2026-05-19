import "server-only";

import { z } from "zod";
import { parseBgPrice } from "@/lib/menu/parse-price";
import { findDuplicate } from "@/lib/menu/duplicate-detect";
import type {
  ImportItemConfidence,
  MenuImportItem,
  MenuImportResult,
} from "@/lib/menu/import-types";

// ---------------------------------------------------------------------------
// Zod schema for the raw Gemini response
// ---------------------------------------------------------------------------

const RawItemSchema = z.object({
  name_bg: z.string(),
  category: z.string().nullable().optional(),
  price: z.union([z.number(), z.string()]).nullable().optional(),
  description_bg: z.string().nullable().optional(),
  source_file_name: z.string().nullable().optional(),
});

export const RawResponseSchema = z.object({
  items: z.array(RawItemSchema),
});

export type RawItem = z.infer<typeof RawItemSchema>;

// ---------------------------------------------------------------------------
// Confidence heuristic
// ---------------------------------------------------------------------------

const UNCLASSIFIED = "Некласифицирано";

function isSuspiciousName(name: string): boolean {
  if (name.length < 3) return true;
  const cyrillicLatinCount = (name.match(/[А-Яа-яA-Za-z]/g) ?? []).length;
  const ratio = cyrillicLatinCount / name.length;
  return ratio < 0.6; // more than 40% non-Cyrillic/non-Latin
}

function deriveConfidence(
  name: string,
  category: string,
  price: number | null,
): ImportItemConfidence {
  if (category === UNCLASSIFIED || name.length < 3 || isSuspiciousName(name)) {
    return "low";
  }

  if (price === null) {
    return "medium";
  }

  return "high";
}

function deriveWarn(
  confidence: ImportItemConfidence,
  category: string,
  name: string,
  price: number | null,
): string | undefined {
  if (confidence === "low") {
    if (category === UNCLASSIFIED) {
      return "Не намерих категория за това ястие — премести го ръчно.";
    }
    if (isSuspiciousName(name) || name.length < 3) {
      return "Името изглежда непълно — провери.";
    }
  }

  if (confidence === "medium" && price === null) {
    return "Цената липсва визточника — добави я.";
  }

  return undefined;
}

// ---------------------------------------------------------------------------
// Post-processing
// ---------------------------------------------------------------------------

export function processRawItems(input: {
  rawItems: RawItem[];
  existingItems: { id: string; name_bg: string }[];
  totalFiles: number;
  warnings: string[];
}): MenuImportResult {
  const { rawItems, existingItems, totalFiles, warnings } = input;

  const items: MenuImportItem[] = [];
  let duplicateCount = 0;
  let flaggedCount = 0;

  for (const raw of rawItems) {
    const name = (raw.name_bg ?? "").trim();
    if (!name) {
      warnings.push(`Пропуснат запис без наименование.`);
      continue;
    }

    const category = (raw.category ?? "").trim() || UNCLASSIFIED;

    const price = parseBgPrice(
      raw.price !== undefined && raw.price !== null ? raw.price : null,
    );

    const sourceFileName =
      typeof raw.source_file_name === "string" && raw.source_file_name.trim()
        ? raw.source_file_name.trim()
        : undefined;

    const descriptionBg =
      typeof raw.description_bg === "string" && raw.description_bg.trim()
        ? raw.description_bg.trim()
        : null;

    let confidence = deriveConfidence(name, category, price);
    let warn = deriveWarn(confidence, category, name, price);

    // Duplicate detection
    const duplicate = findDuplicate({ name_bg: name }, existingItems);
    let duplicateOfItemId: string | undefined;
    if (duplicate) {
      duplicateOfItemId = duplicate.id;
      confidence = "low";
      warn = `Възможен дубликат на: «${duplicate.name}»`;
      duplicateCount++;
    }

    const item: MenuImportItem = {
      name_bg: name,
      category,
      price,
      description_bg: descriptionBg,
      confidence,
      ...(sourceFileName !== undefined && { source_file_name: sourceFileName }),
      ...(duplicateOfItemId !== undefined && {
        duplicate_of_item_id: duplicateOfItemId,
      }),
      ...(warn !== undefined && { warn }),
    };

    if (confidence !== "high") {
      flaggedCount++;
    }

    items.push(item);
  }

  return {
    items,
    warnings,
    stats: {
      total_files: totalFiles,
      items_extracted: items.length,
      items_flagged: flaggedCount,
      duplicates: duplicateCount,
    },
  };
}
