import { GoogleGenerativeAI } from "@google/generative-ai";
import { buildMenuExtractionPrompt } from "./prompts";

export interface ExtractedMenuItem {
  name_bg: string;
  category: string | null;
  price: number | null;
  description_bg: string | null;
}

export interface MenuExtractionResult {
  items: ExtractedMenuItem[];
  error?: string;
}

export async function extractMenu(
  mimeType: string,
  base64Data: string,
): Promise<MenuExtractionResult> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = buildMenuExtractionPrompt();

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const responseText = result.response.text();

    // Clean up the response if it includes markdown code blocks
    let cleanedText = responseText.trim();
    if (cleanedText.startsWith("\`\`\`json")) {
      cleanedText = cleanedText
        .replace(/^\`\`\`json\n/, "")
        .replace(/\n\`\`\`$/, "");
    } else if (cleanedText.startsWith("\`\`\`")) {
      cleanedText = cleanedText
        .replace(/^\`\`\`\n/, "")
        .replace(/\n\`\`\`$/, "");
    }

    const parsed = JSON.parse(cleanedText) as MenuExtractionResult;

    if (parsed.error) {
      return { items: [], error: parsed.error };
    }

    return { items: parsed.items || [] };
  } catch (error) {
    console.error("Error extracting menu:", error);
    return { items: [], error: "Failed to parse menu from image" };
  }
}
