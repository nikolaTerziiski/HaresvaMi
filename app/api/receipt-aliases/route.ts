import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import {
  addManualAlias,
  aliasTextSchema,
  listAliasesForMenuItem,
} from "@/lib/receipt-aliases/queries";

// ---------------------------------------------------------------------------
// GET /api/receipt-aliases?menu_item_id=<uuid>
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const { user, restaurant } = await getCurrentOwnerState();

    if (!user || !restaurant) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const menuItemId = request.nextUrl.searchParams.get("menu_item_id");

    if (!menuItemId || !/^[0-9a-f-]{36}$/.test(menuItemId)) {
      return NextResponse.json(
        {
          error: "menu_item_id query parameter is required and must be a UUID",
        },
        { status: 400 },
      );
    }

    const aliases = await listAliasesForMenuItem({
      restaurantId: restaurant.id,
      menuItemId,
    });

    return NextResponse.json({ aliases });
  } catch (error) {
    console.error("API Error in GET /api/receipt-aliases:", error);
    return NextResponse.json(
      { error: "Unable to fetch aliases." },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/receipt-aliases
// Body: { menu_item_id: string, alias_text: string }
// ---------------------------------------------------------------------------

const postSchema = z.object({
  menu_item_id: z.string().uuid(),
  alias_text: aliasTextSchema,
});

export async function POST(request: NextRequest) {
  try {
    const { user, restaurant } = await getCurrentOwnerState();

    if (!user || !restaurant) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const body = postSchema.parse(await request.json());

    const result = await addManualAlias({
      restaurantId: restaurant.id,
      menuItemId: body.menu_item_id,
      rawText: body.alias_text,
    });

    if (!result.ok) {
      if (result.code === "duplicate") {
        return NextResponse.json(
          { error: "duplicate", message: "This alias already exists." },
          { status: 409 },
        );
      }
      if (result.code === "invalid_menu_item") {
        return NextResponse.json(
          {
            error: "invalid_menu_item",
            message: "Menu item not found or not active.",
          },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "write_failed", message: "Unable to save alias." },
        { status: 500 },
      );
    }

    return NextResponse.json({ alias: result.alias }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "invalid_payload", issues: error.issues },
        { status: 400 },
      );
    }
    console.error("API Error in POST /api/receipt-aliases:", error);
    return NextResponse.json(
      { error: "Unable to create alias." },
      { status: 500 },
    );
  }
}
