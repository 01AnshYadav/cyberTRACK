interface ConnectedAccount {
  id: string;
  platform: string;
}

const knownPlatforms = [
  { slug: "github", label: "GitHub", icon: "GH" },
  { slug: "tryhackme", label: "TryHackMe", icon: "TH" },
  { slug: "hackthebox", label: "Hack The Box", icon: "HT" },
  { slug: "picoctf", label: "PicoCTF", icon: "PC" },
];

export function PlatformStatus({
  connectedAccounts,
}: {
  connectedAccounts: ConnectedAccount[];
}) {
  const connectedPlatforms = new Set(
    connectedAccounts.map((a) => a.platform.toLowerCase()),
  );

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Connected Platforms
        </h2>
        <a
          href="/connections"
          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
        >
          Manage
        </a>
      </div>
      <ul className="space-y-2">
        {knownPlatforms.map((p) => {
          const isConnected = connectedPlatforms.has(p.slug);
          return (
            <li
              key={p.slug}
              className="flex items-center justify-between rounded-lg bg-zinc-800/40 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded bg-zinc-800 text-xs font-bold text-zinc-400">
                  {p.icon}
                </span>
                <span className="text-sm text-zinc-300">{p.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium ${
                    isConnected ? "text-emerald-400" : "text-zinc-600"
                  }`}
                >
                  {isConnected ? "Connected" : "Not connected"}
                </span>
                {!isConnected && p.slug === "github" && (
                  <a
                    href="/connections"
                    className="rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-black hover:bg-emerald-500 transition-colors"
                  >
                    Connect
                  </a>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
