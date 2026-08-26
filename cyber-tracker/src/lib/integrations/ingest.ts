import type { Activity } from "@/types/database";

// ── Activity rows as they go into Supabase ─────────────────
export type ActivityInsert = Omit<Activity, "id">;
