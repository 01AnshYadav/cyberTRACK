"use client";

interface PlatformBreakdown {
  label: string;
  count: number;
  colour: string;
}

interface StatsWidgetProps {
  stats: {
    totalActivities: number;
    activeDaysThisWeek: number;
    platformsConnected: number;
    groupRank: number;
  };
  platformBreakdown: PlatformBreakdown[];
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

export function StatsWidget({ stats, platformBreakdown }: StatsWidgetProps) {
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

  const maxCount = Math.max(...platformBreakdown.map((p) => p.count), 1);

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
          {platformBreakdown.length === 0 ? (
            <p className="text-xs text-zinc-600">
              No platform activity yet.
            </p>
          ) : (
            platformBreakdown.map((p) => (
              <PlatformBar
                key={p.label}
                label={p.label}
                count={p.count}
                max={maxCount}
                colour={p.colour}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
