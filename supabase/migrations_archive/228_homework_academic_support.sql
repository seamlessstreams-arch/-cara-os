-- Migration: 228_homework_academic_support
-- Service: homework-academic-support-service
-- CHR 2015 Reg 8(2)(a) (education), Reg 8(1) (educational development)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_homework_academic_support (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  subject_area text NOT NULL CHECK (subject_area IN ('english','maths','science','humanities','languages','creative_arts','technology','physical_education','life_skills','other')),
  support_type text NOT NULL CHECK (support_type IN ('homework_help','one_to_one_tutoring','group_study','revision_support','exam_preparation')),
  engagement_level text NOT NULL CHECK (engagement_level IN ('highly_engaged','engaged','partially_engaged','disengaged','refused')),
  progress_outcome text NOT NULL CHECK (progress_outcome IN ('exceeded_expectations','met_expectations','some_progress','no_progress','regression')),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  supported_by text NOT NULL,
  homework_completed boolean NOT NULL DEFAULT true,
  quiet_space_provided boolean NOT NULL DEFAULT true,
  resources_available boolean NOT NULL DEFAULT true,
  school_liaison_made boolean NOT NULL DEFAULT true,
  learning_needs_met boolean NOT NULL DEFAULT true,
  positive_encouragement boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  pep_updated boolean NOT NULL DEFAULT true,
  attendance_checked boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_homework_academic_home ON cs_homework_academic_support(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_homework_academic_date ON cs_homework_academic_support(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_homework_academic_subject ON cs_homework_academic_support(subject_area);

ALTER TABLE cs_homework_academic_support ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_homework_academic_support_home_isolation" ON cs_homework_academic_support;
CREATE POLICY "cs_homework_academic_support_home_isolation" ON cs_homework_academic_support
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 228 homework_academic_support: %', SQLERRM;
END $$;
