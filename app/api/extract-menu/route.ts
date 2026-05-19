import { NextRequest, NextResponse } from "next/server";
import { getCurrentOwnerState } from "@/lib/auth/owner";
import { extractMenu, extractMenuFromFiles } from "@/lib/ai/extract-menu";
import { canExtractMenu } from "@/lib/billing/entitlements";
import { incrementMenuExtractionUsage } from "@/lib/billing/usage";
import { MAX_MENU_FILE_SIZE_BYTES } from "@/lib/menu/constants";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const maxDuration = 120; // 120s timeout for multi-file Gemini calls

const MAX_FILES = 8;
const MAX_TOTAL_BYTES = 30 * 1024 * 1024;
const TOTAL_CONTENT_LENGTH_CEILING = 32 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // Early reject on Content-Length header before buffering
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > TOTAL_CONTENT_LENGTH_CEILING) {
      return NextResponse.json({ error: "total_too_large" }, { status: 413 });
    }

    const { user, restaurant } = await getCurrentOwnerState();

    if (!user || !restaurant) {
      return NextResponse.json(
        { error: "Unauthorized or no restaurant found" },
        { status: 401 },
      );
    }

    const formData = await request.formData();

    // ---------------------------------------------------------------------------
    // Multi-file path (new Phase 1 API)
    // ---------------------------------------------------------------------------
    const fileEntries = formData.getAll("files");
    const multiFiles = fileEntries.filter(
      (entry): entry is File => entry instanceof File,
    );

    if (multiFiles.length > 0) {
      if (multiFiles.length > MAX_FILES) {
        return NextResponse.json(
          { error: "too_many_files", max: MAX_FILES },
          { status: 400 },
        );
      }

      for (const file of multiFiles) {
        if (file.size > MAX_MENU_FILE_SIZE_BYTES) {
          return NextResponse.json(
            { error: "file_too_large", file_name: file.name },
            { status: 413 },
          );
        }
      }

      const totalSize = multiFiles.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > MAX_TOTAL_BYTES) {
        return NextResponse.json(
          { error: "total_too_large", limit: MAX_TOTAL_BYTES },
          { status: 413 },
        );
      }

      for (const file of multiFiles) {
        const mime = file.type;
        if (!mime.startsWith("image/") && mime !== "application/pdf") {
          return NextResponse.json(
            { error: "unsupported_type", file_name: file.name },
            { status: 400 },
          );
        }
      }

      const entitlement = await canExtractMenu(restaurant.id);
      if (!entitlement.allowed) {
        return NextResponse.json(
          {
            error: entitlement.reason,
            used: entitlement.used,
            limit: entitlement.limit,
          },
          { status: 402 },
        );
      }

      // Convert files to base64 in parallel
      const filesPayload = await Promise.all(
        multiFiles.map(async (file) => {
          const buffer = Buffer.from(await file.arrayBuffer());
          return {
            mimeType: file.type,
            base64Data: buffer.toString("base64"),
            fileName: file.name,
          };
        }),
      );

      // Load existing menu items for duplicate detection
      const supabase = createSupabaseServiceClient();
      const { data: existingItems } = await supabase
        .from("menu_items")
        .select("id, name_bg")
        .eq("restaurant_id", restaurant.id)
        .is("deleted_at", null);

      let result;
      try {
        result = await extractMenuFromFiles({
          files: filesPayload,
          restaurantId: restaurant.id,
          existingItems: existingItems ?? [],
        });
      } catch (aiError) {
        console.error("Gemini multi-file extraction failed");
        return NextResponse.json(
          {
            error: "ai_failed",
            message: "Не успяхме да прочетем менюто. Опитай отново след малко.",
          },
          { status: 502 },
        );
      }

      await incrementMenuExtractionUsage(restaurant.id);

      return NextResponse.json({ result }, { status: 200 });
    }

    // ---------------------------------------------------------------------------
    // Legacy single-file path (kept until Phase 3 removes it)
    // ---------------------------------------------------------------------------
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const mimeType = file.type;
    if (!mimeType.startsWith("image/") && mimeType !== "application/pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Only images and PDFs are supported." },
        { status: 400 },
      );
    }

    if (file.size > MAX_MENU_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File exceeds maximum size of 10MB" },
        { status: 413 },
      );
    }

    const entitlement = await canExtractMenu(restaurant.id);

    if (!entitlement.allowed) {
      return NextResponse.json(
        {
          error: entitlement.reason,
          used: entitlement.used,
          limit: entitlement.limit,
        },
        { status: 402 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const extractResult = await extractMenu(
      mimeType,
      base64Data,
      restaurant.id,
    );

    if (extractResult.error) {
      return NextResponse.json({ error: extractResult.error }, { status: 422 });
    }

    await incrementMenuExtractionUsage(restaurant.id);

    return NextResponse.json({ items: extractResult.items });
  } catch (error: unknown) {
    console.error("API Error in /extract-menu");
    const message =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
