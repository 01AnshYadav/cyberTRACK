"use client";

import { useState } from "react";

interface InviteModalProps {
  inviteCode: string;
  groupName: string;
}

export function InviteModal({ inviteCode, groupName }: InviteModalProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [joinEmail, setJoinEmail] = useState("");
  const [joinStatus, setJoinStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleJoin = async () => {
    if (!joinEmail.trim()) return;
    setJoinStatus("loading");
    try {
      const res = await fetch("/api/groups/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode }),
      });
      setJoinStatus(res.ok ? "success" : "error");
    } catch {
      setJoinStatus("error");
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:border-emerald-500 hover:text-emerald-400"
      >
        Invite to {groupName}
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-zinc-100">
                Invite to {groupName}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 transition-colors hover:text-zinc-300"
              >
                &#x2715;
              </button>
            </div>

            {/* Invite code section */}
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                Share this invite code
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-zinc-800 px-3 py-2 font-mono text-sm text-emerald-400">
                  {inviteCode}
                </code>
                <button
                  onClick={handleCopy}
                  className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-emerald-500"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            {/* Join via API section */}
            <div className="border-t border-zinc-800 pt-4">
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-zinc-500">
                Or join directly
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter invite code"
                  value={joinEmail}
                  onChange={(e) => setJoinEmail(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors focus:border-emerald-500"
                />
                <button
                  onClick={handleJoin}
                  disabled={joinStatus === "loading"}
                  className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-emerald-500 disabled:opacity-50"
                >
                  {joinStatus === "loading" ? "Joining..." : "Join"}
                </button>
              </div>
              {joinStatus === "success" && (
                <p className="mt-2 text-xs text-emerald-400">
                  Successfully joined the group!
                </p>
              )}
              {joinStatus === "error" && (
                <p className="mt-2 text-xs text-red-400">
                  Failed to join. Check the invite code and try again.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
