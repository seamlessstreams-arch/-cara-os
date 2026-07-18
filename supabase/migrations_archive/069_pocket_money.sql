-- ══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — POCKET MONEY & SAVINGS
-- CHR 2015 Reg 37 (children's money — pocket money, savings, allowances),
-- Reg 7 (children's views — financial choices),
-- Reg 14 (care planning — financial provisions).
-- Tables: cs_financial_profiles, cs_financial_transactions, cs_financial_audits
-- ══════════════════════════════════════════════════════════════════════════════

-- ── cs_financial_profiles ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_financial_profiles (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                     uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id                    text NOT NULL,
  child_name                  text NOT NULL,
  weekly_pocket_money         numeric(10,2) NOT NULL DEFAULT 0,
  clothing_allowance_monthly  numeric(10,2) NOT NULL DEFAULT 0,
  savings_balance             numeric(10,2) NOT NULL DEFAULT 0,
  pocket_money_balance        numeric(10,2) NOT NULL DEFAULT 0,
  financial_literacy_level    text NOT NULL DEFAULT 'not_assessed',
  has_bank_account            boolean NOT NULL DEFAULT false,
  bank_account_type           text,
  savings_goal                text,
  savings_target              numeric(10,2),
  financial_skills_notes      text,
  last_audit_date             date,
  next_audit_date             date,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_profiles_home    ON cs_financial_profiles(home_id);
CREATE INDEX IF NOT EXISTS idx_financial_profiles_child   ON cs_financial_profiles(child_id);

ALTER TABLE cs_financial_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own financial profiles"
    ON cs_financial_profiles FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_financial_transactions ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_financial_transactions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id              text NOT NULL,
  child_name            text NOT NULL,
  transaction_date      date NOT NULL,
  transaction_type      text NOT NULL,
  account_type          text NOT NULL DEFAULT 'pocket_money',
  amount                numeric(10,2) NOT NULL,
  description           text NOT NULL,
  spending_category     text,
  receipt_reference     text,
  authorised_by         text NOT NULL,
  witnessed_by          text,
  child_present         boolean NOT NULL DEFAULT true,
  balance_after         numeric(10,2),
  notes                 text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_transactions_home    ON cs_financial_transactions(home_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_child   ON cs_financial_transactions(child_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date    ON cs_financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type    ON cs_financial_transactions(transaction_type);

ALTER TABLE cs_financial_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own financial transactions"
    ON cs_financial_transactions FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── cs_financial_audits ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_financial_audits (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  home_id                   uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  audit_date                date NOT NULL,
  audited_by                text NOT NULL,
  status                    text NOT NULL DEFAULT 'pending',
  children_audited          jsonb NOT NULL DEFAULT '[]',
  expected_total            numeric(10,2) NOT NULL DEFAULT 0,
  actual_total              numeric(10,2) NOT NULL DEFAULT 0,
  discrepancy_amount        numeric(10,2) NOT NULL DEFAULT 0,
  discrepancy_explanation   text,
  corrective_action         text,
  notes                     text,
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_audits_home    ON cs_financial_audits(home_id);
CREATE INDEX IF NOT EXISTS idx_financial_audits_date    ON cs_financial_audits(audit_date);
CREATE INDEX IF NOT EXISTS idx_financial_audits_status  ON cs_financial_audits(status);

ALTER TABLE cs_financial_audits ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Home staff can manage own financial audits"
    ON cs_financial_audits FOR ALL
    USING  (home_id = get_my_home_id())
    WITH CHECK (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
