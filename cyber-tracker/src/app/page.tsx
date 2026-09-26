import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500 selection:text-black">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-base">
            ⚡
          </span>
          <span className="font-bold tracking-tight text-lg text-zinc-100">
            Cyber Tracker
          </span>
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-400">
            v0.1
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-semibold text-zinc-300 hover:text-emerald-400 transition-colors px-3 py-1.5"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-black transition-all hover:bg-emerald-400 active:scale-95 shadow-md"
          >
            Join a Pod
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16 sm:py-24 max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/30 px-3.5 py-1 text-xs font-mono text-emerald-300 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
          <span>Passive Synchronization • Zero Social Bloat</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-zinc-100 leading-tight">
          Private Cybersecurity <br />
          <span className="bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
            Mutual Accountability Hub
          </span>
        </h1>

        <p className="mt-5 text-base sm:text-lg text-zinc-400 max-w-2xl leading-relaxed">
          Aggregates real-time cybersecurity practice and software development across isolated platforms into intimate, private cohorts. No performative posts, no feeds, no vanity likes—just raw event telemetry and mutual consistency.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
          <Link
            href="/dashboard"
            className="rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-bold text-black transition-all hover:bg-emerald-400 active:scale-95 shadow-lg shadow-emerald-950/50"
          >
            Launch Dashboard →
          </Link>
          <Link
            href="/connections"
            className="rounded-xl border border-zinc-800 bg-zinc-900/80 px-6 py-3.5 text-sm font-semibold text-zinc-200 transition-all hover:bg-zinc-800 hover:border-zinc-700"
          >
            Explore Platform Sync
          </Link>
        </div>

        {/* Supported Platforms Strip */}
        <div className="mt-14 w-full pt-8 border-t border-zinc-900">
          <p className="text-[11px] uppercase tracking-widest font-semibold text-zinc-500 mb-5">
            Automated Ingestion Across Core Ecosystems
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 flex flex-col items-center">
              <span className="text-2xl mb-1">💻</span>
              <span className="text-xs font-bold text-zinc-200">GitHub</span>
              <span className="text-[10px] text-zinc-500">Commits & PRs</span>
            </div>
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 flex flex-col items-center">
              <span className="text-2xl mb-1">🎯</span>
              <span className="text-xs font-bold text-zinc-200">TryHackMe</span>
              <span className="text-[10px] text-zinc-500">Guided Labs & Rooms</span>
            </div>
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 flex flex-col items-center">
              <span className="text-2xl mb-1">💀</span>
              <span className="text-xs font-bold text-zinc-200">Hack The Box</span>
              <span className="text-[10px] text-zinc-500">Machines & Roots</span>
            </div>
            <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 flex flex-col items-center">
              <span className="text-2xl mb-1">🚩</span>
              <span className="text-xs font-bold text-zinc-200">PicoCTF</span>
              <span className="text-[10px] text-zinc-500">Challenge Solves</span>
            </div>
          </div>
        </div>

        {/* 3 Core Pillars */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6">
            <div className="text-emerald-400 font-bold text-lg mb-2">🔒 Small Pod Cohorts</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Designed for intimate pods of up to 3 members (scalable to small cohorts of 10–50). Everyone knows each other, fostering real peer accountability rather than anonymous competition.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6">
            <div className="text-emerald-400 font-bold text-lg mb-2">⚖️ Comparative Focus</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Transparent breakdown comparing weekly effort: Active Coding vs. Offensive Labs vs. CTF problem solving. See where your peers are spending their study hours.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/30 p-6">
            <div className="text-emerald-400 font-bold text-lg mb-2">🔥 Daily Momentum</div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Continuous multi-platform streak tracking and milestone achievements. No manual check-in friction—your code and exploits speak for themselves.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600 font-mono">
        Cyber Tracker • Anti-Social Accountability for Cybersecurity Learners • Built with Next.js & Supabase
      </footer>
    </main>
  );
}
