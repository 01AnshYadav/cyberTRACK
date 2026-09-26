import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { calculateStreak, calculateMilestones, classifyFocus } from "@/lib/streak";
import { formatDistanceToNow } from "@/lib/utils";
import type { Activity } from "@/types/database";

const PLATFORM_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string }
> = {
  github: {
    label: "GitHub",
    badge: "bg-zinc-800 text-zinc-200 border-zinc-700",
    dot: "bg-zinc-400",
  },
  tryhackme: {
    label: "TryHackMe",
    badge: "bg-red-950/60 text-red-300 border-red-800/60",
    dot: "bg-red-400",
  },
  hackthebox: {
    label: "Hack The Box",
    badge: "bg-purple-950/60 text-purple-300 border-purple-800/60",
    dot: "bg-purple-400",
  },
  picoctf: {
    label: "PicoCTF",
    badge: "bg-amber-950/60 text-amber-300 border-amber-800/60",
    dot: "bg-amber-400",
  },
};

interface MemberPageProps {
  params: Promise<{ id: string }>;
}

export default async function MemberProfilePage({ params }: MemberPageProps) {
  const { id: memberId } = await params;
  const supabase = await createClient();

  // Auth check
  const {
    data: { user: currentUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !currentUser) {
    redirect("/login");
  }

  // Fetch target member profile
  const { data: memberProfile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", memberId)
    .maybeSingle();

  if (profileError || !memberProfile) {
    notFound();
  }

  // Fetch group/pod information for this member
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name, invite_code, max_members)")
    .eq("user_id", memberId);

  const groupInfo = memberships?.[0]?.groups as unknown as { name?: string } | undefined;
  const podName = groupInfo?.name || "Cohort Pod";

  // Fetch all activities for this member
  const { data: rawActivities } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", memberId)
    .order("performed_at", { ascending: false });

  const activities: Activity[] = rawActivities ?? [];

  // Fetch connected accounts for this member
  const { data: connectedAccounts } = await supabase
    .from("connected_accounts")
    .select("platform, platform_username, external_id")
    .eq("user_id", memberId);

  // Calculate dynamic streak and momentum
  const streakInfo = calculateStreak(activities);
  const effectiveStreak = Math.max(memberProfile.streak_count, streakInfo.currentStreak);
  const milestones = calculateMilestones(activities, effectiveStreak);
  const focus = classifyFocus(activities);

  // Platform breakdown counts
  const platformCounts: Record<string, number> = {};
  for (const a of activities) {
    const p = a.platform.toLowerCase();
    platformCounts[p] = (platformCounts[p] ?? 0) + 1;
  }

  const isOwnProfile = currentUser.id === memberId;

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Navigation & Header */}
        <header>
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-emerald-400 transition-colors"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-950/60 text-2xl font-bold text-emerald-400 shadow-lg">
                  {memberProfile.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
                      {memberProfile.username}
                    </h1>
                    {isOwnProfile && (
                      <span className="rounded-md border border-emerald-500/30 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
                        You
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1 flex flex-wrap items-center gap-2">
                    <span>Cohort: <strong className="text-zinc-200">[{podName}]</strong></span>
                    <span>•</span>
                    <span>Joined {new Date(memberProfile.created_at).toLocaleDateString()}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-mono">
                      Primary Focus: {focus.primaryFocus}
                    </span>
                  </p>
                </div>
              </div>

              {/* Streak Callout */}
              <div className="flex items-center gap-4 bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 sm:px-5">
                <div className="text-center">
                  <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                    {effectiveStreak}
                  </span>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                    Day Streak
                  </p>
                </div>
                <div className="h-8 w-px bg-zinc-800" />
                <div className="text-center">
                  <span className="text-2xl font-extrabold text-zinc-400 font-mono">
                    {streakInfo.longestStreak}
                  </span>
                  <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
                    Best Streak
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Total Ingested Events
            </span>
            <p className="text-2xl font-bold text-zinc-100 font-mono mt-1">
              {activities.length}
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Active Days (7d)
            </span>
            <p className="text-2xl font-bold text-sky-400 font-mono mt-1">
              {streakInfo.activeDays7d} <span className="text-xs text-zinc-500">/ 7</span>
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Active Days (30d)
            </span>
            <p className="text-2xl font-bold text-purple-400 font-mono mt-1">
              {streakInfo.activeDays30d} <span className="text-xs text-zinc-500">/ 30</span>
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Platforms Synced
            </span>
            <p className="text-2xl font-bold text-emerald-400 font-mono mt-1">
              {new Set((connectedAccounts ?? []).map((a) => a.platform)).size}
            </p>
          </div>
        </div>

        {/* Focus & Platforms Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Focus Distribution */}
          <div className="lg:col-span-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
              Relative Focus Distribution
            </h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Active Coding (GitHub)</span>
                  <span className="font-mono text-zinc-300">{focus.codingCount} ({focus.codingPercent}%)</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    style={{ width: `${focus.codingPercent}%` }}
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Offensive Labs (HTB / THM)</span>
                  <span className="font-mono text-zinc-300">{focus.labsCount} ({focus.labsPercent}%)</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    style={{ width: `${focus.labsPercent}%` }}
                    className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">CTF Challenges (PicoCTF)</span>
                  <span className="font-mono text-zinc-300">{focus.ctfCount} ({focus.ctfPercent}%)</span>
                </div>
                <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                  <div
                    style={{ width: `${focus.ctfPercent}%` }}
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Platform Connections & Handles */}
          <div className="lg:col-span-6 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
              Connected Platform Handles
            </h2>
            <div className="space-y-2.5">
              {["github", "tryhackme", "hackthebox", "picoctf"].map((plat) => {
                const conn = (connectedAccounts ?? []).find(
                  (a) => a.platform.toLowerCase() === plat,
                );
                const cfg = PLATFORM_CONFIG[plat] || {
                  label: plat,
                  badge: "bg-zinc-800 text-zinc-400",
                  dot: "bg-zinc-600",
                };

                return (
                  <div
                    key={plat}
                    className="flex items-center justify-between rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3.5 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2 w-2 rounded-full ${conn ? cfg.dot : "bg-zinc-700"}`} />
                      <span className="text-xs font-semibold text-zinc-200">
                        {cfg.label}
                      </span>
                    </div>

                    <div className="text-right">
                      {conn ? (
                        <span className="font-mono text-xs text-emerald-400">
                          @{conn.platform_username || conn.external_id}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-600">Not linked</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Milestone Achievements */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
              Milestone Badges
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Disciplined milestones unlocked through passive activity ingestion
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {milestones.map((m) => (
              <div
                key={m.id}
                className={`rounded-xl border p-4 transition-all ${
                  m.unlocked
                    ? "border-emerald-500/30 bg-emerald-950/20 shadow-sm"
                    : "border-zinc-800/60 bg-zinc-950/30 opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{m.icon}</span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase font-bold ${
                      m.unlocked
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    {m.unlocked ? "Unlocked" : m.progress || "Locked"}
                  </span>
                </div>
                <h3 className="mt-3 text-xs font-bold text-zinc-200">
                  {m.name}
                </h3>
                <p className="mt-1 text-[11px] text-zinc-400 line-clamp-2">
                  {m.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Chronological Raw Telemetry Log */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
                Chronological Activity History
              </h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                Direct event timestamps with platform telemetry
              </p>
            </div>
            <span className="font-mono text-xs text-zinc-500">
              {activities.length} total entries
            </span>
          </div>

          {activities.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
              No activity logs recorded yet for this member.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/60 font-mono text-xs">
              {activities.map((a) => {
                const cfg = PLATFORM_CONFIG[a.platform.toLowerCase()] || {
                  label: a.platform,
                  badge: "bg-zinc-800 text-zinc-300 border-zinc-700",
                  dot: "bg-zinc-500",
                };

                return (
                  <div
                    key={a.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between py-3 gap-2 hover:bg-zinc-800/20 px-2 rounded transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-[10px] font-semibold shrink-0 ${cfg.badge}`}
                      >
                        {cfg.label}
                      </span>
                      <span className="text-zinc-200 truncate font-sans text-sm">
                        {a.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-zinc-500 text-[11px]">
                      <span title={new Date(a.performed_at).toLocaleString()}>
                        {formatDistanceToNow(a.performed_at)}
                      </span>
                      <span className="text-zinc-700">•</span>
                      <span className="text-zinc-600 font-mono text-[10px]">
                        {new Date(a.performed_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
