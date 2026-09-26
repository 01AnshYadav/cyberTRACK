"use client";

import { useState } from "react";
import Link from "next/link";
import type { Activity } from "@/types/database";
import { formatDistanceToNow } from "@/lib/utils";

/** Map platform slug → display label + colour classes */
const PLATFORMS: Record<
  string,
  { label: string; badge: string; initial: string }
> = {
  github: {
    label: "GitHub",
    badge: "bg-zinc-800 text-zinc-200 border-zinc-700",
    initial: "GH",
  },
  tryhackme: {
    label: "TryHackMe",
    badge: "bg-red-950/60 text-red-300 border-red-800/60",
    initial: "TH",
  },
  hackthebox: {
    label: "Hack The Box",
    badge: "bg-purple-950/60 text-purple-300 border-purple-800/60",
    initial: "HT",
  },
  picoctf: {
    label: "PicoCTF",
    badge: "bg-amber-950/60 text-amber-300 border-amber-800/60",
    initial: "PC",
  },
};

function getPlatformInfo(platform: string) {
  return (
    PLATFORMS[platform.toLowerCase()] ?? {
      label: platform,
      badge: "bg-zinc-800 text-zinc-300 border-zinc-700",
      initial: platform.slice(0, 2).toUpperCase(),
    }
  );
}

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
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={avatarUrl}
        alt={username}
        className="mt-0.5 h-8 w-8 shrink-0 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-950/70 text-xs font-bold text-emerald-400 border border-emerald-500/30">
      {initial}
    </div>
  );
}

interface ActivityFeedProps {
  activities: Activity[];
  userMap?: Record<string, { username: string; avatar_url: string | null }>;
}

export function ActivityFeed({ activities, userMap = {} }: ActivityFeedProps) {
  const [filter, setFilter] = useState<string>("all");

  const filtered =
    filter === "all"
      ? activities
      : activities.filter((a) => a.platform.toLowerCase() === filter);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <span>📡</span> Live Telemetry Feed
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Automated event ingestion across cohort members
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
          {["all", "github", "tryhackme", "hackthebox", "picoctf"].map((p) => {
            const label = p === "all" ? "All" : PLATFORMS[p]?.label || p;
            const active = filter === p;
            return (
              <button
                key={p}
                onClick={() => setFilter(p)}
                className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-zinc-800 text-emerald-400 font-semibold shadow-sm"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-800 p-8 text-center text-xs text-zinc-500">
          No activities found for this filter.
        </div>
      ) : (
        <ul className="divide-y divide-zinc-800/60">
          {filtered.map((a) => {
            const info = getPlatformInfo(a.platform);
            const profile = userMap[a.user_id];
            const username = profile?.username ?? "Unknown";

            return (
              <li
                key={a.id}
                className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0"
              >
                <Link href={`/members/${a.user_id}`}>
                  <Avatar
                    username={username}
                    avatarUrl={profile?.avatar_url ?? null}
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/members/${a.user_id}`}
                      className="text-sm font-semibold text-zinc-200 hover:text-emerald-400 transition-colors"
                    >
                      {username}
                    </Link>
                    <span
                      className={`inline-block rounded border px-2 py-0.5 text-[10px] font-semibold ${info.badge}`}
                    >
                      {info.label}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-zinc-300 font-mono">
                    {a.title}
                  </p>
                </div>

                <time
                  title={new Date(a.performed_at).toLocaleString()}
                  className="shrink-0 whitespace-nowrap text-[11px] text-zinc-500 font-mono"
                >
                  {formatDistanceToNow(a.performed_at)}
                </time>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
