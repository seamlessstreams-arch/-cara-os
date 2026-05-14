-- Migration: 231_work_experience_employment
-- Service: work-experience-employment-service
-- CHR 2015 Reg 8(2)(a)(vi) (preparation for independence), Reg 5(c) (employment)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_work_experience_employment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  placement_type text NOT NULL CHECK (placement_type IN ('work_experience','volunteer_placement','apprenticeship','part_time_employment','career_taster','cv_workshop','interview_practice','job_search_support','enterprise_activity','other')),
  readiness_level text NOT NULL CHECK (readiness_level IN ('work_ready','nearly_ready','developing','early_stage','not_ready')),
  employer_feedback text NOT NULL CHECK (employer_feedback IN ('excellent','good','satisfactory','needs_improvement','not_suitable')),
  skill_acquisition text NOT NULL CHECK (skill_acquisition IN ('significant_gain','good_gain','some_gain','no_gain','decline')),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  supported_by text NOT NULL,
  child_consented boolean NOT NULL DEFAULT true,
  age_appropriate boolean NOT NULL DEFAULT true,
  risk_assessed boolean NOT NULL DEFAULT true,
  safeguarding_checked boolean NOT NULL DEFAULT true,
  dbs_verified boolean NOT NULL DEFAULT true,
  insurance_confirmed boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  pathway_plan_updated boolean NOT NULL DEFAULT true,
  transport_arranged boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_work_experience_home ON cs_work_experience_employment(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_work_experience_date ON cs_work_experience_employment(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_work_experience_type ON cs_work_experience_employment(placement_type);

ALTER TABLE cs_work_experience_employment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_work_experience_employment_home_isolation" ON cs_work_experience_employment;
CREATE POLICY "cs_work_experience_employment_home_isolation" ON cs_work_experience_employment
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 231 work_experience_employment: %', SQLERRM;
END $$;
