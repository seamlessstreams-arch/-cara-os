-- ══════════════════════════════════════════════════════════════════════════════
-- Enter Once Persistence
--
-- Durable storage for the universal "Enter Once" entry system. Records created
-- via the universal orchestrator (and their audit trail) currently live in an
-- in-memory store and reset on restart. These tables make them persistent.
--
-- Write-through happens at the API route boundary (POST /api/v1/records,
-- GET /api/v1/audit) only when Supabase is configured; otherwise the platform
-- continues with the in-memory demo store. UK GDPR compliant; RLS applied.
--
-- Tables:
--   cs_records        — every record created via the universal orchestrator
--   cs_record_audit   — the orchestrator audit log (one row per record event)
-- ══════════════════════════════════════════════════════════════════════════════

-- ── 1. cs_records ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_records (
  id              TEXT PRIMARY KEY,
  reference       TEXT NOT NULL,
  record_type     TEXT NOT NULL,
  home_id         TEXT NOT NULL DEFAULT 'home_oak',
  child_id        TEXT,
  staff_id        TEXT NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  severity        TEXT,
  status          TEXT NOT NULL DEFAULT 'open',
  tags            JSONB NOT NULL DEFAULT '[]'::jsonb,
  data            JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_records_home       ON cs_records (home_id);
CREATE INDEX IF NOT EXISTS idx_cs_records_child      ON cs_records (child_id);
CREATE INDEX IF NOT EXISTS idx_cs_records_type       ON cs_records (record_type);
CREATE INDEX IF NOT EXISTS idx_cs_records_created    ON cs_records (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cs_records_reference  ON cs_records (reference);

-- ── 2. cs_record_audit ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_record_audit (
  id              TEXT PRIMARY KEY,
  event_type      TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       TEXT NOT NULL,
  actor_id        TEXT NOT NULL,
  summary         TEXT NOT NULL,
  risk_level      TEXT NOT NULL DEFAULT 'none',
  source          TEXT NOT NULL DEFAULT 'universal',
  detail          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cs_record_audit_entity   ON cs_record_audit (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_cs_record_audit_actor    ON cs_record_audit (actor_id);
CREATE INDEX IF NOT EXISTS idx_cs_record_audit_created  ON cs_record_audit (created_at DESC);

-- ── 3. Row-level security ─────────────────────────────────────────────────────
-- Service-role (server-side) bypasses RLS. These policies govern any future
-- direct client access; default-deny to anon.

ALTER TABLE cs_records      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cs_record_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_records_service_all ON cs_records;
CREATE POLICY cs_records_service_all ON cs_records
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS cs_record_audit_service_all ON cs_record_audit;
CREATE POLICY cs_record_audit_service_all ON cs_record_audit
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
