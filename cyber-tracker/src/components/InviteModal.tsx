"use client";

import { useState } from "react";

interface InviteModalProps {
  inviteCode: string;
  groupName: string;
  memberCount?: number;
  maxMembers?: number;
}

export function InviteModal({
  inviteCode,
  groupName,
  memberCount = 1,
  maxMembers = 3,
}: InviteModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinStatus, setJoinStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [joinMessage, setJoinMessage] = useState<string>("");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is blocked
    }
  };

  const handleJoin = async () => {
    if (!joinCodeInput.trim()) return;
    setJoinStatus("loading");
    setJoinMessage("");

    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: joinCodeInput.trim() }),
      });
      const data = await res.json();

      if (res.ok) {
        setJoinStatus("success");
        setJoinMessage("Successfully joined pod! Reloading...");
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setJoinStatus("error");
        setJoinMessage(data.error || "Failed to join pod.");
      }
    } catch {
      setJoinStatus("error");
      setJoinMessage("Network request failed.");
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/30 px-3.5 py-2 text-xs font-semibold text-emerald-400 transition-all hover:bg-emerald-900/40 hover:border-emerald-500/60 shadow-sm"
      >
        <span>👥</span>
        <span>Pod: {groupName}</span>
        <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300 font-mono">
          {memberCount}/{maxMembers}
        </span>
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900/95 p-6 shadow-2xl backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div>
                <h2 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
                  <span>🔒</span> Pod Invite & Access
                </h2>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Small cohort architecture ({maxMembers} seats max)
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 transition-colors hover:text-zinc-300 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {/* Invite code section */}
            <div className="mb-6 space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Pod Invite Code
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2.5 font-mono text-sm font-bold text-emerald-400 tracking-wider select-all">
                  {inviteCode}
                </code>
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-bold text-black transition-all hover:bg-emerald-400 active:scale-95 shadow-md"
                >
                  {copied ? "Copied!" : "Copy Code"}
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                Share this with your study partner or small team. Keeping groups intimate preserves mutual accountability.
              </p>
            </div>

            {/* Join other pod section */}
            <div className="border-t border-zinc-800/80 pt-5">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Join Another Pod
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. POD-ABCD-1234"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-emerald-500 font-mono"
                />
                <button
                  onClick={handleJoin}
                  disabled={joinStatus === "loading" || !joinCodeInput.trim()}
                  className="shrink-0 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-200 transition-all hover:bg-zinc-700 disabled:opacity-50"
                >
                  {joinStatus === "loading" ? "Joining..." : "Join"}
                </button>
              </div>
              {joinMessage && (
                <p
                  className={`mt-2 text-xs font-medium ${
                    joinStatus === "success"
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {joinMessage}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
