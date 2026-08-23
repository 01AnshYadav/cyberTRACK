"use client";

import { formatDistanceToNow } from "@/lib/utils";

interface Activity {
  id: string;
  platform: string;
  title: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

const platformColors: Record<string, string> = {
  github: "bg-zinc-700 text-zinc-200",
  tryhackme: "bg-red-900/60 text-red-300",
  hackthebox: "bg-purple-900/60 text-purple-300",
  picoctf: "bg-yellow-900/60 text-yellow-300",
  ctf: "bg-orange-900/60 text-orange-300",
};

function platformTag(platform: string) {
  const cls =
    platformColors[platform.toLowerCase()] ??
    "bg-zinc-800 text-zinc-300";
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {platform}
    </span>
  );
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider">
          Recent Activity
        </h2>
        <p className="text-zinc-500 text-sm">
          No activity yet. Connect a platform to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-sm font-semibold text-zinc-300 mb-4 uppercase tracking-wider">
        Recent Activity
      </h2>
      <ul className="divide-y divide-zinc-800/60">
        {activities.map((a) => (
          <li key={a.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            {/* Avatar placeholder */}
            <div className="mt-0.5 h-8 w-8 shrink-0 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-400">
              {a.profiles?.username?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-zinc-200">
                  {a.profiles?.username ?? "Unknown"}
                </span>
                {platformTag(a.platform)}
              </div>
              <p className="text-sm text-zinc-400 truncate mt-0.5">
                {a.title}
              </p>
            </div>
            <time className="text-xs text-zinc-600 whitespace-nowrap shrink-0">
              {formatDistanceToNow(a.created_at)}
            </time>
          </li>
        ))}
      </ul>
    </div>
  );
}
