-- ══════════════════════════════════════════════════════════════════════════════
-- Comms Centre (Phase 1)
--
-- Secure internal messaging to replace WhatsApp / personal email. Role-based,
-- home-based, shift-aware, auditable. Messages are soft-deleted (never hard
-- deleted) and carry retention + investigation-hold flags (Phases 13/14).
--
-- Write-through happens at the API route boundary only when Supabase is
-- configured; otherwise the platform uses the in-memory demo store. RLS applied;
-- the service-role key used by API routes bypasses RLS. UK GDPR compliant.
--
-- Tables:
--   comms_channels                     — channels (home-scoped, access-typed)
--   comms_channel_members              — explicit membership (optional)
--   comms_messages                     — messages (soft delete, links, priority)
--   comms_message_receipts             — read + acknowledgement per user
--   comms_message_actions              — message → record/task conversions (Phase 2)
--   staff_trust_notice_acknowledgements— staff trust notice consent log
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. comms_channels ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comms_channels (
  id                TEXT PRIMARY KEY,
  home_id           TEXT NOT NULL DEFAULT 'home_oak',
  type              TEXT NOT NULL,
  name              TEXT NOT NULL,
  description       TEXT,
  access            TEXT NOT NULL DEFAULT 'all_staff',
  allowed_roles     JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_child_id   TEXT,
  linked_incident_id TEXT,
  sensitivity       TEXT NOT NULL DEFAULT 'internal',
  is_archived       BOOLEAN NOT NULL DEFAULT FALSE,
  created_by        TEXT NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comms_channels_home ON comms_channels (home_id);
CREATE INDEX IF NOT EXISTS idx_comms_channels_child ON comms_channels (linked_child_id);

-- ── 2. comms_channel_members ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comms_channel_members (
  id              TEXT PRIMARY KEY,
  channel_id      TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  role_in_channel TEXT NOT NULL DEFAULT 'member',
  muted           BOOLEAN NOT NULL DEFAULT FALSE,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comms_members_channel ON comms_channel_members (channel_id);
CREATE INDEX IF NOT EXISTS idx_comms_members_user ON comms_channel_members (user_id);

-- ── 3. comms_messages ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comms_messages (
  id                      TEXT PRIMARY KEY,
  channel_id              TEXT NOT NULL,
  home_id                 TEXT NOT NULL DEFAULT 'home_oak',
  author_id               TEXT NOT NULL,
  body                    TEXT NOT NULL,
  priority                TEXT NOT NULL DEFAULT 'normal',
  requires_acknowledgement BOOLEAN NOT NULL DEFAULT FALSE,
  linked_child_id         TEXT,
  linked_incident_id      TEXT,
  linked_record_type      TEXT,
  linked_record_id        TEXT,
  edited                  BOOLEAN NOT NULL DEFAULT FALSE,
  edit_history            JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_deleted              BOOLEAN NOT NULL DEFAULT FALSE,
  deleted_at              TIMESTAMPTZ,
  deleted_by              TEXT,
  retention_category      TEXT NOT NULL DEFAULT 'routine_messages',
  investigation_hold      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comms_messages_channel ON comms_messages (channel_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comms_messages_home ON comms_messages (home_id);
CREATE INDEX IF NOT EXISTS idx_comms_messages_hold ON comms_messages (investigation_hold) WHERE investigation_hold = TRUE;

-- ── 4. comms_message_receipts ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comms_message_receipts (
  id              TEXT PRIMARY KEY,
  message_id      TEXT NOT NULL,
  channel_id      TEXT NOT NULL,
  user_id         TEXT NOT NULL,
  read_at         TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  UNIQUE (message_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_comms_receipts_message ON comms_message_receipts (message_id);
CREATE INDEX IF NOT EXISTS idx_comms_receipts_user ON comms_message_receipts (user_id, channel_id);

-- ── 5. comms_message_actions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comms_message_actions (
  id              TEXT PRIMARY KEY,
  message_id      TEXT NOT NULL,
  action_type     TEXT NOT NULL,
  target_record_id TEXT,
  created_by      TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comms_actions_message ON comms_message_actions (message_id);

-- ── 6. staff_trust_notice_acknowledgements ────────────────────────────────────
CREATE TABLE IF NOT EXISTS staff_trust_notice_acknowledgements (
  id              TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL DEFAULT 'org_default',
  user_id         TEXT NOT NULL,
  notice_version  TEXT NOT NULL,
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trust_notice_user ON staff_trust_notice_acknowledgements (user_id);

-- ── 7. Row-level security ─────────────────────────────────────────────────────
-- Home-scoped (same pattern as migration 006); service role (API routes) bypasses
-- RLS. Application-layer comms-access.ts enforces the fine-grained channel rules.

ALTER TABLE comms_channels                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms_channel_members               ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms_messages                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms_message_receipts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE comms_message_actions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_trust_notice_acknowledgements ENABLE ROW LEVEL SECURITY;

-- comms_channels: home-scoped read/write; managers delete.
DROP POLICY IF EXISTS comms_channels_select ON comms_channels;
CREATE POLICY comms_channels_select ON comms_channels FOR SELECT USING (home_id = get_my_home_id());
DROP POLICY IF EXISTS comms_channels_insert ON comms_channels;
CREATE POLICY comms_channels_insert ON comms_channels FOR INSERT WITH CHECK (home_id = get_my_home_id());
DROP POLICY IF EXISTS comms_channels_update ON comms_channels;
CREATE POLICY comms_channels_update ON comms_channels FOR UPDATE USING (home_id = get_my_home_id());
DROP POLICY IF EXISTS comms_channels_delete ON comms_channels;
CREATE POLICY comms_channels_delete ON comms_channels FOR DELETE USING (
  home_id = get_my_home_id() AND get_my_role() IN ('registered_manager','deputy_manager','responsible_individual')
);

-- comms_messages: home-scoped read/write. No DELETE policy — messages are soft-deleted only.
DROP POLICY IF EXISTS comms_messages_select ON comms_messages;
CREATE POLICY comms_messages_select ON comms_messages FOR SELECT USING (home_id = get_my_home_id());
DROP POLICY IF EXISTS comms_messages_insert ON comms_messages;
CREATE POLICY comms_messages_insert ON comms_messages FOR INSERT WITH CHECK (home_id = get_my_home_id());
DROP POLICY IF EXISTS comms_messages_update ON comms_messages;
CREATE POLICY comms_messages_update ON comms_messages FOR UPDATE USING (home_id = get_my_home_id());

-- comms_channel_members + receipts + actions: channel/home scoped via subquery.
DROP POLICY IF EXISTS comms_members_all ON comms_channel_members;
CREATE POLICY comms_members_all ON comms_channel_members FOR ALL USING (
  channel_id IN (SELECT id FROM comms_channels WHERE home_id = get_my_home_id())
) WITH CHECK (channel_id IN (SELECT id FROM comms_channels WHERE home_id = get_my_home_id()));

DROP POLICY IF EXISTS comms_receipts_all ON comms_message_receipts;
CREATE POLICY comms_receipts_all ON comms_message_receipts FOR ALL USING (
  channel_id IN (SELECT id FROM comms_channels WHERE home_id = get_my_home_id())
) WITH CHECK (channel_id IN (SELECT id FROM comms_channels WHERE home_id = get_my_home_id()));

DROP POLICY IF EXISTS comms_actions_all ON comms_message_actions;
CREATE POLICY comms_actions_all ON comms_message_actions FOR ALL USING (
  message_id IN (SELECT id FROM comms_messages WHERE home_id = get_my_home_id())
) WITH CHECK (message_id IN (SELECT id FROM comms_messages WHERE home_id = get_my_home_id()));

-- Trust notice acks: a user sees/writes only their own.
DROP POLICY IF EXISTS trust_notice_own ON staff_trust_notice_acknowledgements;
CREATE POLICY trust_notice_own ON staff_trust_notice_acknowledgements FOR ALL
  USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);

COMMENT ON TABLE comms_messages IS 'Comms Centre messages — soft-delete only; never hard-deleted. Convertible to formal records (Phase 2).';
