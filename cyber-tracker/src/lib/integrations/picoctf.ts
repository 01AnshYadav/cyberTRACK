import type { ActivityInsert } from "./ingest";

// ── PicoCTF response types ──────────────────────────────────
export interface PicoCTFSolve {
  id: string | number;
  challenge_name: string;
  category: string;
  points: number;
  solved_at: string;
}

export interface PicoCTFProfile {
  username: string;
  user_id?: string | number;
  solves?: PicoCTFSolve[];
  total_score?: number;
}

/**
 * Fetch public activity and solves for a PicoCTF user.
 * PicoCTF API exposes user statistics or public profile data.
 * If external network request fails or user profile is restricted, returns empty array.
 */
export async function fetchPicoCTFActivity(
  username: string,
): Promise<ActivityInsert[]> {
  try {
    // PicoCTF public user profile endpoint
    const res = await fetch(
      `https://play.picoctf.org/api/users/${encodeURIComponent(username)}/solves`,
      {
        headers: {
          "User-Agent": "cyber-tracker",
          Accept: "application/json",
        },
        next: { revalidate: 600 },
      },
    );

    if (res.ok) {
      const data = (await res.json()) as { solves?: PicoCTFSolve[] };
      if (Array.isArray(data.solves) && data.solves.length > 0) {
        return normalisePicoCTF(data.solves);
      }
    }

    // Secondary attempt: check public scoreboard / profile
    const profileRes = await fetch(
      `https://play.picoctf.org/api/user/${encodeURIComponent(username)}`,
      {
        headers: {
          "User-Agent": "cyber-tracker",
          Accept: "application/json",
        },
        next: { revalidate: 600 },
      },
    );

    if (profileRes.ok) {
      const profile = (await profileRes.json()) as PicoCTFProfile;
      if (profile.solves) {
        return normalisePicoCTF(profile.solves);
      }
    }

    return [];
  } catch (err) {
    console.error("[picoctf] Error fetching activity for", username, err);
    return [];
  }
}

/**
 * Normalise PicoCTF solves into ActivityInsert records.
 */
export function normalisePicoCTF(solves: PicoCTFSolve[]): ActivityInsert[] {
  return solves.map((s) => ({
    user_id: "", // Caller fills this with Supabase user ID
    platform: "picoctf",
    external_id: `pico-${s.id || s.challenge_name.toLowerCase().replace(/\s+/g, "-")}`,
    title: `Solved CTF: ${s.challenge_name} (${s.category || "General"}, ${s.points || 100}pts)`,
    type: "solve",
    performed_at: s.solved_at || new Date().toISOString(),
  }));
}
