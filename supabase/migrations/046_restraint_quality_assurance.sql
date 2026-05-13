-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 046 Physical Interventions + Quality Assurance
-- Restraint: Reg 19 (behaviour management), Reg 20 (restraint), Reg 35
-- Quality: Reg 45 (review of quality of care), SCCIF Leadership & Management
-- Tables: cs_restraint_records, cs_quality_audits, cs_improvement_plans
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_restraint_records ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_restraint_records (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                   UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                  UUID NOT NULL,
  child_name                TEXT NOT NULL,
  incident_date             DATE NOT NULL DEFAULT CURRENT_DATE,
  incident_time             TIME NOT NULL,
  restraint_type            TEXT NOT NULL,
  technique_used            TEXT NOT NULL,
  duration_minutes          INTEGER NOT NULL DEFAULT 0,
  staff_involved            JSONB NOT NULL DEFAULT '[]',
  antecedent                TEXT NOT NULL DEFAULT '',
  behaviour_description     TEXT NOT NULL DEFAULT '',
  de_escalation_attempted   JSONB NOT NULL DEFAULT '[]',
  outcome                   TEXT NOT NULL DEFAULT '',
  injuries_child            JSONB NOT NULL DEFAULT '[]',
  injuries_staff            JSONB NOT NULL DEFAULT '[]',
  body_map_completed        BOOLEAN NOT NULL DEFAULT FALSE,
  child_views_obtained      BOOLEAN NOT NULL DEFAULT FALSE,
  child_views               TEXT NOT NULL DEFAULT '',
  debrief_completed         BOOLEAN NOT NULL DEFAULT FALSE,
  debrief_date              DATE,
  debrief_notes             TEXT,
  manager_reviewed          BOOLEAN NOT NULL DEFAULT FALSE,
  manager_review_date       DATE,
  manager_review_notes      TEXT,
  ofsted_notified           BOOLEAN NOT NULL DEFAULT FALSE,
  parent_carer_notified     BOOLEAN NOT NULL DEFAULT FALSE,
  social_worker_notified    BOOLEAN NOT NULL DEFAULT FALSE,
  created_by                TEXT NOT NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_restraint_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "restraint_records_home" ON cs_restraint_records
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_restraint_records_home
  ON cs_restraint_records(home_id, incident_date);

CREATE INDEX IF NOT EXISTS idx_restraint_records_child
  ON cs_restraint_records(child_id);

-- ── cs_quality_audits ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_quality_audits (
  id                          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                     UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  audit_type                  TEXT NOT NULL,
  audit_date                  DATE NOT NULL DEFAULT CURRENT_DATE,
  auditor                     TEXT NOT NULL,
  areas_audited               JSONB NOT NULL DEFAULT '[]',
  overall_rating              TEXT NOT NULL DEFAULT 'good',
  strengths                   JSONB NOT NULL DEFAULT '[]',
  areas_for_improvement       JSONB NOT NULL DEFAULT '[]',
  recommendations             JSONB NOT NULL DEFAULT '[]',
  previous_actions_reviewed   BOOLEAN NOT NULL DEFAULT FALSE,
  previous_actions_status     TEXT NOT NULL DEFAULT '',
  next_audit_date             DATE,
  status                      TEXT NOT NULL DEFAULT 'planned',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_quality_audits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "quality_audits_home" ON cs_quality_audits
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_quality_audits_home
  ON cs_quality_audits(home_id, audit_date);

CREATE INDEX IF NOT EXISTS idx_quality_audits_status
  ON cs_quality_audits(status);

-- ── cs_improvement_plans ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_improvement_plans (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id               UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  title                 TEXT NOT NULL,
  source                TEXT NOT NULL,
  created_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  target_completion     DATE NOT NULL,
  actions               JSONB NOT NULL DEFAULT '[]',
  status                TEXT NOT NULL DEFAULT 'active',
  progress_percentage   INTEGER NOT NULL DEFAULT 0,
  review_date           DATE,
  reviewed_by           TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_improvement_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "improvement_plans_home" ON cs_improvement_plans
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_improvement_plans_home
  ON cs_improvement_plans(home_id);

CREATE INDEX IF NOT EXISTS idx_improvement_plans_status
  ON cs_improvement_plans(status);
