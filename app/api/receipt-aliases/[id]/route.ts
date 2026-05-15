import { NextRequest, NextResponse } from "next/server";

import { getCurrentOwnerState } from "@/lib/auth/owner";
import { deleteAlias } from "@/lib/receipt-aliases/queries";

// ---------------------------------------------------------------------------
// DELETE /api/receipt-aliases/:id
// ---------------------------------------------------------------------------

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { user, restaurant } = await getCurrentOwnerState();

    if (!user || !restaurant) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
      return NextResponse.json(
        { error: "id path parameter must be a UUID" },
        { status: 400 },
      );
    }

    const result = await deleteAlias({
      restaurantId: restaurant.id,
      aliasId: id,
    });

    if (!result.ok) {
      if (result.code === "not_found") {
        return NextResponse.json(
          { error: "not_found", message: "Alias not found." },
          { status: 404 },
        );
      }
      return NextResponse.json(
        { error: "write_failed", message: "Unable to delete alias." },
        { status: 500 },
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("API Error in DELETE /api/receipt-aliases/:id:", error);
    return NextResponse.json(
      { error: "Unable to delete alias." },
      { status: 500 },
    );
  }
}
