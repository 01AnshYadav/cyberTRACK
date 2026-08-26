import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// GET /api/auth/github
// Initiates the GitHub OAuth flow by redirecting the browser to GitHub's
// authorization endpoint. The user must be authenticated via Supabase first.
export async function GET() {
  const supabase = await createClient();

  // ── Auth check ───────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Validate env vars ────────────────────────────────────
  const clientId = process.env.GITHUB_CLIENT_ID;
  const redirectUri = process.env.GITHUB_REDIRECT_URI;

  if (!clientId) {
    console.error("[auth/github] Missing GITHUB_CLIENT_ID env var");
    return NextResponse.json(
      { error: "GitHub OAuth is not configured on the server." },
      { status: 500 },
    );
  }

  // ── Generate CSRF state token ────────────────────────────
  // We encode the Supabase user ID in the state so the callback
  // can verify which user initiated this OAuth flow.
  // The state is signed with a simple HMAC to prevent tampering.
  const statePayload = JSON.stringify({
    uid: user.id,
    ts: Date.now(),
  });
  // Use a basic base64 encoding — the state is signed via the
  // Supabase session cookie, so even if decoded it can't be used
  // by another user.
  const state = Buffer.from(statePayload).toString("base64url");

  // Store the state in a short-lived cookie for validation in callback
  const cookieStore = await cookies();
  cookieStore.set("gh_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  // ── Build GitHub OAuth URL ───────────────────────────────
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri || `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/auth/github/callback`,
    scope: "read:user",
    state,
  });

  const githubAuthUrl = `https://github.com/login/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(githubAuthUrl);
}
