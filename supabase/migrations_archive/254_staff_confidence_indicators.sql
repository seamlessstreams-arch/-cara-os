-- 254: Staff Confidence Indicators
-- Tracks staff confidence across key practice areas — where they feel strong and where support is needed
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_staff_confidence_indicators (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id),
  staff_name text NOT NULL,
  staff_id uuid,
  practice_area text NOT NULL CHECK (practice_area IN ('de_escalation','safeguarding','medication','recording','care_planning','communication','child_engagement','team_working','lone_working','professional_boundaries')),
  confidence_level text NOT NULL CHECK (confidence_level IN ('very_confident','confident','developing','low_confidence','no_confidence')),
  trend_direction text NOT NULL CHECK (trend_direction IN ('improving','stable','declining','fluctuating','new_assessment')),
  assessment_source text NOT NULL CHECK (assessment_source IN ('self_assessment','supervision_observation','peer_feedback','manager_assessment','training_evaluation','incident_review','child_feedback','multi_source','annual_review','other')),
  session_date date NOT NULL,
  assessed_by text NOT NULL,
  confidence_description text NOT NULL,
  evidence_basis text NOT NULL,
  strengths_observed text,
  development_needs text,
  support_provided text,
  training_linked text,
  staff_self_reflection text,
  manager_observation text,
  previous_confidence_level text,
  barriers_to_confidence text,
  approved_by text,
  approved_at timestamptz,
  evidence_based boolean NOT NULL DEFAULT false,
  staff_self_assessed boolean NOT NULL DEFAULT false,
  manager_validated boolean NOT NULL DEFAULT false,
  strengths_discussed boolean NOT NULL DEFAULT false,
  development_plan_linked boolean NOT NULL DEFAULT false,
  training_identified boolean NOT NULL DEFAULT false,
  mentoring_offered boolean NOT NULL DEFAULT false,
  supervision_discussed boolean NOT NULL DEFAULT false,
  wellbeing_considered boolean NOT NULL DEFAULT false,
  progress_tracked boolean NOT NULL DEFAULT false,
  staff_agreed boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_staff_confidence_indicators_home ON cs_staff_confidence_indicators(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_staff_confidence_indicators_staff ON cs_staff_confidence_indicators(staff_name);
CREATE INDEX IF NOT EXISTS idx_cs_staff_confidence_indicators_date ON cs_staff_confidence_indicators(session_date);

ALTER TABLE cs_staff_confidence_indicators ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_confidence_indicators_home" ON cs_staff_confidence_indicators;
CREATE POLICY "staff_confidence_indicators_home" ON cs_staff_confidence_indicators
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 254 (staff confidence indicators): %', SQLERRM;
END $$;
