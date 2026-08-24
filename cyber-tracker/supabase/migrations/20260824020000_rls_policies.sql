-- ============================================================
-- Apply missing RLS policies and indexes
-- ============================================================
-- The tables were created outside the migration system.
-- The migration repair command marked old migrations as "applied"
-- without executing their SQL, so RLS policies were never created.
-- This migration adds them idempotently.
-- ============================================================

-- ---------- profiles ----------
DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Manage own profile"
    ON profiles FOR ALL
    USING (id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- groups ----------
DO $$ BEGIN
  CREATE POLICY "View own groups"
    ON groups FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM group_members
        WHERE group_id = groups.id AND user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- group_members ----------
DO $$ BEGIN
  CREATE POLICY "View same-group members"
    ON group_members FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM group_members gm2
        WHERE gm2.group_id = group_members.group_id
          AND gm2.user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Join group"
    ON group_members FOR INSERT
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- connected_accounts ----------
DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Manage own connected accounts"
    ON connected_accounts FOR ALL
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- activities ----------
DO $$ BEGIN
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
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Insert own activities"
    ON activities FOR INSERT
    WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Update own activities"
    ON activities FOR UPDATE
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------- Indexes (idempotent) ----------
CREATE INDEX IF NOT EXISTS idx_group_members_group   ON group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user    ON group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user       ON activities (user_id);
CREATE INDEX IF NOT EXISTS idx_activities_performed  ON activities (performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_connected_accounts_user ON connected_accounts (user_id);
