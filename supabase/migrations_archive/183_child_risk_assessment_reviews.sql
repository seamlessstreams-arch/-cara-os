-- Migration: cs_child_risk_assessment_reviews
-- Tracks periodic reviews of individual child risk assessments

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_child_risk_assessment_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  risk_domain text NOT NULL DEFAULT 'other',
  review_outcome text NOT NULL DEFAULT 'risk_unchanged',
  current_risk_level text NOT NULL DEFAULT 'medium',
  review_frequency text NOT NULL DEFAULT 'monthly',
  review_date date NOT NULL DEFAULT now(),
  child_name text NOT NULL DEFAULT '',
  child_id uuid,
  reviewed_by text NOT NULL DEFAULT '',
  child_participated boolean,
  social_worker_consulted boolean,
  multi_agency_input boolean NOT NULL DEFAULT false,
  triggers_updated boolean,
  protective_factors_reviewed boolean,
  safety_plan_updated boolean,
  staff_briefed boolean,
  management_oversight boolean,
  evidence_documented boolean,
  dynamic_factors_assessed boolean,
  historical_factors_reviewed boolean,
  contingency_plan_current boolean,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  previous_risk_level text,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_child_risk_assessment_reviews_home ON cs_child_risk_assessment_reviews(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_child_risk_assessment_reviews_date ON cs_child_risk_assessment_reviews(review_date);

ALTER TABLE cs_child_risk_assessment_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_child_risk_assessment_reviews_home_isolation ON cs_child_risk_assessment_reviews;
CREATE POLICY cs_child_risk_assessment_reviews_home_isolation ON cs_child_risk_assessment_reviews
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_child_risk_assessment_reviews migration: %', SQLERRM;
END $$;
