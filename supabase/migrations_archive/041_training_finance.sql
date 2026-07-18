-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 041 Training & Development + Financial Management
-- Reg 33 (employment of staff), Reg 34 (fitness of workers),
-- Reg 39 (financial arrangements)
-- Tables: cs_training_records, cs_staff_dbs, cs_staff_qualifications,
--         cs_child_allowances, cs_financial_transactions, cs_savings_accounts
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_training_records ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_training_records (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id               UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  staff_id              UUID NOT NULL,
  staff_name            TEXT NOT NULL,
  training_type         TEXT NOT NULL,
  completed_date        DATE NOT NULL,
  expiry_date           DATE,
  provider              TEXT NOT NULL DEFAULT '',
  certificate_reference TEXT,
  status                TEXT NOT NULL DEFAULT 'current',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_training_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "training_records_home" ON cs_training_records
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_training_records_home
  ON cs_training_records(home_id);

CREATE INDEX IF NOT EXISTS idx_training_records_staff
  ON cs_training_records(staff_id, training_type);

-- ── cs_staff_dbs ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_staff_dbs (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                   UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  staff_id                  UUID NOT NULL,
  staff_name                TEXT NOT NULL,
  dbs_number                TEXT NOT NULL,
  issue_date                DATE NOT NULL,
  dbs_type                  TEXT NOT NULL DEFAULT 'enhanced_barred',
  status                    TEXT NOT NULL DEFAULT 'pending',
  renewal_due               DATE,
  update_service_registered BOOLEAN NOT NULL DEFAULT FALSE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_staff_dbs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "staff_dbs_home" ON cs_staff_dbs
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_staff_dbs_home
  ON cs_staff_dbs(home_id);

CREATE INDEX IF NOT EXISTS idx_staff_dbs_staff
  ON cs_staff_dbs(staff_id);

-- ── cs_staff_qualifications ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_staff_qualifications (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id               UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  staff_id              UUID NOT NULL,
  staff_name            TEXT NOT NULL,
  qualification_type    TEXT NOT NULL,
  title                 TEXT NOT NULL,
  awarding_body         TEXT NOT NULL DEFAULT '',
  date_achieved         DATE,
  expected_completion   DATE,
  status                TEXT NOT NULL DEFAULT 'not_started',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_staff_qualifications ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "staff_quals_home" ON cs_staff_qualifications
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_staff_quals_home
  ON cs_staff_qualifications(home_id);

CREATE INDEX IF NOT EXISTS idx_staff_quals_staff
  ON cs_staff_qualifications(staff_id);

-- ── cs_child_allowances ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_child_allowances (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id         UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id        UUID NOT NULL,
  child_name      TEXT NOT NULL,
  allowance_type  TEXT NOT NULL,
  amount          NUMERIC(8,2) NOT NULL DEFAULT 0,
  frequency       TEXT NOT NULL DEFAULT 'weekly',
  start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date        DATE,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  approved_by     TEXT NOT NULL DEFAULT '',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_child_allowances ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "child_allowances_home" ON cs_child_allowances
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_child_allowances_home
  ON cs_child_allowances(home_id);

CREATE INDEX IF NOT EXISTS idx_child_allowances_child
  ON cs_child_allowances(child_id);

-- ── cs_financial_transactions ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_financial_transactions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id           UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id          UUID NOT NULL,
  child_name        TEXT NOT NULL,
  transaction_type  TEXT NOT NULL,
  category          TEXT NOT NULL,
  amount            NUMERIC(8,2) NOT NULL DEFAULT 0,
  description       TEXT NOT NULL DEFAULT '',
  date              DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by       TEXT NOT NULL,
  receipt_reference TEXT,
  child_consulted   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_financial_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "financial_txn_home" ON cs_financial_transactions
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_financial_txn_home
  ON cs_financial_transactions(home_id);

CREATE INDEX IF NOT EXISTS idx_financial_txn_child
  ON cs_financial_transactions(child_id, date);

-- ── cs_savings_accounts ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_savings_accounts (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id           UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id          UUID NOT NULL,
  child_name        TEXT NOT NULL,
  account_reference TEXT,
  balance           NUMERIC(10,2) NOT NULL DEFAULT 0,
  last_updated      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_savings_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "savings_home" ON cs_savings_accounts
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_savings_home
  ON cs_savings_accounts(home_id);

CREATE INDEX IF NOT EXISTS idx_savings_child
  ON cs_savings_accounts(child_id);
