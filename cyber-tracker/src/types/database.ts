// ============================================================
// Cyber Tracker – Database TypeScript Contracts
// ============================================================

export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  streak_count: number;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  invite_code: string;
  max_members: number;
  created_at: string;
}

export interface GroupMember {
  group_id: string;
  user_id: string;
  joined_at: string;
}

export interface ConnectedAccount {
  id: string;
  user_id: string;
  platform: string;
  platform_username: string | null;
  access_token: string | null;
}

export interface Activity {
  id: string;
  user_id: string;
  platform: string;
  external_id: string;
  title: string;
  type: string;
  performed_at: string;
}
