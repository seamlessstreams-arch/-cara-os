-- 253: Staff Review Outcomes
-- Records outcomes of formal and informal staff reviews — supervision, appraisals, performance conversations
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_review_outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  staff_name text NOT NULL,
  staff_id uuid,
  review_type text NOT NULL CHECK (review_type IN ('supervision','probation_review','annual_appraisal','return_to_work','performance_conversation','informal_check_in','capability_review','sickness_review','team_review','other')),
  review_outcome text NOT NULL CHECK (review_outcome IN ('excellent','good','satisfactory','needs_improvement','unsatisfactory')),
  outcome_status text NOT NULL DEFAULT 'draft' CHECK (outcome_status IN ('draft','agreed','disputed','under_appeal','finalised')),
  follow_up_urgency text NOT NULL DEFAULT 'next_review' CHECK (follow_up_urgency IN ('immediate','within_week','within_month','next_review','none_required')),
  session_date date NOT NULL,
  reviewed_by text NOT NULL,
  strengths_discussed text NOT NULL,
  areas_for_development text NOT NULL,
  agreed_actions text,
  staff_response text,
  support_identified text,
  training_needs text,
  concerns_raised text,
  previous_actions_progress text,
  manager_notes text,
  approved_by text,
  approved_at timestamptz,
  strengths_acknowledged boolean NOT NULL DEFAULT false,
  development_discussed boolean NOT NULL DEFAULT false,
  actions_agreed boolean NOT NULL DEFAULT false,
  staff_views_recorded boolean NOT NULL DEFAULT false,
  wellbeing_discussed boolean NOT NULL DEFAULT false,
  training_needs_identified boolean NOT NULL DEFAULT false,
  previous_actions_reviewed boolean NOT NULL DEFAULT false,
  support_offered boolean NOT NULL DEFAULT false,
  safeguarding_discussed boolean NOT NULL DEFAULT false,
  record_shared_with_staff boolean NOT NULL DEFAULT false,
  approved_by_senior boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_staff_review_outcomes_home ON cs_staff_review_outcomes(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_staff_review_outcomes_staff ON cs_staff_review_outcomes(staff_name);
CREATE INDEX IF NOT EXISTS idx_cs_staff_review_outcomes_date ON cs_staff_review_outcomes(session_date);

ALTER TABLE cs_staff_review_outcomes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_review_outcomes_home" ON cs_staff_review_outcomes;
CREATE POLICY "staff_review_outcomes_home" ON cs_staff_review_outcomes
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 253 (staff review outcomes): %', SQLERRM;
END $$;
