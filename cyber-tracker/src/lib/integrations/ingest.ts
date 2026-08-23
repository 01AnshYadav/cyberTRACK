import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity } from "@/types/database";

// ── Activity rows as they go into Supabase ─────────────────
export type ActivityInsert = Omit<Activity, "id">;

// ── Core ingestion: upsert activities deduplicated by       ──
//   (platform, external_id) via the UNIQUE constraint.       ──
export async function upsertActivities(
  supabase: SupabaseClient,
  rows: ActivityInsert[],
): Promise<{ inserted: number; error?: string }> {
  if (rows.length === 0) return { inserted: 0 };

  const { error } = await supabase
    .from("activities")
    .upsert(rows, {
      onConflict: "platform,external_id",
      ignoreDuplicates: false, // update if exists
    });

  if (error) {
    console.error("[ingest] upsert error:", error.message);
    return { inserted: 0, error: error.message };
  }

  return { inserted: rows.length };
}
