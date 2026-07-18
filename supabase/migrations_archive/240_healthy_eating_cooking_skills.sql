-- Migration: 240_healthy_eating_cooking_skills
-- Service: healthy-eating-cooking-skills-service
-- CHR 2015 Reg 9(2)(a)(v) (healthy diet and cooking), Reg 8(2)(a)(vi) (independence — cooking)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_healthy_eating_cooking_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  session_type text NOT NULL CHECK (session_type IN ('meal_preparation','baking','food_hygiene','menu_planning','shopping_skills','budget_cooking','cultural_cuisine','nutrition_education','dietary_management','other')),
  skill_level text NOT NULL CHECK (skill_level IN ('advanced','competent','developing','basic','not_started')),
  engagement_level text NOT NULL CHECK (engagement_level IN ('highly_engaged','engaged','partially_engaged','disengaged','refused')),
  health_outcome text NOT NULL CHECK (health_outcome IN ('significant_improvement','some_improvement','maintained','slight_decline','declined')),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  supported_by text NOT NULL,
  age_appropriate boolean NOT NULL DEFAULT true,
  food_hygiene_followed boolean NOT NULL DEFAULT true,
  child_chose_recipe boolean NOT NULL DEFAULT true,
  dietary_needs_met boolean NOT NULL DEFAULT true,
  allergy_awareness boolean NOT NULL DEFAULT true,
  kitchen_safety_followed boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  healthy_options_promoted boolean NOT NULL DEFAULT true,
  skills_transferable boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_healthy_eating_home ON cs_healthy_eating_cooking_skills(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_healthy_eating_date ON cs_healthy_eating_cooking_skills(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_healthy_eating_type ON cs_healthy_eating_cooking_skills(session_type);

ALTER TABLE cs_healthy_eating_cooking_skills ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_healthy_eating_cooking_skills_home_isolation" ON cs_healthy_eating_cooking_skills;
CREATE POLICY "cs_healthy_eating_cooking_skills_home_isolation" ON cs_healthy_eating_cooking_skills
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 240 healthy_eating_cooking_skills: %', SQLERRM;
END $$;
