-- ============================================================
-- Fix missing INSERT/UPDATE RLS policies on activities
-- ============================================================
-- PROBLEM:
-- The activities table has RLS enabled but only a SELECT policy
-- exists ("View same-group activities"). When the server-side
-- sync route tries to upsert rows via the authenticated user's
-- Supabase client, PostgreSQL denies the write because no INSERT
-- policy permits it.
--
-- The INSERT policy was defined in 20260824020000_rls_policies.sql
-- but the migration repair command may have marked it as applied
-- without executing the SQL.
--
-- FIX:
-- Create the INSERT and UPDATE policies idempotently. Drop first
-- to avoid conflicts with any partial state.
-- ============================================================

-- Drop any existing INSERT/UPDATE policies on activities
-- (safe to re-create)
DROP POLICY IF EXISTS "Insert own activities" ON activities;
DROP POLICY IF EXISTS "Update own activities" ON activities;

-- INSERT: a user can only insert activities belonging to themselves
CREATE POLICY "Insert own activities"
  ON activities FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: a user can only update their own activities (needed for upsert)
CREATE POLICY "Update own activities"
  ON activities FOR UPDATE
  USING (user_id = auth.uid());
