-- ============================================================
-- cyberTRACK – Complete Database Setup Migration
-- Compatible with fresh Supabase projects
-- ============================================================

-- 1. Profiles (mirrors Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT UNIQUE NOT NULL,
  avatar_url    TEXT,
  streak_count  INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Groups (intimate accountability pods)
CREATE TABLE IF NOT EXISTS public.groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  max_members INT NOT NULL DEFAULT 3,
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Group membership
CREATE TABLE IF NOT EXISTS public.group_members (
  id         UUID DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

-- 4. Connected platform accounts (GitHub, TryHackMe, Hack The Box, PicoCTF)
CREATE TABLE IF NOT EXISTS public.connected_accounts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform          TEXT NOT NULL,
  platform_username TEXT,
  access_token      TEXT,
  external_id       TEXT,
  connected_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, platform)
);

-- 5. Activities (deduplicated by platform + external_id)
CREATE TABLE IF NOT EXISTS public.activities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  platform     TEXT NOT NULL,
  external_id  TEXT NOT NULL,
  title        TEXT NOT NULL,
  type         TEXT NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (platform, external_id)
);

-- ============================================================
-- Performance Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_group_members_group      ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user       ON public.group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user          ON public.activities (user_id);
CREATE INDEX IF NOT EXISTS idx_activities_performed     ON public.activities (performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user  ON public.connected_accounts (user_id);
CREATE INDEX IF NOT EXISTS idx_groups_invite_code       ON public.groups (invite_code);

-- ============================================================
-- Helper Functions
-- ============================================================

-- Check if two users share at least one group (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION public.same_group(p_user_a UUID, p_user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = p_user_a
      AND gm2.user_id = p_user_b
  );
$$;

-- Auto-provision profile on Supabase auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, streak_count)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'username',
      split_part(NEW.email, '@', 1),
      'user_' || substr(NEW.id::text, 1, 6)
    ),
    0
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Row-Level Security (RLS) Configuration
-- ============================================================
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities         ENABLE ROW LEVEL SECURITY;

-- Clean existing policies for idempotency
DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile"                 ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"                 ON public.profiles;
DROP POLICY IF EXISTS "View same-group profiles"                     ON public.profiles;
DROP POLICY IF EXISTS "Manage own profile"                           ON public.profiles;

DROP POLICY IF EXISTS "Groups are viewable by authenticated users"   ON public.groups;
DROP POLICY IF EXISTS "Authenticated users can create groups"        ON public.groups;
DROP POLICY IF EXISTS "Group members can update group"               ON public.groups;
DROP POLICY IF EXISTS "Group members can delete group"               ON public.groups;
DROP POLICY IF EXISTS "View own groups"                              ON public.groups;
DROP POLICY IF EXISTS "Create groups"                                ON public.groups;

DROP POLICY IF EXISTS "Group members viewable by authenticated users" ON public.group_members;
DROP POLICY IF EXISTS "Users can join groups"                         ON public.group_members;
DROP POLICY IF EXISTS "Users can leave groups"                        ON public.group_members;
DROP POLICY IF EXISTS "View same-group members"                       ON public.group_members;
DROP POLICY IF EXISTS "Join group"                                    ON public.group_members;

DROP POLICY IF EXISTS "View connected accounts"                       ON public.connected_accounts;
DROP POLICY IF EXISTS "Insert own connected account"                  ON public.connected_accounts;
DROP POLICY IF EXISTS "Update own connected account"                  ON public.connected_accounts;
DROP POLICY IF EXISTS "Delete own connected account"                  ON public.connected_accounts;
DROP POLICY IF EXISTS "View same-group connected accounts"            ON public.connected_accounts;
DROP POLICY IF EXISTS "Manage own connected accounts"                 ON public.connected_accounts;

DROP POLICY IF EXISTS "View activities"                               ON public.activities;
DROP POLICY IF EXISTS "Insert own activities"                         ON public.activities;
DROP POLICY IF EXISTS "Update own activities"                         ON public.activities;
DROP POLICY IF EXISTS "Delete own activities"                         ON public.activities;
DROP POLICY IF EXISTS "View same-group activities"                    ON public.activities;

-- ── profiles policies ──
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ── groups policies ──
CREATE POLICY "Groups are viewable by authenticated users"
  ON public.groups FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create groups"
  ON public.groups FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Group members can update group"
  ON public.groups FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid()));

CREATE POLICY "Group members can delete group"
  ON public.groups FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_members WHERE group_members.group_id = groups.id AND group_members.user_id = auth.uid()));

-- ── group_members policies ──
CREATE POLICY "Group members viewable by authenticated users"
  ON public.group_members FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can join groups"
  ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave groups"
  ON public.group_members FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── connected_accounts policies ──
CREATE POLICY "View connected accounts"
  ON public.connected_accounts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.same_group(auth.uid(), connected_accounts.user_id));

CREATE POLICY "Insert own connected account"
  ON public.connected_accounts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update own connected account"
  ON public.connected_accounts FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Delete own connected account"
  ON public.connected_accounts FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ── activities policies ──
CREATE POLICY "View activities"
  ON public.activities FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.same_group(auth.uid(), activities.user_id));

CREATE POLICY "Insert own activities"
  ON public.activities FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Update own activities"
  ON public.activities FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Delete own activities"
  ON public.activities FOR DELETE TO authenticated
  USING (user_id = auth.uid());
