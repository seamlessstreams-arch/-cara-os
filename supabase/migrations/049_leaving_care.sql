-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 049 Leaving Care / Pathway Planning
-- Pathway plans, independence assessments, entitlements for 16+ YP.
-- Reg 14 (duty of care leaving), Children (Leaving Care) Act 2000,
-- Reg 36 (case records), SCCIF Experiences & Progress.
-- Tables: cs_pathway_plans, cs_independence_assessments,
--         cs_leaving_care_entitlements
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_pathway_plans ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_pathway_plans (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                   UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                  UUID NOT NULL,
  child_name                TEXT NOT NULL,
  plan_type                 TEXT NOT NULL DEFAULT 'initial',
  status                    TEXT NOT NULL DEFAULT 'draft',
  start_date                DATE NOT NULL DEFAULT CURRENT_DATE,
  target_leaving_date       DATE,
  accommodation_plan        TEXT NOT NULL DEFAULT '',
  accommodation_type        TEXT,
  education_training_plan   TEXT NOT NULL DEFAULT '',
  education_status          TEXT,
  employment_plan           TEXT NOT NULL DEFAULT '',
  financial_plan            TEXT NOT NULL DEFAULT '',
  benefit_entitlements      JSONB NOT NULL DEFAULT '[]',
  health_plan               TEXT NOT NULL DEFAULT '',
  registered_gp             BOOLEAN NOT NULL DEFAULT FALSE,
  registered_dentist        BOOLEAN NOT NULL DEFAULT FALSE,
  emotional_support_plan    TEXT NOT NULL DEFAULT '',
  social_network            JSONB NOT NULL DEFAULT '[]',
  life_skills_assessment    JSONB NOT NULL DEFAULT '{}',
  personal_advisor_name     TEXT,
  personal_advisor_contact  TEXT,
  reviewed_by               TEXT,
  review_date               DATE,
  next_review_date          DATE,
  version                   INTEGER NOT NULL DEFAULT 1,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_pathway_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "pathway_plans_home" ON cs_pathway_plans
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_pathway_plans_home
  ON cs_pathway_plans(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_pathway_plans_status
  ON cs_pathway_plans(status, next_review_date);

-- ── cs_independence_assessments ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_independence_assessments (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                   UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                  UUID NOT NULL,
  child_name                TEXT NOT NULL,
  assessment_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  assessed_by               TEXT NOT NULL,
  skills                    JSONB NOT NULL DEFAULT '[]',
  overall_readiness_score   INTEGER NOT NULL DEFAULT 0,
  areas_of_strength         JSONB NOT NULL DEFAULT '[]',
  areas_needing_development JSONB NOT NULL DEFAULT '[]',
  recommended_actions       JSONB NOT NULL DEFAULT '[]',
  next_assessment_date      DATE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_independence_assessments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "independence_assessments_home" ON cs_independence_assessments
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_independence_assessments_home
  ON cs_independence_assessments(home_id, child_id);

-- ── cs_leaving_care_entitlements ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_leaving_care_entitlements (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id             UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id            UUID NOT NULL,
  child_name          TEXT NOT NULL,
  entitlement_type    TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  amount              NUMERIC(10,2) NOT NULL DEFAULT 0,
  frequency           TEXT NOT NULL DEFAULT 'one_off',
  start_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date            DATE,
  status              TEXT NOT NULL DEFAULT 'pending',
  claimed_date        DATE,
  claimed_amount      NUMERIC(10,2),
  recorded_by         TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_leaving_care_entitlements ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "leaving_care_entitlements_home" ON cs_leaving_care_entitlements
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_leaving_care_entitlements_home
  ON cs_leaving_care_entitlements(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_leaving_care_entitlements_status
  ON cs_leaving_care_entitlements(status, child_id);
