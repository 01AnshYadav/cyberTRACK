import type { ActivityInsert } from "./ingest";

// ── Hack The Box API response shapes ──────────────────────
interface HTBChallengeSolved {
  id: number;
  title: string;
  category: string;
  difficulty: string;
  solved_at: string;
}

interface HTBMachine {
  id: number;
  name: string;
  os: string;
  difficulty: string;
  retired: boolean;
  user_owns?: { solved_at: string } | null;
  root_owns?: { solved_at: string } | null;
}

interface HTBUserActivity {
  challenges_solved?: HTBChallengeSolved[];
  machines?: HTBMachine[];
}

// ── Fetch Hack The Box activity via public profile API ─────
// HTB exposes a limited public API at /profile/{username}.
// We use the machine and challenge data available there.
export async function fetchHackTheBoxActivity(
  username: string,
): Promise<ActivityInsert[]> {
  try {
    const res = await fetch(
      `https://www.hackthebox.com/api/v4/profile/${encodeURIComponent(username)}`,
      {
        headers: {
          "User-Agent": "cyber-tracker",
          Accept: "application/json",
        },
        next: { revalidate: 600 },
      },
    );

    if (!res.ok) return [];

    const data = (await res.json()) as HTBUserActivity;
    return normaliseHackTheBox(data);
  } catch {
    console.error("[hackthebox] failed to fetch activity for", username);
    return [];
  }
}

// ── Normalise Hack The Box data into Activity rows ─────────
export function normaliseHackTheBox(data: HTBUserActivity): ActivityInsert[] {
  const activities: ActivityInsert[] = [];

  if (data.challenges_solved) {
    for (const ch of data.challenges_solved) {
      activities.push({
        user_id: "", // caller must fill
        platform: "hackthebox",
        external_id: `htb-challenge-${ch.id}`,
        title: `Solved challenge: ${ch.title} (${ch.category}, ${ch.difficulty})`,
        type: "challenge",
        performed_at: ch.solved_at,
      });
    }
  }

  if (data.machines) {
    for (const m of data.machines) {
      if (m.user_owns?.solved_at) {
        activities.push({
          user_id: "",
          platform: "hackthebox",
          external_id: `htb-machine-user-${m.id}`,
          title: `User-owned machine: ${m.name} (${m.os}, ${m.difficulty})`,
          type: "machine_user",
          performed_at: m.user_owns.solved_at,
        });
      }

      if (m.root_owns?.solved_at) {
        activities.push({
          user_id: "",
          platform: "hackthebox",
          external_id: `htb-machine-root-${m.id}`,
          title: `Rooted machine: ${m.name} (${m.os}, ${m.difficulty})`,
          type: "machine_root",
          performed_at: m.root_owns.solved_at,
        });
      }
    }
  }

  return activities;
}
