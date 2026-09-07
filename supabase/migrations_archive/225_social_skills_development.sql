-- Social Skills Development tracking
-- CHR 2015 Reg 8(2)(a)(vii) (social development), Reg 6 (quality of care)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_social_skills_development (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  skill_area text NOT NULL DEFAULT 'other',
  competence_level text NOT NULL DEFAULT 'developing',
  progress_assessment text NOT NULL DEFAULT 'some_progress',
  group_dynamic text NOT NULL DEFAULT 'active_participant',
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  facilitated_by text NOT NULL,
  child_engaged boolean,
  age_appropriate boolean,
  strengths_identified boolean,
  targets_set boolean,
  positive_reinforcement boolean,
  peer_modelling_used boolean,
  care_plan_reflects boolean,
  social_worker_informed boolean,
  family_updated boolean,
  school_linked boolean,
  therapeutic_input boolean,
  recorded_promptly boolean,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_social_skills_development ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Home isolation" ON cs_social_skills_development;
CREATE POLICY "Home isolation" ON cs_social_skills_development
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_social_skills_development_home
  ON cs_social_skills_development(home_id);

EXCEPTION WHEN others THEN RAISE NOTICE 'cs_social_skills_development migration: %', SQLERRM;
END $$;
