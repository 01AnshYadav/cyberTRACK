import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { StatsWidget } from "@/components/StatsWidget";
import { InviteModal } from "@/components/InviteModal";
import { PlatformStatus } from "@/components/platform-status";
import { ComparativeBreakdown } from "@/components/ComparativeBreakdown";
import { PodManagementModal } from "@/components/PodManagementModal";
import { calculateStreak, classifyFocus } from "@/lib/streak";
import type { Activity, Profile } from "@/types/database";

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
    picoctf: { label: "PicoCTF", colour: "bg-amber-400" },
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

/** Compute ranked members with dynamic streaks and weekly breakdown */
function computeRankedMembers(
  memberProfiles: Profile[],
  allActivities: Activity[],
) {
  const now = Date.now();
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

  const leaderboardMembers = memberProfiles.map((p, idx) => {
    const userActivities = allActivities.filter((a) => a.user_id === p.id);
    const dailyCount = userActivities.filter(
      (a) => new Date(a.performed_at).getTime() >= oneDayAgo,
    ).length;

    const streak = calculateStreak(userActivities);
    const effectiveStreak = Math.max(p.streak_count, streak.currentStreak);

    const weeklyByPlatform: Record<string, number> = {};
    for (const a of userActivities) {
      if (new Date(a.performed_at).getTime() >= sevenDaysAgo) {
        weeklyByPlatform[a.platform] = (weeklyByPlatform[a.platform] ?? 0) + 1;
      }
    }

    return {
      user: p,
      rank: idx + 1,
      dailyCount,
      weeklyByPlatform,
      effectiveStreak,
    };
  });

  leaderboardMembers.sort(
    (a, b) => (b.effectiveStreak ?? 0) - (a.effectiveStreak ?? 0),
  );
  return leaderboardMembers.map((m, idx) => ({
    ...m,
    rank: idx + 1,
  }));
}

/** Compute comparative focus breakdown for all cohort members */
function computeComparativeData(
  memberProfiles: Profile[],
  allActivities: Activity[],
) {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  return memberProfiles.map((p) => {
    const weeklyActs = allActivities.filter(
      (a) =>
        a.user_id === p.id &&
        new Date(a.performed_at).getTime() >= sevenDaysAgo,
    );
    const focus = classifyFocus(weeklyActs);
    return {
      user: p,
      codingCount: focus.codingCount,
      labsCount: focus.labsCount,
      ctfCount: focus.ctfCount,
      totalWeekly: weeklyActs.length,
      dominantFocus: focus.primaryFocus,
    };
  });
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // ── Auth check ─────────────────────────────────────────
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // ── Fetch profile ──────────────────────────────────────
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    // Attempt auto-provisioning profile if missing
    const username = user.email?.split("@")[0] || `user_${user.id.slice(0, 6)}`;
    const { data: newProf } = await supabase
      .from("profiles")
      .upsert({ id: user.id, username, streak_count: 0 })
      .select()
      .maybeSingle();

    profile = newProf || {
      id: user.id,
      username,
      avatar_url: null,
      streak_count: 0,
      created_at: new Date().toISOString(),
    };
  }

  // ── Fetch groups the user belongs to ───────────────────
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("user_id", user.id);

  const groupIds = (memberships ?? []).map((m) => m.group_id);

  // ── Fetch group details ────────────────────────────────
  let groupName = "Solo Pod";
  let inviteCode = "";
  let maxMembers = 3;
  let currentMemberCount = 1;

  if (groupIds.length > 0) {
    const { data: groups } = await supabase
      .from("groups")
      .select("name, invite_code, max_members")
      .in("id", groupIds)
      .limit(1);

    if (groups && groups.length > 0) {
      groupName = groups[0].name;
      inviteCode = groups[0].invite_code;
      maxMembers = groups[0].max_members || 3;
    }
  }

  // ── Fetch group members & activities ───────────────────
  let memberProfiles: Profile[] = [profile];
  let allActivities: Activity[] = [];

  if (groupIds.length > 0) {
    const { data: groupMembers } = await supabase
      .from("group_members")
      .select("user_id")
      .in("group_id", groupIds);

    const memberIds = [...new Set((groupMembers ?? []).map((m) => m.user_id))];
    currentMemberCount = memberIds.length || 1;

    if (memberIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", memberIds);

      if (profiles && profiles.length > 0) {
        memberProfiles = profiles as Profile[];
      }

      const { data: acts } = await supabase
        .from("activities")
        .select("*")
        .in("user_id", memberIds)
        .order("performed_at", { ascending: false });

      allActivities = acts ?? [];
    }
  } else {
    // Fetch solo user's activities
    const { data: acts } = await supabase
      .from("activities")
      .select("*")
      .eq("user_id", user.id)
      .order("performed_at", { ascending: false });

    allActivities = acts ?? [];
  }

  // ── Compute dynamic streak, daily count, and comparative breakdown ──
  const rankedMembers = computeRankedMembers(memberProfiles, allActivities);
  const comparativeData = computeComparativeData(memberProfiles, allActivities);

  // ── Build user map for ActivityFeed ────────────────────
  const userMap: Record<string, { username: string; avatar_url: string | null }> = {};
  for (const p of memberProfiles) {
    userMap[p.id] = { username: p.username, avatar_url: p.avatar_url };
  }

  // ── Fetch connected accounts for current user ──────────
  const { data: connectedAccounts } = await supabase
    .from("connected_accounts")
    .select("id, platform")
    .eq("user_id", user.id);

  // ── User stats ─────────────────────────────────────────
  const currentUserActivities = allActivities.filter((a) => a.user_id === user.id);
  const totalActivities = currentUserActivities.length;
  const activeDaysThisWeek = countActiveDays(currentUserActivities);
  const platformsConnected = new Set(
    (connectedAccounts ?? []).map((a) => a.platform),
  ).size;
  const groupRank =
    rankedMembers.findIndex((m) => m.user.id === user.id) + 1 || 1;
  const platformBreakdown = computePlatformBreakdown(currentUserActivities);

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-400 font-bold">
                Telemetry Active
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2">
              <span>⚡</span>
              <span>Cyber Tracker</span>
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Welcome back,{" "}
              <Link
                href={`/members/${profile.id}`}
                className="text-emerald-400 font-semibold hover:underline"
              >
                {profile.username}
              </Link>
              . Mutual accountability dashboard for cohort{" "}
              <span className="text-zinc-300 font-semibold">[{groupName}]</span>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {inviteCode ? (
              <InviteModal
                inviteCode={inviteCode}
                groupName={groupName}
                memberCount={currentMemberCount}
                maxMembers={maxMembers}
              />
            ) : (
              <PodManagementModal buttonText="Initialize Pod" />
            )}

            <Link
              href="/connections"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition-all hover:bg-zinc-800 hover:border-emerald-500 hover:text-emerald-400 shadow-sm"
            >
              <span>🔌</span>
              <span>Platforms ({platformsConnected}/4)</span>
            </Link>
          </div>
        </header>

        {/* Onboarding Banner if user has no Pod */}
        {groupIds.length === 0 && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6 backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-emerald-300">
                  Join or Form Your Accountability Pod
                </h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-xl leading-relaxed">
                  Cyber Tracker relies on small, intimate cohorts (up to 3 members initially) for mutual peer accountability. Create your pod to invite peers, or enter an invite code to join an existing cohort.
                </p>
              </div>
              <div className="shrink-0">
                <PodManagementModal buttonText="Create or Join Pod" />
              </div>
            </div>
          </div>
        )}

        {/* Comparative Focus Breakdown Matrix */}
        <ComparativeBreakdown members={comparativeData} />

        {/* Main Grid: Activity feed (7 cols) + Widgets (5 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Feed */}
          <div className="lg:col-span-7">
            <ActivityFeed activities={allActivities} userMap={userMap} />
          </div>

          {/* Right: Widgets */}
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
            <Leaderboard members={rankedMembers} />
            <PlatformStatus connectedAccounts={connectedAccounts ?? []} />
          </div>
        </div>
      </div>
    </div>
  );
}
