-- ============================================================
-- Fix infinite recursion in RLS policies on group_members
-- ============================================================
-- PROBLEM:
-- The "View same-group members" policy on group_members queried
-- group_members directly, causing PostgreSQL error 42P17
-- ("infinite recursion detected in policy for relation
-- group_members").
--
-- Recursion chain:
--   profiles SELECT → "View same-group profiles" policy
--     → queries group_members
--       → group_members RLS "View same-group members" fires
--         → queries group_members AGAIN (self-referential)
--           → RLS fires again → ♻️ infinite recursion
--
-- FIX:
-- Replace direct subqueries against group_members with a
-- SECURITY DEFINER helper function that bypasses RLS, breaking
-- the recursion cycle.
-- ============================================================

-- 1. SECURITY DEFINER helper: check if two users share a group
--    Runs as the function owner (superuser), bypassing RLS,
--    so it can query group_members safely from any policy.
CREATE OR REPLACE FUNCTION public.same_group(p_user_a UUID, p_user_b UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members gm1
    JOIN group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = p_user_a
      AND gm2.user_id = p_user_b
  );
$$;

-- 2. Drop the four policies that trigger recursion
--    (they all query group_members directly or indirectly)

DROP POLICY IF EXISTS "View same-group profiles"           ON profiles;
DROP POLICY IF EXISTS "View same-group members"            ON group_members;
DROP POLICY IF EXISTS "View same-group connected accounts" ON connected_accounts;
DROP POLICY IF EXISTS "View same-group activities"         ON activities;

-- 3. Recreate them using the SECURITY DEFINER function

-- profiles: can see profiles of users in the same group
CREATE POLICY "View same-group profiles"
  ON profiles FOR SELECT
  USING (public.same_group(auth.uid(), profiles.id));

-- group_members: can see own membership + same-group memberships
CREATE POLICY "View same-group members"
  ON group_members FOR SELECT
  USING (
    group_members.user_id = auth.uid()
    OR public.same_group(auth.uid(), group_members.user_id)
  );

-- connected_accounts: can see connected accounts of same-group users
CREATE POLICY "View same-group connected accounts"
  ON connected_accounts FOR SELECT
  USING (public.same_group(auth.uid(), connected_accounts.user_id));

-- activities: can see activities of same-group users
CREATE POLICY "View same-group activities"
  ON activities FOR SELECT
  USING (public.same_group(auth.uid(), activities.user_id));
