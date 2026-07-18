-- Migration: 236_positive_behaviour_reinforcement
-- Service: positive-behaviour-reinforcement-service
-- CHR 2015 Reg 19(2)(a) (promoting positive behaviour), Reg 11(2)(b) (nurturing wellbeing)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_positive_behaviour_reinforcement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  reinforcement_type text NOT NULL CHECK (reinforcement_type IN ('verbal_praise','written_recognition','reward_chart','special_privilege','activity_reward','token_economy','peer_recognition','certificate_award','family_celebration','other')),
  praise_quality text NOT NULL CHECK (praise_quality IN ('specific_genuine','appropriate','generic','inconsistent','absent')),
  child_response text NOT NULL CHECK (child_response IN ('very_positive','positive','neutral','indifferent','negative')),
  consistency_level text NOT NULL CHECK (consistency_level IN ('highly_consistent','consistent','variable','inconsistent','absent')),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  supported_by text NOT NULL,
  behaviour_specific boolean NOT NULL DEFAULT true,
  age_appropriate boolean NOT NULL DEFAULT true,
  culturally_sensitive boolean NOT NULL DEFAULT true,
  timely_delivery boolean NOT NULL DEFAULT true,
  proportionate_response boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  peers_included boolean NOT NULL DEFAULT true,
  child_input_sought boolean NOT NULL DEFAULT true,
  progress_tracked boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_positive_behaviour_home ON cs_positive_behaviour_reinforcement(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_positive_behaviour_date ON cs_positive_behaviour_reinforcement(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_positive_behaviour_type ON cs_positive_behaviour_reinforcement(reinforcement_type);

ALTER TABLE cs_positive_behaviour_reinforcement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_positive_behaviour_reinforcement_home_isolation" ON cs_positive_behaviour_reinforcement;
CREATE POLICY "cs_positive_behaviour_reinforcement_home_isolation" ON cs_positive_behaviour_reinforcement
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 236 positive_behaviour_reinforcement: %', SQLERRM;
END $$;
