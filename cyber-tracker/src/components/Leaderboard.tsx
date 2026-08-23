"use client";

import type { MockMember } from "@/lib/mockData";

const RANK_COLOURS: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-zinc-300",
  3: "text-amber-600",
};

const RANK_ICONS: Record<number, string> = {
  1: "\u{1F947}",
  2: "\u{1F948}",
  3: "\u{1F949}",
};

interface LeaderboardProps {
  members: MockMember[];
}

export function Leaderboard({ members }: LeaderboardProps) {
  const sorted = [...members].sort((a, b) => b.user.streak_count - a.user.streak_count);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-300">
        Team Leaderboard
      </h2>
      <ul className="space-y-3">
        {sorted.map((m, idx) => {
          const rank = idx + 1;
          const colour = RANK_COLOURS[rank] ?? "text-zinc-500";
          const medal = RANK_ICONS[rank] ?? `#${rank}`;

          return (
            <li
              key={m.user.id}
              className="flex items-center justify-between rounded-lg bg-zinc-800/40 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className={`w-6 text-center text-sm font-bold ${colour}`}>
                  {medal}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-900/60 text-xs font-semibold text-emerald-300">
                  {m.user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {m.user.username}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {m.dailyCount} activities today
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-emerald-400">
                  {m.user.streak_count}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-zinc-500">
                  day streak
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
