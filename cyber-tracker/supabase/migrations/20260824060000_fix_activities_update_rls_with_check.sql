-- ============================================================
-- Fix UPDATE RLS policy on activities for PostgREST upsert
-- ============================================================
-- PROBLEM:
-- PostgREST upserts (INSERT ... ON CONFLICT DO UPDATE) require
-- both INSERT and UPDATE policies. The current UPDATE policy
-- has USING (user_id = auth.uid()) but is missing WITH CHECK.
--
-- Without WITH CHECK on the UPDATE policy, PostgREST evaluates
-- the UPDATE USING clause against the EXISTING row, then falls
-- back to the INSERT policy's WITH CHECK for the NEW row. In
-- some configurations this causes a 42501 RLS violation even
-- when both user_ids match.
--
-- FIX:
-- Add WITH CHECK (user_id = auth.uid()) to the UPDATE policy
-- so PostgREST can validate the new row state independently.
-- ============================================================

DROP POLICY IF EXISTS "Update own activities" ON public.activities;

CREATE POLICY "Update own activities"
  ON public.activities
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
