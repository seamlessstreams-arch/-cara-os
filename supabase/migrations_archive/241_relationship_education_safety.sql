-- Migration: 241_relationship_education_safety
-- Service: relationship-education-safety-service
-- CHR 2015 Reg 12(2)(b) (online safety and relationships), Reg 5(c) (healthy relationships)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_relationship_education_safety (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  topic_area text NOT NULL CHECK (topic_area IN ('consent_understanding','healthy_relationships','body_safety','online_safety','personal_boundaries','gender_identity','emotional_literacy','peer_pressure','conflict_resolution','other')),
  understanding_level text NOT NULL CHECK (understanding_level IN ('confident','good_understanding','developing','limited','not_understood')),
  engagement_quality text NOT NULL CHECK (engagement_quality IN ('highly_engaged','engaged','partially_engaged','disengaged','refused')),
  age_appropriateness text NOT NULL CHECK (age_appropriateness IN ('very_appropriate','appropriate','somewhat_appropriate','not_appropriate','harmful')),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  delivered_by text NOT NULL,
  child_consented boolean NOT NULL DEFAULT true,
  age_appropriate_content boolean NOT NULL DEFAULT true,
  safe_space_provided boolean NOT NULL DEFAULT true,
  trigger_warnings_given boolean NOT NULL DEFAULT true,
  child_led_pace boolean NOT NULL DEFAULT true,
  resources_provided boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  follow_up_offered boolean NOT NULL DEFAULT true,
  confidentiality_maintained boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_relationship_ed_home ON cs_relationship_education_safety(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_relationship_ed_date ON cs_relationship_education_safety(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_relationship_ed_topic ON cs_relationship_education_safety(topic_area);

ALTER TABLE cs_relationship_education_safety ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_relationship_education_safety_home_isolation" ON cs_relationship_education_safety;
CREATE POLICY "cs_relationship_education_safety_home_isolation" ON cs_relationship_education_safety
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 241 relationship_education_safety: %', SQLERRM;
END $$;
