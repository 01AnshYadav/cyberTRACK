import type { Activity } from "@/types/database";

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  activeDays7d: number;
  activeDays30d: number;
  totalActiveDays: number;
  isActiveToday: boolean;
}

export interface Milestone {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  unlocked: boolean;
  progress?: string;
}

export interface FocusBreakdown {
  codingCount: number;
  labsCount: number;
  ctfCount: number;
  codingPercent: number;
  labsPercent: number;
  ctfPercent: number;
  primaryFocus: "Active Coding" | "Offensive Labs" | "CTF Solving" | "Balanced" | "None";
}

/**
 * Calculate streak and active day statistics from an array of activity timestamps.
 */
export function calculateStreak(
  activities: { performed_at: string }[],
): StreakInfo {
  if (!activities || activities.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      activeDays7d: 0,
      activeDays30d: 0,
      totalActiveDays: 0,
      isActiveToday: false,
    };
  }

  // Extract unique ISO day strings (YYYY-MM-DD) in UTC
  const daySet = new Set<string>();
  for (const a of activities) {
    try {
      const d = new Date(a.performed_at);
      if (!isNaN(d.getTime())) {
        daySet.add(d.toISOString().slice(0, 10));
      }
    } catch {
      // Ignore invalid date strings
    }
  }

  const sortedDays = Array.from(daySet).sort().reverse(); // Most recent first
  if (sortedDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      activeDays7d: 0,
      activeDays30d: 0,
      totalActiveDays: 0,
      isActiveToday: false,
    };
  }

  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const isActiveToday = sortedDays.includes(todayStr);
  const isActiveYesterday = sortedDays.includes(yesterdayStr);

  // Streak is alive if user has activity today OR yesterday
  let currentStreak = 0;
  if (isActiveToday || isActiveYesterday) {
    let checkDate = isActiveToday ? new Date(now) : yesterday;
    while (true) {
      const dateStr = checkDate.toISOString().slice(0, 10);
      if (daySet.has(dateStr)) {
        currentStreak++;
        checkDate = new Date(checkDate.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  // Longest streak calculation
  let longestStreak = 0;
  let running = 0;
  const chronological = Array.from(daySet).sort(); // Oldest first
  for (let i = 0; i < chronological.length; i++) {
    if (i === 0) {
      running = 1;
    } else {
      const prev = new Date(chronological[i - 1]);
      const curr = new Date(chronological[i]);
      const diffDays = Math.round(
        (curr.getTime() - prev.getTime()) / (24 * 60 * 60 * 1000),
      );
      if (diffDays === 1) {
        running++;
      } else {
        running = 1;
      }
    }
    if (running > longestStreak) {
      longestStreak = running;
    }
  }

  // Active days in 7d and 30d
  const sevenDaysAgoTime = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgoTime = now.getTime() - 30 * 24 * 60 * 60 * 1000;

  let activeDays7d = 0;
  let activeDays30d = 0;

  for (const day of sortedDays) {
    const time = new Date(day).getTime();
    if (time >= sevenDaysAgoTime) activeDays7d++;
    if (time >= thirtyDaysAgoTime) activeDays30d++;
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    activeDays7d,
    activeDays30d,
    totalActiveDays: daySet.size,
    isActiveToday,
  };
}

/**
 * Classify activities into relative focus categories: Coding, Labs, and CTF.
 */
export function classifyFocus(
  activities: { platform: string; type: string }[],
): FocusBreakdown {
  let codingCount = 0;
  let labsCount = 0;
  let ctfCount = 0;

  for (const a of activities) {
    const p = a.platform.toLowerCase();
    if (p === "github") {
      codingCount++;
    } else if (p === "tryhackme" || p === "hackthebox") {
      labsCount++;
    } else if (p === "picoctf") {
      ctfCount++;
    }
  }

  const total = codingCount + labsCount + ctfCount;
  if (total === 0) {
    return {
      codingCount: 0,
      labsCount: 0,
      ctfCount: 0,
      codingPercent: 0,
      labsPercent: 0,
      ctfPercent: 0,
      primaryFocus: "None",
    };
  }

  const codingPercent = Math.round((codingCount / total) * 100);
  const labsPercent = Math.round((labsCount / total) * 100);
  const ctfPercent = 100 - (codingPercent + labsPercent);

  let primaryFocus: FocusBreakdown["primaryFocus"] = "Balanced";
  if (codingPercent >= 50) {
    primaryFocus = "Active Coding";
  } else if (labsPercent >= 50) {
    primaryFocus = "Offensive Labs";
  } else if (ctfPercent >= 50) {
    primaryFocus = "CTF Solving";
  }

  return {
    codingCount,
    labsCount,
    ctfCount,
    codingPercent,
    labsPercent,
    ctfPercent: Math.max(0, ctfPercent),
    primaryFocus,
  };
}

/**
 * Calculate milestone achievements dynamically based on logs and streak.
 */
export function calculateMilestones(
  activities: Activity[],
  streakCount: number,
): Milestone[] {
  const total = activities.length;
  const ghCount = activities.filter((a) => a.platform === "github").length;
  const thmCount = activities.filter((a) => a.platform === "tryhackme").length;
  const htbCount = activities.filter((a) => a.platform === "hackthebox").length;
  const picoCount = activities.filter((a) => a.platform === "picoctf").length;

  const platformsUsed = new Set(activities.map((a) => a.platform)).size;
  const hasRooted = activities.some(
    (a) => a.platform === "hackthebox" && a.type.includes("root"),
  );

  return [
    {
      id: "first_activity",
      name: "Day 1 Recruit",
      description: "Synchronized your first cybersecurity activity log.",
      icon: "⚡",
      tier: "bronze",
      unlocked: total >= 1,
      progress: `${Math.min(total, 1)}/1`,
    },
    {
      id: "streak_7",
      name: "7-Day Consistency",
      description: "Maintained an unbroken 7-day study streak.",
      icon: "🔥",
      tier: "bronze",
      unlocked: streakCount >= 7,
      progress: `${Math.min(streakCount, 7)}/7 days`,
    },
    {
      id: "streak_30",
      name: "30-Day Momentum",
      description: "Elite discipline: 30 consecutive days of cyber output.",
      icon: "💎",
      tier: "gold",
      unlocked: streakCount >= 30,
      progress: `${Math.min(streakCount, 30)}/30 days`,
    },
    {
      id: "git_master",
      name: "Code Crafter",
      description: "Shipped 20+ git commits or code contributions.",
      icon: "💻",
      tier: "silver",
      unlocked: ghCount >= 20,
      progress: `${Math.min(ghCount, 20)}/20`,
    },
    {
      id: "root_access",
      name: "Root Access",
      description: "Compromised a Hack The Box machine or solved challenge.",
      icon: "💀",
      tier: "gold",
      unlocked: hasRooted || htbCount >= 1,
      progress: hasRooted || htbCount >= 1 ? "Unlocked" : "0/1",
    },
    {
      id: "room_sweeper",
      name: "Room Sweeper",
      description: "Completed 5 or more guided TryHackMe rooms.",
      icon: "🎯",
      tier: "silver",
      unlocked: thmCount >= 5,
      progress: `${Math.min(thmCount, 5)}/5`,
    },
    {
      id: "ctf_solver",
      name: "Flag Capturer",
      description: "Captured and submitted 3 CTF challenge flags.",
      icon: "🚩",
      tier: "silver",
      unlocked: picoCount >= 3,
      progress: `${Math.min(picoCount, 3)}/3`,
    },
    {
      id: "multi_platform",
      name: "Cyber Polyglot",
      description: "Active across 3 or more cybersecurity platforms.",
      icon: "🌐",
      tier: "platinum",
      unlocked: platformsUsed >= 3,
      progress: `${Math.min(platformsUsed, 3)}/3 platforms`,
    },
  ];
}
