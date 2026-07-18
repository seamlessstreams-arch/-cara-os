-- Migration: 202_room_sharing_assessment
-- Table: cs_room_sharing_assessment
-- CHR 2015 Reg 10 (accommodation), Reg 12 (health/wellbeing)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_room_sharing_assessment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  sharing_arrangement text NOT NULL CHECK (sharing_arrangement IN ('single_room','shared_by_choice','shared_by_necessity','temporary_sharing','emergency_sharing')),
  compatibility_rating text NOT NULL CHECK (compatibility_rating IN ('highly_compatible','compatible','manageable','incompatible','not_assessed')),
  room_risk_level text NOT NULL CHECK (room_risk_level IN ('no_risk','low','medium','high','unacceptable')),
  review_frequency text NOT NULL CHECK (review_frequency IN ('weekly','fortnightly','monthly','quarterly','as_needed')),
  assessment_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  assessed_by text NOT NULL,
  child_consent_obtained boolean NOT NULL DEFAULT true,
  child_views_sought boolean NOT NULL DEFAULT true,
  safeguarding_check_done boolean NOT NULL DEFAULT true,
  risk_assessment_current boolean NOT NULL DEFAULT true,
  age_appropriate boolean NOT NULL DEFAULT true,
  gender_appropriate boolean NOT NULL DEFAULT true,
  behaviour_history_considered boolean NOT NULL DEFAULT true,
  social_worker_consulted boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT false,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  privacy_maintained boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_room_sharing_assessment ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_room_sharing_assessment_home ON cs_room_sharing_assessment;
CREATE POLICY cs_room_sharing_assessment_home ON cs_room_sharing_assessment
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_room_sharing_assessment_home ON cs_room_sharing_assessment(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_room_sharing_assessment_date ON cs_room_sharing_assessment(assessment_date);
CREATE INDEX IF NOT EXISTS idx_cs_room_sharing_assessment_risk ON cs_room_sharing_assessment(room_risk_level);

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 202 room_sharing_assessment: %', SQLERRM;
END $$;
