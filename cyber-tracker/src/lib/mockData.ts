import type { Activity, Profile, Group } from "@/types/database";

// ── Mock User ──────────────────────────────────────────────
export const MOCK_USER: Profile = {
  id: "u-001",
  username: "ghost_rider",
  avatar_url: null,
  streak_count: 12,
  created_at: "2026-07-01T10:00:00Z",
};

// ── Mock Group ─────────────────────────────────────────────
export const MOCK_GROUP: Group = {
  id: "g-001",
  name: "Cyber Wolves",
  invite_code: "WOLF-2026-XYZ",
  max_members: 3,
  created_at: "2026-07-15T08:30:00Z",
};

// ── Mock Team Members (for leaderboard) ────────────────────
export interface MockMember {
  user: Profile;
  rank: number;
  dailyCount: number;
  weeklyByPlatform: Record<string, number>;
}

export const MOCK_MEMBERS: MockMember[] = [
  {
    user: { ...MOCK_USER, streak_count: 12 },
    rank: 1,
    dailyCount: 5,
    weeklyByPlatform: { github: 14, hackthebox: 7, tryhackme: 3 },
  },
  {
    user: {
      id: "u-002",
      username: "zero_cool",
      avatar_url: null,
      streak_count: 8,
      created_at: "2026-07-02T10:00:00Z",
    },
    rank: 2,
    dailyCount: 3,
    weeklyByPlatform: { github: 10, picoctf: 5 },
  },
  {
    user: {
      id: "u-003",
      username: "acid_burn",
      avatar_url: null,
      streak_count: 5,
      created_at: "2026-07-03T10:00:00Z",
    },
    rank: 3,
    dailyCount: 2,
    weeklyByPlatform: { tryhackme: 8, hackthebox: 4 },
  },
];

// ── Mock Stats ─────────────────────────────────────────────
export interface MockStats {
  totalActivities: number;
  activeDaysThisWeek: number;
  platformsConnected: number;
  groupRank: number;
}

export const MOCK_STATS: MockStats = {
  totalActivities: 142,
  activeDaysThisWeek: 5,
  platformsConnected: 3,
  groupRank: 1,
};

// ── Mock Activities ────────────────────────────────────────
export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "a-001",
    user_id: "u-001",
    platform: "github",
    external_id: "gh-101",
    title: "Pushed 3 commits to cyber-tracker/backend",
    type: "push",
    performed_at: "2026-08-24T14:30:00Z",
  },
  {
    id: "a-002",
    user_id: "u-002",
    platform: "hackthebox",
    external_id: "htb-202",
    title: "Completed challenge: Labyrinth",
    type: "challenge",
    performed_at: "2026-08-24T13:15:00Z",
  },
  {
    id: "a-003",
    user_id: "u-003",
    platform: "tryhackme",
    external_id: "thm-303",
    title: "Finished room: Intro to Cyber Security",
    type: "room",
    performed_at: "2026-08-24T11:45:00Z",
  },
  {
    id: "a-004",
    user_id: "u-001",
    platform: "github",
    external_id: "gh-104",
    title: "Opened PR #42: Add RLS policies",
    type: "pull_request",
    performed_at: "2026-08-24T10:00:00Z",
  },
  {
    id: "a-005",
    user_id: "u-003",
    platform: "picoctf",
    external_id: "pico-405",
    title: "Solved: buffer overflow 1",
    type: "solve",
    performed_at: "2026-08-23T22:10:00Z",
  },
  {
    id: "a-006",
    user_id: "u-002",
    platform: "github",
    external_id: "gh-106",
    title: "Pushed 5 commits to cyber-tracker/frontend",
    type: "push",
    performed_at: "2026-08-23T20:30:00Z",
  },
  {
    id: "a-007",
    user_id: "u-001",
    platform: "hackthebox",
    external_id: "htb-207",
    title: "Started machine: Sneaky",
    type: "machine",
    performed_at: "2026-08-23T18:00:00Z",
  },
  {
    id: "a-008",
    user_id: "u-003",
    platform: "tryhackme",
    external_id: "thm-308",
    title: "Completed pathway: Pre-Security",
    type: "pathway",
    performed_at: "2026-08-23T15:20:00Z",
  },
];

// ── Mock Connected Accounts ────────────────────────────────
export interface MockConnectedAccount {
  id: string;
  platform: string;
  connected_at: string;
}

export const MOCK_CONNECTED_ACCOUNTS: MockConnectedAccount[] = [
  { id: "ca-001", platform: "github", connected_at: "2026-07-01T10:00:00Z" },
  {
    id: "ca-002",
    platform: "hackthebox",
    connected_at: "2026-07-10T14:30:00Z",
  },
  {
    id: "ca-003",
    platform: "tryhackme",
    connected_at: "2026-07-20T09:00:00Z",
  },
];
