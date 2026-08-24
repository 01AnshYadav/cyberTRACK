export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-emerald-400">
          Cyber Tracker
        </h1>
        <p className="text-zinc-400 text-lg">
          Private cybersecurity activity tracking for small teams.
        </p>
        <a
          href="/login"
          className="inline-block mt-4 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-emerald-400"
        >
          Sign In
        </a>
      </div>
    </main>
  );
}
