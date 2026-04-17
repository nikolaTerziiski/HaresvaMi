import type { NextRequest } from "next/server";

import { updateSupabaseSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  // Run on every request except static assets + favicon + manifest.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
