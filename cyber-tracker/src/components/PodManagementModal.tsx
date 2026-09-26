"use client";

import { useState } from "react";

interface PodManagementModalProps {
  buttonText?: string;
  className?: string;
}

export function PodManagementModal({
  buttonText = "Create or Join Pod",
  className = "",
}: PodManagementModalProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [maxMembers, setMaxMembers] = useState(3);
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, maxMembers }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(`Pod "${data.group.name}" created! Refreshing...`);
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(data.error || "Failed to create pod.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess("Successfully joined pod! Refreshing...");
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setError(data.error || "Failed to join pod.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          className ||
          "rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-black transition-all hover:bg-emerald-400 active:scale-95 shadow-md"
        }
      >
        {buttonText}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-in fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-zinc-800 pb-3">
              <h2 className="text-base font-semibold text-zinc-100">
                Cohorts & Pods
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>

            {/* Switch Tabs */}
            <div className="mb-5 flex rounded-lg bg-zinc-950 p-1 border border-zinc-800">
              <button
                onClick={() => {
                  setTab("create");
                  setError(null);
                }}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                  tab === "create"
                    ? "bg-zinc-800 text-emerald-400 shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Create New Pod
              </button>
              <button
                onClick={() => {
                  setTab("join");
                  setError(null);
                }}
                className={`flex-1 rounded-md py-1.5 text-xs font-semibold transition-colors ${
                  tab === "join"
                    ? "bg-zinc-800 text-emerald-400 shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Join with Code
              </button>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-950/60 border border-red-800 px-3 py-2 text-xs text-red-300">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 rounded-lg bg-emerald-950/60 border border-emerald-800 px-3 py-2 text-xs text-emerald-300">
                {success}
              </div>
            )}

            {tab === "create" ? (
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Pod Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cyber Wolves or 0xExploit"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Max Capacity (Small Cohort Model)
                  </label>
                  <select
                    value={maxMembers}
                    onChange={(e) => setMaxMembers(Number(e.target.value))}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-emerald-500"
                  >
                    <option value={3}>3 members (Recommended Pod)</option>
                    <option value={5}>5 members</option>
                    <option value={10}>10 members (Small Cohort)</option>
                    <option value={25}>25 members</option>
                    <option value={50}>50 members (Cohort Max)</option>
                  </select>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Cyber Tracker is built for intimate pods where everyone knows each other.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="w-full rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-black transition-all hover:bg-emerald-400 disabled:opacity-50 active:scale-98"
                >
                  {loading ? "Creating Pod..." : "Initialize Pod"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wider text-zinc-400">
                    Invite Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. POD-ABCD-1234"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !inviteCode.trim()}
                  className="w-full rounded-lg bg-emerald-500 py-2.5 text-xs font-bold text-black transition-all hover:bg-emerald-400 disabled:opacity-50 active:scale-98"
                >
                  {loading ? "Joining..." : "Join Pod"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
