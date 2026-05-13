-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 053 Deprivation of Liberty & Restrictions Register
-- DoL orders, restrictions on children, proportionality tracking.
-- Reg 20 (restraint and deprivation of liberty), Reg 21 (privacy & access),
-- SCCIF Helped & Protected, Children Act 1989.
-- Tables: cs_dol_orders, cs_restrictions_register
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_dol_orders ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_dol_orders (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id             UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id            UUID NOT NULL,
  child_name          TEXT NOT NULL,
  order_type          TEXT NOT NULL,
  authorising_body    TEXT NOT NULL,
  order_reference     TEXT,
  start_date          DATE NOT NULL,
  end_date            DATE,
  review_date         DATE,
  conditions          JSONB NOT NULL DEFAULT '[]',
  justification       TEXT NOT NULL DEFAULT '',
  legal_representative TEXT,
  irm_notified        BOOLEAN NOT NULL DEFAULT FALSE,
  ofsted_notified     BOOLEAN NOT NULL DEFAULT FALSE,
  status              TEXT NOT NULL DEFAULT 'pending',
  reviewed_by         TEXT,
  review_notes        TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_dol_orders ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "dol_orders_home" ON cs_dol_orders
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_dol_orders_home
  ON cs_dol_orders(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_dol_orders_status
  ON cs_dol_orders(status, end_date);

-- ── cs_restrictions_register ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_restrictions_register (
  id                        UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                   UUID NOT NULL REFERENCES cs_homes(id) ON DELETE CASCADE,
  child_id                  UUID NOT NULL,
  child_name                TEXT NOT NULL,
  restriction_type          TEXT NOT NULL,
  description               TEXT NOT NULL DEFAULT '',
  justification             TEXT NOT NULL DEFAULT '',
  legal_basis               TEXT NOT NULL DEFAULT 'risk_assessment',
  start_date                DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date                  DATE,
  review_frequency          TEXT NOT NULL DEFAULT 'monthly',
  last_review_date          DATE,
  next_review_date          DATE,
  reviewed_by               TEXT,
  child_consulted           BOOLEAN NOT NULL DEFAULT FALSE,
  child_views               TEXT,
  social_worker_informed    BOOLEAN NOT NULL DEFAULT FALSE,
  social_worker_informed_date DATE,
  parent_informed           BOOLEAN NOT NULL DEFAULT FALSE,
  proportionate             BOOLEAN NOT NULL DEFAULT TRUE,
  status                    TEXT NOT NULL DEFAULT 'active',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_restrictions_register ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "restrictions_register_home" ON cs_restrictions_register
    USING (home_id = get_my_home_id());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_restrictions_home
  ON cs_restrictions_register(home_id, child_id);

CREATE INDEX IF NOT EXISTS idx_restrictions_status
  ON cs_restrictions_register(status, next_review_date);
