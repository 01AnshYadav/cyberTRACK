"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface ConnectedAccount {
  id: string;
  platform: string;
  platform_username: string | null;
}

const PLATFORM_DETAILS: Record<
  string,
  {
    slug: string;
    label: string;
    icon: string;
    placeholder: string;
    helpText: string;
    supportsOAuth: boolean;
  }
> = {
  github: {
    slug: "github",
    label: "GitHub",
    icon: "💻",
    placeholder: "GitHub username",
    helpText: "Syncs commits, repositories, and pull requests via public events or OAuth.",
    supportsOAuth: true,
  },
  tryhackme: {
    slug: "tryhackme",
    label: "TryHackMe",
    icon: "🎯",
    placeholder: "TryHackMe username (e.g. cyber_hacker)",
    helpText: "Syncs completed rooms, pathways, and unlocked badges from your public profile.",
    supportsOAuth: false,
  },
  hackthebox: {
    slug: "hackthebox",
    label: "Hack The Box",
    icon: "💀",
    placeholder: "HTB username or App Token",
    helpText: "Syncs user-owned machines, root flags, and completed challenges.",
    supportsOAuth: false,
  },
  picoctf: {
    slug: "picoctf",
    label: "PicoCTF",
    icon: "🚩",
    placeholder: "PicoCTF username",
    helpText: "Syncs challenge solves, category points, and CTF achievements.",
    supportsOAuth: false,
  },
};

export default function ConnectionsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncAllLoading, setSyncAllLoading] = useState(false);
  const [modalPlatform, setModalPlatform] = useState<string | null>(null);
  const [inputUsername, setInputUsername] = useState("");
  const [inputToken, setInputToken] = useState("");
  const [savingConnection, setSavingConnection] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    const params = new URLSearchParams(window.location.search);
    const ghConnected = params.get("github");
    const error = params.get("error");
    if (ghConnected === "connected") {
      return { type: "success", text: "GitHub connected successfully!" };
    }
    if (error) {
      return { type: "error", text: `Connection returned an error: ${error}` };
    }
    return null;
  });

  const supabase = createClient();

  // Clean URL params if present
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.search) {
      window.history.replaceState({}, "", "/connections");
    }
  }, []);

  // Fetch connected accounts
  const fetchAccounts = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("connected_accounts")
        .select("id, platform, platform_username")
        .eq("user_id", user.id);

      setAccounts(data ?? []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user || ignore) return;

        const { data } = await supabase
          .from("connected_accounts")
          .select("id, platform, platform_username")
          .eq("user_id", user.id);

        if (!ignore) {
          setAccounts(data ?? []);
        }
      } catch {
        // Fallback
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [supabase]);

  // Connect via API modal submission
  async function handleSaveConnection(e: React.FormEvent) {
    e.preventDefault();
    if (!modalPlatform || !inputUsername.trim()) return;

    setSavingConnection(true);
    setMessage(null);

    try {
      const res = await fetch("/api/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: modalPlatform,
          username: inputUsername.trim(),
          token: inputToken.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: "success",
          text: `Successfully linked ${PLATFORM_DETAILS[modalPlatform]?.label || modalPlatform}! Now syncing activity...`,
        });
        setModalPlatform(null);
        setInputUsername("");
        setInputToken("");
        await fetchAccounts();
        // Automatically trigger sync
        handleSync(modalPlatform);
      } else {
        setMessage({
          type: "error",
          text: data.error || "Failed to save connection.",
        });
      }
    } catch {
      setMessage({
        type: "error",
        text: "Network error saving platform connection.",
      });
    } finally {
      setSavingConnection(false);
    }
  }

  // Handle single platform sync
  async function handleSync(platform: string) {
    setSyncing(platform);
    setMessage(null);

    try {
      const res = await fetch(`/api/sync/${platform}`, {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Synced ${data.synced ?? 0} new activities from ${PLATFORM_DETAILS[platform]?.label || platform} (Skipped ${data.skipped ?? 0} existing).`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || `Sync failed for ${platform}.`,
        });
      }
    } catch {
      setMessage({ type: "error", text: `Sync request failed for ${platform}.` });
    } finally {
      setSyncing(null);
    }
  }

  // Handle Sync All
  async function handleSyncAll() {
    setSyncAllLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/sync/all", {
        method: "POST",
      });
      const data = await res.json();

      if (res.ok) {
        setMessage({
          type: "success",
          text: `Batch sync complete! ${data.totalSynced ?? 0} new events ingested across all platforms.`,
        });
      } else {
        setMessage({
          type: "error",
          text: data.error || "Batch sync encountered an error.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Batch sync request failed." });
    } finally {
      setSyncAllLoading(false);
    }
  }

  // Handle Disconnect
  async function handleDisconnect(platform: string) {
    const confirmed = window.confirm(
      `Disconnect ${PLATFORM_DETAILS[platform]?.label || platform}? This stops automated ingestion for this platform.`,
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/connections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });

      if (res.ok) {
        setAccounts((prev) => prev.filter((a) => a.platform !== platform));
        setMessage({
          type: "success",
          text: `${PLATFORM_DETAILS[platform]?.label || platform} disconnected.`,
        });
      } else {
        const data = await res.json();
        setMessage({
          type: "error",
          text: data.error || "Failed to disconnect.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error disconnecting platform." });
    }
  }

  const connectedMap = new Map(accounts.map((a) => [a.platform, a]));

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8 min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                href="/dashboard"
                className="text-xs font-semibold text-zinc-400 hover:text-emerald-400 transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <span>🔌</span> Platform Synchronization
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Connect your external profiles once. Ingestion happens automatically in the background.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSyncAll}
              disabled={syncAllLoading || accounts.length === 0}
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-black transition-all hover:bg-emerald-400 disabled:opacity-50 shadow-md"
            >
              <span>⚡</span>
              <span>{syncAllLoading ? "Syncing All..." : "Sync All Platforms"}</span>
            </button>
          </div>
        </header>

        {/* Status Message */}
        {message && (
          <div
            className={`rounded-xl px-4 py-3 text-xs font-semibold border ${
              message.type === "success"
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800"
                : "bg-red-950/40 text-red-300 border-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Platform Cards */}
        {loading ? (
          <div className="text-zinc-500 text-sm font-mono">Loading connected telemetry...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(PLATFORM_DETAILS).map((p) => {
              const account = connectedMap.get(p.slug);
              const isConnected = !!account;

              return (
                <div
                  key={p.slug}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 flex flex-col justify-between hover:border-zinc-700 transition-all shadow-sm"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800/80 text-lg border border-zinc-700/50">
                          {p.icon}
                        </span>
                        <div>
                          <h3 className="text-sm font-bold text-zinc-200">
                            {p.label}
                          </h3>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-mono font-medium ${
                              isConnected ? "text-emerald-400" : "text-zinc-600"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                isConnected ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"
                              }`}
                            />
                            {isConnected ? "Active Sync" : "Disconnected"}
                          </span>
                        </div>
                      </div>

                      {isConnected && account?.platform_username && (
                        <span className="rounded bg-zinc-800/80 border border-zinc-700/60 px-2.5 py-1 text-xs font-mono text-emerald-300">
                          @{account.platform_username}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                      {p.helpText}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 mt-2">
                    {isConnected ? (
                      <>
                        <button
                          onClick={() => handleDisconnect(p.slug)}
                          className="text-xs font-medium text-zinc-500 hover:text-red-400 transition-colors"
                        >
                          Disconnect
                        </button>
                        <button
                          onClick={() => handleSync(p.slug)}
                          disabled={syncing === p.slug}
                          className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-mono font-semibold text-zinc-200 transition-all hover:bg-zinc-700 hover:text-emerald-400 disabled:opacity-50"
                        >
                          {syncing === p.slug ? "Ingesting..." : "Sync Now"}
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-end w-full gap-2">
                        {p.slug === "github" && (
                          <a
                            href="/api/auth/github"
                            className="rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-colors"
                          >
                            Connect via OAuth
                          </a>
                        )}
                        <button
                          onClick={() => {
                            setModalPlatform(p.slug);
                            setInputUsername("");
                            setInputToken("");
                          }}
                          className="rounded-lg bg-emerald-500 px-3.5 py-1.5 text-xs font-bold text-black transition-all hover:bg-emerald-400 active:scale-95"
                        >
                          Connect Handle
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for connecting platform handles/tokens */}
        {modalPlatform && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in"
            onClick={() => setModalPlatform(null)}
          >
            <div
              className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span>{PLATFORM_DETAILS[modalPlatform]?.icon}</span>
                  <h2 className="text-base font-semibold text-zinc-100">
                    Connect {PLATFORM_DETAILS[modalPlatform]?.label}
                  </h2>
                </div>
                <button
                  onClick={() => setModalPlatform(null)}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-zinc-400 mb-4">
                Enter your public handle or account identifier. We will query the platform telemetry to ingest your solved rooms, machines, commits, and challenges.
              </p>

              <form onSubmit={handleSaveConnection} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Username / Handle
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={PLATFORM_DETAILS[modalPlatform]?.placeholder}
                    value={inputUsername}
                    onChange={(e) => setInputUsername(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {modalPlatform === "hackthebox" && (
                  <div>
                    <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                      HTB App Token <span className="text-zinc-600">(Optional)</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Optional API App Token for private queries"
                      value={inputToken}
                      onChange={(e) => setInputToken(e.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={savingConnection || !inputUsername.trim()}
                  className="w-full rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-black transition-all hover:bg-emerald-400 disabled:opacity-50 active:scale-98"
                >
                  {savingConnection ? "Verifying & Linking..." : "Save Connection"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
