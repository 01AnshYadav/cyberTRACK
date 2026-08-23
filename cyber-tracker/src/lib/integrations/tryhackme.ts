import type { ActivityInsert } from "./ingest";

// ── TryHackMe API response shapes ─────────────────────────
interface THMRoomCompleted {
  room_id: number;
  room_name: string;
  completed_at: string;
}

interface THMBadge {
  badge_id: number;
  badge_name: string;
  badge_image: string;
  unlocked_at: string;
}

interface THMProfile {
  username: string;
  rooms_completed?: THMRoomCompleted[];
  badges?: THMBadge[];
}

// ── Fetch TryHackMe user data via public profile ──────────
// TryHackMe doesn't have a public REST API for activity logs,
// so we scrape the public profile page and parse the JSON
// embedded in it. If that fails, we return an empty array.
export async function fetchTryHackMeActivity(
  username: string,
): Promise<ActivityInsert[]> {
  try {
    const res = await fetch(
      `https://tryhackme.com/p/${encodeURIComponent(username)}`,
      {
        headers: { "User-Agent": "cyber-tracker" },
        next: { revalidate: 600 },
      },
    );

    if (!res.ok) return [];

    const html = await res.text();

    // Try to extract JSON data embedded in the page
    const dataMatch = html.match(
      /window\.__INITIAL_STATE__\s*=\s*({[\s\S]+?});?\s*<\/script>/,
    );
    if (!dataMatch) return [];

    const data = JSON.parse(dataMatch[1]) as THMProfile;
    return normaliseTryHackMe(data);
  } catch {
    console.error("[tryhackme] failed to fetch activity for", username);
    return [];
  }
}

// ── Normalise TryHackMe data into Activity rows ───────────
export function normaliseTryHackMe(profile: THMProfile): ActivityInsert[] {
  const activities: ActivityInsert[] = [];

  if (profile.rooms_completed) {
    for (const room of profile.rooms_completed) {
      activities.push({
        user_id: "", // caller must fill
        platform: "tryhackme",
        external_id: `thm-room-${room.room_id}`,
        title: `Completed room: ${room.room_name}`,
        type: "room_complete",
        performed_at: room.completed_at,
      });
    }
  }

  if (profile.badges) {
    for (const badge of profile.badges) {
      activities.push({
        user_id: "",
        platform: "tryhackme",
        external_id: `thm-badge-${badge.badge_id}`,
        title: `Earned badge: ${badge.badge_name}`,
        type: "badge",
        performed_at: badge.unlocked_at,
      });
    }
  }

  return activities;
}
