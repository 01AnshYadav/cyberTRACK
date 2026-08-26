"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ConnectedAccount {
  id: string;
  platform: string;
  platform_username: string | null;
}

const knownPlatforms = [
  { slug: "github", label: "GitHub", icon: "GH" },
  { slug: "tryhackme", label: "TryHackMe", icon: "TH" },
  { slug: "hackthebox", label: "Hack The Box", icon: "HT" },
  { slug: "picoctf", label: "PicoCTF", icon: "PC" },
];

export default function ConnectionsPage() {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const supabase = createClient();

  // ── Read URL params for OAuth result messages ──────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ghConnected = params.get("github");
    const error = params.get("error");

    if (ghConnected === "connected") {
      setMessage({ type: "success", text: "GitHub connected successfully!" });
      // Clean up URL
      window.history.replaceState({}, "", "/connections");
    } else if (error) {
      const errorMessages: Record<string, string> = {
        access_denied: "GitHub authorization was denied.",
        invalid_state: "Security validation failed. Please try again.",
        state_expired: "OAuth session expired. Please try again.",
        token_exchange_failed: "Failed to exchange authorization code. Please try again.",
        github_api_failed: "Failed to fetch GitHub profile. Please try again.",
        save_failed: "Failed to save connection. Please try again.",
        server_misconfigured: "GitHub OAuth is not configured on the server.",
      };
      setMessage({
        type: "error",
        text: errorMessages[error] || `Connection failed: ${error}`,
      });
      window.history.replaceState({}, "", "/connections");
    }
  }, []);

  // ── Fetch connected accounts ───────────────────────────
  useEffect(() => {
    async function fetchAccounts() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("connected_accounts")
        .select("id, platform, platform_username")
        .eq("user_id", user.id);

      setAccounts(data ?? []);
      setLoading(false);
    }

    fetchAccounts();
  }, [supabase]);

  // ── Handle Connect GitHub ──────────────────────────────
  function handleConnectGitHub() {
    // This navigates to the API route which redirects to GitHub OAuth
    window.location.href = "/api/auth/github";
  }

  // ── Handle Sync ────────────────────────────────────────
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
          text: `Synced ${data.synced ?? 0} activities from ${platform}.`,
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

  // ── Handle Disconnect ──────────────────────────────────
  async function handleDisconnect(platform: string) {
    const confirmed = window.confirm(
      `Disconnect ${platform}? This will remove the saved connection.`,
    );
    if (!confirmed) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("connected_accounts")
      .delete()
      .eq("user_id", user.id)
      .eq("platform", platform);

    if (error) {
      setMessage({ type: "error", text: `Failed to disconnect: ${error.message}` });
      return;
    }

    setAccounts((prev) => prev.filter((a) => a.platform !== platform));
    setMessage({ type: "success", text: `${platform} disconnected.` });
  }

  // ── Derive connected platforms map ─────────────────────
  const connectedMap = new Map(accounts.map((a) => [a.platform, a]));

  return (
    <div className="flex-1 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <a
              href="/dashboard"
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-emerald-400">
            Connections
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Connect your platforms to sync activity automatically.
          </p>
        </header>

        {/* Status message */}
        {message && (
          <div
            className={`mb-6 rounded-lg px-4 py-3 text-sm font-medium ${
              message.type === "success"
                ? "bg-emerald-900/40 text-emerald-300 border border-emerald-800"
                : "bg-red-900/40 text-red-300 border border-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Platform cards */}
        {loading ? (
          <div className="text-zinc-500 text-sm">Loading...</div>
        ) : (
          <ul className="space-y-3">
            {knownPlatforms.map((p) => {
              const account = connectedMap.get(p.slug);
              const isConnected = !!account;

              return (
                <li
                  key={p.slug}
                  className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5"
                >
                  <div className="flex items-center justify-between">
                    {/* Left: icon + name + status */}
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-xs font-bold text-zinc-400">
                        {p.icon}
                      </span>
                      <div>
                        <span className="text-sm font-medium text-zinc-200">
                          {p.label}
                        </span>
                        {isConnected && account?.platform_username && (
                          <span className="ml-2 text-xs text-zinc-500">
                            ({account.platform_username})
                          </span>
                        )}
                        <div>
                          <span
                            className={`text-xs font-medium ${
                              isConnected
                                ? "text-emerald-400"
                                : "text-zinc-600"
                            }`}
                          >
                            {isConnected ? "Connected" : "Not connected"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex items-center gap-2">
                      {isConnected ? (
                        <>
                          <button
                            onClick={() => handleSync(p.slug)}
                            disabled={syncing === p.slug}
                            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-700 disabled:opacity-50"
                          >
                            {syncing === p.slug ? "Syncing..." : "Sync"}
                          </button>
                          {p.slug === "github" && (
                            <button
                              onClick={() => handleDisconnect(p.slug)}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 transition-colors hover:text-red-400"
                            >
                              Disconnect
                            </button>
                          )}
                        </>
                      ) : (
                        <>
                          {p.slug === "github" ? (
                            <button
                              onClick={handleConnectGitHub}
                              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-emerald-500"
                            >
                              Connect {p.label}
                            </button>
                          ) : (
                            <span className="text-xs text-zinc-600">
                              Coming soon
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
