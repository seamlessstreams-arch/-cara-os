-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — Migration 018: Generic Records Table
--
-- Catch-all table for the 300+ extended record types that don't have
-- individual tables yet. Each record's type is identified by `record_type`
-- (e.g., 'adoption_records', 'allergy_plans', 'advocacy_records') and the
-- full record payload lives in the `data` JSONB column.
--
-- This lets the platform run entirely on Supabase Cloud without needing
-- a separate table per extended type. Individual tables can be introduced
-- later for high-volume or high-query types.
-- ══════════════════════════════════════════════════════════════════════════════

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS generic_records (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id         uuid        NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  record_type     text        NOT NULL,
  data            jsonb       NOT NULL DEFAULT '{}',
  child_id        uuid        REFERENCES young_people(id) ON DELETE SET NULL,
  staff_id        uuid        REFERENCES staff_members(id) ON DELETE SET NULL,
  created_by      text,
  updated_by      text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE generic_records IS
  'Catch-all table for extended record types. record_type identifies the specific type (e.g., adoption_records, allergy_plans). data contains the full record as JSONB. Allows all 300+ extended Cornerstone record types to be stored in Supabase without individual tables.';

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX idx_generic_records_home_type ON generic_records (home_id, record_type);
CREATE INDEX idx_generic_records_type      ON generic_records (record_type);
CREATE INDEX idx_generic_records_child     ON generic_records (child_id) WHERE child_id IS NOT NULL;
CREATE INDEX idx_generic_records_staff     ON generic_records (staff_id) WHERE staff_id IS NOT NULL;
CREATE INDEX idx_generic_records_data      ON generic_records USING gin (data);

-- ── Auto-update updated_at trigger ───────────────────────────────────────────

CREATE TRIGGER set_generic_records_updated_at
  BEFORE UPDATE ON generic_records
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE generic_records ENABLE ROW LEVEL SECURITY;

-- Authenticated users: scoped to their home
CREATE POLICY generic_records_select_home ON generic_records
  FOR SELECT TO authenticated
  USING (home_id = get_my_home_id());

CREATE POLICY generic_records_insert_home ON generic_records
  FOR INSERT TO authenticated
  WITH CHECK (home_id = get_my_home_id());

CREATE POLICY generic_records_update_home ON generic_records
  FOR UPDATE TO authenticated
  USING (home_id = get_my_home_id())
  WITH CHECK (home_id = get_my_home_id());

-- Service role: full access (used by server-side API routes)
CREATE POLICY generic_records_service_role_all ON generic_records
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);
