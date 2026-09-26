import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchGitHubEvents, parseGitHubEvents } from "@/lib/integrations/github";
import { fetchTryHackMeActivity } from "@/lib/integrations/tryhackme";
import { fetchHackTheBoxActivity } from "@/lib/integrations/hackthebox";
import { fetchPicoCTFActivity } from "@/lib/integrations/picoctf";
import type { ActivityInsert } from "@/lib/integrations/ingest";

// POST /api/sync/all
// Syncs all linked platform accounts for the authenticated user.
export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all connected accounts for the user
  const { data: accounts, error: acctError } = await supabase
    .from("connected_accounts")
    .select("platform, platform_username, access_token")
    .eq("user_id", user.id);

  if (acctError || !accounts || accounts.length === 0) {
    return NextResponse.json(
      { error: "No connected platform accounts found." },
      { status: 400 },
    );
  }

  const results: Record<
    string,
    { synced: number; skipped: number; status: string; error?: string }
  > = {};

  for (const account of accounts) {
    const platform = account.platform;
    const username = account.platform_username;

    if (!username) {
      results[platform] = {
        synced: 0,
        skipped: 0,
        status: "skipped",
        error: "Missing username",
      };
      continue;
    }

    try {
      let activities: ActivityInsert[] = [];

      switch (platform) {
        case "github": {
          const events = await fetchGitHubEvents(username, account.access_token);
          activities = parseGitHubEvents(events, user.id);
          break;
        }
        case "tryhackme": {
          const raw = await fetchTryHackMeActivity(username);
          activities = raw.map((a) => ({ ...a, user_id: user.id }));
          break;
        }
        case "hackthebox": {
          const raw = await fetchHackTheBoxActivity(username);
          activities = raw.map((a) => ({ ...a, user_id: user.id }));
          break;
        }
        case "picoctf": {
          const raw = await fetchPicoCTFActivity(username);
          activities = raw.map((a) => ({ ...a, user_id: user.id }));
          break;
        }
        default:
          break;
      }

      const seen = new Set<string>();
      const unique = activities.filter((r) => {
        if (!r.external_id || seen.has(r.external_id)) return false;
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

      results[platform] = {
        synced: inserted,
        skipped: unique.length - inserted,
        status: "success",
      };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sync encountered an error";
      results[platform] = {
        synced: 0,
        skipped: 0,
        status: "failed",
        error: message,
      };
    }
  }

  const totalSynced = Object.values(results).reduce(
    (acc, cur) => acc + (cur.synced || 0),
    0,
  );

  return NextResponse.json({
    success: true,
    totalSynced,
    details: results,
  });
}
