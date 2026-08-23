import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchGitHubEvents, parseGitHubEvents } from "@/lib/integrations/github";
import { upsertActivities } from "@/lib/integrations/ingest";

// POST /api/sync/github
// Authenticated endpoint that fetches the user's recent public
// GitHub events and upserts them into the activities table.
export async function POST() {
  const supabase = await createClient();

  // ── Auth check ───────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Look up linked GitHub account ────────────────────────
  const { data: account, error: acctError } = await supabase
    .from("connected_accounts")
    .select("platform_username, access_token")
    .eq("user_id", user.id)
    .eq("platform", "github")
    .maybeSingle();

  if (acctError) {
    return NextResponse.json(
      { error: "Failed to look up connected account" },
      { status: 500 },
    );
  }

  if (!account?.platform_username) {
    return NextResponse.json(
      { error: "No GitHub account linked. Please connect GitHub first." },
      { status: 400 },
    );
  }

  // ── Fetch events from GitHub ─────────────────────────────
  let events;
  try {
    events = await fetchGitHubEvents(
      account.platform_username,
      account.access_token,
    );
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown GitHub API error";
    console.error("[sync/github]", message);
    return NextResponse.json(
      { error: `Failed to fetch GitHub events: ${message}` },
      { status: 502 },
    );
  }

  // ── Normalise into Activity rows ─────────────────────────
  const rows = parseGitHubEvents(events, user.id);

  // ── Upsert (deduplicate on platform + external_id) ──────
  const result = await upsertActivities(supabase, rows);

  if (result.error) {
    return NextResponse.json(
      { error: `Ingestion failed: ${result.error}` },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    synced: result.inserted,
    username: account.platform_username,
  });
}
