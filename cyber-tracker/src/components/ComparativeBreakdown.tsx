"use client";

import Link from "next/link";
import type { Profile } from "@/types/database";

export interface MemberComparativeStats {
  user: Profile;
  codingCount: number;
  labsCount: number;
  ctfCount: number;
  totalWeekly: number;
  dominantFocus: string;
}

interface ComparativeBreakdownProps {
  members: MemberComparativeStats[];
}

export function ComparativeBreakdown({ members }: ComparativeBreakdownProps) {
  if (!members || members.length === 0) {
    return null;
  }

  // Calculate cohort aggregates
  const totalCohort = members.reduce((acc, m) => acc + m.totalWeekly, 0);
  const totalCoding = members.reduce((acc, m) => acc + m.codingCount, 0);
  const totalLabs = members.reduce((acc, m) => acc + m.labsCount, 0);
  const totalCtf = members.reduce((acc, m) => acc + m.ctfCount, 0);

  const codingPct = totalCohort > 0 ? Math.round((totalCoding / totalCohort) * 100) : 0;
  const labsPct = totalCohort > 0 ? Math.round((totalLabs / totalCohort) * 100) : 0;
  const ctfPct = totalCohort > 0 ? Math.max(0, 100 - (codingPct + labsPct)) : 0;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 shadow-sm">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <span>⚖️</span> Comparative Focus Breakdown
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Weekly output across platforms (Active Coding vs. Lab Solving vs. CTF)
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-zinc-400 font-mono text-[11px]">Coding ({codingPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <span className="text-zinc-400 font-mono text-[11px]">Labs ({labsPct}%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-zinc-400 font-mono text-[11px]">CTF ({ctfPct}%)</span>
          </div>
        </div>
      </div>

      {/* Cohort-wide macro ratio bar */}
      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-zinc-800 flex">
        <div
          style={{ width: `${codingPct}%` }}
          className="bg-emerald-500 transition-all duration-500"
          title={`Coding: ${totalCoding} events (${codingPct}%)`}
        />
        <div
          style={{ width: `${labsPct}%` }}
          className="bg-purple-500 transition-all duration-500"
          title={`Labs: ${totalLabs} events (${labsPct}%)`}
        />
        <div
          style={{ width: `${ctfPct}%` }}
          className="bg-amber-500 transition-all duration-500"
          title={`CTF: ${totalCtf} events (${ctfPct}%)`}
        />
      </div>

      {/* Individual member comparative comparison rows */}
      <div className="space-y-3.5">
        {members.map((m) => {
          const mTotal = m.totalWeekly;
          const mCodingPct = mTotal > 0 ? Math.round((m.codingCount / mTotal) * 100) : 0;
          const mLabsPct = mTotal > 0 ? Math.round((m.labsCount / mTotal) * 100) : 0;
          const mCtfPct = mTotal > 0 ? Math.max(0, 100 - (mCodingPct + mLabsPct)) : 0;

          return (
            <div
              key={m.user.id}
              className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 p-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <Link
                  href={`/members/${m.user.id}`}
                  className="group flex items-center gap-2 text-sm font-medium text-zinc-200 hover:text-emerald-400 transition-colors"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-950/80 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                    {m.user.username.charAt(0).toUpperCase()}
                  </div>
                  <span>{m.user.username}</span>
                  <span className="text-[10px] text-zinc-600 group-hover:text-zinc-400">→</span>
                </Link>

                <div className="flex items-center gap-2">
                  <span className="rounded bg-zinc-800/90 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
                    {m.dominantFocus}
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-300">
                    {mTotal} <span className="text-[10px] font-normal text-zinc-500">weekly</span>
                  </span>
                </div>
              </div>

              {/* Stacked relative breakdown bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800 flex">
                {mTotal === 0 ? (
                  <div className="w-full bg-zinc-800 text-[9px] text-zinc-600 text-center" />
                ) : (
                  <>
                    <div
                      style={{ width: `${mCodingPct}%` }}
                      className="bg-emerald-500 transition-all duration-300"
                      title={`Coding: ${m.codingCount} (${mCodingPct}%)`}
                    />
                    <div
                      style={{ width: `${mLabsPct}%` }}
                      className="bg-purple-500 transition-all duration-300"
                      title={`Labs: ${m.labsCount} (${mLabsPct}%)`}
                    />
                    <div
                      style={{ width: `${mCtfPct}%` }}
                      className="bg-amber-500 transition-all duration-300"
                      title={`CTF: ${m.ctfCount} (${mCtfPct}%)`}
                    />
                  </>
                )}
              </div>

              <div className="mt-1.5 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                <span>Code: {m.codingCount}</span>
                <span>Labs (HTB/THM): {m.labsCount}</span>
                <span>CTF (Pico): {m.ctfCount}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
