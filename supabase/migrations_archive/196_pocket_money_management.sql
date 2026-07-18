-- Migration: 196_pocket_money_management
-- Table: cs_pocket_money_management
-- CHR 2015 Reg 9 (financial competence), Reg 7 (individual child)

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_pocket_money_management (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('weekly_allowance','birthday_money','gift_money','earned_income','savings_deposit','savings_withdrawal','purchase','charitable_donation','refund','other')),
  spending_category text NOT NULL CHECK (spending_category IN ('clothing','food_treats','entertainment','electronics','hobbies','toiletries','transport','gifts_for_others','savings','other')),
  approval_status text NOT NULL CHECK (approval_status IN ('approved','pending','declined','not_required','retrospective')),
  financial_literacy_level text NOT NULL CHECK (financial_literacy_level IN ('independent','supported','learning','needs_guidance','not_assessed')),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  child_name text NOT NULL,
  child_id uuid,
  recorded_by text NOT NULL,
  receipt_obtained boolean NOT NULL DEFAULT true,
  child_chose_purchase boolean NOT NULL DEFAULT true,
  age_appropriate_spend boolean NOT NULL DEFAULT true,
  budget_discussed boolean NOT NULL DEFAULT true,
  savings_encouraged boolean NOT NULL DEFAULT true,
  value_for_money_discussed boolean NOT NULL DEFAULT true,
  financial_record_updated boolean NOT NULL DEFAULT true,
  balance_reconciled boolean NOT NULL DEFAULT true,
  social_worker_informed boolean NOT NULL DEFAULT false,
  parent_informed boolean NOT NULL DEFAULT false,
  care_plan_linked boolean NOT NULL DEFAULT true,
  recorded_promptly boolean NOT NULL DEFAULT true,
  issues_found jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions_taken jsonb NOT NULL DEFAULT '[]'::jsonb,
  amount_pence integer NOT NULL DEFAULT 0,
  running_balance_pence integer NOT NULL DEFAULT 0,
  next_review_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_pocket_money_management ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cs_pocket_money_management_home ON cs_pocket_money_management;
CREATE POLICY cs_pocket_money_management_home ON cs_pocket_money_management
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_pocket_money_management_home ON cs_pocket_money_management(home_id);
CREATE INDEX IF NOT EXISTS idx_cs_pocket_money_management_date ON cs_pocket_money_management(transaction_date);
CREATE INDEX IF NOT EXISTS idx_cs_pocket_money_management_child ON cs_pocket_money_management(child_name);

EXCEPTION WHEN others THEN RAISE NOTICE 'Migration 196 pocket_money_management: %', SQLERRM;
END $$;
