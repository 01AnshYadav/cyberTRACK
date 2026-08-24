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
      <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
        Connected Platforms
      </h2>
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
              <span
                className={`text-xs font-medium ${
                  isConnected ? "text-emerald-400" : "text-zinc-600"
                }`}
              >
                {isConnected ? "Connected" : "Not connected"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
