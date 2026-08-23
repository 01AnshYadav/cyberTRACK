"use client";

import type { Activity } from "@/types/database";
import { formatDistanceToNow } from "@/lib/utils";

/** Map platform slug → display label + colour classes */
const PLATFORMS: Record<
  string,
  { label: string; badge: string; initial: string }
> = {
  github: {
    label: "GitHub",
    badge: "bg-zinc-700 text-zinc-200",
    initial: "GH",
  },
  tryhackme: {
    label: "TryHackMe",
    badge: "bg-red-900/60 text-red-300",
    initial: "TH",
  },
  hackthebox: {
    label: "Hack The Box",
    badge: "bg-purple-900/60 text-purple-300",
    initial: "HT",
  },
  picoctf: {
    label: "PicoCTF",
    badge: "bg-yellow-900/60 text-yellow-300",
    initial: "PC",
  },
};

function getPlatformInfo(platform: string) {
  return (
    PLATFORMS[platform.toLowerCase()] ?? {
      label: platform,
      badge: "bg-zinc-800 text-zinc-300",
      initial: platform.slice(0, 2).toUpperCase(),
    }
  );
}

/** Avatar: shows uploaded image or falls back to a coloured circle with initial */
function Avatar({
  username,
  avatarUrl,
}: {
  username: string;
  avatarUrl: string | null;
}) {
  const initial = username.charAt(0).toUpperCase();

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-900/60 text-xs font-semibold text-emerald-300">
      {initial}
    </div>
  );
}

interface ActivityFeedProps {
  activities: Activity[];
  /** Optional map of user_id → { username, avatar_url } for display */
  userMap?: Record<string, { username: string; avatar_url: string | null }>;
}

export function ActivityFeed({ activities, userMap = {} }: ActivityFeedProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
          Recent Activity
        </h2>
        <p className="text-sm text-zinc-500">
          No activity yet. Connect a platform to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
        Recent Activity
      </h2>
      <ul className="divide-y divide-zinc-800/60">
        {activities.map((a) => {
          const info = getPlatformInfo(a.platform);
          const profile = userMap[a.user_id];

          return (
            <li
              key={a.id}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <Avatar
                username={profile?.username ?? "Unknown"}
                avatarUrl={profile?.avatar_url ?? null}
              />

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-zinc-200">
                    {profile?.username ?? "Unknown"}
                  </span>
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${info.badge}`}
                  >
                    {info.label}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm text-zinc-400">
                  {a.title}
                </p>
              </div>

              <time className="shrink-0 whitespace-nowrap text-xs text-zinc-600">
                {formatDistanceToNow(a.performed_at)}
              </time>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
