-- Migration: 194_sleep_quality_assessment
-- Table: cs_sleep_quality_assessment
-- CHR 2015 Reg 12 (health/wellbeing — restful sleep), Reg 7 (individual child)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_sleep_quality_assessment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  sleep_quality text NOT NULL CHECK (sleep_quality IN ('excellent','good','fair','poor','very_poor')),
  bedtime_routine text NOT NULL CHECK (bedtime_routine IN ('fully_followed','mostly_followed','partially_followed','not_followed','no_routine_set')),
  sleep_environment text NOT NULL CHECK (sleep_environment IN ('excellent','good','adequate','needs_improvement','unsuitable')),
  waking_frequency text NOT NULL CHECK (waking_frequency IN ('none','once','twice','three_plus','continuous_disturbance')),
  sleep_concern text NOT NULL CHECK (sleep_concern IN ('nightmares','insomnia','sleep_apnoea','restless_legs','night_terrors','sleepwalking','medication_related','anxiety_related','none_identified','other')),
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  assessed_by text NOT NULL,
  bedtime_consistent boolean,
  wake_time_consistent boolean,
  room_comfortable boolean,
  temperature_appropriate boolean,
  noise_minimised boolean,
  screen_free_before_bed boolean,
  relaxation_supported boolean,
  child_preferences_met boolean,
  gp_referral_considered boolean NOT NULL DEFAULT false,
  sleep_plan_in_place boolean,
  care_plan_linked boolean,
  recorded_promptly boolean,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  sleep_hours numeric(4,1) NOT NULL DEFAULT 8.0,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_sleep_quality_assessment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_sleep_quality_assessment_home ON cs_sleep_quality_assessment;
CREATE POLICY cs_sleep_quality_assessment_home ON cs_sleep_quality_assessment
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_sleep_quality_assessment_home ON cs_sleep_quality_assessment(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_sleep_quality_assessment_date ON cs_sleep_quality_assessment(assessment_date);
CREATE INDEX IF NOT EXISTS idx_cs_sleep_quality_assessment_quality ON cs_sleep_quality_assessment(sleep_quality);

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 194 sleep_quality_assessment: %', SQLERRM;
END $$;
