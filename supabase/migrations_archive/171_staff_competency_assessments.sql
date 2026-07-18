-- ══════════════════════════════════════════════════════════════════
-- CORNERSTONE — Staff Competency Assessments
-- CHR 2015 Reg 32, 33, 19
-- ══════════════════════════════════════════════════════════════════

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_competency_assessments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  competency_area text NOT NULL DEFAULT 'other',
  assessment_method text NOT NULL DEFAULT 'direct_observation',
  competency_rating text NOT NULL DEFAULT 'developing',
  action_required text NOT NULL DEFAULT 'none',
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  staff_name    text NOT NULL,
  staff_role    text NOT NULL,
  assessor_name text NOT NULL,
  theory_demonstrated boolean NOT NULL DEFAULT false,
  practical_demonstrated boolean NOT NULL DEFAULT false,
  reflective_practice_shown boolean NOT NULL DEFAULT false,
  values_aligned boolean NOT NULL DEFAULT false,
  child_centred_approach boolean NOT NULL DEFAULT false,
  evidence_documented boolean NOT NULL DEFAULT false,
  development_plan_updated boolean NOT NULL DEFAULT false,
  staff_agreed_outcome boolean NOT NULL DEFAULT false,
  follow_up_date_set boolean NOT NULL DEFAULT false,
  competency_maintained boolean NOT NULL DEFAULT false,
  issues_found  jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_assessment_date date,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_staff_competency_assessments_home
  ON cs_staff_competency_assessments(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_staff_competency_assessments_date
  ON cs_staff_competency_assessments(assessment_date);

ALTER TABLE cs_staff_competency_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_staff_competency_assessments_tenant ON cs_staff_competency_assessments;
CREATE POLICY cs_staff_competency_assessments_tenant ON cs_staff_competency_assessments
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Migration 171 (staff_competency_assessments): %', SQLERRM;
END $$;
