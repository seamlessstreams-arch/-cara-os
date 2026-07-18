-- Migration: 233_financial_literacy_savings
-- Service: financial-literacy-savings-service
-- CHR 2015 Reg 8(2)(a)(vi) (preparation for independence — finances), Reg 5(c) (financial capability)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_financial_literacy_savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  topic_area text NOT NULL CHECK (topic_area IN ('budgeting_basics','savings_accounts','spending_tracking','shopping_comparison','bills_utilities','banking_skills','benefits_entitlements','debt_awareness','earning_income','other')),
  understanding_level text NOT NULL CHECK (understanding_level IN ('confident','good_understanding','developing','limited','not_understood')),
  engagement_quality text NOT NULL CHECK (engagement_quality IN ('highly_engaged','engaged','partially_engaged','disengaged','refused')),
  saving_progress text NOT NULL CHECK (saving_progress IN ('exceeding_target','on_target','below_target','no_savings','in_debt')),
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  supported_by text NOT NULL,
  age_appropriate boolean NOT NULL DEFAULT true,
  practical_exercise boolean NOT NULL DEFAULT true,
  real_money_used boolean NOT NULL DEFAULT true,
  savings_account_active boolean NOT NULL DEFAULT true,
  budget_created boolean NOT NULL DEFAULT true,
  targets_set boolean NOT NULL DEFAULT true,
  care_plan_reflects boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT true,
  parent_informed boolean NOT NULL DEFAULT true,
  pathway_plan_updated boolean NOT NULL DEFAULT true,
  resources_provided boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cs_financial_literacy_home ON cs_financial_literacy_savings(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_financial_literacy_date ON cs_financial_literacy_savings(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_cs_financial_literacy_topic ON cs_financial_literacy_savings(topic_area);

ALTER TABLE cs_financial_literacy_savings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cs_financial_literacy_savings_home_isolation" ON cs_financial_literacy_savings;
CREATE POLICY "cs_financial_literacy_savings_home_isolation" ON cs_financial_literacy_savings
  USING (home_id = get_my_home_id());

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 233 financial_literacy_savings: %', SQLERRM;
END $$;
