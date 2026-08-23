import type { ActivityInsert } from "./ingest";

// ── GitHub public event shapes (subset we care about) ──────
interface GitHubEvent {
  id: string;
  type: string;
  actor: { login: string; id: number };
  repo: { name: string };
  created_at: string;
  payload: Record<string, unknown>;
}

interface GitHubPushEvent extends GitHubEvent {
  type: "PushEvent";
  payload: {
    commits?: { sha: string; message: string }[];
    ref?: string;
  };
}

interface GitHubCreateEvent extends GitHubEvent {
  type: "CreateEvent";
  payload: {
    ref_type?: string;
    ref?: string;
  };
}

interface GitHubIssuesEvent extends GitHubEvent {
  type: "IssuesEvent";
  payload: {
    action?: string;
    issue?: { title: string; html_url: string };
  };
}

interface GitHubPullRequestEvent extends GitHubEvent {
  type: "PullRequestEvent";
  payload: {
    action?: string;
    pull_request?: { title: string; html_url: string };
  };
}

// ── Fetch public events for a GitHub user ──────────────────
export async function fetchGitHubEvents(
  username: string,
  accessToken?: string | null,
): Promise<GitHubEvent[]> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "cyber-tracker",
  };

  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(
    `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=30`,
    { headers, next: { revalidate: 300 } },
  );

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status}: ${res.statusText}`);
  }

  return res.json() as Promise<GitHubEvent[]>;
}

// ── Normalise a single GitHub event → ActivityInsert ───────
export function parseGitHubEvent(
  event: GitHubEvent,
  userId: string,
): ActivityInsert | null {
  const platform = "github";

  switch (event.type) {
    case "PushEvent": {
      const e = event as GitHubPushEvent;
      const commitCount = e.payload.commits?.length ?? 0;
      return {
        user_id: userId,
        platform,
        external_id: event.id,
        title: `Pushed ${commitCount} commit${commitCount === 1 ? "" : "s"} to ${event.repo.name}`,
        type: "push",
        performed_at: event.created_at,
      };
    }

    case "CreateEvent": {
      const e = event as GitHubCreateEvent;
      const refType = e.payload.ref_type ?? "repo";
      return {
        user_id: userId,
        platform,
        external_id: event.id,
        title: `Created ${refType}${e.payload.ref ? `: ${e.payload.ref}` : ""} in ${event.repo.name}`,
        type: "create",
        performed_at: event.created_at,
      };
    }

    case "IssuesEvent": {
      const e = event as GitHubIssuesEvent;
      const action = e.payload.action ?? "updated";
      return {
        user_id: userId,
        platform,
        external_id: event.id,
        title: `${action} issue "${e.payload.issue?.title ?? "unknown"}" in ${event.repo.name}`,
        type: "issue",
        performed_at: event.created_at,
      };
    }

    case "PullRequestEvent": {
      const e = event as GitHubPullRequestEvent;
      const action = e.payload.action ?? "updated";
      return {
        user_id: userId,
        platform,
        external_id: event.id,
        title: `${action} PR "${e.payload.pull_request?.title ?? "unknown"}" in ${event.repo.name}`,
        type: "pull_request",
        performed_at: event.created_at,
      };
    }

    // Fallback: capture any other event type generically
    default:
      return {
        user_id: userId,
        platform,
        external_id: event.id,
        title: `${event.type.replace("Event", "")} in ${event.repo.name}`,
        type: event.type.toLowerCase().replace("event", ""),
        performed_at: event.created_at,
      };
  }
}

// ── Batch parse ────────────────────────────────────────────
export function parseGitHubEvents(
  events: GitHubEvent[],
  userId: string,
): ActivityInsert[] {
  return events
    .map((e) => parseGitHubEvent(e, userId))
    .filter((a): a is ActivityInsert => a !== null);
}
