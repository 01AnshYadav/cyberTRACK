import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchGitHubEvents, parseGitHubEvents } from "@/lib/integrations/github";

// POST /api/sync/github
// Fetches GitHub events and inserts each one individually.
// Duplicate-key errors (23505) are silently skipped.
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: account, error: acctError } = await supabase
    .from("connected_accounts")
    .select("platform_username")
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

  let events;
  try {
    events = await fetchGitHubEvents(account.platform_username);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown GitHub API error";
    return NextResponse.json(
      { error: `Failed to fetch GitHub events: ${message}` },
      { status: 502 },
    );
  }

  const rows = parseGitHubEvents(events, user.id);

  // Deduplicate by external_id (GitHub API can repeat events)
  const seen = new Set<string>();
  const unique = rows.filter((r) => {
    if (seen.has(r.external_id)) return false;
    seen.add(r.external_id);
    return true;
  });

  let inserted = 0;
  for (const row of unique) {
    const { error } = await supabase.from("activities").insert(row);
    if (!error) {
      inserted++;
    }
    // 23505 = duplicate key → already exists, skip silently
  }

  return NextResponse.json({
    success: true,
    synced: inserted,
    skipped: unique.length - inserted,
    username: account.platform_username,
  });
}
