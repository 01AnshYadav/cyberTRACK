import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/proxy";

// ── Routes that require authentication ──────────────────
const PROTECTED_ROUTES = ["/dashboard", "/group", "/profile", "/connections", "/activity"];

// ── Routes that are always public (never redirect to login) ──
const PUBLIC_ROUTES = ["/", "/login", "/signup", "/api/dev-login"];

function isProtected(pathname: string) {
  return PROTECTED_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
}

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/"),
  );
}

/**
 * Next.js 16 Proxy (formerly middleware).
 *
 * - Refreshes the Supabase session on every request to a protected route.
 * - Redirects unauthenticated users to /login.
 * - Skips session refresh for public routes and API routes.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes and non-protected routes pass through without auth check
  if (!isProtected(pathname)) {
    return undefined;
  }

  // ── Refresh session via Supabase ──────────────────────────
  const refreshedCookies: { name: string; value: string }[] = [];
  const supabase = createClient(request, refreshedCookies);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  // ── Apply refreshed session cookies to the response ───────
  const response = NextResponse.next();
  for (const { name, value } of refreshedCookies) {
    response.cookies.set(name, value, { path: "/" });
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (metadata file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
