import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

/**
 * Create a Supabase client inside Next.js Proxy (formerly middleware).
 *
 * Reads cookies from the incoming request. When the session is refreshed,
 * the updated cookies are stored in `refreshedCookies` so the proxy can
 * apply them to the outgoing response.
 */
export function createClient(
  request: NextRequest,
  refreshedCookies: { name: string; value: string }[],
) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            refreshedCookies.push({ name, value });
          }
        },
      },
    },
  );
}
