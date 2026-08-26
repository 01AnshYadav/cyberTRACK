import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

// GET /api/auth/github/callback?code=...&state=...
// Handles the GitHub OAuth callback. Exchanges the authorization code
// for an access token, retrieves the GitHub user identity, and saves
// the connection to connected_accounts.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // ── Handle OAuth errors from GitHub ──────────────────────
  if (errorParam) {
    console.error("[auth/github/callback] GitHub returned error:", errorParam);
    return NextResponse.redirect(
      new URL(`/connections?error=${encodeURIComponent(errorParam)}`, baseUrl),
    );
  }

  // ── Validate parameters ──────────────────────────────────
  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/connections?error=missing_params", baseUrl),
    );
  }

  // ── Validate state against stored cookie ─────────────────
  const cookieStore = await cookies();
  const storedState = cookieStore.get("gh_oauth_state")?.value;

  if (!storedState || storedState !== state) {
    console.error("[auth/github/callback] State mismatch — possible CSRF");
    return NextResponse.redirect(
      new URL("/connections?error=invalid_state", baseUrl),
    );
  }

  // Clear the state cookie
  cookieStore.delete("gh_oauth_state");

  // ── Decode state to get user ID ──────────────────────────
  let stateData: { uid: string; ts: number };
  try {
    stateData = JSON.parse(Buffer.from(state, "base64url").toString());
  } catch {
    return NextResponse.redirect(
      new URL("/connections?error=invalid_state", baseUrl),
    );
  }

  // Verify state isn't too old (10 minutes max)
  if (Date.now() - stateData.ts > 10 * 60 * 1000) {
    return NextResponse.redirect(
      new URL("/connections?error=state_expired", baseUrl),
    );
  }

  // ── Authenticate the CyberTRACK user ─────────────────────
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.redirect(
      new URL("/login?error=session_expired", baseUrl),
    );
  }

  // Verify the state belongs to this user
  if (stateData.uid !== user.id) {
    console.error("[auth/github/callback] State user ID mismatch");
    return NextResponse.redirect(
      new URL("/connections?error=state_user_mismatch", baseUrl),
    );
  }

  // ── Exchange authorization code for access token ─────────
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error("[auth/github/callback] Missing GitHub OAuth env vars");
    return NextResponse.redirect(
      new URL("/connections?error=server_misconfigured", baseUrl),
    );
  }

  let accessToken: string;
  try {
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
        }),
      },
    );

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error(
        "[auth/github/callback] Token exchange failed:",
        tokenData.error,
        tokenData.error_description,
      );
      return NextResponse.redirect(
        new URL(
          `/connections?error=${encodeURIComponent(tokenData.error)}`,
          baseUrl,
        ),
      );
    }

    accessToken = tokenData.access_token;
  } catch (err) {
    console.error("[auth/github/callback] Token exchange request failed:", err);
    return NextResponse.redirect(
      new URL("/connections?error=token_exchange_failed", baseUrl),
    );
  }

  // ── Fetch GitHub user identity ───────────────────────────
  let ghUser: { login: string; id: number; avatar_url: string };
  try {
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "User-Agent": "cyber-tracker",
      },
    });

    if (!userRes.ok) {
      console.error(
        "[auth/github/callback] Failed to fetch GitHub user:",
        userRes.status,
      );
      return NextResponse.redirect(
        new URL("/connections?error=github_api_failed", baseUrl),
      );
    }

    ghUser = await userRes.json();
  } catch (err) {
    console.error("[auth/github/callback] GitHub user fetch failed:", err);
    return NextResponse.redirect(
      new URL("/connections?error=github_api_failed", baseUrl),
    );
  }

  // ── Save or update connected_accounts ────────────────────
  // The table has UNIQUE (user_id, platform), so we upsert.
  const { error: upsertError } = await supabase
    .from("connected_accounts")
    .upsert(
      {
        user_id: user.id,
        platform: "github",
        platform_username: ghUser.login,
        external_id: String(ghUser.id),
        access_token: accessToken,
      },
      {
        onConflict: "user_id,platform",
      },
    );

  if (upsertError) {
    console.error("[auth/github/callback] Upsert failed:", upsertError.message);
    return NextResponse.redirect(
      new URL("/connections?error=save_failed", baseUrl),
    );
  }

  // ── Redirect back to Connections page ────────────────────
  return NextResponse.redirect(
    new URL("/connections?github=connected", baseUrl),
  );
}
