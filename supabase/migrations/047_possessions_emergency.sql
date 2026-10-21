-- ═══════════════════════════════════════════════════════════════════════════════
-- CORNERSTONE — 047 Children's Possessions + Emergency Planning
-- Possessions: Reg 21 (privacy & access), Reg 36 (records)
-- Emergency: Reg 22 (arrangements), Reg 25 (premises), Reg 40 (notifications)
-- Tables: cs_possession_records, cs_money_records, cs_fire_drills,
--         cs_emergency_contacts, cs_contingency_plans
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── cs_possession_records ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_possession_records (
  id                      UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id                 UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id                UUID NOT NULL,
  child_name              TEXT NOT NULL,
  item_description        TEXT NOT NULL,
  category                TEXT NOT NULL,
  estimated_value         NUMERIC(10,2),
  condition_on_arrival    TEXT NOT NULL DEFAULT 'good',
  condition_on_departure  TEXT,
  stored_location         TEXT,
  photo_reference         TEXT,
  recorded_date           DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by             TEXT NOT NULL,
  child_signed            BOOLEAN NOT NULL DEFAULT FALSE,
  staff_signed            BOOLEAN NOT NULL DEFAULT FALSE,
  status                  TEXT NOT NULL DEFAULT 'with_child',
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_possession_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "possession_records_home" ON cs_possession_records
    USING (home_id = (select get_my_home_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_possession_records_home
  ON cs_possession_records(home_id);

CREATE INDEX IF NOT EXISTS idx_possession_records_child
  ON cs_possession_records(child_id, status);

-- ── cs_money_records ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_money_records (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id             UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  child_id            UUID NOT NULL,
  child_name          TEXT NOT NULL,
  transaction_type    TEXT NOT NULL,
  amount              NUMERIC(10,2) NOT NULL DEFAULT 0,
  description         TEXT NOT NULL,
  balance_after       NUMERIC(10,2) NOT NULL DEFAULT 0,
  recorded_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by         TEXT NOT NULL,
  child_signed        BOOLEAN NOT NULL DEFAULT FALSE,
  receipt_reference   TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_money_records ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "money_records_home" ON cs_money_records
    USING (home_id = (select get_my_home_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_money_records_child
  ON cs_money_records(child_id, recorded_date);

-- ── cs_emergency_contacts ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_emergency_contacts (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id               UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  contact_type          TEXT NOT NULL,
  name                  TEXT NOT NULL,
  role                  TEXT NOT NULL,
  phone_primary         TEXT NOT NULL,
  phone_secondary       TEXT,
  email                 TEXT,
  availability          TEXT NOT NULL DEFAULT '24/7',
  priority_order        INTEGER NOT NULL DEFAULT 1,
  last_verified_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  status                TEXT NOT NULL DEFAULT 'active',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_emergency_contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "emergency_contacts_home" ON cs_emergency_contacts
    USING (home_id = (select get_my_home_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_emergency_contacts_home
  ON cs_emergency_contacts(home_id, priority_order);

-- ── cs_contingency_plans ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS cs_contingency_plans (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id               UUID NOT NULL REFERENCES homes(id) ON DELETE CASCADE,
  plan_type             TEXT NOT NULL,
  title                 TEXT NOT NULL,
  description           TEXT NOT NULL DEFAULT '',
  trigger_conditions    JSONB NOT NULL DEFAULT '[]',
  immediate_actions     JSONB NOT NULL DEFAULT '[]',
  responsible_persons   JSONB NOT NULL DEFAULT '[]',
  escalation_contacts   JSONB NOT NULL DEFAULT '[]',
  review_date           DATE NOT NULL,
  reviewed_by           TEXT,
  status                TEXT NOT NULL DEFAULT 'current',
  version               INTEGER NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cs_contingency_plans ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "contingency_plans_home" ON cs_contingency_plans
    USING (home_id = (select get_my_home_id()));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_contingency_plans_home
  ON cs_contingency_plans(home_id, status);
