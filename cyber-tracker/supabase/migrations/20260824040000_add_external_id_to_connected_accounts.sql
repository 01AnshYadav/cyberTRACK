-- ============================================================
-- Add external_id to connected_accounts
-- ============================================================
-- Stores the platform's account identifier (e.g. GitHub numeric user ID).
-- This is separate from platform_username (the human-readable login)
-- and access_token (the OAuth token used for API calls).
-- ============================================================

ALTER TABLE connected_accounts
  ADD COLUMN IF NOT EXISTS external_id TEXT;

-- No data migration needed — existing rows get NULL for external_id.
