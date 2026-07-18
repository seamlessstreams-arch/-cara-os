-- Migration: 229_advocacy_representation
-- Service: advocacy-representation-service
-- CHR 2015 Reg 7 (advocacy/representation), Reg 14(2)(b)(iv) (access to advocacy)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_advocacy_representation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  advocacy_type text NOT NULL CHECK (advocacy_type IN ('independent_advocate','peer_advocacy','self_advocacy','formal_representation','informal_support','complaints_advocacy','review_advocacy','rights_education','group_advocacy','other')),
  representation_quality text NOT NULL CHECK (representation_quality IN ('excellent','good','adequate','poor','not_provided')),
  child_satisfaction text NOT NULL CHECK (child_satisfaction IN ('very_satisfied','satisfied','neutral','dissatisfied','very_dissatisfied')),
  outcome_effectiveness text NOT NULL CHECK (outcome_effectiveness IN ('fully_effective','mostly_effective','partially_effective','ineffective','counterproductive')),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  facilitated_by text NOT NULL,
  child_voice_heard boolean NOT NULL DEFAULT true,
  child_understood_rights boolean NOT NULL DEFAULT true,
  independent_access boolean NOT NULL DEFAULT true,
  confidentiality_maintained boolean NOT NULL DEFAULT true,
  outcome_communicated boolean NOT NULL DEFAULT true,
  follow_up_arranged boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  irm_notified boolean NOT NULL DEFAULT true,
  decision_influenced boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_advocacy_representation_home ON cs_advocacy_representation(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_advocacy_representation_date ON cs_advocacy_representation(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_advocacy_representation_type ON cs_advocacy_representation(advocacy_type);

ALTER TABLE cs_advocacy_representation ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_advocacy_representation_home_isolation" ON cs_advocacy_representation;
CREATE POLICY "cs_advocacy_representation_home_isolation" ON cs_advocacy_representation
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 229 advocacy_representation: %', SQLERRM;
END $$;
