-- Emotional Regulation Support — CHR 2015 Reg 12, Reg 11, Reg 7
DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_emotional_regulation_support (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  regulation_strategy text NOT NULL DEFAULT 'co_regulation',
  emotional_trigger text NOT NULL DEFAULT 'unknown',
  support_outcome text NOT NULL DEFAULT 'regulated_with_support',
  child_age_group text NOT NULL DEFAULT 'not_specified',
  support_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid REFERENCES children(id) ON DELETE SET NULL,
  staff_name text NOT NULL,
  child_participated boolean NOT NULL DEFAULT true,
  trauma_informed boolean NOT NULL DEFAULT true,
  age_appropriate boolean NOT NULL DEFAULT true,
  child_chose_strategy boolean NOT NULL DEFAULT true,
  environment_adapted boolean NOT NULL DEFAULT true,
  relationship_based boolean NOT NULL DEFAULT true,
  de_escalation_used boolean NOT NULL DEFAULT false,
  follow_up_planned boolean NOT NULL DEFAULT true,
  care_plan_linked boolean NOT NULL DEFAULT false,
  learning_shared boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT false,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]',
  actions_taken jsonb NOT NULL DEFAULT '[]',
  support_duration_minutes integer NOT NULL DEFAULT 0,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_emotional_regulation_support ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_emotional_regulation_support_home ON cs_emotional_regulation_support;
CREATE POLICY cs_emotional_regulation_support_home ON cs_emotional_regulation_support
  USING (home_id = get_my_home_id());

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
