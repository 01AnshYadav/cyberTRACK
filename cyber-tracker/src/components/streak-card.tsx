export function StreakCard() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
        Streaks
      </h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Current Streak</span>
          <span className="text-xl font-bold text-emerald-400">0 days</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Longest Streak</span>
          <span className="text-xl font-bold text-zinc-500">0 days</span>
        </div>
        <div className="mt-4 h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div className="h-full w-0 rounded-full bg-emerald-500 transition-all" />
        </div>
        <p className="text-xs text-zinc-600">
          Log activity daily to build your streak.
        </p>
      </div>
    </div>
  );
}
