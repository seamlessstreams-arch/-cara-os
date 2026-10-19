-- ══════════════════════════════════════════════════════════════════
-- CORNERSTONE — Admission Assessments
-- CHR 2015 Reg 14, 36, 5
-- ══════════════════════════════════════════════════════════════════

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_admission_assessments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  assessment_stage text NOT NULL DEFAULT 'initial_assessment',
  suitability_decision text NOT NULL DEFAULT 'pending',
  matching_outcome text NOT NULL DEFAULT 'not_assessed',
  referral_source text NOT NULL DEFAULT 'local_authority',
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name    text NOT NULL,
  child_id      text,
  placing_authority text NOT NULL,
  impact_risk_completed boolean NOT NULL DEFAULT false,
  matching_criteria_met boolean NOT NULL DEFAULT false,
  existing_children_consulted boolean NOT NULL DEFAULT false,
  pre_admission_visit_completed boolean NOT NULL DEFAULT false,
  care_plan_received boolean NOT NULL DEFAULT false,
  health_assessment_available boolean NOT NULL DEFAULT false,
  education_info_received boolean NOT NULL DEFAULT false,
  risk_assessments_reviewed boolean NOT NULL DEFAULT false,
  safeguarding_info_shared boolean NOT NULL DEFAULT false,
  placement_plan_agreed boolean NOT NULL DEFAULT false,
  key_worker_allocated boolean NOT NULL DEFAULT false,
  bedroom_prepared boolean NOT NULL DEFAULT false,
  issues_found  jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  assessed_by   text NOT NULL,
  next_review_date date,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_admission_assessments_home
  ON cs_admission_assessments(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_admission_assessments_date
  ON cs_admission_assessments(assessment_date);

ALTER TABLE cs_admission_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_admission_assessments_tenant ON cs_admission_assessments;
CREATE POLICY cs_admission_assessments_tenant ON cs_admission_assessments
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Migration 170 (admission_assessments): %', SQLERRM;
END $$;
