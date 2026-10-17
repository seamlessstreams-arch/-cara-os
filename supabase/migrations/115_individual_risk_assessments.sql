-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — INDIVIDUAL RISK ASSESSMENTS
-- CHR 2015 Reg 12 (protection of children),
-- Reg 13 (leadership and management — risk management),
-- Reg 34 (placement plans — risk assessment).
-- Tables: cs_individual_risk_assessments
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cs_individual_risk_assessments (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name                  text NOT NULL,
  child_id                    uuid NOT NULL,
  risk_domain                 text NOT NULL,
  risk_rating                 text NOT NULL DEFAULT 'medium',
  assessment_status           text NOT NULL DEFAULT 'draft',
  assessed_by                 text NOT NULL,
  assessment_date             date NOT NULL,
  review_date                 date,
  review_trigger              text NOT NULL DEFAULT 'initial',
  risk_indicators             jsonb NOT NULL DEFAULT '[]',
  protective_factors          jsonb NOT NULL DEFAULT '[]',
  management_strategies       jsonb NOT NULL DEFAULT '[]',
  triggers                    jsonb NOT NULL DEFAULT '[]',
  staff_aware                 boolean NOT NULL DEFAULT false,
  staff_briefed_date          date,
  multi_agency_involved       boolean NOT NULL DEFAULT false,
  social_worker_informed      boolean NOT NULL DEFAULT false,
  child_involved_in_plan      boolean NOT NULL DEFAULT false,
  parent_informed             boolean NOT NULL DEFAULT false,
  linked_incident_ids         jsonb NOT NULL DEFAULT '[]',
  notes                       text,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ind_risk_home       ON cs_individual_risk_assessments(home_id);
CREATE INDEX IF NOT EXISTS idx_ind_risk_child      ON cs_individual_risk_assessments(child_id);
CREATE INDEX IF NOT EXISTS idx_ind_risk_domain     ON cs_individual_risk_assessments(risk_domain);
CREATE INDEX IF NOT EXISTS idx_ind_risk_rating     ON cs_individual_risk_assessments(risk_rating);
CREATE INDEX IF NOT EXISTS idx_ind_risk_status     ON cs_individual_risk_assessments(assessment_status);
CREATE INDEX IF NOT EXISTS idx_ind_risk_date       ON cs_individual_risk_assessments(assessment_date);

ALTER TABLE cs_individual_risk_assessments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own individual risk assessments"
    ON cs_individual_risk_assessments FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
