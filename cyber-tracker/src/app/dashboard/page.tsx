import {
  MOCK_ACTIVITIES,
  MOCK_MEMBERS,
  MOCK_STATS,
  MOCK_USER,
  MOCK_GROUP,
  MOCK_CONNECTED_ACCOUNTS,
} from "@/lib/mockData";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { StatsWidget } from "@/components/StatsWidget";
import { InviteModal } from "@/components/InviteModal";
import { PlatformStatus } from "@/components/platform-status";

/** Build a user-id → profile lookup so ActivityFeed can display names/avatars */
function buildUserMap() {
  const map: Record<string, { username: string; avatar_url: string | null }> =
    {};
  for (const m of MOCK_MEMBERS) {
    map[m.user.id] = {
      username: m.user.username,
      avatar_url: m.user.avatar_url,
    };
  }
  return map;
}

export default function DashboardPage() {
  const userMap = buildUserMap();

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
              Welcome back, <span className="text-zinc-300">{MOCK_USER.username}</span>. Here&apos;s your team&apos;s activity overview.
            </p>
          </div>
          <InviteModal
            inviteCode={MOCK_GROUP.invite_code}
            groupName={MOCK_GROUP.name}
          />
        </header>

        {/* ── Main grid ────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ── Left column: Activity feed (spans 7 cols on lg) ── */}
          <div className="lg:col-span-7">
            <ActivityFeed activities={MOCK_ACTIVITIES} userMap={userMap} />
          </div>

          {/* ── Right column: Widgets (spans 5 cols on lg) ── */}
          <div className="space-y-6 lg:col-span-5">
            <StatsWidget stats={MOCK_STATS} />
            <Leaderboard members={MOCK_MEMBERS} />
            <PlatformStatus
              connectedAccounts={MOCK_CONNECTED_ACCOUNTS}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
