import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ActivityFeed } from "@/components/activity-feed";
import { StreakCard } from "@/components/streak-card";
import { PlatformStatus } from "@/components/platform-status";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Fetch the user's groups
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, groups(id, name)")
    .eq("user_id", user.id);

  const groupIds = (memberships ?? []).map((m) => m.group_id);

  // Fetch recent activities from all user's groups
  const { data: rawActivities } = await supabase
    .from("activities")
    .select(
      `
      id,
      platform,
      title,
      created_at,
      profiles(username, avatar_url)
    `,
    )
    .in("group_id", groupIds.length > 0 ? groupIds : ["00000000-0000-0000-0000-000000000000"])
    .order("created_at", { ascending: false })
    .limit(20);

  // Supabase returns profiles as an array; unwrap to a single object
  const activities = (rawActivities ?? []).map((a) => ({
    ...a,
    profiles: Array.isArray(a.profiles) ? a.profiles[0] ?? null : a.profiles,
  }));

  // Fetch connected accounts
  const { data: connectedAccounts } = await supabase
    .from("connected_accounts")
    .select("id, platform, connected_at")
    .eq("user_id", user.id);

  return (
    <div className="flex-1 p-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-emerald-400">
          Dashboard
        </h1>
        <p className="text-zinc-500 mt-1">
          Welcome back. Here&apos;s your team&apos;s activity overview.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed – spans 2 columns on large screens */}
        <div className="lg:col-span-2">
          <ActivityFeed activities={activities} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <StreakCard />
          <PlatformStatus connectedAccounts={connectedAccounts ?? []} />
        </div>
      </div>
    </div>
  );
}
