-- Migration: 350_pocket_money_savings
-- Domain: Children's Services — Pocket Money & Savings Management
-- Description: Tracks pocket money transactions, savings, Junior ISA contributions,
-- and financial literacy support for looked-after children. Records transaction types
-- including weekly/monthly pocket money, birthday/Christmas money, clothing allowance,
-- holiday spending, savings deposits/withdrawals, Junior ISA contributions, gifts,
-- prizes, work experience earnings, chore payments, and special occasions.
--
-- UK Regulatory Framework:
-- CHR 2015 Reg 5 (independence — financial management),
-- CHR 2015 Reg 9 (quality of care),
-- SCCIF: Experiences & progress — "Children are supported to manage money."
-- DfE guidance on looked-after children's savings,
-- Junior ISA for looked-after children (DfE scheme).

DO $$ BEGIN

CREATE TABLE IF NOT EXISTS cs_pocket_money_savings (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id               uuid NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_name            text NOT NULL,
  transaction_date      date NOT NULL,
  recorded_by           text NOT NULL,
  transaction_type      text NOT NULL DEFAULT 'Pocket Money — Weekly',
  amount                numeric NOT NULL DEFAULT 0,
  currency              text NOT NULL DEFAULT 'GBP',
  balance_after         numeric NULL,
  savings_balance       numeric NULL,
  junior_isa_balance    numeric NULL,
  receipt_kept          boolean NOT NULL DEFAULT false,
  child_choice          boolean NOT NULL DEFAULT true,
  budgeting_discussion  boolean NOT NULL DEFAULT false,
  age_appropriate       boolean NOT NULL DEFAULT true,
  parental_consent      boolean NULL,
  social_worker_aware   boolean NULL,
  notes                 text NULL,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE cs_pocket_money_savings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON cs_pocket_money_savings
  USING (home_id = get_my_home_id());

CREATE INDEX IF NOT EXISTS idx_cs_pocket_money_savings_home
  ON cs_pocket_money_savings(home_id);

CREATE INDEX IF NOT EXISTS idx_cs_pocket_money_savings_date
  ON cs_pocket_money_savings(transaction_date);

CREATE INDEX IF NOT EXISTS idx_cs_pocket_money_savings_type
  ON cs_pocket_money_savings(transaction_type);

EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
