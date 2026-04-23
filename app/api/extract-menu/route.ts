import { NextRequest, NextResponse } from "next/server";
import { getCurrentOwnerState } from "@/lib/auth/owner";
import { extractMenu } from "@/lib/ai/extract-menu";

export const maxDuration = 60; // 60s timeout for Gemini API calls

export async function POST(request: NextRequest) {
  try {
    const { user, restaurant } = await getCurrentOwnerState();

    if (!user || !restaurant) {
      return NextResponse.json(
        { error: "Unauthorized or no restaurant found" },
        { status: 401 }
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
        { status: 400 }
      );
    }

    // Convert File to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");

    const result = await extractMenu(mimeType, base64Data);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    return NextResponse.json({ items: result.items });
  } catch (error: any) {
    console.error("API Error in /extract-menu:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
