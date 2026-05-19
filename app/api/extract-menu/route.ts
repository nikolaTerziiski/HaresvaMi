import { NextRequest, NextResponse } from "next/server";
import { getCurrentOwnerState } from "@/lib/auth/owner";
import { extractMenu } from "@/lib/ai/extract-menu";
import { canExtractMenu } from "@/lib/billing/entitlements";
import { incrementMenuExtractionUsage } from "@/lib/billing/usage";
import { MAX_MENU_FILE_SIZE_BYTES } from "@/lib/menu/constants";

export const maxDuration = 60; // 60s timeout for Gemini API calls

export async function POST(request: NextRequest) {
  try {
    const { user, restaurant } = await getCurrentOwnerState();

    if (!user || !restaurant) {
      return NextResponse.json(
        { error: "Unauthorized or no restaurant found" },
        { status: 401 },
      );
    }

    const formData = await request.formData();
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

    const result = await extractMenu(mimeType, base64Data, restaurant.id);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    await incrementMenuExtractionUsage(restaurant.id);

    return NextResponse.json({ items: result.items });
  } catch (error: any) {
    console.error("API Error in /extract-menu:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
