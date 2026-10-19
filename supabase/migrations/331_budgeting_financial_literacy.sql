-- Migration: 331_budgeting_financial_literacy
-- Domain: Budgeting & Financial Literacy Skills
-- Tracks financial literacy sessions, skill areas, competency progression,
-- practical exercises, bank account setup, savings habits, and pathway plan
-- linkage for children preparing for independence.
-- CHR 2015 Reg 5 (preparing children for independence),
-- Children (Leaving Care) Act 2000, Children and Social Work Act 2017,
-- Pathway Planning requirements,
-- SCCIF: Experiences and progress -- "Children are prepared for adulthood
-- including financial management."

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_budgeting_financial_literacy (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id       uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,

  child_name                  text        NOT NULL,
  session_date                date        NOT NULL,
  facilitator_name            text        NOT NULL,

  skill_area                  text        NOT NULL CHECK (skill_area IN ('Budgeting Basics','Bank Account Management','Savings Planning','Understanding Bills','Shopping & Comparison','Debt Awareness','Benefits & Entitlements','Payslip Understanding','Tax Basics','Insurance Awareness','Tenancy Costs','Emergency Funds','Online Safety — Financial Scams','Credit Scores')),
  delivery_method             text        NOT NULL CHECK (delivery_method IN ('1-to-1 Session','Group Workshop','Practical Exercise','Online Module','Mentoring','Real-World Practice','Game/Simulation')),
  competency_level            text        NOT NULL CHECK (competency_level IN ('Not Yet Started','Emerging','Developing','Competent','Confident')),

  young_person_engaged        boolean     NOT NULL DEFAULT false,
  practical_component         boolean     NOT NULL DEFAULT false,
  real_money_used             boolean     NOT NULL DEFAULT false,
  bank_account_opened         boolean     NOT NULL DEFAULT false,
  savings_started             boolean     NOT NULL DEFAULT false,
  budget_created              boolean     NOT NULL DEFAULT false,
  pathway_plan_linked         boolean     NOT NULL DEFAULT false,
  social_worker_informed      boolean     NOT NULL DEFAULT false,

  next_session_date           date        NULL,
  notes                       text        NULL,

  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE cs_budgeting_financial_literacy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant isolation" ON cs_budgeting_financial_literacy;
CREATE POLICY "Tenant isolation" ON cs_budgeting_financial_literacy
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_budgeting_financial_literacy_home
  ON cs_budgeting_financial_literacy(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_budgeting_financial_literacy_date
  ON cs_budgeting_financial_literacy(session_date DESC);

EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
