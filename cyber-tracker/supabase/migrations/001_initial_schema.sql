-- ============================================================
-- Cyber Tracker – Initial Schema Migration
-- ============================================================

-- Profiles (mirrors Supabase auth.users)
CREATE TABLE profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username   TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Groups (max 3 members)
CREATE TABLE groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  max_members INT NOT NULL DEFAULT 3,
  created_by  UUID NOT NULL REFERENCES profiles(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Group membership (one row per user per group)
CREATE TABLE group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

-- Connected platform accounts
CREATE TABLE connected_accounts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id      UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  platform      TEXT NOT NULL,
  external_id   TEXT NOT NULL,
  access_token  TEXT,
  refresh_token TEXT,
  connected_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

-- Activities (deduplicated by platform + external_id)
CREATE TABLE activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id    UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL,
  external_id TEXT NOT NULL,
  title       TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, external_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_group_members_group   ON group_members (group_id);
CREATE INDEX idx_group_members_user    ON group_members (user_id);
CREATE INDEX idx_activities_group      ON activities (group_id);
CREATE INDEX idx_activities_user       ON activities (user_id);
CREATE INDEX idx_activities_created    ON activities (created_at DESC);
CREATE INDEX idx_connected_accounts_user ON connected_accounts (user_id);

-- ============================================================
-- Row-Level Security
-- ============================================================
ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups             ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities         ENABLE ROW LEVEL SECURITY;

-- Helper: check if a user belongs to a group
CREATE OR REPLACE FUNCTION public.user_in_group(p_user UUID, p_group UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE user_id = p_user AND group_id = p_group
  );
$$;

-- ---------- profiles ----------
-- Users can read profiles of people in the same group
CREATE POLICY "View same-group profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm1
      JOIN group_members gm2 ON gm1.group_id = gm2.group_id
      WHERE gm1.user_id = profiles.id
        AND gm2.user_id = auth.uid()
    )
  );

-- Users can insert/update their own profile
CREATE POLICY "Manage own profile"
  ON profiles FOR ALL
  USING (id = auth.uid());

-- ---------- groups ----------
-- Users can see groups they belong to
CREATE POLICY "View own groups"
  ON groups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_id = groups.id AND user_id = auth.uid()
    )
  );

-- Any authenticated user can create a group
CREATE POLICY "Create groups"
  ON groups FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- ---------- group_members ----------
-- Users can see members of their own groups
CREATE POLICY "View same-group members"
  ON group_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id
        AND gm2.user_id = auth.uid()
    )
  );

-- Users can join groups (insert own membership)
CREATE POLICY "Join group"
  ON group_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- ---------- connected_accounts ----------
-- Users can see connected accounts of same-group members
CREATE POLICY "View same-group connected accounts"
  ON connected_accounts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_members gm2 ON gm.group_id = gm2.group_id
      WHERE gm.user_id = connected_accounts.user_id
        AND gm2.user_id = auth.uid()
    )
  );

-- Users can manage their own connected accounts
CREATE POLICY "Manage own connected accounts"
  ON connected_accounts FOR ALL
  USING (user_id = auth.uid());

-- ---------- activities ----------
-- Users can see activities of same-group members
CREATE POLICY "View same-group activities"
  ON activities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_members gm2 ON gm.group_id = gm2.group_id
      WHERE gm.user_id = activities.user_id
        AND gm2.user_id = auth.uid()
    )
  );

-- Users can insert their own activities
CREATE POLICY "Insert own activities"
  ON activities FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own activities
CREATE POLICY "Update own activities"
  ON activities FOR UPDATE
  USING (user_id = auth.uid());
