import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchHackTheBoxActivity } from "@/lib/integrations/hackthebox";

// POST /api/sync/hackthebox
// Fetches Hack The Box machines and challenges, then inserts into activities.
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
    .eq("platform", "hackthebox")
    .maybeSingle();

  if (acctError) {
    return NextResponse.json(
      { error: "Failed to look up connected account" },
      { status: 500 },
    );
  }

  if (!account?.platform_username) {
    return NextResponse.json(
      { error: "No Hack The Box account linked. Please connect Hack The Box first." },
      { status: 400 },
    );
  }

  let activities;
  try {
    activities = await fetchHackTheBoxActivity(account.platform_username);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown Hack The Box error";
    return NextResponse.json(
      { error: `Failed to fetch Hack The Box activity: ${message}` },
      { status: 502 },
    );
  }

  const rows = activities.map((a) => ({
    ...a,
    user_id: user.id,
  }));

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
  }

  return NextResponse.json({
    success: true,
    synced: inserted,
    skipped: unique.length - inserted,
    username: account.platform_username,
  });
}
