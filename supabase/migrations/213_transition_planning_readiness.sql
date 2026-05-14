-- 213: Transition Planning Readiness
-- CHR 2015 Reg 13 (leaving care), Reg 14 (care planning)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_transition_planning_readiness (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  transition_type text NOT NULL DEFAULT 'leaving_care',
  readiness_level text NOT NULL DEFAULT 'partially_ready',
  independence_skill text NOT NULL DEFAULT 'developing',
  pathway_plan_status text NOT NULL DEFAULT 'in_progress',
  assessment_date date NOT NULL DEFAULT now(),
  child_name   text NOT NULL DEFAULT '',
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  assessed_by  text NOT NULL DEFAULT '',
  child_views_included boolean NOT NULL DEFAULT true,
  life_skills_assessed boolean NOT NULL DEFAULT true,
  budgeting_skills boolean NOT NULL DEFAULT true,
  cooking_skills boolean NOT NULL DEFAULT true,
  housing_identified boolean NOT NULL DEFAULT true,
  education_employment_plan boolean NOT NULL DEFAULT true,
  health_needs_addressed boolean NOT NULL DEFAULT true,
  social_network_mapped boolean NOT NULL DEFAULT true,
  personal_advisor_allocated boolean NOT NULL DEFAULT true,
  social_worker_involved boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_transition_planning_readiness ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transition_planning_readiness_home" ON cs_transition_planning_readiness;
CREATE POLICY "transition_planning_readiness_home" ON cs_transition_planning_readiness
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 213 idempotent: %', SQLERRM;
END $$;
