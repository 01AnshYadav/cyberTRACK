"use client";

import type { MockStats } from "@/lib/mockData";

interface StatsWidgetProps {
  stats: MockStats;
}

/** Weekly platform breakdown bars */
function PlatformBar({
  label,
  count,
  max,
  colour,
}: {
  label: string;
  count: number;
  max: number;
  colour: string;
}) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-400">{label}</span>
        <span className="font-medium text-zinc-300">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={`h-full rounded-full transition-all ${colour}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export function StatsWidget({ stats }: StatsWidgetProps) {
  const summaryCards = [
    {
      label: "Total Activities",
      value: stats.totalActivities,
      accent: "text-emerald-400",
    },
    {
      label: "Active Days (7d)",
      value: stats.activeDaysThisWeek,
      accent: "text-sky-400",
    },
    {
      label: "Platforms",
      value: stats.platformsConnected,
      accent: "text-purple-400",
    },
    {
      label: "Group Rank",
      value: `#${stats.groupRank}`,
      accent: "text-yellow-400",
    },
  ];

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
        Your Stats
      </h2>

      {/* Summary grid */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        {summaryCards.map((c) => (
          <div
            key={c.label}
            className="rounded-lg bg-zinc-800/40 px-3 py-3 text-center"
          >
            <p className={`text-xl font-bold ${c.accent}`}>{c.value}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wider text-zinc-500">
              {c.label}
            </p>
          </div>
        ))}
      </div>

      {/* Weekly platform breakdown */}
      <div>
        <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          This Week by Platform
        </h3>
        <div className="space-y-3">
          <PlatformBar
            label="GitHub"
            count={14}
            max={20}
            colour="bg-zinc-400"
          />
          <PlatformBar
            label="Hack The Box"
            count={7}
            max={20}
            colour="bg-purple-400"
          />
          <PlatformBar
            label="TryHackMe"
            count={3}
            max={20}
            colour="bg-red-400"
          />
          <PlatformBar
            label="PicoCTF"
            count={0}
            max={20}
            colour="bg-yellow-400"
          />
        </div>
      </div>
    </div>
  );
}
