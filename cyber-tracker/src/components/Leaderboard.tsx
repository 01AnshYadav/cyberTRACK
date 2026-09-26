"use client";

import Link from "next/link";
import type { Profile } from "@/types/database";

const RANK_COLOURS: Record<number, string> = {
  1: "text-yellow-400 border-yellow-500/30 bg-yellow-950/20",
  2: "text-zinc-300 border-zinc-500/30 bg-zinc-800/20",
  3: "text-amber-500 border-amber-600/30 bg-amber-950/20",
};

const RANK_ICONS: Record<number, string> = {
  1: "🥇",
  2: "🥈",
  3: "🥉",
};

export interface LeaderboardMemberData {
  user: Profile;
  rank: number;
  dailyCount: number;
  weeklyByPlatform?: Record<string, number>;
  effectiveStreak?: number;
}

interface LeaderboardProps {
  members: LeaderboardMemberData[];
}

export function Leaderboard({ members }: LeaderboardProps) {
  const sorted = [...members].sort((a, b) => {
    const streakA = a.effectiveStreak ?? a.user.streak_count;
    const streakB = b.effectiveStreak ?? b.user.streak_count;
    return streakB - streakA;
  });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300">
            Cohort Leaderboard
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Ranked by streak consistency & mutual peer accountability
          </p>
        </div>
        <span className="font-mono text-xs text-emerald-400">
          {members.length} {members.length === 1 ? "member" : "members"}
        </span>
      </div>

      <ul className="space-y-2.5">
        {sorted.map((m, idx) => {
          const rank = idx + 1;
          const badgeStyle = RANK_COLOURS[rank] ?? "text-zinc-500 border-zinc-800 bg-zinc-900";
          const medal = RANK_ICONS[rank] ?? `#${rank}`;
          const displayStreak = m.effectiveStreak ?? m.user.streak_count;

          return (
            <li key={m.user.id}>
              <Link
                href={`/members/${m.user.id}`}
                className="group flex items-center justify-between rounded-lg border border-zinc-800/60 bg-zinc-800/30 px-3.5 py-2.5 transition-all hover:bg-zinc-800/60 hover:border-zinc-700"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-md border text-xs font-bold ${badgeStyle}`}
                  >
                    {medal}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-950/80 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                    {m.user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200 group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                      <span>{m.user.username}</span>
                      <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400">→</span>
                    </p>
                    <p className="text-[11px] text-zinc-500 font-mono">
                      {m.dailyCount} activities today
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-base font-extrabold text-emerald-400 font-mono">
                    {displayStreak}
                  </p>
                  <p className="text-[9px] uppercase tracking-wider text-zinc-500 font-medium">
                    day streak
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
