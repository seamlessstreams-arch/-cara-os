-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 051 Sanctions & Rewards / Consequence Framework
-- Behaviour management records for sanctions and positive reinforcement.
-- Reg 19 (behaviour management), Reg 20 (restraint cross-ref),
-- Reg 35 (behaviour management standards), SCCIF Experiences & Progress.
-- Tables: cs_sanction_records, cs_reward_records
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_sanction_records ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_sanction_records (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id               UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id              UUID NOT NULL,
  child_name            TEXT NOT NULL,
  sanction_type         TEXT NOT NULL,
  reason                TEXT NOT NULL DEFAULT '',
  description           TEXT NOT NULL DEFAULT '',
  incident_date         DATE NOT NULL DEFAULT CURRENT_DATE,
  incident_time         TIME,
  duration_minutes      INTEGER NOT NULL DEFAULT 0,
  privilege_removed     TEXT,
  proportionate         BOOLEAN NOT NULL DEFAULT TRUE,
  age_appropriate       BOOLEAN NOT NULL DEFAULT TRUE,
  consistent_with_plan  BOOLEAN NOT NULL DEFAULT TRUE,
  child_informed        BOOLEAN NOT NULL DEFAULT TRUE,
  child_response        TEXT,
  imposed_by            TEXT NOT NULL,
  witnessed_by          TEXT,
  manager_reviewed      BOOLEAN NOT NULL DEFAULT FALSE,
  manager_reviewed_by   TEXT,
  manager_review_date   DATE,
  status                TEXT NOT NULL DEFAULT 'active',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_sanction_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "sanction_records_home" ON cs_sanction_records
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_sanction_records_home
  ON cs_sanction_records(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_sanction_records_date
  ON cs_sanction_records(incident_date, status);

-- ── cs_reward_records ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_reward_records (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id             UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id            UUID NOT NULL,
  child_name          TEXT NOT NULL,
  reward_type         TEXT NOT NULL,
  reason              TEXT NOT NULL DEFAULT '',
  description         TEXT NOT NULL DEFAULT '',
  award_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  awarded_by          TEXT NOT NULL,
  linked_to_target    BOOLEAN NOT NULL DEFAULT FALSE,
  target_description  TEXT,
  child_response      TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_reward_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "reward_records_home" ON cs_reward_records
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_reward_records_home
  ON cs_reward_records(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_reward_records_date
  ON cs_reward_records(award_date);
