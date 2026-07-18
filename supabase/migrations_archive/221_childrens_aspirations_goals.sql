-- 221: Children's Aspirations & Goals
-- CHR 2015 Reg 7 (children's wishes — future aspirations), Reg 14 (care planning — goals and outcomes)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_childrens_aspirations_goals (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id      uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  aspiration_category text NOT NULL DEFAULT 'education',
  goal_status text NOT NULL DEFAULT 'in_progress',
  motivation_level text NOT NULL DEFAULT 'motivated',
  support_quality text NOT NULL DEFAULT 'good',
  review_date  date NOT NULL DEFAULT now(),
  child_name   text NOT NULL DEFAULT '',
  child_id     uuid REFERENCES children(id) ON DELETE SET NULL,
  supported_by text NOT NULL DEFAULT '',
  child_led_goal boolean NOT NULL DEFAULT true,
  realistic_timeframe boolean NOT NULL DEFAULT true,
  resources_identified boolean NOT NULL DEFAULT true,
  mentor_involved boolean NOT NULL DEFAULT true,
  progress_celebrated boolean NOT NULL DEFAULT true,
  barriers_addressed boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  family_aware boolean NOT NULL DEFAULT true,
  school_linked boolean NOT NULL DEFAULT true,
  review_scheduled boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  next_review_date date,
  notes text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_childrens_aspirations_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "childrens_aspirations_goals_home" ON cs_childrens_aspirations_goals;
CREATE POLICY "childrens_aspirations_goals_home" ON cs_childrens_aspirations_goals
  FOR ALL USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'migration 221 idempotent: %', SQLERRM;
END $$;
