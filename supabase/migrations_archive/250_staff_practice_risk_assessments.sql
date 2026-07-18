-- Staff Practice Risk Assessments — ARIA Staff Intelligence Layer
-- Not punitive — protective. Includes protective factors, support controls,
-- management controls, staff right to comment, approval trail.

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_practice_risk_assessments (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id          uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  staff_name       text NOT NULL,
  staff_id         uuid,
  risk_area        text NOT NULL DEFAULT 'boundaries',
  likelihood       text NOT NULL DEFAULT 'possible',
  impact_severity  text NOT NULL DEFAULT 'moderate',
  assessment_status text NOT NULL DEFAULT 'draft',
  session_date     date NOT NULL DEFAULT CURRENT_DATE,
  assessed_by      text NOT NULL,
  identified_concern text NOT NULL,
  evidence_summary text NOT NULL,
  children_affected text,
  protective_factors text,
  support_controls text,
  management_controls text,
  restrictions     text,
  decision_rationale text,
  staff_comment    text,
  approved_by      text,
  approved_at      timestamptz,
  evidence_verified                  boolean NOT NULL DEFAULT false,
  staff_notified                     boolean NOT NULL DEFAULT false,
  staff_commented                    boolean NOT NULL DEFAULT false,
  protective_factors_identified      boolean NOT NULL DEFAULT false,
  support_controls_set               boolean NOT NULL DEFAULT false,
  management_controls_set            boolean NOT NULL DEFAULT false,
  review_date_set                    boolean NOT NULL DEFAULT false,
  approved_by_senior                 boolean NOT NULL DEFAULT false,
  children_safeguarded               boolean NOT NULL DEFAULT false,
  alternative_explanations_considered boolean NOT NULL DEFAULT false,
  proportionate_response             boolean NOT NULL DEFAULT false,
  recorded_promptly                  boolean NOT NULL DEFAULT true,
  issues_found     jsonb NOT NULL DEFAULT '[]',
  actions_taken    jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes            text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_staff_practice_risk_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_practice_risk_assessments_home" ON cs_staff_practice_risk_assessments;
CREATE POLICY "staff_practice_risk_assessments_home" ON cs_staff_practice_risk_assessments
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_staff_practice_risk_assessments_home ON cs_staff_practice_risk_assessments(home_id);
CREATE INDEX IF NOT EXISTS idx_staff_practice_risk_assessments_staff ON cs_staff_practice_risk_assessments(staff_name);

EXCEPTION WHEN others THEN RAISE NOTICE 'staff_practice_risk_assessments migration: %', SQLERRM;
END $$;
