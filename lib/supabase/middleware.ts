import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "@/lib/supabase/types";

let warnedMissingEnv = false;

/**
 * Refreshes the Supabase auth session cookie on every matched request.
 * Called from the root `middleware.ts` — do not call from pages or route handlers.
 *
 * When Supabase env vars are missing (e.g. during initial Phase 0 scaffold
 * before `.env.local` is created) this becomes a no-op instead of crashing.
 */
export async function updateSupabaseSession(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (!warnedMissingEnv) {
      console.warn(
        "[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set — skipping auth session refresh.",
      );
      warnedMissingEnv = true;
    }
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Touch the session so the refresh token rolls forward.
  await supabase.auth.getUser();

  return response;
}
