-- ══════════════════════════════════════════════════════════════════
-- CORNERSTONE — Environmental Audits
-- CHR 2015 Reg 25, 36, 6
-- ══════════════════════════════════════════════════════════════════

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_environmental_audits (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  audit_area    text NOT NULL DEFAULT 'communal_living',
  audit_rating  text NOT NULL DEFAULT 'good',
  audit_type    text NOT NULL DEFAULT 'scheduled_audit',
  priority_level text NOT NULL DEFAULT 'medium',
  audit_date    date NOT NULL DEFAULT CURRENT_DATE,
  area_name     text NOT NULL,
  homely_feel   boolean,
  child_friendly boolean,
  personalised  boolean,
  clean_and_tidy boolean,
  well_maintained boolean,
  safe_environment boolean,
  accessible    boolean,
  adequate_lighting boolean,
  temperature_comfortable boolean,
  noise_appropriate boolean,
  privacy_maintained boolean,
  children_consulted boolean,
  issues_found  jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  audited_by    text NOT NULL,
  next_audit_date date,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_environmental_audits_home
  ON cs_environmental_audits(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_environmental_audits_date
  ON cs_environmental_audits(audit_date);

ALTER TABLE cs_environmental_audits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_environmental_audits_tenant ON cs_environmental_audits;
CREATE POLICY cs_environmental_audits_tenant ON cs_environmental_audits
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Migration 172 (environmental_audits): %', SQLERRM;
END $$;
