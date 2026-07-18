-- ══════════════════════════════════════════════════════════════════
-- CORNERSTONE — Missing Person Risk Assessments
-- CHR 2015 Reg 12, 34, 13
-- ══════════════════════════════════════════════════════════════════

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_missing_person_risk (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  risk_level    text NOT NULL DEFAULT 'medium',
  assessment_type text NOT NULL DEFAULT 'initial_assessment',
  trigger_plan_status text NOT NULL DEFAULT 'not_required',
  protective_factor text NOT NULL DEFAULT 'other',
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name    text NOT NULL,
  child_id      text,
  previous_missing_episodes integer NOT NULL DEFAULT 0,
  trigger_plan_in_place boolean NOT NULL DEFAULT false,
  return_interview_completed boolean NOT NULL DEFAULT false,
  police_informed boolean NOT NULL DEFAULT false,
  social_worker_informed boolean NOT NULL DEFAULT false,
  parents_informed boolean NOT NULL DEFAULT false,
  push_factors_identified boolean NOT NULL DEFAULT false,
  pull_factors_identified boolean NOT NULL DEFAULT false,
  peer_mapping_completed boolean NOT NULL DEFAULT false,
  safe_places_identified boolean NOT NULL DEFAULT false,
  escalation_protocol_followed boolean NOT NULL DEFAULT false,
  multi_agency_involved boolean NOT NULL DEFAULT false,
  exploitation_risk_identified boolean NOT NULL DEFAULT false,
  issues_found  jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  assessed_by   text NOT NULL,
  next_review_date date,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_missing_person_risk_home
  ON cs_missing_person_risk(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_missing_person_risk_date
  ON cs_missing_person_risk(assessment_date);

ALTER TABLE cs_missing_person_risk ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_missing_person_risk_tenant ON cs_missing_person_risk;
CREATE POLICY cs_missing_person_risk_tenant ON cs_missing_person_risk
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN
  RAISE NOTICE 'Migration 167 (missing_person_risk): %', SQLERRM;
END $$;
