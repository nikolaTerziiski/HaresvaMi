import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "@/lib/supabase/types";

/**
 * Supabase client for Server Components, Route Handlers, and Server Actions.
 * Reads + writes the auth cookie so server code sees the same session as the browser.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot set cookies — the middleware client handles session refresh.
          }
        },
      },
    },
  );
}

/**
 * Service-role client. Bypasses RLS. Only use inside Route Handlers and Server Actions
 * where we know the action has been authorized by an RLS-protected read first.
 */
export function createSupabaseServiceClient() {
  const { createClient } =
    require("@supabase/supabase-js") as typeof import("@supabase/supabase-js");

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
