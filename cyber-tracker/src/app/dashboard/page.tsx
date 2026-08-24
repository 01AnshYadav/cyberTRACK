import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { StatsWidget } from "@/components/StatsWidget";
import { InviteModal } from "@/components/InviteModal";
import { PlatformStatus } from "@/components/platform-status";
import type { Activity, Profile } from "@/types/database";

// ── Types for computed leaderboard data ─────────────────
interface LeaderboardMember {
  user: Profile;
  rank: number;
  dailyCount: number;
  weeklyByPlatform: Record<string, number>;
}

/** Compute weekly platform breakdown from activities */
function computePlatformBreakdown(
  activities: Activity[],
): { label: string; count: number; colour: string }[] {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const counts: Record<string, number> = {};
  for (const a of activities) {
    const ts = new Date(a.performed_at).getTime();
    if (ts >= sevenDaysAgo) {
      counts[a.platform] = (counts[a.platform] ?? 0) + 1;
    }
  }

  const PLATFORM_LABELS: Record<string, { label: string; colour: string }> = {
    github: { label: "GitHub", colour: "bg-zinc-400" },
    hackthebox: { label: "Hack The Box", colour: "bg-purple-400" },
    tryhackme: { label: "TryHackMe", colour: "bg-red-400" },
    picoctf: { label: "PicoCTF", colour: "bg-yellow-400" },
  };

  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .map(([platform, count]) => {
      const info = PLATFORM_LABELS[platform] ?? {
        label: platform,
        colour: "bg-zinc-400",
      };
      return { label: info.label, count, colour: info.colour };
    });
}

/** Count distinct days with activity in the last 7 days */
function countActiveDays(activities: Activity[]): number {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const days = new Set<string>();
  for (const a of activities) {
    const ts = new Date(a.performed_at).getTime();
    if (ts >= sevenDaysAgo) {
      days.add(new Date(a.performed_at).toISOString().slice(0, 10));
    }
  }
  return days.size;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // ── Auth check ─────────────────────────────────────────
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // ── Fetch profile ──────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    // Profile doesn't exist yet — show a setup prompt
    return (
      <div className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-emerald-400">
              Welcome to Cyber Tracker
            </h1>
            <p className="mt-3 text-zinc-400">
              Your account is set up, but your profile hasn&apos;t been created yet.
              Please contact your team admin to join a group.
            </p>
            <a
              href="/"
              className="mt-6 inline-block rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-emerald-500"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ── Fetch groups the user belongs to ───────────────────
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  const groupIds = (memberships ?? []).map((m) => m.group_id);

  // ── Fetch group details ────────────────────────────────
  let groupName = "Your Group";
  let inviteCode = "";
  if (groupIds.length > 0) {
    const { data: groups } = await supabase
      .from("groups")
      .select("name, invite_code")
      .in("id", groupIds)
      .limit(1);

    if (groups && groups.length > 0) {
      groupName = groups[0].name;
      inviteCode = groups[0].invite_code;
    }
  }

  // ── Fetch group members (for leaderboard) ──────────────
  let members: LeaderboardMember[] = [];
  if (groupIds.length > 0) {
    const { data: groupMembers } = await supabase
      .from("group_members")
      .select("user_id")
      .in("group_id", groupIds);

    const memberIds = [...new Set((groupMembers ?? []).map((m) => m.user_id))];

    if (memberIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", memberIds);

      // Fetch all activities for group members
      const { data: allActivities } = await supabase
        .from("activities")
        .select("*")
        .in("user_id", memberIds)
        .order("performed_at", { ascending: false });

      const activities = allActivities ?? [];
      const now = Date.now();
      const oneDayAgo = now - 24 * 60 * 60 * 1000;

      members = (profiles ?? []).map((p, idx) => {
        const userActivities = activities.filter((a) => a.user_id === p.id);
        const dailyCount = userActivities.filter(
          (a) => new Date(a.performed_at).getTime() >= oneDayAgo,
        ).length;

        // Weekly platform breakdown per user
        const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
        const weeklyByPlatform: Record<string, number> = {};
        for (const a of userActivities) {
          if (new Date(a.performed_at).getTime() >= sevenDaysAgo) {
            weeklyByPlatform[a.platform] =
              (weeklyByPlatform[a.platform] ?? 0) + 1;
          }
        }

        return {
          user: p as Profile,
          rank: idx + 1,
          dailyCount,
          weeklyByPlatform,
        };
      });

      // Sort by streak (descending)
      members.sort((a, b) => b.user.streak_count - a.user.streak_count);
      members = members.map((m, idx) => ({ ...m, rank: idx + 1 }));
    }
  }

  // ── Fetch recent activities for the user's groups ──────
  let activities: Activity[] = [];
  if (groupIds.length > 0) {
    const { data: groupActivities } = await supabase
      .from("activities")
      .select("*")
      .in("user_id", members.map((m) => m.user.id))
      .order("performed_at", { ascending: false })
      .limit(20);

    activities = groupActivities ?? [];
  }

  // ── Build user map for ActivityFeed ────────────────────
  const userMap: Record<string, { username: string; avatar_url: string | null }> = {};
  for (const m of members) {
    userMap[m.user.id] = {
      username: m.user.username,
      avatar_url: m.user.avatar_url,
    };
  }

  // ── Fetch connected accounts ───────────────────────────
  const { data: connectedAccounts } = await supabase
    .from("connected_accounts")
    .select("id, platform")
    .eq("user_id", user.id);

  // ── Compute stats ──────────────────────────────────────
  const userActivities = activities.filter((a) => a.user_id === user.id);
  const totalActivities = userActivities.length;
  const activeDaysThisWeek = countActiveDays(userActivities);
  const platformsConnected = new Set(
    (connectedAccounts ?? []).map((a) => a.platform),
  ).size;

  // Group rank is the user's position in the leaderboard
  const groupRank =
    members.findIndex((m) => m.user.id === user.id) + 1 || 1;

  const platformBreakdown = computePlatformBreakdown(userActivities);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        {/* ── Header ───────────────────────────────────────── */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-emerald-400">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Welcome back,{" "}
              <span className="text-zinc-300">{profile.username}</span>.
              Here&apos;s your team&apos;s activity overview.
            </p>
          </div>
          {inviteCode && (
            <InviteModal inviteCode={inviteCode} groupName={groupName} />
          )}
        </header>

        {/* ── Main grid ────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ── Left column: Activity feed (spans 7 cols on lg) ── */}
          <div className="lg:col-span-7">
            <ActivityFeed activities={activities} userMap={userMap} />
          </div>

          {/* ── Right column: Widgets (spans 5 cols on lg) ────── */}
          <div className="space-y-6 lg:col-span-5">
            <StatsWidget
              stats={{
                totalActivities,
                activeDaysThisWeek,
                platformsConnected,
                groupRank,
              }}
              platformBreakdown={platformBreakdown}
            />
            <Leaderboard members={members} />
            <PlatformStatus
              connectedAccounts={connectedAccounts ?? []}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
